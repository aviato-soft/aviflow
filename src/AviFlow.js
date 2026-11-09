import { AviFlowCoreEngine } from './AviFlowCoreEngine.js';
import { AviFlowActions } from './AviFlowActions.js';
import { AviElement } from './tools/AviElement.js';
// import { AviText } from './tools/AviText.js';

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * @class AviFlow
 * @description The core engine for implementing declarative data flow mechanisms within the DOM.
 *
 * The engine interprets a special attribute, ``data-flow``, present on HTML elements to define
 * a sequence of operations (event, action, and target).
 *
 * ### Data Flow Grammar
 * The flow string is parsed using the `->` delimiter.
 *
 * 1. **`event -> action -> target`** (Full Flow):
 *    * Executes an action and propagates its result to a specified target.
 * 2. **`action -> target`** (Implicit Event):
 *    * Executes the action (defaulting to the ``click`` event) and propagates the result to the target.
 * 3. **`action`** (Eventless Flow):
 *    * Executes the action without any associated event or target propagation.
 * 4. **`event -> action -|`** (Terminate):
 *    * Triggers the specified event and action but halts execution, preventing target updates.
 * 5. **`action -|`** (Terminate):
 *    * Executes the action and halts execution, preventing target updates.
 *
 * ### Components
 * - **`event`**: A DOM event name, which may include modifiers:
 *   - Examples: ``"submit.prevent"``, ``"click.prevent.stop"``, ``"scroll.passive.window"``
 *   - Supported modifiers: ``prevent``, ``stop``, ``passive``, ``window``
 *   - **`.prevent`**: Invokes `event.preventDefault()` before action execution.
 *   - **`.stop`**: Invokes `event.stopPropagation()`.
 *   - **`.passive`**: Registers the listener as passive (`{ passive: true }`), telling the
 *     browser it will not call `preventDefault()`. If another flow on the same element and
 *     event uses `.prevent`, `.passive` is ignored and a warning is logged.
 *   - **`.window`**: Attaches the listener to `window` instead of the element, so the event
 *     is caught wherever it fires (e.g. ``"resize.window"``, ``"keydown.window"``).
 * - **`action`**: A string identifying a callable method within the flow's `action` object.
 *   It may be a dotted path of any depth into nested objects: ``getTrigger.id``,
 *   ``admin.users.remove``. An exact key (even one containing dots) takes
 *   precedence over path resolution.
 * - **`target`**: A standard CSS selector string defining one or more elements that will receive the action's result.
 *
 * ### Examples:
 *   data-flow="fetch -> #list"                      click, fetch, update #list
 *   data-flow="load"                                click, load
 *   data-flow="fetch -|"                            click, fetch, no target
 *   data-flow="focus -> fetch -|"                   focus, fetch, no target
 *   data-flow="submit.prevent -> fetch -> #result"  ajax form
 *   data-flow="submit.prevent -> save -|"           ajax form, nothing to update
 *
 * ### Built-in actions
 * Registered by default (they can be overridden by passing an action with the same name):
 *   - **`fetch`**: `AviFlowActions.fetchData`. Sends an HTTP request built from the element's
 *     data attributes and returns the parsed response.
 *   - **`value`**: `AviFlowActions.elementValue`. Returns the element's value: `true`/`false`
 *     for checkboxes, `value` for inputs/textareas/selects, `innerText` for other elements,
 *     or `null`.
 *
 *   data-flow="input -> value -> #preview"         copy the input's value into #preview
 *   data-flow="change -> value -> #state"          checkbox checked state (true / false)
 *
 * ### Providing actions
 * Pass them to the constructor, or assign them to `flow.action` at any time:
 *   new AviFlow({ save, admin: { users: { remove } } });
 *   flow.action.reload = reload;
 *
 * ### Usage and Behavior
 * - Malformed flow definitions (missing required components or incorrect
 *   structure, e.g. an empty action, an empty target such as "fetch ->", more
 *   than three parts, or "-|" after three parts) are logged as warnings and
 *   will not be registered.
 * - Modifiers are only recognised at the END of the event part
 *   ("my.event" is a plain event name).
 * - Actions are executed as `action.call(owner, element, event, target, flow)`, where `owner`
 *   is the object that contains the function (`flow.action` for top-level actions,
 *   the nested object for dotted paths). May be sync or async. Parameters, in order:
 *   - **`element`**: the `HTMLElement` that triggered the flow.
 *   - **`event`**: the DOM event object.
 *   - **`target`**: the target CSS selector string from the flow definition.
 *   - **`flow`**: the `AviFlow` instance.
 *   All are optional to declare: an action only needs to list the parameters it uses,
 *   up to the last one it needs, e.g. `(element, event) => { ... }`.
 */
