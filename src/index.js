/**
 * AviFlow - Modern, lightweight JavaScript class to automate fetch requests 
 * natively using HTML data-attributes.
 * 
 * Supported data-attributes on triggered elements:
 *  @param data-action = "fetch" - Mandatory for selecting the object click trigger.
 *  @param data-url    = The URL to fetch. Falls back to the element's `href` if not set. 
 *                       Optional attibute - if missing page url is used.
 *  @param data-method = HTTP method (e.g., GET, POST). @default to `'POST'`.
 *  @param data-target = CSS selector of a container whose innerHTML will be replaced with the response.
 *  @param data-body-* = A collection of dataset key-value objects. 
 *                       All `data-body-*` attributes are collected into a FormData object via `formData(element)` 
 *                       and sent as the request body for non-GET methods
 *  @param data-on-error    = function to be call on case of error 
 *  @param data-on-success  = function to be call on case of success
  */
class AviFlow {
  static DEFAULT_METHOD = 'POST';
  static DEFAULT_URL = '/';
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
   * Core fetch handler
   */
  async handleFetch(element) {
    // Extract configurations from data attributes
    let url = element.dataset.url || element.getAttribute('href') || AviFlow.DEFAULT_URL;
    const method = element.dataset.method || AviFlow.DEFAULT_METHOD;
    const targetSelector = element.dataset.target;
    
    // Optional: Disable element during loading state
    const originalContent = element.innerHTML;
    this.setLoadingState(element, true);

    try {
      const headers = {
        'X-Requested-With': 'XMLHttpRequest'
      };

      const body = method !== 'GET' ? (element.dataset.body || this.formData(element)) : null;

      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method: method,
        headers: headers,
        // Pull payload from data-body attributes if it exists (expects JSON string)
        body: body
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Handle response depending on content-type header
      const contentType = response.headers ? response.headers.get('content-type') : null;
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
          targetContainer.innerHTML = typeof data === 'object' ? JSON.stringify(data) : data;
        }
      }

      // Trigger custom or default success callback
      this.options.onSuccess(data, element);

    } catch (error) {
      this.options.onError(error, element);
    } finally {
      this.setLoadingState(element, false, originalContent);
    }
  }

  /**
   * Collects all data-body-* attributes from the element into a FormData object.
   * Keys are converted from kebab-case (e.g., `data-body-name`) to camelCase (`name`).
   *
   * @param {HTMLElement} element
   * @returns {FormData}
   */
  formData(element) {
    const form = new FormData();
    let hasEntries = false;
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-body-')) {
        // Convert `data-body-name` -> `name` (camelCase)
        const rest = attr.name.slice(10); // Remove 'data-body-'
        const camelKey = rest.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        form.append(camelKey, attr.value);
        hasEntries = true;
      }
    });
    return hasEntries ? form : null;
  }

  /**
   * Sets innerHTML on an element based on its current status (pending, success, error).
   *
   * @param {HTMLElement} element
   * @param {'pending'|'success'|'error'} status
   */
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
   * Capitalize the first letter of a string.
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Visual indicator when an operation is pending
   */
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
export default AviFlow;
