/**
 * AviFlow - Modern, lightweight JavaScript class to automate fetch requests
 * natively using HTML data-attributes.
 *
 * Supported data-attributes on triggered elements:
 * @param [data-action="fetch"] 
 *  Mandatory for selecting the object click trigger.
 *  
 * @param [data-url] 
 *  The URL to fetch. Falls back to the element's `href` if not set.
 *  Optional attribute – if missing, page url is used.
 *  
 * @param [data-method] 
 *  HTTP method (e.g., GET, POST). 
 *  Defaults to `'POST'`.
 *  
 * @param [data-target] 
 *  CSS selector of a container whose innerHTML will be replaced with the response.
 *  If JSON content-type is returned it is `JSON.stringify()`d before insertion.
 * 
 * @param [data-param-*] 
 *  A collection of data-attributes prefixed `data-param-*`.
 *  All attributes are collected into a FormData object via `tools.formData(element)`
 *  and sent as the request body for non-GET methods.
 *  The `*` is replaced with the attribute name (e.g. `action`, `body`).
 * 
 * @param [data-parent]
 *  Get the parameters from parent.
 *  Trigger parameters will overwrite the parent parameters having same name.
 *  
 * @param [data-on-error]
 *  function to be called on error
 *  
 * @param [data-on-success]
 *  function to be called on success
 */
class AviFlow {

  constructor(options = {}) {
    // Default configurations
    this.options = {
      selector: '[data-action="fetch"]',
      url: '#',
      method: 'POST',
      pendingClass: 'pending',
      ...options
    };

    this.on = {
      success: (data, element) => this.default.success(data, element),
      error: (data, element, error) => this.default.error(data, element, error),
    };

    //run initialization
    this.init();
  }


  /**
   * Default fallback hooks that also dispatch standard CustomEvents 
   * so other parts of your app can listen cleanly.
   */
  default = {

    error: function (data, element, error) {
      // console.error({ element, error, data });
      const event = new CustomEvent('aviflow:error', { bubbles: true, detail: data });
      if (error !== undefined) {
        event.error = error;
      }
      element.dispatchEvent(event);
    },

    success: function (data, element) {
      // console.log('AviFlow success:', data);
      element.dispatchEvent(new CustomEvent('aviflow:success', { bubbles: true, detail: data }));
    }
  }



  /**
  * Initializes the event listener on the document body (Event Delegation)
  * This ensures elements added dynamically via JS later are also covered.
  */
  init() {
    if ( typeof window !== 'undefined' ) {
      document.body.addEventListener('click', async (event) => {

        // Find closest element matching selector (handles nested icons/spans inside a button)
        const triggerElement = event.target.closest(this.options.selector);

        if (triggerElement) {
          event.preventDefault();
          await this.handleFetch(triggerElement);
        }
      });
    }
  }


  /**
   * 
   * 
   */
  fn = {}


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
        // Check if it's a global function path (e.g. "avi.onSuccess" or "alert")
        const parts = callbackStr.split('.');
        let func = typeof window !== 'undefined' ? window : null;
        for (const part of parts) {
          if (func) {
            func = func[part];
          }
        }

