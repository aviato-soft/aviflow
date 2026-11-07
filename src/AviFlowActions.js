import { AviElement } from './tools/AviElement.js';

/**
 * @class AviFlowActions
 * @description Integrated actions for AviFlow class.
 *
 * ###note
 * To create a new action use direct AviFlow.controller
**/
export class AviFlowActions {
  /**
   * Sends an HTTP request built from the element's data attributes and returns the parsed response
   * (JSON object, or HTML string when the response is `text/html`).
   *
   * - GET/HEAD: params go in the query string.
   * - POST/PUT: params are sent as FormData.
   * - Other methods: params are sent as a JSON body.
   *
   * Optional hooks (action names resolved through `flow.resolveAction`), called as
   * `hook(payload, element, event, targetSelector, flow)`:
   * - `onSucces`: JSON response with a truthy `success`   (payload = data)
   * - `onFail`:   JSON response with a falsy `success`    (payload = data)
   * - `onError`:  any thrown error, which is then re-thrown (payload = error)
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
      const resolved = flow?.resolveAction(name);
      resolved?.fn.call(resolved.owner, payload, element, event, targetSelector, flow);
    };

    const { method, params, url: baseUrl } = {
      method: (dataset.method || 'POST').toUpperCase(),
      params: AviElement.getParams(element),
      url: dataset.url || (element.tagName === 'A' ? element.getAttribute('href') : null) || '/',
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
      const isHtml = (response.headers.get('content-type') || '').includes('text/html');
      const data = isHtml ? await response.text() : await response.json();

      if (data && typeof data === 'object') {
        callHook(data.success ? dataset.onSucces : dataset.onFail, data);
      }

      return data;
    } catch (err) {
      callHook(dataset.onError, err);
      throw err;
    } finally {
      AviElement.togglePendingState(element, false);
    }
  }
}

export default AviFlowActions
