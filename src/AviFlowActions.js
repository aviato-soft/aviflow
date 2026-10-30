import { AviElement } from './tools/AviElement.js';

/**
 * @class AviFlowActions
 * @description Integrated actions for AviFlow class.
 * 
 * ###note
 * To create a new action use direct AviFlow.controller or AviFlow.register
**/
export class AviFlowActions {
  /**
   * Performs an asynchronous data retrieval operation using the Fetch API.
   * This method manages HTTP communication, including parameter serialization,
   * request headers, and automatic response parsing into JSON or text format.
   * It also manages pending state visual indicators via ``AviElement``.
   *
   * @param {HTMLElement} ``element`` The element containing the URL and request configuration.
   * @param {Object} [``opt``={}] Optional configuration parameters for the HTTP request.
   * @returns {Promise<Object|string>} A promise that resolves with the parsed response data (JSON object or HTML string), or rejects on error.
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
        'X-Requested-With': 'XMLHttpRequest'
      }),
      method: (elementDataset.method || 'POST').toUpperCase(),
      params: AviElement.getParams(element),
      url: elementDataset.url || '/',
      ...opt
    }

    if (options.method === 'GET' || options.method === 'HEAD') {
      if (Object.keys(options.params).length > 0) {
        options.url += (options.url.includes('?') ? '&' : '?') 
          + new URLSearchParams(options.params).toString();
      }
    } else {
      if (Object.keys(options.params).length > 0) {
        options.body = JSON.stringify(options.params);
      }
    }

    if (options.method === 'POST' || options.method === 'PUT') {
      const formData = new FormData();
      Object.entries(options.params).forEach(([key, value]) => {
        formData.append(key, value);
      });
      options.body = formData;
    } else {
      options.headers.append('Content-Type', 'application/json; charset=UTF-8');
    }

    return new Promise((resolve, reject) => {
      fetch(options.url, {
        body: options.body,
        headers: options.headers,
        method: options.method
      })
        .then(response => {
          const contentType = response.headers.get('content-type');
          
          // Check if content-type suggests HTML
          if (contentType && contentType.includes('text/html')) {
            return response.text();
          } 
          // Otherwise, attempt to parse as JSON
          return response.json();
        })
        .then(data => {
          // If the result is a string, it's HTML content. Return it directly.
          if (typeof data === 'string') {
            resolve(data);
          } else if (data.success) {
            resolve(data);
          } else {
            reject(data.error || '[AviFlow.action.fetch] Error fetching data');
          }
        })
        .catch(err => {
          // If the error is due to response.json() failing (e.g. non-JSON response),
          // and we haven't handled it as HTML yet, we might need to check if it's text.
          // However, for simplicity, we pass the original error here.
          reject(err);
        })
        .finally(() => {
          AviElement.togglePendingState(element, false);
        });
    });
  }
}

export default AviFlowActions