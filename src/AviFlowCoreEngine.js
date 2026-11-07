import { AviElement } from './tools/AviElement.js';

const KNOWN_MODIFIERS = new Set(['prevent', 'stop', 'passive', 'window']);
const CACHE_LIMIT = 500;
/** Path segments that must never be traversed when resolving an action. */


export class AviFlowCoreEngine {
    /** Parsed data-flow strings, keyed by the raw string (frozen results, or null for invalid). */
    static #cache = new Map();

    /** Latest request token per target selector, used to discard stale async results. */
    #latest = new Map();

    constructor(flow) {
        this.flow = flow;
        // Kept for backward compatibility with code that reads `flow.core`.
        this.core = this;
        /** @type {WeakMap<Element, Map<string, {flows: Object[], passive: boolean, ac: AbortController}>>} */
        this.boundElements = new WeakMap();
    }


    /**
     * Binds (or re-syncs) the listeners declared in `element.dataset.flow`.
     * Safe to call repeatedly: existing listeners are reused, replaced when their
     * options change, and removed when their event is no longer declared.
     *
     * @param {Element} element
     */
    controller(element) {
        if (!element?.dataset) return;

        const flows = AviFlowCoreEngine.parseFlow(element.dataset.flow);
        let eventConfigs = this.boundElements.get(element);

        // data-flow removed or no longer valid: detach whatever was bound before
        if (!flows) {
            if (eventConfigs) this.destroy(element);
            return;
        }

        // Group flows by scope + event so several flows can share one listener
        const byKey = new Map();
        for (const f of flows) {
            const key = `${f.onWindow ? 'window' : 'element'}:${f.event}`;
            let group = byKey.get(key);
            if (!group) {
                group = { event: f.event, onWindow: f.onWindow, anyPassive: false, anyPrevent: false, list: [] };
                byKey.set(key, group);
            }
            group.anyPassive ||= f.passive;
            group.anyPrevent ||= f.prevent;
            group.list.push(f);
        }

        if (!eventConfigs) {
            eventConfigs = new Map();
            this.boundElements.set(element, eventConfigs);
        }

        // Keys no longer present in data-flow: remove their listeners
        for (const key of [...eventConfigs.keys()]) {
            if (!byKey.has(key)) this.#unbind(element, key);
        }
        // #unbind drops the element once its last listener is removed; the new
        // listeners below are added to this same map, so make sure it is registered
        this.boundElements.set(element, eventConfigs);

        for (const [key, group] of byKey) {
            // preventDefault() is ignored in passive listeners, so prevent wins
            if (group.anyPassive && group.anyPrevent) {
                console.warn(`[AviFlow.core.controller] "passive" ignored for "${group.event}": a flow on the same event uses "prevent"`);
            }
            const passive = group.anyPassive && !group.anyPrevent;

            const existing = eventConfigs.get(key);
            if (existing) {
                if (existing.passive === passive) {
                    existing.flows = group.list;
                    continue;
                }
                // Listener options can't change after binding: replace the listener
                existing.ac.abort();
            }

            const ac = new AbortController();
            const entry = { flows: group.list, passive, ac };
            eventConfigs.set(key, entry);

            const host = group.onWindow ? window : element;
            const options = passive ? { passive: true, signal: ac.signal } : { signal: ac.signal };

            host.addEventListener(group.event, (e) => {
                // Window listeners would otherwise keep detached elements alive forever
                if (group.onWindow && !element.isConnected) {
                    this.#unbind(element, key);
                    return;
                }
                for (const f of entry.flows) {
                    this.eventHandler(element, e, f.action, f.target, f.prevent, f.stop);
                }
            }, options);
        }
    }

    /**
     * Removes every listener bound to an element. Call this when an element is
     * discarded (especially one with `.window` flows).
     *
     * @param {Element} element
     */
    destroy(element) {
        const eventConfigs = this.boundElements.get(element);
        if (!eventConfigs) return;
        for (const entry of eventConfigs.values()) entry.ac.abort();
        eventConfigs.clear();
        this.boundElements.delete(element);
    }

