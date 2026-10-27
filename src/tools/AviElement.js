/**
 * @class AviElement
 * @description HTMLElement utility class for AviFlow.
 * 
 * Return convention: methods that operate on an element having prefix: `set`
 * return that element, * or `null` when the input is not a valid element.
 */
export class AviElement {

    /** Form control tags that support the `disabled` property. */
    static #FORM_TAGS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']);

    /** Option values that mean "do not apply". */
    static #OFF = new Set([false, 'false', undefined, null]);

    /** Saved state of elements currently in pending state. */
    static #pending = new WeakMap();

    /**
     * Builds the full data-attribute prefix.
     * '' -> 'data-', '-' -> 'data--', 'opt' -> 'data-opt-' (lowercased).
     *
     * @param {string} prefix
     * @returns {string}
     */
    static #fullPrefix(prefix) {
        const p = String(prefix ?? '').toLowerCase();
        return (p === '' || p === '-') ? `data-${p}` : `data-${p}-`;
    }


    /**
    * Copies attributes starting with `fullPrefix` into `target` (prefix stripped).
    */
    static #readPrefixed(el, fullPrefix, target) {
        for (const attr of el.attributes) {
            if (attr.name.startsWith(fullPrefix)) {
                target[attr.name.slice(fullPrefix.length)] = attr.value;
            }
        }
    }


    /**
     * Resolves the `data-parent` chain of an element (iteratively, with cycle protection).
     *
     * @param {HTMLElement} element Starting element.
     * @param {string} tag Log prefix used in warnings.
     * @returns {HTMLElement[]} Chain ordered root ancestor first, element last.
     */
    static #resolveChain(element, tag) {
        const chain = [];
        const visited = new Set();
        let current = element;

        while (current && !visited.has(current)) {
            visited.add(current);
            chain.push(current);

            const selector = current.dataset?.parent;
            if (!selector) break;

            try {
                current = document.querySelector(selector);
            } catch (err) {
                console.warn(`${tag} Invalid parent selector`, selector, err);
                break;
            }
        }
        return chain.reverse();
    }


    /**
     * Retrieves all dataset properties for the specified element.
     * If the element possesses a ``data-parent`` attribute, properties are inherited
     * from the parent chain. The element's own values take precedence.
     *
     * @param {HTMLElement} `element` The HTML element to analyze.
     * @returns {Object} A merged object containing all accessible dataset properties.
     */
    static getDataset(element) {
        if (!element?.dataset) return {};
        const chain = AviElement.#resolveChain(element, '[AviFlow.tools.element.getDataset]');
        const result = {};
        for (const el of chain) {
            Object.assign(result, el.dataset);
        }
        return result;
    }


    /**
     * Extracts all form parameter values from the specified element, 
     * provided the element is an instance of `HTMLFormElement`.
     *
     * @param {HTMLFormElement} `element` The form element from which to retrieve parameters.
     * @returns {Object.<string, string|string[]>} An object mapping form field names to their values, or an array of values if the field is duplicated.
     */
    static getFormParams(element, useClosest = false) {
        const formParams = {};

        if (!element) return formParams;

        const formElement = element instanceof HTMLFormElement
            ? element
            : (useClosest ? element.closest?.('form') : false);
        if (!formElement) return formParams;


        const formData = new FormData(formElement);

        for (const [key, value] of formData.entries()) {
            if (Object.hasOwn(formParams, key)) {
                if (!Array.isArray(formParams[key])) {
                    formParams[key] = [formParams[key]];
                }
                formParams[key].push(value);
            } else {
                formParams[key] = value;
            }
        }

        return formParams;
    }


    /**
     * Retrieves parameters from 3 sources: 
     *  the element, form fields of the element children and `data-parent` ancestors.
     *
     * Priority (highest first):
     * 1. `data-{prefix}-*` of the element itself
     * 2. `data-{prefix}-*` of each ancestor, nearest first
     * 3. form fields of the element and its ancestors that are forms, nearest first
     *
     * @param {HTMLElement} element The target element.
     * @param {string} [prefix='param'] Attribute prefix (without `data-`).
     * @returns {Object} Merged form and data parameters.
     */
    static getParams(element, prefix = 'param', opt = {}) {
        if (!element?.attributes) return {};

        const options = {
            "parent": true,
            "form": true,
            ...opt
        };

        const dataParams = {};
        const formParams = {};
        const fullPrefix = AviElement.#fullPrefix(prefix);

        if (options.parent) {
            // chain is root ancestor first, so nearer elements overwrite farther ones
            const chain = AviElement.#resolveChain(element, '[AviFlow.tools.element.getParams]')
            for (const el of chain) {
                if (options.form) Object.assign(formParams, AviElement.getFormParams(el));
                AviElement.#readPrefixed(el, fullPrefix, dataParams);
            }
        } else {
            if (options.form) Object.assign(formParams, AviElement.getFormParams(element));
            AviElement.#readPrefixed(element, fullPrefix, dataParams);
        }

        return { ...formParams, ...dataParams };
    }


    /**
     * Activates one or more content sections within a container element.
     *
     * Children with a `data-content` attribute listed in `activeName` are shown;
     * all others are hidden. Hiding adds the hidden class and, optionally,
     * `aria-hidden="true"`. Showing removes them.
     *
     * @param {HTMLElement} element The container element.
     * @param {string|number} activeName The `data-content` value to activate.
     * `activeName` can be:
     * - a string: `'a'`
     * - a string with several names separated by spaces and/or commas: `'a b'`, `'a, b'`
     * - an array of names: `['a', 'b']`
     * - an empty string or empty array: hides every content section
     * Names therefore cannot contain spaces or commas.
     * @param {Object} [opt={}] Options overriding `data-opt-*` attributes.
     *  `opt` can be:
     * - `hidden-class` (default 'hidden'), 
     * - `hidden-aria` (default true).
     * Note: `aria-hidden` on focusable descendants is an accessibility anti-pattern.
     * If hidden sections contain links or inputs, use a hidden class that applies
     * `display:none` (which also removes them from the tab order) or disable `hidden-aria`.
     * @returns {HTMLElement|null} The container, or null if invalid.
     */
    static setActiveContent(element, activeName, opt = {}) {
        if (!(element instanceof Element)) return null;
        if (activeName == null) return element;

        const options = {
            "hidden-class": 'hidden',
            'hidden-aria': true,
            ...AviElement.getParams(element, 'opt'),
            ...opt
        };

        const hiddenClasses = String(options['hidden-class']).split(/\s+/).filter(Boolean);
        const useAria = !AviElement.#OFF.has(options['hidden-aria']);
        if (!hiddenClasses.length && !useAria) return element;

        const activeNames = new Set();
        const rawNames = Array.isArray(activeName) ? activeName : [activeName];

        for (const name of rawNames) {
            if (name != null) {
                const parts = String(name).split(/[\s,]+/);
                for (const part of parts) {
                    if (part) activeNames.add(part);
                }
            }
        }

        for (const el of element.querySelectorAll('[data-content]')) {
            const hide = !activeNames.has(el.dataset.content);

            for (const c of hiddenClasses) el.classList.toggle(c, hide);
            if (useAria) hide ? el.setAttribute('aria-hidden', 'true') : el.removeAttribute('aria-hidden');
        }
        return element;
    }


    /**
     * Manages the loading state of the DOM element.
     * Sets or removes a `pending` state by applying visual indicators such as
     * reduced opacity and disabled pointer events.
     * 
     * Tip: call `togglePendingState(el, false)` in a `finally` block.
     * 
     * Supported option keys (read from `data-opt-*` attributes or the `opt` argument):
     * - `pending-class`     {string}  Class added while pending. Default: 'pending'.
     * - `pending-opacity`   {number|string|false} Opacity while pending. Default: 0.6.
     * - `pending-pointer`   {string|false} pointer-events value while pending. Default: 'none'.
     * - `pending-disabled`  {boolean|string} Disable form controls while pending. Default: true.
     *
     * @param {HTMLElement} `element` The DOM element whose state needs to be toggled.
     * @param {boolean|null} isPending If true, enters pending state; if false, restores original state.
     */
    static togglePendingState(element, isPending = null, opt = {}) {
        if (!(element instanceof Element)) return null;

        const options = {
            "pending-class": 'pending',
            "pending-opacity": 0.6,
            "pending-pointer": "none",
            "pending-disabled": true,
            ...AviElement.getParams(element, 'opt'),
            ...opt
        };

        const on = v => !AviElement.#OFF.has(v);

        isPending ??= !AviElement.#pending.has(element);

        if (isPending) {
            if (AviElement.#pending.has(element)) return element; // already pending

            const saved = {
                cls: String(options['pending-class']),
                ariaBusy: element.getAttribute('aria-busy'),
                style: {},
                disabled: undefined
            };

            if (on(options['pending-opacity'])) {
                saved.style['opacity'] = element.style.getPropertyValue('opacity');
                element.style.setProperty('opacity', String(options['pending-opacity']));
            }
            if (on(options['pending-pointer'])) {
                saved.style['pointer-events'] = element.style.getPropertyValue('pointer-events');
                element.style.setProperty('pointer-events', String(options['pending-pointer']));
            }
            if (on(options['pending-disabled']) && AviElement.#FORM_TAGS.has(element.tagName)) {
                saved.disabled = element.disabled;
                element.disabled = true;
            }

            element.setAttribute('aria-busy', 'true');
            if (saved.cls) element.classList.add(saved.cls);
            AviElement.#pending.set(element, saved);

        } else {
            const saved = AviElement.#pending.get(element);

            if (saved) {
                for (const prop in saved.style) {
                    const prev = saved.style[prop];
                    prev ? element.style.setProperty(prop, prev) : element.style.removeProperty(prop);
                }
                if (saved.disabled !== undefined) element.disabled = saved.disabled;
                if (saved.cls) element.classList.remove(saved.cls);

                if (saved.ariaBusy !== null) {
                    element.setAttribute('aria-busy', saved.ariaBusy);
                } else {
                    element.removeAttribute('aria-busy');
                }
                AviElement.#pending.delete(element);
            } else {
                // Nothing saved (e.g. pending set externally): just clean up markers
                const cls = String(options['pending-class']);
                if (cls) element.classList.remove(cls);
            }

            element.removeAttribute('aria-busy');
        }

        return element;
    }

    /**
     * Updates the content of the element based on its type and the provided data.
     * Content can be HTML, string, or object structures.
     * If the element is an input field, `element.value` is set; otherwise,
     * the `element.innerHTML` is updated.
     *
     * @param {HTMLElement} `element` The target HTML element.
     * @param {*} `content` The data to be inserted into the element.
     * @returns {HTMLElement} The modified element.
     */
    static updateContent(element, content) {
        if (!(element instanceof Element)) return null;

        if (content instanceof Node) {
            element.replaceChildren(content.cloneNode(true));
            return element;
        }

        let parsedContent = content;

        if (content !== null && typeof content === 'object') {
            if (Object.hasOwn(content, 'html')) {
                parsedContent = typeof content.html === 'string'
                    ? content.html
                    : JSON.stringify(content.html);
            } else {
                parsedContent = JSON.stringify(content);
            }
        }

        // Normalized assignment
        const value = parsedContent ?? '';

        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement) {
            element.value = value;
        } else {
            element.innerHTML = String(value);
        }

        return element;
    }
}

export default AviElement