        if (typeof func === 'function') {
          func.apply(element, args);
        } else {
          // Otherwise, evaluate it as code. Pass arguments named after their purpose.
          const fn = new Function('data', 'element', 'error', callbackStr);
          fn.apply(element, args);
        }
      } catch (e) {
        //console.error(`Error executing AviFlow callback for ${attrName}:`, e);
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
    filterAttributes: (element, prefix = '', capitalizeKey = false) => {
      return Array.from(element.attributes)
        .filter((attr) => attr.name.startsWith(prefix))
        .map(({ name, value }) => {
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
    filterDataset: (element, prefix = '') => {
      return Object.entries(element.dataset)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]);
    },


    /**
     * Builds a `FormData` object by collecting parameters from the element and optionally its parent.
     *
     * @param {HTMLElement} [element] The target element to extract data from.
     * @param {string}      [prefix = 'param'] Key prefix (e.g., 'param' for data-param-*).
     * @param {boolean}     [useParentDataset = false] Whether to look for parameters in a parent container using data-parent.
     * @returns {FormData}
     */
    formData: (element, prefix = 'param', useParentDataset = null) => {
        if (!element) {
            return new FormData();
        }

        let entries = {};

        // Extract Parent Dataset if requested
        if (element.dataset.parent && useParentDataset !== false) {
            const parentElement = document.querySelector(element.dataset.parent);
            if (parentElement) {
                entries = { ...entries, ...this.tools.formEntries(parentElement, prefix) };
            }
        }

        // Extract Element Data (Overwrites parent entries)
        entries = { ...entries, ...this.tools.formEntries(element, prefix) };

        const data = new FormData();

        // Single loop to append all merged entries to FormData
        for (const [key, value] of Object.entries(entries)) {
            if (value !== undefined && value !== null) {
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
    formEntries: (element, prefix = '', use = 'dataset') => {
      if (use === 'dataset') {
        return Object.fromEntries(this.tools.filterDataset(element, prefix));
      }

      if (use === 'attributes') {
        if (prefix === '') {
          return Object.fromEntries(this.tools.filterAttributes(element, 'data-', true));
        } else {
          return Object.fromEntries(this.tools.filterAttributes(element, `data-${prefix}-`, true));
        }
      }

      return {};
    },



    /**
     * Returns `true` if the given value is a non-null, empty plain object.
     *
     * @param {*} o   The value to check (or `null`).
     * @returns {boolean}
     */
    isEmptyObject: (o) => {
      //is this an object ?
      if (!o || typeof o !== 'object') {
        return false;
      }

      // Performance win: if it has any enumerable properties, it's not empty
      for (let _key in o) {
        return false;
      }

      // Confirm it is an object:
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
    setLoadingState: (element, isLoading, originalContent = '') => {
      const pendingClass = Object.prototype.hasOwnProperty.call(element.dataset, 'onProgress')
        ? element.dataset['onProgress']
        : this.options.pendingClass;

      if (isLoading) {
        element.classList.add(pendingClass);
        element.disabled = true;
        element.setAttribute('disabled', '');
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
      } else {
        element.classList.remove(pendingClass);
        element.disabled = false;
        element.innerHTML = originalContent;
        element.removeAttribute('disabled');
        element.style.opacity = '';
        element.style.pointerEvents = '';
      }
    },


    /**
     * Converts a string to camelCase.  Non-string inputs return an empty string.
     *
     * @param {*} text   The input string.
     * @param {boolean} firstLetterLower  If true, the first letter of the result will be lowercase. Defaults to true.
     * @returns {string}
     */
    toCamelCase: (text, firstLetterLower = true) => {
      if (typeof text !== 'string') {
        return '';
      }

      let result = text
        .trim()
        .replace(/^[-_\s]+/, '')
        .replace(/[-_\s]+(.)?/g, (_, letter) => (letter ? letter.toUpperCase() : ''));

      if (result.length === 0) return '';

      if (firstLetterLower) {
        // camelCase
        return result.charAt(0).toLowerCase() + result.slice(1);
      } else {
        // PascalCase
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
      const trimText = text
        .trim()
        .replace(/^[-_\s]+/, '');
      return trimText.charAt(0).toUpperCase() + trimText.slice(1);
    }
  };



  /**
   * Execute target.flow on element success
   * @param {} element 
   * WIP:
   *  data-flow = aviflow.fn.controller
   *  data-event = click | change | ...
   * 
   * aviflow.handleFetch -> aviflow.fn.fetch 
   * 
   * e.g.
   *  data-action = fetch 
   *  => data-action = fetch|click 
   *     =>
   *       - data-flow = fetch
   *       - data-event = click | element.on.click = ...
   *
  fn: {
    async fetch(element) {
    },
  }
   */


  /**
   * Fetch event handler invoked after a matching element is clicked.
   * Extracts URL, HTTP method and `data-target` selector from the element's data-attributes,
   * collects form data via {@linkcode AviFlow.tools#formData}, performs the fetch request,
   * updates the DOM (if a target container was specified) and dispatches success/error callbacks.
   */
  async handleFetch(element) {
    let data = null;
    let url = element.dataset.url || element.getAttribute('href') || this.options.url;
    const method = (element.dataset.method || this.options.method).toUpperCase();
    const targetSelector = element.dataset.target || false;

    // Optional: Disable element during loading state
    const originalContent = element.innerHTML;
    this.tools.setLoadingState(element, true);

    try {
      const headers = {
        'X-Requested-With': 'XMLHttpRequest',
      };

      const fetchOptions = {
        headers: headers,
        method: method
      };

      if (method === 'POST' || method === 'PUT') {
        fetchOptions.body = this.tools.formData(element, 'param');
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json; charset=UTF-8';
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle response depending on content-type header
      const contentType = response.headers ? response.headers.get('content-type') : null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }



      // Render automatically if data-target is provided
      if (targetSelector) {
        const targetContainer = document.querySelector(targetSelector);

        if (targetContainer) {

          if (typeof data === 'object') {
            if (data.html && typeof data.html === 'string') {
              targetContainer.innerHTML = data.html;
            } else {
              targetContainer.textContent = JSON.stringify(data);
            }
          } else {
            targetContainer.innerHTML = data;
          }
        }
      }

      // If inline callback is present, execute it and ignore custom or default success callback
      if (element.dataset.onSuccess) {
        this.tools.executeCallback(element, 'onSuccess', data, element);
      } else {
        this.on.success(data, element);
      }

    } catch (error) {
      // If inline callback is present, execute it and ignore custom or default error callback
      if (element.dataset.onError) {
        this.tools.executeCallback(element, 'onError', data, element, error);
      } else {
        this.on.error(data, element, error);
      }
    } finally {
      this.tools.setLoadingState(element, false, originalContent);
    }

    return data;
  }
}


// Global exposure for standalone browser script tags
if (typeof window !== 'undefined') {
  window.AviFlow = AviFlow;
}

// ES Module export for bundlers and modern environments
export default AviFlow;