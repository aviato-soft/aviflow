// src/index.js
var AviFlow = class {
  constructor(options = {}) {
    this.options = {
      datasetSelectorName: "action",
      // flow will search for elements having set: data-action 
      url: "#",
      method: "POST",
      pendingClass: "pending",
      ...options
    };
    this.on = {
      success: (data, element) => this.default.success(data, element),
      error: (data, element, error) => this.default.error(data, element, error)
    };
    this.init();
  }
  /**
   * Default fallback hooks that also dispatch standard CustomEvents
   * so other parts of your application can listen for events.
   */
  default = {
    error: function(data, element, error) {
      const event = new CustomEvent("aviflow:error", { bubbles: true, detail: data });
      if (error !== void 0) {
        event.error = error;
      }
      element.dispatchEvent(event);
    },
    success: function(data, element) {
      element.dispatchEvent(new CustomEvent("aviflow:success", { bubbles: true, detail: data }));
    }
  };
  /**
  * Initializes event listeners for `data-action` elements, supporting both static and dynamic elements.
  * It utilizes a MutationObserver pattern for event delegation on dynamically added elements.
  * @returns {void}
  */
  bind() {
    if (typeof window === "undefined") return;
    const selector = `[data-${this.options.datasetSelectorName}]`;
    const eventTriggered = this.tools.getUniqueEventsBySelector(selector);
    if (this._AviFlowActionHandler) {
      eventTriggered.forEach((event) => {
        document.body.removeEventListener(event, this._AviFlowActionHandler);
      });
    }
    this._AviFlowActionHandler = async (event) => {
      const element = event.target.closest(selector);
      if (element) {
        const action = element.dataset[this.options.datasetSelectorName];
        if (typeof this.fn[action] === "function") {
          event.preventDefault();
          await this.fn[action](element);
        }
      }
    };
    eventTriggered.forEach((event) => {
      document.body.addEventListener(event, this._AviFlowActionHandler);
    });
  }
  /**
   * The place for flow controllers
   */
  fn = {
    /**
     * Fetch event handler invoked after a matching element is triggered.
     *
     * It extracts the URL and HTTP method from the element's data-attributes,
     * collects form data via `AviFlow.tools#formData`, executes the fetch request,
     * updates the DOM (if a `data-target` is specified), and dispatches success or error callbacks.
     *
     * @param {HTMLElement} element The triggered element.
     * @returns {Promise<any>} The response data.
     */
    fetch: async (element) => {
      let data = null;
      let url = element.dataset.url || element.getAttribute("href") || this.options.url;
      const method = (element.dataset.method || this.options.method).toUpperCase();
      const targetSelector = element.dataset.target || false;
      const originalContent = element.innerHTML;
      this.tools.setLoadingState(element, true);
      try {
        const headers = {
          "X-Requested-With": "XMLHttpRequest"
        };
        const fetchOptions = {
          headers,
          method
        };
        if (method === "POST" || method === "PUT") {
          fetchOptions.body = this.tools.formData(element, "param");
        } else {
          fetchOptions.headers["Content-Type"] = "application/json; charset=UTF-8";
        }
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers ? response.headers.get("content-type") : null;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        if (targetSelector) {
          const targetContainer = document.querySelector(targetSelector);
          if (targetContainer) {
            if (typeof data === "object") {
              if (data.html && typeof data.html === "string") {
                targetContainer.innerHTML = data.html;
              } else {
                targetContainer.textContent = JSON.stringify(data);
              }
            } else {
              targetContainer.innerHTML = data;
            }
          }
        }
        if (element.dataset.onSuccess) {
          this.tools.executeCallback(element, "onSuccess", data, element);
        } else {
          this.on.success(data, element);
        }
      } catch (error) {
        if (element.dataset.onError) {
          this.tools.executeCallback(element, "onError", data, element, error);
        } else {
          this.on.error(data, element, error);
        }
      } finally {
        this.tools.setLoadingState(element, false, originalContent);
      }
      return data;
    }
  };
  /**
   * Initializes the library, invoked from the `constructor`.
   * @returns {void}
   */
  init() {
    this.tools.setDataEventsFromDataAction();
    this.bind();
  }
  /**
   * Integrated tools.
   */
  tools = {
    /**
     * Helper to execute dynamic callbacks defined in data-attributes (e.g. data-on-success, data-on-error)
     * It checks if the string resolves to a function path in the window object (e.g., 'console.log')
     * or evaluates the string as Javascript code.
     * 
     * @param {HTMLElement} element
     * @param {string} attrName Dataset attribute name (camelCase, e.g. 'onSuccess')
     * @param {...*} args Arguments to pass to the function/code evaluation
     */
    executeCallback: (element, attrName, ...args) => {
      const callbackStr = element.dataset[attrName];
      if (!callbackStr) return;
      try {
        const parts = callbackStr.split(".");
        let func = typeof window !== "undefined" ? window : null;
        for (const part of parts) {
          if (func) {
            func = func[part];
          }
        }
        if (typeof func === "function") {
          func.apply(element, args);
        } else {
          const fn = new Function("data", "element", "error", callbackStr);
          fn.apply(element, args);
        }
      } catch (e) {
        return e;
      }
    },
    /**
     * Filters attributes of an element that match a given prefix.
     *
     * @param {HTMLElement} element   The target element
     * @param {string}      [prefix = '']   Optional attribute name prefix
     * @param {boolean}     [capitalizeKey = false]  Whether to capitalize key names
     * @returns {Array<[string, string]>} Array of `[attributeNameWithoutPrefix, value]` pairs
     */
    filterAttributes: (element, prefix = "", capitalizeKey = false) => {
      return Array.from(element.attributes).filter((attr) => attr.name.startsWith(prefix)).map(({ name, value }) => {
        let key = name.slice(prefix.length);
        if (capitalizeKey) {
          key = this.tools.toCapitalize(key);
        }
        return [key, value];
      });
    },
    /**
     * Filters dataset entries of an element that match a given prefix.
     *
     * @param {HTMLElement} element   The target element
     * @param {string}      [prefix = '']  Optional key prefix, Defaults to `''` (all keys)
     * @returns {Array<[string, string]>} Array of `[keyWithoutPrefix, value]` pairs
     *
     */
    filterDataset: (element, prefix = "") => {
      return Object.entries(element.dataset).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]);
    },
    /**
     * Builds a `FormData` object by collecting parameters from the element and optionally its parent.
     *
     * @param {HTMLElement} [element] The target element to extract data from.
     * @param {string}      [prefix = 'param'] Key prefix (e.g., 'param' for data-param-*).
     * @param {boolean}     [useParentDataset = false] Whether to look for parameters in a parent container using data-parent.
     * @returns {FormData}
     */
    formData: (element, prefix = "param", useParentDataset = null) => {
      if (!element) {
        return new FormData();
      }
      let entries = {};
      if (element.dataset.parent && useParentDataset !== false) {
        const parentElement = document.querySelector(element.dataset.parent);
        if (parentElement) {
          entries = { ...entries, ...this.tools.formEntries(parentElement, prefix) };
        }
      }
      entries = { ...entries, ...this.tools.formEntries(element, prefix) };
      const data = new FormData();
      for (const [key, value] of Object.entries(entries)) {
        if (value !== void 0 && value !== null) {
          data.append(this.tools.toCamelCase(key), value);
        }
      }
      return data;
    },
    /**
     * Builds an object from dataset or [data-*] attributes entries that share a common prefix.
     *
     * Reads the element's `dataset` by default; 
     * Pass `'attribute'` as the third argument to read HTML attributes instead.
     *
     * @param {HTMLElement}  element          The target element
     * @param {string}       [prefix = '']    Optional name prefix (e.g. `body`, `data-body-param`)
     * @param {'dataset'|'attributes'} [use]  Where to read from: `'dataset'` or `'attribute'`
     * @returns {Object.<string, string>} Object with `[keyWithoutPrefix]: value` entries
     *
     */
    formEntries: (element, prefix = "", use = "dataset") => {
      if (use === "dataset") {
        return Object.fromEntries(this.tools.filterDataset(element, prefix));
      }
      if (use === "attributes") {
        if (prefix === "") {
          return Object.fromEntries(this.tools.filterAttributes(element, "data-", true));
        } else {
          return Object.fromEntries(this.tools.filterAttributes(element, `data-${prefix}-`, true));
        }
      }
      return {};
    },
    /**
     * Finds all unique event types defined in the 'data-event' attribute for elements matching the given selector.
     * Defaults to the selector configured in `options.datasetSelectorName`.
     *
     * @param {string | null} [selector] The data- selector to query. Default is '[data-action]'
     * @returns {string[]} An array of unique event names.
     */
    getUniqueEventsBySelector: (selector = null) => {
      selector = selector || `[data-${this.options.datasetSelectorName}]`;
      const elements = document.querySelectorAll(selector);
      const uniqueEvents = /* @__PURE__ */ new Set();
      uniqueEvents.add("click");
      elements.forEach((element) => {
        const event = element.dataset.event;
        if (event) {
          uniqueEvents.add(event);
        }
      });
      return Array.from(uniqueEvents);
    },
    /**
     * Returns `true` if the given value is a non-null, empty plain object.
     *
     * @param {*} o   The value to check (or `null`).
     * @returns {boolean}
     */
    isEmptyObject: (o) => {
      if (!o || typeof o !== "object") {
        return false;
      }
      for (let _key in o) {
        return false;
      }
      return o.constructor === Object;
    },
    /**
     * Manages the visual loading state of an element (pending class, pointer-events and opacity).
     *
     * Uses a custom CSS class from `element.dataset['data-on-progress']` if present,
     * otherwise falls back to {@linkcode this.options.pendingClass}.
     *
     * @param {HTMLElement} element
     * @param {boolean} isLoading Whether the operation is in progress (`true`) or complete (`false`).
     */
    setLoadingState: (element, isLoading, originalContent = "") => {
      const pendingClass = Object.prototype.hasOwnProperty.call(element.dataset, "onProgress") ? element.dataset["onProgress"] : this.options.pendingClass;
      if (isLoading) {
        element.classList.add(pendingClass);
        element.disabled = true;
        element.setAttribute("disabled", "");
        element.style.opacity = "0.6";
        element.style.pointerEvents = "none";
      } else {
        element.classList.remove(pendingClass);
        element.disabled = false;
        element.innerHTML = originalContent;
        element.removeAttribute("disabled");
        element.style.opacity = "";
        element.style.pointerEvents = "";
      }
    },
    /**
     * Logic to split data-action and set data-event
     */
    setDataEventsFromDataAction: () => {
      if (typeof window === "undefined") return;
      const actionElements = document.querySelectorAll("[data-action]");
      actionElements.forEach((element) => {
        const actionValue = element.dataset.action;
        if (actionValue && actionValue.includes("|")) {
          const parts = actionValue.split("|");
          const newAction = parts[0];
          const newEvent = parts[1];
          element.dataset.action = newAction;
          if (!element.dataset.event) {
            element.dataset.event = newEvent;
          }
        }
      });
    },
    /**
     * Converts a string to camelCase.  Non-string inputs return an empty string.
     *
     * @param {*} text   The input string.
     * @param {boolean} firstLetterLower  If true, the first letter of the result will be lowercase. Defaults to true.
     * @returns {string}
     */
    toCamelCase: (text, firstLetterLower = true) => {
      if (typeof text !== "string") {
        return "";
      }
      let result = text.trim().replace(/^[-_\s]+/, "").replace(/[-_\s]+(.)?/g, (_, letter) => letter ? letter.toUpperCase() : "");
      if (result.length === 0) return "";
      if (firstLetterLower) {
        return result.charAt(0).toLowerCase() + result.slice(1);
      } else {
        return this.tools.toCapitalize(result);
      }
    },
    /**
     * Converts a string to PascalCase (capitalizes the first letter and subsequent words).
     * Non-string inputs return an empty string.
     *
     * @param {*} text   The input string.
     * @returns {string} The PascalCased string.
     */
    toPascalCase: (text) => {
      return this.tools.toCamelCase(text, false);
    },
    /**
     * Capitalizes the first letter of a string. Non-string inputs return an empty string.
     *
     * @param {*} text   The input string.
     * @returns {string} The capitalized string.
     */
    toCapitalize: (text) => {
      const trimText = text.trim().replace(/^[-_\s]+/, "");
      return trimText.charAt(0).toUpperCase() + trimText.slice(1);
    }
  };
};
if (typeof window !== "undefined") {
  window.AviFlow = AviFlow;
}
var index_default = AviFlow;
export {
  index_default as default
};
