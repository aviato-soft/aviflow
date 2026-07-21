// src/index.js
var AviFlow = class {
  constructor(options = {}) {
    this.options = {
      selector: '[data-action="fetch"]',
      url: "#",
      method: "POST",
      pendingClass: "pending",
      ...options
    };
    this.on = {
      success: (data, element) => this.defaultSuccess(data, element),
      error: (data, element, error) => this.defaultError(data, element, error)
    };
    this.init();
  }
  /**
   * Initializes the event listener on the document body (Event Delegation)
   * This ensures elements added dynamically via JS later are also covered.
   */
  init() {
    document.body.addEventListener("click", async (event) => {
      const triggerElement = event.target.closest(this.options.selector);
      if (triggerElement) {
        event.preventDefault();
        await this.handleFetch(triggerElement);
      }
    });
  }
  /**
   * Integrated tools.
   */
  tools = {
    /**
     * Filters attributes of an element that match a given prefix.
     *
     * @param {HTMLElement} element   The target element.
     * @param {string}       prefix   Optional attribute name prefix. Defaults to `''` (all attributes).
     * @param {boolean}      capitalizeKey Optional flag to capitalize key names. Defaults to `false`.
     * @returns {Array<[string, string]>} Array of `[attributeNameWithoutPrefix, value]` pairs.
     */
    filterAttributes: function(element, prefix = "", capitalizeKey = false) {
      return Array.from(element.attributes).filter((attr) => attr.name.startsWith(prefix)).map(({ name, value }) => {
        let key = name.slice(prefix.length);
        if (capitalizeKey) {
          key = this.tools ? this.tools.toCapitalize(key) : this.toCapitalize(key);
        }
        return [key, value];
      });
    },
    /**
     * Filters dataset entries of an element that match a given prefix.
     *
     * @param {HTMLElement} element   The target element.
     * @param {string}       prefix   Optional key prefix. Defaults to `''` (all keys).
     * @returns {Array<[string, string]>} Array of `[keyWithoutPrefix, value]` pairs.
     */
    filterDataset: function(element, prefix = "") {
      return Object.entries(element.dataset).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]);
    },
    /**
     * Builds an object from attributes or dataset entries that share a common prefix.
     *
     * Reads the element's `dataset` by default; pass `'attribute'` as the third argument to read HTML attributes instead.
     *
     * @param {HTMLElement} element The target element.
     * @param {string}       [prefix = ''] Optional name prefix to match against (e.g. `body`, `data-body-param`).
     * @param {'dataset'|'attributes'} [use='dataset'] Where to read data from: `'dataset'` or `'attribute'`.
     * @returns {Object.<string, string>} Object with `[keyWithoutPrefix]: value` entries.
     */
    formEntries: function(element, prefix = "", use = "dataset") {
      if (use === "dataset") {
        return Object.fromEntries(this.filterDataset(element, prefix));
      }
      if (use === "attributes") {
        if (prefix === "") {
          return Object.fromEntries(this.filterAttributes(element, "data-", true));
        } else {
          return Object.fromEntries(this.filterAttributes(element, `data-${prefix}-`, true));
        }
      }
      return {};
    },
    /**
     * Call formEntries with 'param' default prefix
     * @param {HTMLElement} element
     * @returns {FormData}
     */
    formData: function(element, prefix = "param") {
      const data = new FormData();
      const formEntries = this.formEntries(element, prefix);
      if (this.isEmptyObject(formEntries)) {
        return data;
      }
      for (const [key, value] of Object.entries(formEntries)) {
        if (value !== void 0 && value !== null) {
          data.append(this.toCamelCase(key), value);
        }
      }
      return data;
    },
    isEmptyObject: function(o) {
      if (!o || typeof o !== "object") {
        return false;
      }
      for (let _key in o) {
        return false;
      }
      return o.constructor === Object;
    },
    toCamelCase: function(text) {
      if (typeof text !== "string") {
        return "";
      }
      return text.trim().toLowerCase().replace(/^[-_\s]+/, "").replace(/[-_\s]+(.)?/g, (_, letter) => letter ? letter.toUpperCase() : "");
    },
    toCapitalize: function(text) {
      const trimText = text.trim().replace(/^[-_\s]+/, "");
      return trimText.charAt(0).toUpperCase() + trimText.slice(1);
    }
  };
  /**
     * Execute target.flow on element success
     * @param {} element 
     * WIP
     *  data-target
     *  data-success
     *  data-error
     * /
    async flow(element) {
      console.log('fow was called on element');
      console.log(element);
    }
  
  
  
    /**
     * Fetch event handler invoked after a matching element is clicked.
     * Extracts URL, HTTP method and `data-target` selector from the element's data-attributes,
     * collects form data via {@linkcode AviFlow.tools#formData}, performs the fetch request,
     * updates the DOM (if a target container was specified) and dispatches success/error callbacks.
     */
  async handleFetch(element) {
    let data = null;
    let url = element.dataset.url || element.getAttribute("href") || this.options.url;
    const method = (element.dataset.method || this.options.method).toUpperCase();
    const targetSelector = element.dataset.target || false;
    const originalContent = element.innerHTML;
    this.setLoadingState(element, true);
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
        this.executeCallback(element, "onSuccess", data, element);
      } else {
        this.on.success(data, element);
      }
    } catch (error) {
      if (element.dataset.onError) {
        this.executeCallback(element, "onError", data, element, error);
      } else {
        this.on.error(data, element, error);
      }
    } finally {
      this.setLoadingState(element, false, originalContent);
    }
    return data;
  }
  /**
   * Helper to execute dynamic callbacks defined in data-attributes (e.g. data-on-success, data-on-error)
   * It checks if the string resolves to a function path in the window object (e.g., 'console.log')
   * or evaluates the string as Javascript code.
   * 
   * @param {HTMLElement} element
   * @param {string} attrName Dataset attribute name (camelCase, e.g. 'onSuccess')
   * @param {...*} args Arguments to pass to the function/code evaluation
   */
  executeCallback(element, attrName, ...args) {
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
      console.error(`Error executing AviFlow callback for ${attrName}:`, e);
    }
  }
  /**
  * Manages the visual loading state of an element (pending class, pointer-events and opacity).
  *
  * Uses a custom CSS class from `element.dataset['data-on-progress']` if present,
  * otherwise falls back to {@linkcode this.options.pendingClass}.
  *
  * @param {HTMLElement} element
  * @param {boolean} isLoading Whether the operation is in progress (`true`) or complete (`false`).
  */
  setLoadingState(element, isLoading, originalContent = "") {
    const pendingClass = Object.prototype.hasOwnProperty.call(element.dataset, "data-on-progress") ? element.dataset["data-on-progress"] : this.options.pendingClass;
    if (isLoading) {
      element.disabled = true;
      element.setAttribute("disabled", "");
      element.classList.add(pendingClass);
      element.style.pointerEvents = "none";
      element.style.opacity = "0.6";
    } else {
      element.disabled = false;
      element.removeAttribute("disabled");
      element.classList.remove(pendingClass);
      element.style.pointerEvents = "";
      element.style.opacity = "";
      element.innerHTML = originalContent;
    }
  }
  /**
   * Default fallback hooks that also dispatch standard CustomEvents 
   * so other parts of your app can listen cleanly.
   */
  defaultSuccess(data, element) {
    element.dispatchEvent(new CustomEvent("aviflow:success", { detail: data, bubbles: true }));
  }
  defaultError(data, element, error) {
    element.dispatchEvent(new CustomEvent("aviflow:error", { detail: error, bubbles: true }));
  }
};
if (typeof window !== "undefined") {
  window.AviFlow = AviFlow;
}
var index_default = AviFlow;
export {
  index_default as default
};
