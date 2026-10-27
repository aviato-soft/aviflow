import { AviElement } from './tools/AviElement.js';

export class AviFlowCoreEngine {
    constructor(flow) {
        this.flow = flow;
        this.core = this;
        this.boundElements = new WeakMap();
    }

    
    controller(element) {
        if (!element?.dataset) return;

        const flowConfig = AviFlowCoreEngine.parseFlow(element.dataset.flow);
        if (!flowConfig) return;

        const { event, action, target, prevent, stop } = flowConfig;

        let eventConfigs = this.boundElements.get(element);
        if (!eventConfigs) {
            eventConfigs = new Map();
            this.boundElements.set(element, eventConfigs);
        }

        if (eventConfigs.has(event)) {
            // Update the existing configuration in place so subsequent events use the new target/action
            const config = eventConfigs.get(event);
            config.action = action;
            config.target = target;
            config.prevent = prevent;
            config.stop = stop;
            return;
        }

        // Create a stable config object referenced by the single event listener
        const config = { action, target, prevent, stop };
        eventConfigs.set(event, config);

        element.addEventListener(event, (e) => {
            this.core.eventHandler(element, e, config.action, config.target, config.prevent, config.stop);
        });

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
            result = actionFn(element, this.flow);
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
        return result;
    }

/**
* Parses a string to determine the event, prevention flags, and propagation flags for the flow.
*
* @param {string} ``strEvent`` The flow string fragment (e.g., "click.prevent.stop").
* @returns {{event: string, prevent: boolean, stop: boolean}} An object defining the event and modifiers.
*/
    static parseEvent(strEvent) {
        const parts = strEvent.split('.').map((s) => s.trim());
        let event = ((parts.length === 1) ? strEvent : parts[0]) || 'click';
        let prevent = strEvent.includes('.prevent');
        let stop = strEvent.includes('.stop');

        return { event, prevent, stop };
    }

/**
     * Parses a flow string and decomposes it into its constituent parts:
     * the triggering event, the action identifier, and the target selector.
     * The flow syntax supports three formats:
     * 1. ``event->action``: Triggers action on event.
     * 2. ``event->action->target``: Executes action and applies result to target selector.
     * 3. ``action->target``: Triggers action directly, applying result to target selector.
     *
     * @param {string} ``flowString`` The flow definition string.
     * @returns {Object|null} An object containing `event`, `action`, `target`, `prevent`, and `stop` flags, or null if parsing fails.
     */
    static parseFlow(flowString) {
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
            return;
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
            return;
        }

        if (!noTarget && parts.length > 1 && !target) {
            console.warn(`[AviFlow.core.parseFlow] Empty target: end the flow with "-|" when there is no target`);
            return;
        }

        if (eventRaw.startsWith(".")) eventRaw = 'click' + eventRaw;

        const { event, prevent, stop } = AviFlowCoreEngine.parseEvent(eventRaw);

        return { event, action, target, prevent, stop };
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

        targets.forEach((el) => AviElement.updateContent(el, content));

        return content;
    }
}

export default AviFlowCoreEngine