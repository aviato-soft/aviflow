import { AviFlowCoreEngine} from './AviFlowCoreEngine.js';
import { AviFlowActions} from './AviFlowActions.js';
import { AviElement } from './tools/AviElement.js';
import { AviText } from './tools/AviText.js';

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
 *   - Examples: ``"submit.prevent"``, ``"click.prevent.stop"``
 *   - **`.prevent`**: Invokes `event.preventDefault()` before action execution.
 *   - **`.stop`**: Invokes `event.stopPropagation()`.
 * - **`action`**: A string identifying a callable method within the flow's `action` registry.
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
 * ### Usage and Behavior
 * - Malformed flow definitions (missing required components or incorrect 
 *   structure, e.g. an empty action, an empty target such as "fetch ->", more 
 *   than three parts, or "-|" after three parts) are logged as warnings and 
 *   will not be registered.
 * - Modifiers are only recognised at the END of the event part 
 *   ("my.event" is a plain event name).
 * - Actions are executed via `action.call(htmlNode, flow)`, where `htmlNode` 
 *   is the initiating HTML element and `flow` is the `AviFlow` instance and 
 *   may be sync or async.
 */
class AviFlow {
    #core = new AviFlowCoreEngine(this);

    tools = {
        element: AviElement,
        text: AviText
    };


    constructor(actions = {}, options = {}) {
        this.action = {
            fetch: AviFlowActions.fetchData,
            ...actions
        }

        this.option = {
            autoInit: true,
            root: typeof document !== 'undefined' ? document : null,
            ...options
        }

        if (this.option.autoInit) this.init();
    };
    

    /**
     * Initializes the engine by finding and binding all elements with the ``data-flow`` attribute
     * within the specified root element (or the document body by default).
     *
     * @param {HTMLElement} [root] The container element to search for flow definitions.
     * @returns {AviFlow} The current AviFlow instance.
     */
    init(root = this.option.root) {
        if (!root) return this;

        const elements = [];

        if (root.nodeType === 1 && root.matches('[data-flow]')) elements.push(root);
        if (typeof root.querySelectorAll === 'function') elements.push(...root.querySelectorAll('[data-flow]'));

        elements.forEach((element) => this.#core.controller(element));

        return this;
    }


    /**
     * Registers a new action function to be available within the data flow system.
     *
     * @param {string} name The unique identifier for the new action.
     * @param {function} actionFn The function to be executed, typically accepting (element, flow) as arguments.
     * @returns {AviFlow} The current AviFlow instance.
     */
    register(name, actionFn) {
        if (name && typeof name === 'object') {
            for (const [key, fn] of Object.entries(name)) this.register(key, fn);
        } else if (typeof name === 'string' && typeof actionFn === 'function') {
            this.action[name] = actionFn;
        } else {
            console.warn("AviFlow.register: expected (string, function) or an object of functions.");
        }
        return this;
    }

}

export default AviFlow;