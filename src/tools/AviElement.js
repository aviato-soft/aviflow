/**
 * @class AviElement
 * @description HTMLElement utility class for AviFlow.
 * 
 * Return convention: methods that operate on an element return that element 
 * or `null` when the input is not a valid element.
 * Getters return plain objects (`{}` when empty).
 */
export class AviElement {

    /** Default options (frozen, shared between calls). */
    static #DEFAULTS_ACTIVE = Object.freeze({
        'hidden-class': 'hidden',
        'hidden-aria': true
    });

    
    static #DEFAULTS_PENDING = Object.freeze({
        'pending-class': 'pending',
        'pending-opacity': 0.6,
        'pending-pointer': 'none',
        'pending-disabled': true
    });
    

    /** Form control tags that support the `disabled` property. */
    static #FORM_TAGS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']);

    
    /** Option values that mean "do not apply". */
    static #OFF = new Set([false, 'false', undefined, null]);

    
    /** `getParams` options used to read `data-opt-*` options: never include form fields. */
    static #OPTIONS_ONLY = Object.freeze({ form: false });

    
    /** Saved state of elements currently in pending state. */
    static #pending = new WeakMap();

    
    /**
     * Converts a class option value into a list of class names.
     * Supports several classes separated by whitespace; "off" values give an empty list.
     *
     * @param {*} value Option value.
     * @returns {string[]}
     */
    static #classTokens(value) {
        if (AviElement.#OFF.has(value)) return [];
        return String(value).split(/\s+/).filter(Boolean);
    }
    

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
        if (!element.dataset?.parent) return [element];

        const chain = [];
        const visited = new Set();
        let current = element;

        while (current && !visited.has(current)) {
            visited.add(current);
            chain.push(current);

            const selector = current.dataset?.parent;
            if (!selector) break;

            try {
                current = current.parentElement?.closest(selector) ?? document.querySelector(selector);
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
     * @param {boolean} [useClosest=false] 
     * If true and the element is not a form, use the form it belongs to 
     * `element.form`, else the closest ancestor `<form>`.
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
     * Extracts all form parameter values from the specified element.
     * By default the element must be an `HTMLFormElement` (strict mode, 
     * as used by `getParams`).
     *
     * @param {HTMLFormElement|HTMLElemen} 
     * `element` The form element from which to retrieve parameters.
     * @param {boolean} [useClosest=false] 
     * If true and the element is not a form, use the form it belongs to 
     * (`element.form`, else the closest ancestor `<form>`).
     * @returns {Object.<string, string|File|Array<string|File>>} 
     * An object mapping form field names to their values, or an array of
     * values if the field is duplicated.
     */
    static getFormParams(element, useClosest = false) {
        const formParams = {};

        if (!element) return formParams;

        const formElement = element instanceof HTMLFormElement
            ? element
            : (useClosest ? (element.form ?? element.closest?.('form')) : null);
        //            : (useClosest ? element.closest?.('form') : false);
        if (!formElement) return formParams;

        const formData = new FormData(formElement);

        for (const [key, value] of formData.entries()) {
            if (key === '__proto__') continue;

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
     * Retrieves parameters from the element and its `data-parent` ancestors:
     * `data-{prefix}-*` attributes plus fields of forms (strict: only elements that
     * are themselves a `<form>` contribute fields).
     *
     * Priority (highest first):
     * 1. `data-{prefix}-*` of the element itself
     * 2. `data-{prefix}-*` of each ancestor, nearest first
     * 3. form fields of the element and its ancestors that are forms, nearest first
     *
     * @param {HTMLElement} element 
     * The element from which to retrieve parameters.
     * @param {string} [prefix='param'] 
     * Attribute prefix (without `data-`).
     * @param {Object} [opt={}] Options:
     *  - `parent` {boolean} Include the `data-parent` chain. Default: true.
     *  - `form` {boolean} Include form fields. Default: true.
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
        const chain = options.parent
            ? AviElement.#resolveChain(element, '[AviFlow.tools.element.getParams]')
            : [element];

        for (const el of chain) {
            if (options.form) Object.assign(formParams, AviElement.getFormParams(el));
            AviElement.#readPrefixed(el, fullPrefix, dataParams);
        }

        return { ...formParams, ...dataParams };
    }


    /**
     * Optional HTML sanitizer used by `updateContent` for HTML strings.
     * Example: `AviElement.sanitizer = (html) => DOMPurify.sanitize(html);`
     * @type {((html: string) => string)|null}
     */
    static sanitizer = null;

    /**
     * Activates one or more content sections within a container element.
     *
     * Children with a `data-content` attribute listed in `activeName` are shown;
     * all others are hidden. Hiding adds the hidden class and, optionally,
     * `aria-hidden="true"`. Showing removes them.
     *
     * @param {HTMLElement} element The container element.
     * @param {string|number|Array<string|number>} activeName 
     * The `data-content` value(s) to activate:
     * - a string: `'a'`
     * - a string with several names separated by spaces and/or commas: `'a b'`, `'a, b'`
     * - an array of names: `['a', 'b']`
     * - an empty string or empty array: hides every content section
     * Names therefore cannot contain spaces or commas.
     * @param {Object} [opt={}] 
     * Options overriding `data-opt-*` attributes:
     * - `hidden-class` (default 'hidden'; several classes separated by spaces; `false` = none),
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
            ...AviElement.#DEFAULTS_ACTIVE,
            ...AviElement.getParams(element, 'opt', AviElement.#OPTIONS_ONLY),
            ...opt
        };

        const hiddenClasses = AviElement.#classTokens(options['hidden-class']);
        const useAria = !AviElement.#OFF.has(options['hidden-aria']);
        if (!hiddenClasses.length && !useAria) return element;

        const activeNames = new Set();
        const rawNames = Array.isArray(activeName) ? activeName : [activeName];

        for (const name of rawNames) {
            if (name != null) {
                for (const part of String(name).split(/[\s,]+/)) {
                    if (part) activeNames.add(part);
                }
            }
        }

        for (const el of element.querySelectorAll('[data-content]')) {
            const hide = !activeNames.has(el.dataset.content);

            for (const c of hiddenClasses) el.classList.toggle(c, hide);

            if (useAria) {
                if (hide) {
                    if (el.getAttribute('aria-hidden') !== 'true') el.setAttribute('aria-hidden', 'true');
                } else {
                    el.removeAttribute('aria-hidden');
                }
            }
        }
        return element;
    }


    /**
     * Manages the loading state of the DOM element.
     * Sets or removes a `pending` state by applying visual indicators such as
     * reduced opacity and disabled pointer events.
     * Only what was actually changed is restored on exit, using the options 
     * that were active when entering.
     * 
     * Tip: call `togglePendingState(el, false)` in a `finally` block.
     * 
     * Supported option keys (read from `data-opt-*` attributes or the `opt` argument):
     * - `pending-class`     {string}  Class added while pending. Default: 'pending'.
     * - `pending-opacity`   {number|string|false} Opacity while pending. Default: 0.6.
     * - `pending-pointer`   {string|false} pointer-events value while pending. Default: 'none'.
     * - `pending-disabled`  {boolean|string} Disable form controls while pending. Default: true.
     *
     * @param {HTMLElement|SVGElement} 
     * element The DOM element whose state needs to be toggled.
     * @param {boolean|null} [isPending=null] 
     * true = enter pending, false = restore, null = toggle.
     * @param {Object} [opt={}] 
     * Options overriding `data-opt-*` attributes.
     * @returns {HTMLElement|SVGElement|null} The element, or null if invalid.
     */
    static togglePendingState(element, isPending = null, opt = {}) {
        if (!(element instanceof HTMLElement || element instanceof SVGElement)) return null;

        const saved = AviElement.#pending.get(element);
        const enter = isPending == null
            ? !saved
            : Boolean(isPending) && !AviElement.#OFF.has(isPending);

        if (enter) {
            if (saved) return element; // already pending

            const options = {
                ...AviElement.#DEFAULTS_PENDING,
                ...AviElement.getParams(element, 'opt', AviElement.#OPTIONS_ONLY),
                ...opt
            };
            const on = v => !AviElement.#OFF.has(v);

            const state = {
                cls: AviElement.#classTokens(options['pending-class']),
                ariaBusy: element.getAttribute('aria-busy'),
                style: {},
                disabled: undefined
            };

            if (on(options['pending-opacity'])) {
                state.style['opacity'] = element.style.getPropertyValue('opacity');
                element.style.setProperty('opacity', String(options['pending-opacity']));
            }
            if (on(options['pending-pointer'])) {
                state.style['pointer-events'] = element.style.getPropertyValue('pointer-events');
                element.style.setProperty('pointer-events', String(options['pending-pointer']));
            }
            if (on(options['pending-disabled']) && AviElement.#FORM_TAGS.has(element.tagName)) {
                state.disabled = element.disabled;
                element.disabled = true;
            }

            element.setAttribute('aria-busy', 'true');
            if (state.cls.length) element.classList.add(...state.cls);
            AviElement.#pending.set(element, state);

        } else if (saved) {
            for (const prop in saved.style) {
                const prev = saved.style[prop];
                prev ? element.style.setProperty(prop, prev) : element.style.removeProperty(prop);
            }
            if (saved.disabled !== undefined) element.disabled = saved.disabled;
            if (saved.cls.length) element.classList.remove(...saved.cls);

            // Restore a pre-existing aria-busy, otherwise remove ours
            if (saved.ariaBusy !== null) {
                element.setAttribute('aria-busy', saved.ariaBusy);
            } else {
                element.removeAttribute('aria-busy');
            }
            AviElement.#pending.delete(element);

        } else {
            // Nothing saved (e.g. pending set externally): just clean up markers
            const options = {
                ...AviElement.#DEFAULTS_PENDING,
                ...AviElement.getParams(element, 'opt', AviElement.#OPTIONS_ONLY),
                ...opt
            };
            const cls = AviElement.#classTokens(options['pending-class']);
            if (cls.length) element.classList.remove(...cls);
            element.removeAttribute('aria-busy');
        }

        return element;
    }

    /**
     * Updates the content of the element based on its type and the provided data.
     * Content can be HTML, string, or object structures.
     *
     * - `Node`: replaces the children with a clone of the node.
     * - Value elements (input, textarea, select): sets `value`.
     * - Strings and `{ html }` objects: set as HTML (through `AviElement.sanitizer` if defined).
     * - Other values (plain objects, numbers, booleans): converted to text (objects as JSON)
     *   and set as plain text, never parsed as HTML.
     * - `null` / `undefined` (also as `html`): empty string.
     *
     * @param {HTMLElement} element The target HTML element.
     * @param {*} content The data to be inserted into the element.
     * @returns {HTMLElement|null} The modified element, or null if invalid.
     */
    static updateContent(element, content) {
        if (!(element instanceof Element)) return null;

        if (content instanceof Node) {
            element.replaceChildren(content.cloneNode(true));
            return element;
        }

        let parsedContent = content;
        let isHtml = typeof content === 'string'; // plain strings stay HTML for backward compatibility

        if (content !== null && typeof content === 'object') {
            if (Object.hasOwn(content, 'html')) {
                isHtml = true;
                parsedContent = (content.html == null || typeof content.html === 'string')
                    ? content.html
                    : JSON.stringify(content.html);
            } else {
                parsedContent = JSON.stringify(content);
            }
        }

        // Normalized assignment
        const value = String(parsedContent ?? '');

        if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement) {
            element.value = value;
        } else if (isHtml) {
            element.innerHTML = AviElement.sanitizer ? AviElement.sanitizer(value) : value;
        } else {
            element.textContent = value;
        }

        return element;
    }
}

export default AviElement