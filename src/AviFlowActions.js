import { AviElement } from './tools/AviElement.js';

/**
 * @class AviFlowActions
 * @description Integrated actions for AviFlow class.
 *
 * ### Built-in actions
 * - `fetchData`   (registered as `fetch`)  : HTTP request driven by the element's data attributes.
 * - `elementValue` (registered as `value`) : reads the current value of the element.
 *
 * ###note
 * To create a new action use direct AviFlow.controller
**/
export class AviFlowActions {
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

    // Calls the hook named `name` (if any) with `payload` followed by the usual action arguments.
    const callHook = (name, payload) => {
      if (!name) return;
      const resolved = flow?.resolveAction(name);
      resolved?.fn.call(resolved.owner, payload, element, event, targetSelector, flow);
    };

    // For <form> elements the native `method` / `action` attributes act as fallbacks for
    // `data-method` / `data-url`. getAttribute is used on purpose: the `form.method` and
    // `form.action` properties always return a value (defaulting to "get" and to the current
    // page URL), which would hide the real defaults below.
    const isForm = element.tagName === 'FORM';
    const formMethod = isForm ? element.getAttribute('method') : null;
    const formAction = isForm ? element.getAttribute('action') : null;

    const { method, params, url: baseUrl } = {
      method: (dataset.method || formMethod || 'POST').toUpperCase(),
      params: AviElement.getParams(element),
      url: dataset.url
        || formAction
        || (element.tagName === 'A' ? element.getAttribute('href') : null)
        || '/',
      ...AviElement.getParams(element, 'opt')
    };

    const headers = new Headers({ 'X-Requested-With': 'XMLHttpRequest' });
    const hasParams = Object.keys(params).length > 0;
    let url = baseUrl;
    let body;

    if (method === 'GET' || method === 'HEAD') {
      if (hasParams) url += `${url.includes('?') ? '&' : '?'}${new URLSearchParams(params)}`;
    } else if (method === 'POST' || method === 'PUT') {
      body = new FormData();
      Object.entries(params).forEach(([key, value]) => body.append(key, value));
    } else {
      headers.set('Content-Type', 'application/json; charset=UTF-8');
      if (hasParams) body = JSON.stringify(params);
    }

    AviElement.togglePendingState(element, true);

    try {
      const response = await fetch(url, { body, headers, method });
      
      // THROW HERE: Force HTTP errors (404, 500, etc.) into the catch block
      if (!response.ok) {
        // HTTP/2 responses have an empty statusText: trim the trailing space
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }
  
      const isHtml = (response.headers.get('content-type') || '').includes('text/html');
      const data = isHtml ? await response.text() : await response.json();

      if (data && typeof data === 'object') {
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

    if (element.tagName === 'INPUT' && element.type === 'checkbox') return element.checked;
    if (typeof element.value === 'string') return element.value;

    return typeof element.innerText === 'string' ? element.innerText : null;
  }
}


export default AviFlowActions