class AviFlow {
    #core = new AviFlowCoreEngine(this);

    tools = {
        element: AviElement,
 //     text: AviText
    };

    /**
     * @param {Object<string, Function|Object>} [actions] Extra actions, merged over the built-in
     *        ones (`fetch`, `value`). Values may be functions or nested objects of functions.
     * @param {Object} [options]
     * @param {boolean} [options.autoInit=true] Bind all `data-flow` elements on construction.
     * @param {Document|HTMLElement|string|null} [options.root=document] Default root for `init()`.
     */
    constructor(actions = {}, options = {}) {
        this.action = {
            fetch: AviFlowActions.fetchData,
            value: AviFlowActions.elementValue,
            ...actions
        };

        this.option = {
            autoInit: true,
            root: typeof document !== 'undefined' ? document : null,
            ...options
        };

        if (this.option.autoInit) this.init();
    }

    /**
     * Initializes the engine by finding and binding all elements with the ``data-flow`` attribute
     * within the specified root (the ``document`` by default). The root itself is also bound
     * if it carries the attribute.
     *
     * The root may be a CSS selector, in which case every matching element is initialized.
     *
     * Safe to call repeatedly, including on already bound content: the core engine's
     * `controller` reuses existing listeners, replaces them when their options change,
     * and removes those whose event is no longer declared.
     *
     * @param {Document|HTMLElement|string} [root] The container to search for flow definitions,
     *        or a CSS selector matching one or more containers.
     * @returns {AviFlow} The current AviFlow instance.
     */
    init(root = this.option.root) {
        if (!root) return this;

        if (typeof root === 'string') {
            document.querySelectorAll(root).forEach((el) => this.init(el));
            return this;
        }

        if (root.matches?.('[data-flow]')) this.#core.controller(root);
        root.querySelectorAll?.('[data-flow]').forEach((el) => this.#core.controller(el));

        return this;
    }

    /**
     * Resolves an action name against `this.action`. The name may be a
     * dotted path of any depth ("fetch", "getTrigger.id", "admin.users.remove").
     *
     * 1. An exact key wins (so flat keys that contain dots keep working).
     * 2. Otherwise the path is walked one segment at a time through nested objects.
     *
     * Only objects are traversed (never functions), and "__proto__", "prototype",
     * "constructor" and inherited Object.prototype members (toString...) are rejected.
     *
     * @param {string} path
     * @returns {{fn: Function, owner: Object}|null} The function and the object that
     *          contains it (used as `this` when the action is called), or null.
     */
    resolveAction(path) {
        if (!this.action || typeof path !== 'string' || !path) return null;

        if (Object.hasOwn(this.action, path)) {
            return typeof this.action[path] === 'function' ? { fn: this.action[path], owner: this.action } : null;
        }

        let owner = this.action;
        let node = this.action;
        for (const key of path.split('.')) {
            if (!key || UNSAFE_KEYS.has(key) || node === null || typeof node !== 'object') return null;
            const next = node[key];
            if (next === undefined || next === Object.prototype[key]) return null;
            owner = node;
            node = next;
        }

        return typeof node === 'function' ? { fn: node, owner } : null;
    }
}

export default AviFlow;
