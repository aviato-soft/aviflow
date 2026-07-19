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
  static DEFAULT_METHOD = 'POST';
  static DEFAULT_URL = '#';
  static DEFAULT_PENDING_CLASS = 'pending';

  constructor(options = {}) {
    // Default configurations
    this.options = {
      selector: '[data-action="fetch"]',
      onSuccess: (data, element) => this.defaultSuccess(data, element),
      onError: (error, element) => this.defaultError(error, element),
      ...options
    };

    this.init();
  }

  /**
   * Initializes the event listener on the document body (Event Delegation)
   * This ensures elements added dynamically via JS later are also covered.
   */
  init() {
    document.body.addEventListener('click', async (event) => {
      // Find closest element matching selector (handles nested icons/spans inside a button)
      const targetElement = event.target.closest(this.options.selector);
      
      if (targetElement) {
        event.preventDefault();
        await this.handleFetch(targetElement);
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
     * @returns {Array<[string, string]>} Array of `[attributeNameWithoutPrefix, value]` pairs.
     */
    filterAttributes: function(element, prefix = '') {
      return Array.from(element.attributes)
          .filter((attr) => attr.name.startsWith(prefix))
          .map(({ name, value }) => [name.slice(prefix.length), value]);
    },

    /**
     * Filters dataset entries of an element that match a given prefix.
     *
     * @param {HTMLElement} element   The target element.
     * @param {string}       prefix   Optional key prefix. Defaults to `''` (all keys).
     * @returns {Array<[string, string]>} Array of `[keyWithoutPrefix, value]` pairs.
     */
    filterDataset: function(element, prefix = '') {
      return Object.entries(element.dataset)
          .filter(([key]) => key.startsWith(prefix))
          .map(([key, value]) => [key.slice(prefix.length), value]);
    },


    /**
     * Builds an object from attributes or dataset entries that share a common prefix.
     *
     * Reads the element's `dataset` by default; pass `'attribute'` as the third argument to read HTML attributes instead.
     *
     * @param {HTMLElement} element The target element.
     * @param {string}       [prefix] Optional name prefix to match against (e.g. `body`, `data-body-param`).
     * @param {'dataset'|'attribute'} [use='dataset'] Where to read data from: `'dataset'` or `'attribute'`.
     * @returns {Object.<string, string>} Object with `[keyWithoutPrefix]: value` entries.
     */
    formEntries: function (element, prefix = '', use = 'dataset') {
      return Object.fromEntries((use === 'dataset') ? 
        this.filterDataset(element, prefix) :
        this.filterAttributes(element, prefix)
      )
    },


    /**
     * Call formEntries with 'param' default prefix
     * @param {HTMLElement} element
     * @returns {FormData}
     */
    formData: function (element, prefix = 'param') {
      const data = new FormData();
      const formEntries = this.formEntries(element, prefix);
      
      if (!formEntries) {
        return data;
      }

      if (this.isEmptyObject(formEntries)) {
        return data;
      }

      for (const [key, value] of Object.entries(formEntries)) {
        if (value !== undefined && value !== null) {
          data.append(this.toCamelCase(key), value);
        }
      }

      return data;
    },


    isEmptyObject: function(o) {
      //is this an object ?
      if (!o || typeof o !== 'object') {
        return false;
      }

      // Performance win: if it has any enumerable properties, it's not empty
      for (const key in o) {
        return false;
      }

      // Confirm it is an object:
      return o.constructor === Object;
    },


    toCamelCase: function(str) {
      if (typeof str !== 'string') {
        return '';
      }

      return str
        .trim()      
        .toLowerCase()
        .replace(/[-_\s]+(.)?/g, (match, letter) => letter ? letter.toUpperCase() : '');
    }
  }


  /**
   * Main event handler invoked after a matching element is clicked.
   * Extracts URL, HTTP method and `data-target` selector from the element's data-attributes,
   * collects form data via {@linkcode AviFlow.tools#formData}, performs the fetch request,
   * updates the DOM (if a target container was specified) and dispatches success/error callbacks.
   */
  async handleFetch(element) {
    // Extract configurations from data attributes
    let url = element.dataset.url || element.getAttribute('href') || AviFlow.DEFAULT_URL;
    const method = (element.dataset.method || AviFlow.DEFAULT_METHOD).toUpperCase();
    const targetSelector = element.dataset.target || false;
    
    // Optional: Disable element during loading state
//  const originalContent = element.innerHTML;
//  this.setLoadingState(element, true);

    try {
      const headers = {
        'X-Requested-With': 'XMLHttpRequest',
       };

      const options = {
        headers: headers,
        method: method,
        mode: "no-cors"
      };

      if (method === 'POST' || method === 'PUT') {
        options.body = this.tools.formData(element, 'param');
      } else {
        options.headers['Content-Type'] = 'application/json; charset=UTF-8';
      }

      const response = await fetch(url, options);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Handle response depending on content-type header
      const contentType = response.headers ? response.headers.get('content-type') : null;
      console.log(response.headers.get('content-type'));
      
      let data;
      
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
            }
            targetContainer.textContent = JSON.stringify(data);  
          } else {
            targetContainer.innerHTML = data;
          }
        }
      }

      // Trigger custom or default success callback
      this.options.onSuccess(data, element);

    } catch (error) {
      this.options.onError(error, element);
    } finally {
 //   this.setLoadingState(element, false, originalContent);
    }
  }


  /**
   * Updates an element's innerHTML and CSS classes according to its loading status.
   * Adds/removes the pending class (custom or default `AviFlow.DEFAULT_PENDING_CLASS`)
   * depending on whether the operation is in progress.
   *
   * @param {HTMLElement} element
   * @param {'pending'|'success'|'error'} status The current loading state to apply.
   *
  setElementInnerHtmlByStatus(element, status) {
    const pendingClass = Object.prototype.hasOwnProperty.call(element.dataset, 'data-on-progress')
      ? element.dataset['data-on-progress']
      : AviFlow.DEFAULT_PENDING_CLASS;

    switch (status) {
      case 'pending':
        if (element.innerHTML.trim() === '') {
          element.classList.add(pendingClass);
          element.style.pointerEvents = 'none';
          element.style.opacity = '0.6';
        }
        break;

      case 'success':
        element.classList.remove(pendingClass);
        element.innerHTML = '';
        element.style.pointerEvents = '';
        element.style.opacity = '';
        break;

      case 'error':
        element.classList.remove(pendingClass);
        element.innerHTML = '';
        element.style.pointerEvents = '';
        element.style.opacity = '';
        break;
    }
  }

  /**
   * Returns a copy of the given string with its first character upper-cased.
   *
   * @param {string} str The input string.
   * @returns {string}
   *
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Manages the visual loading state of an element (pending class, pointer-events and opacity).
   *
   * Uses a custom CSS class from `element.dataset['data-on-progress']` if present,
   * otherwise falls back to {@linkcode AviFlow.DEFAULT_PENDING_CLASS}.
   *
   * @param {HTMLElement} element
   * @param {boolean} isLoading Whether the operation is in progress (`true`) or complete (`false`).
   *
  setLoadingState(element, isLoading, originalContent = '') {
    const pendingClass = Object.prototype.hasOwnProperty.call(element.dataset, 'data-on-progress')
      ? element.dataset['data-on-progress']
      : AviFlow.DEFAULT_PENDING_CLASS;
    if (isLoading) {
      element.classList.add(pendingClass);
      element.style.pointerEvents = 'none';
      element.style.opacity = '0.6';
    } else {
      element.classList.remove(pendingClass);
      element.style.pointerEvents = '';
      element.style.opacity = '';
      element.innerHTML = originalContent;
    }
  }

  /**
   * Default fallback hooks that also dispatch standard CustomEvents 
   * so other parts of your app can listen cleanly.
   */
  defaultSuccess(data, element) {
    // console.log('AviFlow success:', data);
    element.dispatchEvent(new CustomEvent('aviflow:success', { detail: data, bubbles: true }));
  }

  defaultError(error, element) {
    console.error('AviFlow error:', error);
    element.dispatchEvent(new CustomEvent('aviflow:error', { detail: error, bubbles: true }));
  }
}

// Global exposure for standalone browser script tags
if (typeof window !== 'undefined') {
  window.AviFlow = AviFlow;
}

// ES Module export for bundlers and modern environments
//export default AviFlow;