    #unbind(element, key) {
        const eventConfigs = this.boundElements.get(element);
        const entry = eventConfigs?.get(key);
        if (!entry) return;
        entry.ac.abort();
        eventConfigs.delete(key);
        if (!eventConfigs.size) this.boundElements.delete(element);
    }


    /**
     * Runs an action and applies its result to the target.
     * Works the same for sync and async actions: targets are updated, then
     * `flow.init(target)` binds any new data-flow in the injected content.
     *
     * @returns {*|Promise<*>|undefined} The action's content (or a promise of it).
     */
    eventHandler(element, event, actionName, target, prevent, stop) {
        if (prevent) event?.preventDefault?.();
        if (stop) event?.stopPropagation?.();

        //const actions = this.flow?.action;
        const resolved = this.flow.resolveAction(actionName);
        if (!resolved) {
            console.warn(`[AviFlow.core.eventHandler] Action "${actionName}" is not defined`);
            return;
        }
        const { fn: actionFn, owner } = resolved;
        

        const onError = (err) =>
            console.error(`[AviFlow.core.eventHandler] Error on action "${actionName}"`, err);

        // Newest call per target wins: a slow older async result is discarded
        let token = 0;
        if (target) {
            token = (this.#latest.get(target) ?? 0) + 1;
            this.#latest.set(target, token);
        }

        const apply = (content) => {
            if (target && this.#latest.get(target) !== token) return;
            try {
                AviFlowCoreEngine.updateTargets(target, content);
                if (target && content !== undefined) this.flow.init(target);
            } catch (err) {
                console.error(`[AviFlow.core.eventHandler] Error applying result of action "${actionName}"`, err);
            }
            return content;
        };

        try {
            const result = actionFn.call(owner, element, event, target, this.flow);
            return typeof result?.then === 'function'
                ? Promise.resolve(result).then(apply, onError)
                : apply(result);
        } catch (err) {
            onError(err);
        }
    }



    /**
     * Parses one event fragment such as "click.prevent.stop".
     * The first dot starts the modifiers, so event names that contain dots
     * (e.g. custom "app.ready") cannot be expressed.
     * Supported modifiers: prevent, stop, passive, window.
     * A missing (undefined) fragment is read as an empty one: event "click", no modifiers.
     *
     * @param {string} [strEvent='']
     * @returns {{event: string, prevent: boolean, stop: boolean, passive: boolean, onWindow: boolean}}
     */
    static parseEvent(strEvent = '') {
        const [name, ...rawMods] = strEvent.split('.').map((s) => s.trim());
        const mods = new Set(rawMods);

        for (const m of mods) {
            if (!KNOWN_MODIFIERS.has(m)) {
                console.warn(`[AviFlow.core.parseEvent] Unknown modifier "${m}" in "${strEvent}" (known: ${[...KNOWN_MODIFIERS].join(', ')})`);
            }
        }

        return {
            event: name || 'click',
            prevent: mods.has('prevent'),
            stop: mods.has('stop'),
            passive: mods.has('passive'),
            onWindow: mods.has('window'),
        };
    }


    /**
     * Parses a flow definition. Supports a single flow or several flows,
     * each wrapped in square brackets:
     *   "event -> action -> target"
     *   "[event1 -> action1 -> target1][event2 -> action2 -> target2]"
     *
     * Each flow follows one of these formats:
     * 1. `event -> action -> target`
     * 2. `action -> target`            (event defaults to "click")
     * 3. `event -> action -|`          (no target)
     * 4. `action -|`                   (no target, event defaults to "click")
     *
     * Note: without "-|", two parts are read as `action -> target`, NOT `event -> action`.
     *
     * Results are cached by input string and are frozen: do not mutate them.
     *
     * @param {string} flowString
     * @returns {ReadonlyArray<Readonly<{event: string, action: string, target: (string|null), prevent: boolean, stop: boolean, passive: boolean, onWindow: boolean}>>|null}
     */
    static parseFlow(flowString) {
        if (!flowString || typeof flowString !== 'string') return null;

        const cache = AviFlowCoreEngine.#cache;
        if (cache.has(flowString)) return cache.get(flowString);

        let out = null;
        const parts = AviFlowCoreEngine.splitFlows(flowString);
        if (parts) {
            const flows = parts
                .map((p) => AviFlowCoreEngine.parseSingleFlow(p))
                .filter(Boolean);
            if (flows.length) out = Object.freeze(flows.map((f) => Object.freeze(f)));
        }

        if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value); // drop oldest
        cache.set(flowString, out);
        return out;
    }

    /**
     * Parses one flow (no surrounding brackets). See `parseFlow` for the formats.
     *
     * @param {string} flowString
     * @returns {{event: string, action: string, target: (string|null), prevent: boolean, stop: boolean, passive: boolean, onWindow: boolean}|null}
     */
    static parseSingleFlow(flowString) {
        if (!flowString || typeof flowString !== 'string') return null;

        let src = flowString.trim();

        const noTarget = src.endsWith('-|');
        if (noTarget) src = src.slice(0, -2);

        const parts = AviFlowCoreEngine.splitArrows(src);
        const max = noTarget ? 2 : 3;
        if (parts.length > max) {
            console.warn(noTarget
                ? '[AviFlow.core.parseSingleFlow] Too many parts before "-|" (max: event -> action -|)'
                : '[AviFlow.core.parseSingleFlow] Too many "->" parts (max: event -> action -> target)'
            );
            return null;
        }

        let eventRaw = '';
        let action;
        let target = null;

        if (noTarget) {
            if (parts.length === 2) [eventRaw, action] = parts;
            else [action] = parts;
        } else if (parts.length === 3) {
            [eventRaw, action, target] = parts;
        } else if (parts.length === 2) {
            [action, target] = parts;
        } else {
            [action] = parts;
        }

        if (!action) {
            console.warn('[AviFlow.core.parseSingleFlow] Missing "action"');
            return null;
        }

        if (!noTarget && parts.length > 1 && !target) {
            console.warn('[AviFlow.core.parseSingleFlow] Empty target: end the flow with "-|" when there is no target');
            return null;
        }

        // Default event, and ".modifier" shorthand meaning "click.modifier"
        if (!eventRaw) eventRaw = 'click';
        else if (eventRaw.startsWith('.')) eventRaw = 'click' + eventRaw;

        const { event, prevent, stop, passive, onWindow } = AviFlowCoreEngine.parseEvent(eventRaw);

        return { event, action, target, prevent, stop, passive, onWindow };
    }

    /**
     * Splits a string on "->", ignoring arrows inside quotes or square brackets
     * (e.g. the selector `[data-x="a->b"]`). Backslash escapes inside quotes are honored.
     *
     * @param {string} src
     * @returns {string[]} Trimmed parts.
     */
    static splitArrows(src) {
        const parts = [];
        let depth = 0;
        let quote = null;
        let start = 0;

        for (let i = 0; i < src.length; i++) {
            const ch = src[i];

            if (quote) {
                if (ch === '\\') i++;
                else if (ch === quote) quote = null;
                continue;
            }

            if (ch === '"' || ch === "'") quote = ch;
            else if (ch === '[') depth++;
            else if (ch === ']') depth = Math.max(0, depth - 1);
            else if (depth === 0 && ch === '-' && src[i + 1] === '>') {
                parts.push(src.slice(start, i).trim());
                start = i + 2;
                i++;
            }
        }

        parts.push(src.slice(start).trim());
        return parts;
    }


    /**
     * Splits a data-flow string into individual flow strings.
     *   "event -> action -> target"          => ["event -> action -> target"]
     *   "[e1 -> a1 -> t1][e2 -> a2 -> t2]"   => ["e1 -> a1 -> t1", "e2 -> a2 -> t2"]
     *
     * Brackets inside a group (e.g. attribute selectors) are respected via depth
     * tracking. Quoted text inside a group is skipped, and backslash escapes
     * inside quotes are honored. An unbalanced quote makes the whole string invalid.
     *
     * @param {string} flowString
     * @returns {string[]|null}
     */
    static splitFlows(flowString) {
        const src = flowString.trim();
        if (!src.startsWith('[')) return [src];

        const result = [];
        let depth = 0;
        let start = -1;
        let quote = null;

        for (let i = 0; i < src.length; i++) {
            const ch = src[i];

            if (quote) {
                if (ch === '\\') i++;
                else if (ch === quote) quote = null;
                continue;
            }

            if (depth === 0) {
                if (ch === '[') {
                    start = i + 1;
                    depth++;
                } else if (!/\s/.test(ch)) {
                    console.warn(`[AviFlow.core.splitFlows] Unexpected "${ch}" between flow groups`);
                    return null;
                }
                continue;
            }

            if (ch === '"' || ch === "'") {
                quote = ch;
            } else if (ch === '[') {
                depth++;
            } else if (ch === ']') {
                depth--;
                if (depth === 0) result.push(src.slice(start, i));
            }
        }

        if (depth !== 0 || quote) {
            console.warn('[AviFlow.core.splitFlows] Unbalanced brackets or quotes in multi-flow definition');
            return null;
        }

        return result;
    }

    /**
     * Updates every element matching `selector` with `content`.
     * One failing element does not stop the others. `null` content is forwarded
     * to `AviElement.setContent`; only `undefined` means "nothing to apply".
     *
     * @param {string} selector CSS selector for the target elements.
     * @param {*} content HTML, string, or object to inject.
     * @param {ParentNode} [root=document] Optional scope for the selector query.
     * @returns {*|undefined} The content if it was applied, otherwise undefined
     *                        (no selector, no content, invalid selector, or no match).
     */
    static updateTargets(selector, content, root = document) {
        if (!selector || typeof selector !== 'string' || content === undefined) return;

        let targets;
        try {
            targets = root.querySelectorAll(selector);
        } catch {
            console.warn(`[AviFlow.core.updateTargets] Invalid target selector "${selector}"`);
            return;
        }

        if (!targets.length) {
            console.warn(`[AviFlow.core.updateTargets] No element matches "${selector}"`);
            return;
        }

        for (const el of targets) {
            try {
                AviElement.setContent(el, content);
            } catch (err) {
                console.error('[AviFlow.core.updateTargets] setContent failed', el, err);
            }
        }

        return content;
    }
}

export default AviFlowCoreEngine
