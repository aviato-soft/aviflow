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
        'X-Requested-With': 'XMLHttpRequest'
      }),
      method: (elementDataset.method || 'POST').toUpperCase(),
      params: AviElement.getParams(element),
      url: elementDataset.url || '/',
      ...opt
    }

/*
    const params = AviElement.getParams(element);
    const headers = new Headers({
      'X-Requested-With': 'XMLHttpRequest'
    })
    const method = (elementDataset.method || 'POST').toUpperCase();
    let url = elementDataset.url || '/';
/*
    const fetchOptions = {
      headers: headers,
      method: method
    }
  */
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
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            resolve(data);
          } else {
            reject(data.error || 'Error fetching data');
          }
        })
        .catch(err => reject(err))
        .finally(() => {
          AviElement.togglePendingState(element, false);
          return data;
        });
    });
  }
}

export default AviFlowActions