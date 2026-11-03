import { AviElement } from './tools/AviElement.js';

export class AviFlowCoreEngine {
    constructor(flow) {
        this.flow = flow;
        this.core = this;
        this.boundElements = new WeakMap();
    }


    controller(element) {
        if (!element?.dataset) return;

        const flows = AviFlowCoreEngine.parseFlow(element.dataset.flow);
        if (!flows) return;

        // Group flows by scope + event so several flows can share one listener
        const byKey = new Map();
        for (const f of flows) {
            const key = `${f.onWindow ? 'window' : 'element'}:${f.event}`;
            if (!byKey.has(key)) byKey.set(key, { event: f.event, onWindow: f.onWindow, passive: f.passive, list: [] });
            const group = byKey.get(key);
            group.passive = group.passive || f.passive;
            group.list.push(f);
        }

        let eventConfigs = this.boundElements.get(element);
        if (!eventConfigs) {
            eventConfigs = new Map();
            this.boundElements.set(element, eventConfigs);
        }

        // Keys no longer present in data-flow: keep the listener but make it a no-op
        for (const [key, entry] of eventConfigs) {
            if (!byKey.has(key)) entry.flows = [];
        }

        for (const [key, group] of byKey) {
            const existing = eventConfigs.get(key);
            if (existing) {
                existing.flows = group.list;
                continue;
            }

            const entry = { flows: group.list };
            eventConfigs.set(key, entry);

            const host = group.onWindow ? window : element;
            const options = group.passive ? { passive: true } : undefined;

            host.addEventListener(group.event, (e) => {
                for (const f of entry.flows) {
                    this.core.eventHandler(element, e, f.action, f.target, f.prevent, f.stop);
                }
            }, options);
        }
    }


    eventHandler(element, event, actionName, target, prevent, stop) {

        if (prevent && typeof event?.preventDefault === "function") event.preventDefault();
        if (stop && typeof event?.stopPropagation === "function") event.stopPropagation();

        const actionFn = this.flow.action[actionName];
        if (typeof actionFn !== 'function') {
            console.warn(`[AviFlow.core.eventHandler] Action "${actionName}" is not defined`);
            return;
        }

        let result;
        const onError = (err) => console.error(`[AviFlow.core.eventHandler] Error on action "${actionName}"`, err);

        try {
            result = actionFn(element, this.flow, event);
        } catch (err) {
            onError(err);
            return;
        }

        if (result && typeof result.then === 'function') {
            return Promise.resolve(result)
                .then((content) => {
                    AviFlowCoreEngine.updateTargets(target, content);
                })
                .catch(onError);
        }

        AviFlowCoreEngine.updateTargets(target, result);
        this.flow.init(target);
        return result;
    }

    /**
    * Parses a string to determine the event, prevention flags, and propagation flags for the flow.
    *
    * @param {string} ``strEvent`` The flow string fragment (e.g., "click.prevent.stop").
    * @returns {{event: string, prevent: boolean, stop: boolean}} An object defining the event and modifiers.
    */
    static parseEvent(strEvent) {
        const [name, ...mods] = strEvent.split('.').map((s) => s.trim());
        return {
            event: name || 'click',
            prevent: mods.includes('prevent'),
            stop: mods.includes('stop'),
            passive: mods.includes('passive'),
            onWindow: mods.includes('window'),
        };
    }


    /**
     * Parses a flow definition. Supports a single flow or several flows,
     * each wrapped in square brackets:
     *   "event -> action -> target"
     *   "[event1 -> action1 -> target1][event2 -> action2 -> target2]"
     *
     * Each flow follows the formats:
     * 1. ``event->action``
     * 2. ``event->action->target``
     * 3. ``action->target``
     * (end with "-|" for no target)
     *
     * @param {string} flowString The flow definition string.
     * @returns {Array<Object>|null} Array of `{event, action, target, prevent, stop}`, or null if nothing valid was parsed.
     */
    static parseFlow(flowString) {
        if (!flowString || typeof flowString !== 'string') return null;

        const parts = AviFlowCoreEngine.splitFlows(flowString);
        if (!parts) return null;

        const flows = parts
            .map((p) => AviFlowCoreEngine.parseSingleFlow(p))
            .filter(Boolean);

        return flows.length ? flows : null;
    }

    /**
     * Parses one flow (no surrounding brackets).
     *
     * @param {string} flowString
     * @returns {Object|null}
     */
    static parseSingleFlow(flowString) {
        if (!flowString || typeof flowString !== 'string') return null;

        let src = flowString.trim();

        const noTarget = src.endsWith('-|');
        if (noTarget) src = src.slice(0, -2);

        const parts = src.split('->').map((s) => s.trim());
        const max = noTarget ? 2 : 3;
        if (parts.length > max) {
            console.warn(noTarget
                ? '[AviFlow.core.parseFlow] Too many parts before "-|" (max: event -> action -|)'
                : '[AviFlow.core.parseFlow] Too many "->" parts (max: event -> action -> target)'
            );
            return null;
        }

        let eventRaw = 'click';
        let action;
        let target = null;

        if (noTarget) {
            if (parts.length === 2) [eventRaw, action] = parts;
            else[action] = parts;
        } else if (parts.length === 3) {
            [eventRaw, action, target] = parts;
        } else if (parts.length === 2) {
            [action, target] = parts;
        } else {
            [action] = parts;
        }

        if (!action) {
            console.warn('[AviFlow.core.parseFlow] Missing "action"');
            return null;
        }

        if (!noTarget && parts.length > 1 && !target) {
            console.warn(`[AviFlow.core.parseFlow] Empty target: end the flow with "-|" when there is no target`);
            return null;
        }

        if (eventRaw.startsWith(".")) eventRaw = 'click' + eventRaw;

        const { event, prevent, stop, passive, onWindow } = AviFlowCoreEngine.parseEvent(eventRaw);

        return { event, action, target, prevent, stop, passive, onWindow };
    }


    /**
     * Splits a data - flow string into individual flow strings.
     * - "event -> action -> target"            => ["event -> action -> target"]
    * - "[e1 -> a1 -> t1][e2 -> a2 -> t2]"     => ["e1 -> a1 -> t1", "e2 -> a2 -> t2"]
        * Brackets inside a group(e.g.attribute selectors) are respected via depth tracking.
     *
     * @param { string } flowString
    * @returns { string[] | null }
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
                if (ch === quote) quote = null;
                continue;
            }

            if (depth === 0) {
                if (ch === '[') {
                    start = i + 1;
                    depth++;
                } else if (!/\s/.test(ch)) {
                    console.warn(`[AviFlow.core.parseFlow] Unexpected "${ch}" between flow groups`);
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
            console.warn('[AviFlow.core.parseFlow] Unbalanced brackets or quotes in multi-flow definition');
            return null;
        }

        return result;
    }

    /**
         * Updates the specified set of target elements with the provided content.
         * The targets are determined by querying the DOM using the supplied CSS selector.
         *
         * @param {string} ``selector`` The CSS selector string defining the target elements.
         * @param {*} ``content`` The content (HTML, string, or object) to be injected into the targets.
         * @returns {*} The content itself after applying it to all targets.
         */
    static updateTargets(selector, content) {
        if (!selector || typeof selector !== 'string' || content === undefined) return;

        let targets;
        try {
            targets = document.querySelectorAll(selector);
        } catch (err) {
            console.warn(`[AviFlow.core.updateTargets] Invalid target selector "${selector}"`);
            return;
        }

        targets.forEach((el) => AviElement.setContent(el, content));

        return content;
    }
}

export default AviFlowCoreEngine