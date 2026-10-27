var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/AviFlow.js
var AviFlow_exports = {};
__export(AviFlow_exports, {
  default: () => AviFlow_default
});
module.exports = __toCommonJS(AviFlow_exports);

// src/tools/AviElement.js
var AviElement = class _AviElement {
  /** Form control tags that support the `disabled` property. */
  static #FORM_TAGS = /* @__PURE__ */ new Set(["INPUT", "BUTTON", "SELECT", "TEXTAREA"]);
  /** Option values that mean "do not apply". */
  static #OFF = /* @__PURE__ */ new Set([false, "false", void 0, null]);
  /** Saved state of elements currently in pending state. */
  static #pending = /* @__PURE__ */ new WeakMap();
  /**
   * Builds the full data-attribute prefix.
   * '' -> 'data-', '-' -> 'data--', 'opt' -> 'data-opt-' (lowercased).
   *
   * @param {string} prefix
   * @returns {string}
   */
  static #fullPrefix(prefix) {
    const p = String(prefix ?? "").toLowerCase();
    return p === "" || p === "-" ? `data-${p}` : `data-${p}-`;
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
    const visited = /* @__PURE__ */ new Set();
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
    const chain = _AviElement.#resolveChain(element, "[AviFlow.tools.element.getDataset]");
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
    const formElement = element instanceof HTMLFormElement ? element : useClosest ? element.closest?.("form") : false;
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
  static getParams(element, prefix = "param", opt = {}) {
    if (!element?.attributes) return {};
    const options = {
      "parent": true,
      "form": true,
      ...opt
    };
    const dataParams = {};
    const formParams = {};
    const fullPrefix = _AviElement.#fullPrefix(prefix);
    if (options.parent) {
      const chain = _AviElement.#resolveChain(element, "[AviFlow.tools.element.getParams]");
      for (const el of chain) {
        if (options.form) Object.assign(formParams, _AviElement.getFormParams(el));
        _AviElement.#readPrefixed(el, fullPrefix, dataParams);
      }
    } else {
      if (options.form) Object.assign(formParams, _AviElement.getFormParams(element));
      _AviElement.#readPrefixed(element, fullPrefix, dataParams);
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
      "hidden-class": "hidden",
      "hidden-aria": true,
      ..._AviElement.getParams(element, "opt"),
      ...opt
    };
    const hiddenClasses = String(options["hidden-class"]).split(/\s+/).filter(Boolean);
    const useAria = !_AviElement.#OFF.has(options["hidden-aria"]);
    if (!hiddenClasses.length && !useAria) return element;
    const activeNames = /* @__PURE__ */ new Set();
    const rawNames = Array.isArray(activeName) ? activeName : [activeName];
    for (const name of rawNames) {
      if (name != null) {
        const parts = String(name).split(/[\s,]+/);
        for (const part of parts) {
          if (part) activeNames.add(part);
        }
      }
    }
    for (const el of element.querySelectorAll("[data-content]")) {
      const hide = !activeNames.has(el.dataset.content);
      for (const c of hiddenClasses) el.classList.toggle(c, hide);
      if (useAria) hide ? el.setAttribute("aria-hidden", "true") : el.removeAttribute("aria-hidden");
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
      "pending-class": "pending",
      "pending-opacity": 0.6,
      "pending-pointer": "none",
      "pending-disabled": true,
      ..._AviElement.getParams(element, "opt"),
      ...opt
    };
    const on = (v) => !_AviElement.#OFF.has(v);
    isPending ??= !_AviElement.#pending.has(element);
    if (isPending) {
      if (_AviElement.#pending.has(element)) return element;
      const saved = {
        cls: String(options["pending-class"]),
        ariaBusy: element.getAttribute("aria-busy"),
        style: {},
        disabled: void 0
      };
      if (on(options["pending-opacity"])) {
        saved.style["opacity"] = element.style.getPropertyValue("opacity");
        element.style.setProperty("opacity", String(options["pending-opacity"]));
      }
      if (on(options["pending-pointer"])) {
        saved.style["pointer-events"] = element.style.getPropertyValue("pointer-events");
        element.style.setProperty("pointer-events", String(options["pending-pointer"]));
      }
      if (on(options["pending-disabled"]) && _AviElement.#FORM_TAGS.has(element.tagName)) {
        saved.disabled = element.disabled;
        element.disabled = true;
      }
      element.setAttribute("aria-busy", "true");
      if (saved.cls) element.classList.add(saved.cls);
      _AviElement.#pending.set(element, saved);
    } else {
      const saved = _AviElement.#pending.get(element);
      if (saved) {
        for (const prop in saved.style) {
          const prev = saved.style[prop];
          prev ? element.style.setProperty(prop, prev) : element.style.removeProperty(prop);
        }
        if (saved.disabled !== void 0) element.disabled = saved.disabled;
        if (saved.cls) element.classList.remove(saved.cls);
        if (saved.ariaBusy !== null) {
          element.setAttribute("aria-busy", saved.ariaBusy);
        } else {
          element.removeAttribute("aria-busy");
        }
        _AviElement.#pending.delete(element);
      } else {
        const cls = String(options["pending-class"]);
        if (cls) element.classList.remove(cls);
      }
      element.removeAttribute("aria-busy");
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
    if (content !== null && typeof content === "object") {
      if (Object.hasOwn(content, "html")) {
        parsedContent = typeof content.html === "string" ? content.html : JSON.stringify(content.html);
      } else {
        parsedContent = JSON.stringify(content);
      }
    }
    const value = parsedContent ?? "";
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.value = value;
    } else {
      element.innerHTML = String(value);
    }
    return element;
  }
};

// src/AviFlowCoreEngine.js
var AviFlowCoreEngine = class _AviFlowCoreEngine {
  constructor(flow) {
    this.flow = flow;
    this.core = this;
    this.boundElements = /* @__PURE__ */ new WeakMap();
  }
  controller(element) {
    if (!element?.dataset) return;
    const flowConfig = _AviFlowCoreEngine.parseFlow(element.dataset.flow);
    if (!flowConfig) return;
    const { event, action, target, prevent, stop } = flowConfig;
    let eventConfigs = this.boundElements.get(element);
    if (!eventConfigs) {
      eventConfigs = /* @__PURE__ */ new Map();
      this.boundElements.set(element, eventConfigs);
    }
    if (eventConfigs.has(event)) {
      const config2 = eventConfigs.get(event);
      config2.action = action;
      config2.target = target;
      config2.prevent = prevent;
      config2.stop = stop;
      return;
    }
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
    if (typeof actionFn !== "function") {
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
    if (result && typeof result.then === "function") {
      return Promise.resolve(result).then((content) => {
        _AviFlowCoreEngine.updateTargets(target, content);
      }).catch(onError);
    }
    _AviFlowCoreEngine.updateTargets(target, result);
    return result;
  }
  /**
  * Parses a string to determine the event, prevention flags, and propagation flags for the flow.
  *
  * @param {string} ``strEvent`` The flow string fragment (e.g., "click.prevent.stop").
  * @returns {{event: string, prevent: boolean, stop: boolean}} An object defining the event and modifiers.
  */
  static parseEvent(strEvent) {
    const parts = strEvent.split(".").map((s) => s.trim());
    let event = (parts.length === 1 ? strEvent : parts[0]) || "click";
    let prevent = strEvent.includes(".prevent");
    let stop = strEvent.includes(".stop");
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
    if (!flowString || typeof flowString !== "string") return null;
    let src = flowString.trim();
    const noTarget = src.endsWith("-|");
    if (noTarget) src = src.slice(0, -2);
    const parts = src.split("->").map((s) => s.trim());
    const max = noTarget ? 2 : 3;
    if (parts.length > max) {
      console.warn(
        noTarget ? '[AviFlow.core.parseFlow] Too many parts before "-|" (max: event -> action -|)' : '[AviFlow.core.parseFlow] Too many "->" parts (max: event -> action -> target)'
      );
      return;
    }
    let eventRaw = "click";
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
      console.warn('[AviFlow.core.parseFlow] Missing "action"');
      return;
    }
    if (!noTarget && parts.length > 1 && !target) {
      console.warn(`[AviFlow.core.parseFlow] Empty target: end the flow with "-|" when there is no target`);
      return;
    }
    if (eventRaw.startsWith(".")) eventRaw = "click" + eventRaw;
    const { event, prevent, stop } = _AviFlowCoreEngine.parseEvent(eventRaw);
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
    if (!selector || typeof selector !== "string" || content === void 0) return;
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
};

// src/AviFlowActions.js
var AviFlowActions = class {
  /**
   * Performs an asynchronous data retrieval operation using the Fetch API.
   * This method manages HTTP communication, including parameter serialization,
   * request headers, and automatic response parsing into JSON or text format.
   * It also manages pending state visual indicators via ``AviElement``.
   *
   * @param {HTMLElement} ``element`` The element containing the URL and request configuration.
   * @param {Object} [``opt``={}] Optional configuration parameters for the HTTP request.
   * @returns {Promise<Object>} A promise that resolves with the parsed response data, or rejects on error.
   */
  static fetchData(element, opt = {}) {
    let data = null;
    if (!element) {
      return data;
    }
    const elementDataset = AviElement.getDataset(element);
    AviElement.togglePendingState(element, true);
    const options = {
      headers: new Headers({
        "X-Requested-With": "XMLHttpRequest"
      }),
      method: (elementDataset.method || "POST").toUpperCase(),
      params: AviElement.getParams(element),
      url: elementDataset.url || "/",
      ...opt
    };
    if (options.method === "GET" || options.method === "HEAD") {
      if (Object.keys(options.params).length > 0) {
        options.url += (options.url.includes("?") ? "&" : "?") + new URLSearchParams(options.params).toString();
      }
    } else {
      if (Object.keys(options.params).length > 0) {
        options.body = JSON.stringify(options.params);
      }
    }
    if (options.method === "POST" || options.method === "PUT") {
      const formData = new FormData();
      Object.entries(options.params).forEach(([key, value]) => {
        formData.append(key, value);
      });
      options.body = formData;
    } else {
      options.headers.append("Content-Type", "application/json; charset=UTF-8");
    }
    return new Promise((resolve, reject) => {
      fetch(options.url, {
        body: options.body,
        headers: options.headers,
        method: options.method
      }).then((response) => response.json()).then((data2) => {
        if (data2.success) {
          resolve(data2);
        } else {
          reject(data2.error || "Error fetching data");
        }
      }).catch((err) => reject(err)).finally(() => {
        AviElement.togglePendingState(element, false);
        return data;
      });
    });
  }
};

// src/tools/AviText.js
var AviText = class {
  /**
   * Converts a string to `` camelCase `` format. If the input is not a string, it returns an empty string.
   *
   * @param {string|*} ``text`` The input string to process.
   * @param {boolean} [firstLetterLower=true] Determines if the initial character should be lowercase.
   * @returns {string} The formatted string.
   */
  static toCamelCase(text, firstLetterLower = true) {
    if (typeof text !== "string") {
      return "";
    }
    let result = text.trim().replace(/^[-_\s]+/, "").replace(/[-_\s]+(.)?/g, (_, letter) => letter ? letter.toUpperCase() : "");
    if (result.length === 0) return "";
    if (firstLetterLower) {
      return result.charAt(0).toLowerCase() + result.slice(1);
    } else {
      return this.toCapitalize(result);
    }
  }
  /**
   * Capitalizes the first letter of the input string. If the input is not a string, it returns an empty string.
   *
   * @param {string|*} ``text`` The input string.
   * @returns {string} The string with the first letter capitalized.
   */
  static toCapitalize(text) {
    const trimText = text.trim().replace(/^[-_\s]+/, "");
    return trimText.charAt(0).toUpperCase() + trimText.slice(1);
  }
  /**
   * Converts a string to `` PascalCase `` format (capitalizes the first letter and subsequent words). If the input is not a string, it returns an empty string.
   *
   * @param {string|*} ``text`` The input string to process.
   * @returns {string} The formatted string.
   */
  static toPascalCase(text) {
    return this.toCamelCase(text, false);
  }
};

// src/AviFlow.js
var AviFlow = class {
  #core = new AviFlowCoreEngine(this);
  tools = {
    element: AviElement,
    text: AviText
  };
  constructor(actions = {}, options = {}) {
    this.action = {
      fetch: AviFlowActions.fetchData,
      ...actions
    };
    this.option = {
      autoInit: true,
      root: typeof document !== "undefined" ? document : null,
      ...options
    };
    if (this.option.autoInit) this.init();
  }
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
    if (root.nodeType === 1 && root.matches("[data-flow]")) elements.push(root);
    if (typeof root.querySelectorAll === "function") elements.push(...root.querySelectorAll("[data-flow]"));
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
    if (name && typeof name === "object") {
      for (const [key, fn] of Object.entries(name)) this.register(key, fn);
    } else if (typeof name === "string" && typeof actionFn === "function") {
      this.action[name] = actionFn;
    } else {
      console.warn("AviFlow.register: expected (string, function) or an object of functions.");
    }
    return this;
  }
};
var AviFlow_default = AviFlow;
//# sourceMappingURL=aviflow.cjs.js.map
