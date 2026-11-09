// src/tools/AviElement.js
var AviElement = class _AviElement {
  /** Default options (frozen, shared between calls). */
  static #DEFAULTS_ACTIVE = Object.freeze({
    "hidden-class": "hidden",
    "hidden-aria": true
  });
  static #DEFAULTS_PENDING = Object.freeze({
    "pending-class": "pending",
    "pending-opacity": 0.6,
    "pending-pointer": "none",
    "pending-disabled": true
  });
  /** Form control tags that support the `disabled` property. */
  static #FORM_TAGS = /* @__PURE__ */ new Set(["INPUT", "BUTTON", "SELECT", "TEXTAREA", "FIELDSET"]);
  /** Option values that mean "do not apply". */
  static #OFF = /* @__PURE__ */ new Set([false, "false", void 0, null]);
  /** `getParams` options used to read `data-opt-*` options: never include form fields. */
  static #OPTIONS_ONLY = Object.freeze({ form: false });
  /**
   * Converts a class option value into a list of class names.
   * Supports several classes separated by whitespace; "off" values give an empty list.
   *
   * @param {*} value Option value.
   * @returns {string[]}
   */
  static #classTokens(value) {
    if (_AviElement.#OFF.has(value)) return [];
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
    const p = String(prefix ?? "").toLowerCase();
    return p === "" || p === "-" ? `data-${p}` : `data-${p}-`;
  }
  /** Saved state of elements currently in pending state. */
  static #pending = /* @__PURE__ */ new WeakMap();
  /**
  * Copies attributes starting with `fullPrefix` into `target` (prefix stripped).
  */
  static #readPrefixed(el, fullPrefix, target) {
    const fullPrefixLen = fullPrefix.length;
    for (const attr of el.attributes) {
      if (attr.name.startsWith(fullPrefix)) {
        target[attr.name.slice(fullPrefixLen)] = attr.value;
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
    const visited = /* @__PURE__ */ new Set();
    let current = element;
    while (current && !visited.has(current)) {
      visited.add(current);
      chain.unshift(current);
      const selector = current.dataset?.parent;
      if (!selector) break;
      try {
        current = current.parentElement?.closest(selector) ?? document.querySelector(selector);
      } catch (err) {
        console.warn(`${tag} Invalid parent selector`, selector, err);
        break;
      }
    }
    return chain;
  }
  /**
   * Applies the optional `AviElement.sanitizer` to an HTML string.
   *
   * @param {string} html
   * @returns {string}
   */
  static #sanitize(html) {
    return _AviElement.sanitizer ? _AviElement.sanitizer(html) : html;
  }
  /**
   * Serializes a value to JSON without throwing (circular structures,
   * BigInt). Falls back to `String(value)`.
   *
   * @param {*} value Value to serialize.
   * @returns {string|undefined}
   */
  static #toJson(value) {
    try {
      return JSON.stringify(value);
    } catch (err) {
      console.warn(
        "[AviFlow.tools.element.parseContent] Cannot stringify",
        err
      );
      return String(value);
    }
  }
  /**
  * Tells whether `setContent` must write `element.value`:
  * input, textarea, select and form-associated custom elements.
  * (Not a plain `'value' in element` check: that would also match
  * `<button>`, `<li>`, `<option>`, `<meter>`... where `value` is not
  * the displayed content.)
  *
  * @param {Element} el
  * @returns {boolean}
  */
  static #usesValue(el) {
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.constructor?.formAssociated === true && "value" in el;
  }
  /**
   * Appends content (see `parseContent`) to the end of the element's
   * existing content, which is preserved. The element acts as the parent
   * of the new content. No value handling is applied: the content is
   * always added as nodes, whatever the type of the element.
   *
   * - `Node`: a clone is appended.
   * - HTML: inserted after the last child (`insertAdjacentHTML`, so
   *   existing children are not re-parsed), through
   *   `AviElement.sanitizer` if defined.
   * - Text: appended as a text node.
   * - Empty content leaves the element unchanged.
   *
   * @param {HTMLElement} element The element that receives the content.
   * @param {*} content The data to append.
   * @returns {HTMLElement|null} The element, or null if invalid.
   */
  static appendContent(element, content) {
    if (!(element instanceof Element)) return null;
    const parsed = _AviElement.parseContent(content);
    if (parsed.kind === "node") {
      element.append(parsed.value.cloneNode(true));
      return element;
    }
    const value = parsed.value;
    if (value === "") return element;
    if (parsed.kind === "html") {
      element.insertAdjacentHTML("beforeend", _AviElement.#sanitize(value));
    } else {
      element.append(value);
    }
    return element;
  }
  /*
       * Appends content (see `parseContent`) to the end of the element's
       * existing content, which is preserved.
       *
       * - `Node`: a clone is appended.
       * - HTML: inserted after the last child (`insertAdjacentHTML`, so
       *   existing children are not re-parsed), through `AviElement.sanitizer`
       *   if defined.
       * - Text: appended as a text node.
       * - input, textarea and form-associated custom elements: the text is
       *   concatenated to the current `value`. A file input is left untouched.
       * - Empty content leaves the element unchanged.
       *
       * @param {HTMLElement} element The element that receives the content.
       * @param {*} content The data to append.
       * @returns {HTMLElement|null} The element, or null if invalid.
       * /
      static appendContentToParent(element, content) {
          if (!(element instanceof Element)) return null;
  
          const parent = element.parentElement;
          if (!parent) {
              console.warn(
                  '[AviFlow.tools.element.appendContent] Element has no parent'
              );
              return null;
          }
  
          return AviElement.appendContent(parent, content);
      }
  */
  /**
   * Retrieves all dataset properties for the specified element.
   * If the element possesses a `data-parent` attribute, properties are 
   * inherited from the parent chain. The element's own values take 
   * precedence.
   *
   * @param {HTMLElement} 
   *  element The HTML element to analyze.
   * @returns {Object} 
   *  A merged object containing all accessible dataset properties.
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
   * Extracts all form parameter values from the specified element.
   * By default the element must be an `HTMLFormElement` (strict mode, 
   * as used by `getParams`).
   *
   * @param {HTMLFormElement|HTMLElement} 
   * `element` The form element from which to retrieve parameters.
   * @param {boolean} [useClosest=false] 
   *  If true and the element is not a form, use the form it belongs to 
   *  (`element.form`, else the closest ancestor `<form>`).
   * @returns {Object.<string, string|File|Array<string|File>>} 
   *  An object mapping form field names to their values, or an array of
   *  values if the field is duplicated.
   */
  static getFormParams(element, useClosest = false) {
    const formParams = {};
    if (!element) return formParams;
    const formElement = element instanceof HTMLFormElement ? element : useClosest ? element.form ?? element.closest?.("form") : null;
    if (!formElement) return formParams;
    const formData = new FormData(formElement);
    for (const [key, value] of formData.entries()) {
      if (key === "__proto__") continue;
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
   * `data-{prefix}-*` attributes plus fields of forms (strict: only elements
   * that are themselves a `<form>` contribute fields).
   *
   * Priority (highest first):
   * 1. `data-{prefix}-*` of the element itself
   * 2. `data-{prefix}-*` of each ancestor, nearest first
   * 3. form fields of the element and its ancestors that are forms, nearest 
   *  first
   *
   * @param {HTMLElement} element 
   *  The element from which to retrieve parameters.
   * @param {string} [prefix='param'] 
   *  Attribute prefix (without `data-`).
   * @param {Object} [opt={}] Options:
   *  - `parent` {boolean} Include the `data-parent` chain. Default: true.
   *  - `form` {boolean} Include form fields. Default: true.
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
    const chain = options.parent ? _AviElement.#resolveChain(element, "[AviFlow.tools.element.getParams]") : [element];
    for (const el of chain) {
      if (options.form) Object.assign(formParams, _AviElement.getFormParams(el));
      _AviElement.#readPrefixed(el, fullPrefix, dataParams);
    }
    return { ...formParams, ...dataParams };
  }
  /**
   * Normalizes content (usually an ajax response) into a descriptor, so
   * it can be inserted by `setContent` or `appendContent`.
   *
   * Result `{ kind, value }`:
   * - `Node`                    -> `{ kind: 'node', value: node }`
   * - string                    -> `{ kind: 'html', value: string }`
   * - `{ html: ... }` object    -> `{ kind: 'html', value: string }`
   *   (`null` / `undefined` html gives an empty string, a non-string
   *   html is converted to JSON)
   * - other objects             -> `{ kind: 'text', value: json }`
   * - numbers, booleans, others -> `{ kind: 'text', value: String(x) }`
   * - `null` / `undefined`      -> `{ kind: 'text', value: '' }`
   *
   * Plain strings are HTML for backward compatibility. HTML is NOT
   * sanitized here: `setContent` and `appendContent` apply
   * `AviElement.sanitizer` (if defined) when they insert it.
   *
   * @param {*} content The data to parse.
   * @returns {{kind: 'node'|'html'|'text', value: Node|string}}
   */
  static parseContent(content) {
    if (content instanceof Node) {
      return { kind: "node", value: content };
    }
    if (typeof content === "string") {
      return { kind: "html", value: content };
    }
    if (content !== null && typeof content === "object") {
      if (Object.hasOwn(content, "html")) {
        const html = content.html;
        return {
          kind: "html",
          value: html == null || typeof html === "string" ? html ?? "" : String(_AviElement.#toJson(html) ?? "")
        };
      }
      return {
        kind: "text",
        value: String(_AviElement.#toJson(content) ?? "")
      };
    }
    return { kind: "text", value: String(content ?? "") };
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
      ..._AviElement.#DEFAULTS_ACTIVE,
      ..._AviElement.getParams(element, "opt", _AviElement.#OPTIONS_ONLY),
      ...opt
    };
    const hiddenClasses = _AviElement.#classTokens(options["hidden-class"]);
    const useAria = !_AviElement.#OFF.has(options["hidden-aria"]);
    if (!hiddenClasses.length && !useAria) return element;
    const activeNames = /* @__PURE__ */ new Set();
    const rawNames = Array.isArray(activeName) ? activeName : [activeName];
    for (const name of rawNames) {
      if (name != null) {
        for (const part of String(name).split(/[\s,]+/)) {
          if (part) activeNames.add(part);
        }
      }
    }
    const children = Array.from(element.querySelectorAll("[data-content]"));
    for (const el of children) {
      const hide = !activeNames.has(el.dataset.content);
      for (const c of hiddenClasses) el.classList.toggle(c, hide);
      if (useAria) {
        if (hide) {
          if (el.getAttribute("aria-hidden") !== "true") el.setAttribute("aria-hidden", "true");
        } else {
          el.removeAttribute("aria-hidden");
        }
      }
    }
    return element;
  }
  /**
   * Replaces the content of the element with the given content (see
   * `parseContent`), according to the element type.
   *
   * - `Node`: replaces the children with a clone of the node.
   * - Value elements (input, textarea, select, form-associated custom
   *   elements): sets `value`. A file input only accepts an empty string.
   * - HTML: set as `innerHTML` (through `AviElement.sanitizer` if defined).
   * - Text: set as `textContent`, never parsed as HTML.
   * - `null` / `undefined`: empty string.
   *
   * @param {HTMLElement} element The target HTML element.
   * @param {*} content The data to be set into the element.
   * @returns {HTMLElement|null} The modified element, or null if invalid.
   */
  static setContent(element, content) {
    if (!(element instanceof Element)) return null;
    const parsed = _AviElement.parseContent(content);
    if (parsed.kind === "node") {
      element.replaceChildren(parsed.value.cloneNode(true));
      return element;
    }
    const value = parsed.value;
    if (_AviElement.#usesValue(element)) {
      if (element.type === "file" && value !== "") {
        console.warn(
          "[AviFlow.tools.element.setContent] A file input value can only be cleared"
        );
        return element;
      }
      element.value = value;
    } else if (parsed.kind === "html") {
      element.innerHTML = _AviElement.#sanitize(value);
    } else {
      element.textContent = value;
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
    const saved = _AviElement.#pending.get(element);
    const enter = isPending == null ? !saved : Boolean(isPending) && !_AviElement.#OFF.has(isPending);
    if (enter) {
      if (saved) return element;
      const options = {
        ..._AviElement.#DEFAULTS_PENDING,
        ..._AviElement.getParams(element, "opt", _AviElement.#OPTIONS_ONLY),
        ...opt
      };
      const on = (v) => !_AviElement.#OFF.has(v);
      const state = {
        cls: _AviElement.#classTokens(options["pending-class"]),
        ariaBusy: element.getAttribute("aria-busy"),
        style: {},
        disabled: void 0
      };
      if (on(options["pending-opacity"])) {
        state.style["opacity"] = element.style.getPropertyValue("opacity");
        element.style.setProperty("opacity", String(options["pending-opacity"]));
      }
      if (on(options["pending-pointer"])) {
        state.style["pointer-events"] = element.style.getPropertyValue("pointer-events");
        element.style.setProperty("pointer-events", String(options["pending-pointer"]));
      }
      if (on(options["pending-disabled"]) && (_AviElement.#FORM_TAGS.has(element.tagName) || "disabled" in element)) {
        state.disabled = element.disabled;
        element.disabled = true;
      }
      element.setAttribute("aria-busy", "true");
      if (state.cls.length) element.classList.add(...state.cls);
      _AviElement.#pending.set(element, state);
    } else if (saved) {
      for (const prop in saved.style) {
        const prev = saved.style[prop];
        prev ? element.style.setProperty(prop, prev) : element.style.removeProperty(prop);
      }
      if (saved.disabled !== void 0) element.disabled = saved.disabled;
      if (saved.cls.length) element.classList.remove(...saved.cls);
      if (saved.ariaBusy !== null) {
        element.setAttribute("aria-busy", saved.ariaBusy);
      } else {
        element.removeAttribute("aria-busy");
      }
      _AviElement.#pending.delete(element);
    } else {
      const options = {
        ..._AviElement.#DEFAULTS_PENDING,
        ..._AviElement.getParams(element, "opt", _AviElement.#OPTIONS_ONLY),
        ...opt
      };
      const cls = _AviElement.#classTokens(options["pending-class"]);
      if (cls.length) element.classList.remove(...cls);
      element.removeAttribute("aria-busy");
    }
    return element;
  }
  /**
   * Updates the content of the element.
   *
   * @deprecated Use `AviElement.setContent` (replace the content) or
   *  `AviElement.appendContent` (add to the content). Kept as an alias of
   *  `setContent` for backward compatibility.
   * @param {HTMLElement} element The target HTML element.
   * @param {*} content The data to be set into the element.
   * @returns {HTMLElement|null} The modified element, or null if invalid.
   */
  static updateContent(element, content) {
    return _AviElement.setContent(element, content);
  }
};

// src/AviFlowCoreEngine.js
var KNOWN_MODIFIERS = /* @__PURE__ */ new Set(["prevent", "stop", "passive", "window"]);
var CACHE_LIMIT = 500;
var AviFlowCoreEngine = class _AviFlowCoreEngine {
  /** Parsed data-flow strings, keyed by the raw string (frozen results, or null for invalid). */
  static #cache = /* @__PURE__ */ new Map();
  /** Latest request token per target selector, used to discard stale async results. */
  #latest = /* @__PURE__ */ new Map();
  constructor(flow) {
    this.flow = flow;
    this.core = this;
    this.boundElements = /* @__PURE__ */ new WeakMap();
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
    const flows = _AviFlowCoreEngine.parseFlow(element.dataset.flow);
    let eventConfigs = this.boundElements.get(element);
    if (!flows) {
      if (eventConfigs) this.destroy(element);
      return;
    }
    const byKey = /* @__PURE__ */ new Map();
    for (const f of flows) {
      const key = `${f.onWindow ? "window" : "element"}:${f.event}`;
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
      eventConfigs = /* @__PURE__ */ new Map();
      this.boundElements.set(element, eventConfigs);
    }
    for (const key of [...eventConfigs.keys()]) {
      if (!byKey.has(key)) this.#unbind(element, key);
    }
    this.boundElements.set(element, eventConfigs);
    for (const [key, group] of byKey) {
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
        existing.ac.abort();
      }
      const ac = new AbortController();
      const entry = { flows: group.list, passive, ac };
      eventConfigs.set(key, entry);
      const host = group.onWindow ? window : element;
      const options = passive ? { passive: true, signal: ac.signal } : { signal: ac.signal };
      host.addEventListener(group.event, (e) => {
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
    const resolved = this.flow.resolveAction(actionName);
    if (!resolved) {
      console.warn(`[AviFlow.core.eventHandler] Action "${actionName}" is not defined`);
      return;
    }
    const { fn: actionFn, owner } = resolved;
    const onError = (err) => {
      const hookName = AviElement.getDataset(element)?.onError;
      const hook = hookName && this.flow.resolveAction(hookName);
      if (hook) {
        try {
          hook.fn.call(hook.owner, err, element, event, target, this.flow);
          return;
        } catch (hookErr) {
          console.error(`[AviFlow.core.eventHandler] Error hook "${hookName}" failed`, hookErr);
        }
      }
      console.error(`[AviFlow.core.eventHandler] Error on action "${actionName}"`, err);
    };
    let token = 0;
    if (target) {
      token = (this.#latest.get(target) ?? 0) + 1;
      this.#latest.set(target, token);
    }
    const apply = (content) => {
      if (target && this.#latest.get(target) !== token) return;
      try {
        _AviFlowCoreEngine.updateTargets(target, content);
        if (target && content !== void 0) this.flow.init(target);
      } catch (err) {
        console.error(`[AviFlow.core.eventHandler] Error applying result of action "${actionName}"`, err);
      }
      return content;
    };
    try {
      const result = actionFn.call(owner, element, event, target, this.flow);
      return typeof result?.then === "function" ? Promise.resolve(result).then(apply, onError) : apply(result);
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
  static parseEvent(strEvent = "") {
    const [name, ...rawMods] = strEvent.split(".").map((s) => s.trim());
    const mods = new Set(rawMods);
    for (const m of mods) {
      if (!KNOWN_MODIFIERS.has(m)) {
        console.warn(`[AviFlow.core.parseEvent] Unknown modifier "${m}" in "${strEvent}" (known: ${[...KNOWN_MODIFIERS].join(", ")})`);
      }
    }
    return {
      event: name || "click",
      prevent: mods.has("prevent"),
      stop: mods.has("stop"),
      passive: mods.has("passive"),
      onWindow: mods.has("window")
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
    if (!flowString || typeof flowString !== "string") return null;
    const cache = _AviFlowCoreEngine.#cache;
    if (cache.has(flowString)) return cache.get(flowString);
    let out = null;
    const parts = _AviFlowCoreEngine.splitFlows(flowString);
    if (parts) {
      const flows = parts.map((p) => _AviFlowCoreEngine.parseSingleFlow(p)).filter(Boolean);
      if (flows.length) out = Object.freeze(flows.map((f) => Object.freeze(f)));
    }
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
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
    if (!flowString || typeof flowString !== "string") return null;
    let src = flowString.trim();
    const noTarget = src.endsWith("-|");
    if (noTarget) src = src.slice(0, -2);
    const parts = _AviFlowCoreEngine.splitArrows(src);
    const max = noTarget ? 2 : 3;
    if (parts.length > max) {
      console.warn(
        noTarget ? '[AviFlow.core.parseSingleFlow] Too many parts before "-|" (max: event -> action -|)' : '[AviFlow.core.parseSingleFlow] Too many "->" parts (max: event -> action -> target)'
      );
      return null;
    }
    let eventRaw = "";
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
    if (!eventRaw) eventRaw = "click";
    else if (eventRaw.startsWith(".")) eventRaw = "click" + eventRaw;
    const { event, prevent, stop, passive, onWindow } = _AviFlowCoreEngine.parseEvent(eventRaw);
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
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "[") depth++;
      else if (ch === "]") depth = Math.max(0, depth - 1);
      else if (depth === 0 && ch === "-" && src[i + 1] === ">") {
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
    if (!src.startsWith("[")) return [src];
    const result = [];
    let depth = 0;
    let start = -1;
    let quote = null;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (depth === 0) {
        if (ch === "[") {
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
      } else if (ch === "[") {
        depth++;
      } else if (ch === "]") {
        depth--;
        if (depth === 0) result.push(src.slice(start, i));
      }
    }
    if (depth !== 0 || quote) {
      console.warn("[AviFlow.core.splitFlows] Unbalanced brackets or quotes in multi-flow definition");
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
    if (!selector || typeof selector !== "string" || content === void 0) return;
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
        console.error("[AviFlow.core.updateTargets] setContent failed", el, err);
      }
    }
    return content;
  }
};

// src/AviFlowActions.js
var AviFlowActions = class {
  /**
   * Sends an HTTP request built from the element's data attributes and returns the parsed response
   * (JSON object, or HTML string when the response is `text/html`).
   *
   * - For `<form>` elements, the native `method` and `action` attributes are used when
   *   `data-method` and `data-url` are not set (the `data-*` attributes take priority).
   * - GET/HEAD: params go in the query string.
   * - POST/PUT: params are sent as FormData.
   * - Other methods: params are sent as a JSON body.
   *
   * Optional hooks (action names resolved through `flow.resolveAction`), called as
   * `hook(payload, element, event, targetSelector, flow)`:
   * - `onSucces`: JSON response with a truthy `success`   (payload = data)
   * - `onFail`:   JSON response with a falsy `success`    (payload = data)
   *
   * Errors are not handled here: they are thrown to the caller. When run by a flow, the engine
   * passes them to the element's `data-on-error` hook (or logs them).
   *
   * The element's pending state is on while the request runs.
   *
   * @param {HTMLElement} element The element containing the URL and request configuration.
   * @param {Event} event The DOM event that triggered the flow.
   * @param {string} targetSelector The target CSS selector of the flow.
   * @param {AviFlow} flow The AviFlow instance.
   * @returns {Promise<Object|string|null>} The parsed response, or null when there is no element.
   */
  static async fetchData(element, event, targetSelector, flow) {
    if (!element) return null;
    const dataset = AviElement.getDataset(element);
    const callHook = (name, payload) => {
      if (!name) return;
      const resolved = flow?.resolveAction(name);
      resolved?.fn.call(resolved.owner, payload, element, event, targetSelector, flow);
    };
    const isForm = element.tagName === "FORM";
    const formMethod = isForm ? element.getAttribute("method") : null;
    const formAction = isForm ? element.getAttribute("action") : null;
    const { method, params, url: baseUrl } = {
      method: (dataset.method || formMethod || "POST").toUpperCase(),
      params: AviElement.getParams(element),
      url: dataset.url || formAction || (element.tagName === "A" ? element.getAttribute("href") : null) || "/",
      ...AviElement.getParams(element, "opt")
    };
    const headers = new Headers({ "X-Requested-With": "XMLHttpRequest" });
    const hasParams = Object.keys(params).length > 0;
    let url = baseUrl;
    let body;
    if (method === "GET" || method === "HEAD") {
      if (hasParams) url += `${url.includes("?") ? "&" : "?"}${new URLSearchParams(params)}`;
    } else if (method === "POST" || method === "PUT") {
      body = new FormData();
      Object.entries(params).forEach(([key, value]) => body.append(key, value));
    } else {
      headers.set("Content-Type", "application/json; charset=UTF-8");
      if (hasParams) body = JSON.stringify(params);
    }
    AviElement.togglePendingState(element, true);
    try {
      const response = await fetch(url, { body, headers, method });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }
      const isHtml = (response.headers.get("content-type") || "").includes("text/html");
      const data = isHtml ? await response.text() : await response.json();
      if (data && typeof data === "object") {
        callHook(data.success ? dataset.onSuccess : dataset.onFail, data);
      }
      return data;
    } finally {
      AviElement.togglePendingState(element, false);
    }
  }
  /**
   * Reads the current value of the element that triggered the flow. Registered by default
   * as the `value` action.
   *
   * Resolution order:
   * 1. `<input type="checkbox">`: returns the boolean `checked` state (`true` / `false`).
   * 2. Any element whose `value` property is a string (`<input>`, `<textarea>`, `<select>`,
   *    `<button>`, `<option>`, radio inputs...): returns that value. An empty control
   *    returns `""` (it has a value, it is just empty).
   * 3. Otherwise the element's `innerText` (e.g. `<div>`, `<span>`, `<p>`).
   * 4. `null` when there is no element or nothing readable.
   *
   * Elements whose `value` property is not a string (e.g. `<li>`, `<meter>`, which expose a
   * number) are treated as having no value and fall through to `innerText`.
   *
   * The action is synchronous and has no side effects. The `event`, `targetSelector` and
   * `flow` arguments are accepted for signature compatibility with other actions, but unused.
   *
   * @example
   * data-flow="input -> value -> #preview"      // input text goes to #preview
   * data-flow="change -> value -> #agree-state" // checkbox: true / false
   *
   * @param {HTMLElement} element The element that triggered the flow.
   * @param {Event} [event] The DOM event that triggered the flow (unused).
   * @param {string} [targetSelector] The target CSS selector of the flow (unused).
   * @param {AviFlow} [flow] The AviFlow instance (unused).
   * @returns {string|boolean|null} The checked state for checkboxes, the value for value-bearing
   *          elements, the innerText for others, or null when there is nothing to read.
   */
  static elementValue(element, event, targetSelector, flow) {
    if (!element) return null;
    if (element.tagName === "INPUT" && element.type === "checkbox") return element.checked;
    if (typeof element.value === "string") return element.value;
    return typeof element.innerText === "string" ? element.innerText : null;
  }
};

// src/AviFlow.js
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
var AviFlow = class {
  #core = new AviFlowCoreEngine(this);
  tools = {
    element: AviElement
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
      root: typeof document !== "undefined" ? document : null,
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
    if (typeof root === "string") {
      document.querySelectorAll(root).forEach((el) => this.init(el));
      return this;
    }
    if (root.matches?.("[data-flow]")) this.#core.controller(root);
    root.querySelectorAll?.("[data-flow]").forEach((el) => this.#core.controller(el));
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
    if (!this.action || typeof path !== "string" || !path) return null;
    if (Object.hasOwn(this.action, path)) {
      return typeof this.action[path] === "function" ? { fn: this.action[path], owner: this.action } : null;
    }
    let owner = this.action;
    let node = this.action;
    for (const key of path.split(".")) {
      if (!key || UNSAFE_KEYS.has(key) || node === null || typeof node !== "object") return null;
      const next = node[key];
      if (next === void 0 || next === Object.prototype[key]) return null;
      owner = node;
      node = next;
    }
    return typeof node === "function" ? { fn: node, owner } : null;
  }
};
var AviFlow_default = AviFlow;
export {
  AviFlow_default as default
};
//# sourceMappingURL=aviflow.esm.js.map
