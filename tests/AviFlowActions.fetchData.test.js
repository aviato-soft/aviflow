import { expect, jest, test } from '@jest/globals';

// ---------------------------------------------------------------------------
// Test environment helpers
// ---------------------------------------------------------------------------

// jsdom does not always provide Headers; add a minimal polyfill when missing.
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    #map = new Map();
    constructor(init = {}) {
      Object.entries(init).forEach(([k, v]) => this.append(k, v));
    }
    append(name, value) {
      const key = String(name).toLowerCase();
      this.#map.set(key, this.#map.has(key) ? `${this.#map.get(key)}, ${value}` : String(value));
    }
    set(name, value) {
      this.#map.set(String(name).toLowerCase(), String(value));
    }
    get(name) {
      const key = String(name).toLowerCase();
      return this.#map.has(key) ? this.#map.get(key) : null;
    }
    has(name) {
      return this.#map.has(String(name).toLowerCase());
    }
  };
}

// AviElement is mocked so that only the logic of fetchData is under test.
const AviElement = {
  getDataset: jest.fn(),
  getParams: jest.fn(),
  togglePendingState: jest.fn()
};

jest.unstable_mockModule('../src/tools/AviElement.js', () => ({ AviElement }));

const { AviFlowActions } = await import('../src/AviFlowActions.js');
const fetchData = AviFlowActions.fetchData;

// Builds a fake fetch Response.
const makeResponse = ({
  contentType = 'application/json', json = {}, text = '', jsonError = null,
  ok = true, status = 200, statusText = 'OK'
} = {}) => ({
  ok,
  status,
  statusText,
  headers: {
    get: jest.fn((name) => (String(name).toLowerCase() === 'content-type' ? contentType : null))
  },
  json: jest.fn(() => (jsonError ? Promise.reject(jsonError) : Promise.resolve(json))),
  text: jest.fn(() => Promise.resolve(text))
});

// Fake flow: `handlers` maps an action name to a function; every handler gets the same `owner`.
const makeFlow = (handlers = {}, owner = {}) => ({
  resolveAction: jest.fn((name) => (name in handlers ? { fn: handlers[name], owner } : null))
});

// Configures what the mocked AviElement returns for an element.
const setup = ({ dataset = {}, params = {}, opts = {} } = {}) => {
  AviElement.getDataset.mockReturnValue(dataset);
  AviElement.getParams.mockImplementation((el, type) => (type === 'opt' ? opts : params));
};

// Returns [url, init] of the first fetch call.
const fetchCall = () => global.fetch.mock.calls[0];


describe('AviFlowActions / fetchData', () => {

  let element;

  beforeEach(() => {
    AviElement.getDataset.mockReset();
    AviElement.getParams.mockReset();
    AviElement.togglePendingState.mockReset();

    global.fetch = jest.fn().mockResolvedValue(makeResponse());

    document.body.innerHTML = '<button id="btn">Go</button>';
    element = document.getElementById('btn');

    setup();
  });


  // -------------------------------------------------------------------------
  // Guard clause
  // -------------------------------------------------------------------------
  describe('without element', () => {

    test('should resolve with null when element is missing', async () => {
      await expect(fetchData()).resolves.toBeNull();
      await expect(fetchData(null)).resolves.toBeNull();
      await expect(fetchData(undefined)).resolves.toBeNull();
    });


    test('should not read the dataset, toggle pending state or call fetch', async () => {
      await fetchData(null);

      expect(AviElement.getDataset).not.toHaveBeenCalled();
      expect(AviElement.getParams).not.toHaveBeenCalled();
      expect(AviElement.togglePendingState).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

  });


  // -------------------------------------------------------------------------
  // Pending state
  // -------------------------------------------------------------------------
  describe('pending state', () => {

    test('should return a promise', () => {
      expect(fetchData(element)).toBeInstanceOf(Promise);
    });


    test('should read dataset and params from the element', async () => {
      await fetchData(element);

      expect(AviElement.getDataset).toHaveBeenCalledWith(element);
      expect(AviElement.getParams).toHaveBeenCalledWith(element);
      expect(AviElement.getParams).toHaveBeenCalledWith(element, 'opt');
    });


    test('should enable pending state synchronously, before fetch resolves', () => {
      fetchData(element);

      expect(AviElement.togglePendingState).toHaveBeenCalledTimes(1);
      expect(AviElement.togglePendingState).toHaveBeenCalledWith(element, true);
    });


    test('should disable pending state after a successful request', async () => {
      await fetchData(element);

      expect(AviElement.togglePendingState).toHaveBeenCalledTimes(2);
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });


    test('should disable pending state after a failed request', async () => {
      global.fetch.mockRejectedValue(new Error('network'));

      await expect(fetchData(element)).rejects.toThrow('network');

      expect(AviElement.togglePendingState).toHaveBeenCalledTimes(2);
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });


    test('should disable pending state when fetch throws synchronously', async () => {
      global.fetch = jest.fn(() => { throw new Error('sync boom'); });

      await expect(fetchData(element)).rejects.toThrow('sync boom');

      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });

  });


  // -------------------------------------------------------------------------
  // Method
  // -------------------------------------------------------------------------
  describe('method', () => {

    test('should default to POST', async () => {
      await fetchData(element);

      expect(fetchCall()[1].method).toBe('POST');
    });


    test('should upper-case the method from the dataset', async () => {
      setup({ dataset: { method: 'get' } });

      await fetchData(element);

      expect(fetchCall()[1].method).toBe('GET');
    });


    test.each(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'])('should use %s from the dataset', async (method) => {
      setup({ dataset: { method } });

      await fetchData(element);

      expect(fetchCall()[1].method).toBe(method);
    });

  });


  // -------------------------------------------------------------------------
  // URL
  // -------------------------------------------------------------------------
  describe('url', () => {

    test('should use dataset.url', async () => {
      setup({ dataset: { url: '/api/items' } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/api/items');
    });


    test('should fall back to "/" when there is no url', async () => {
      await fetchData(element);

      expect(fetchCall()[0]).toBe('/');
    });


    test('should use the href of an <a> element when dataset.url is missing', async () => {
      document.body.innerHTML = '<a id="link" href="/from-href">Link</a>';
      const link = document.getElementById('link');

      await fetchData(link);

      expect(fetchCall()[0]).toBe('/from-href');
    });


    test('should prefer dataset.url over the href of an <a> element', async () => {
      document.body.innerHTML = '<a id="link" href="/from-href">Link</a>';
      const link = document.getElementById('link');
      setup({ dataset: { url: '/from-dataset' } });

      await fetchData(link);

      expect(fetchCall()[0]).toBe('/from-dataset');
    });


    test('should fall back to "/" for an <a> element without href', async () => {
      document.body.innerHTML = '<a id="link">Link</a>';
      const link = document.getElementById('link');

      await fetchData(link);

      expect(fetchCall()[0]).toBe('/');
    });


    test('should ignore href on non-<a> elements', async () => {
      element.setAttribute('href', '/ignored');

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/');
    });

  });


  // -------------------------------------------------------------------------
  // <form> elements: native `method` / `action` attributes
  // -------------------------------------------------------------------------
  describe('form element', () => {

    // Builds a <form> from an attribute string and returns it.
    const makeForm = (attrs = '') => {
      document.body.innerHTML = `<form id="frm" ${attrs}><input name="q"></form>`;
      return document.getElementById('frm');
    };


    test('should use the "method" attribute when data-method is missing', async () => {
      await fetchData(makeForm('method="put"'));

      expect(fetchCall()[1].method).toBe('PUT');
    });


    test('should use the "action" attribute when data-url is missing', async () => {
      await fetchData(makeForm('action="/submit"'));

      expect(fetchCall()[0]).toBe('/submit');
    });


    test('should use both "method" and "action" attributes together', async () => {
      setup({ params: { a: 1 } });

      await fetchData(makeForm('method="get" action="/search"'));

      expect(fetchCall()[0]).toBe('/search?a=1');
      expect(fetchCall()[1].method).toBe('GET');
      expect(fetchCall()[1].body).toBeUndefined();
    });


    test.each(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'])('should use %s from the "method" attribute', async (method) => {
      await fetchData(makeForm(`method="${method}"`));

      expect(fetchCall()[1].method).toBe(method);
    });


    test('should upper-case the "method" attribute', async () => {
      await fetchData(makeForm('method="get"'));

      expect(fetchCall()[1].method).toBe('GET');
    });


    test('should prefer data-method over the "method" attribute', async () => {
      setup({ dataset: { method: 'delete' } });

      await fetchData(makeForm('method="get"'));

      expect(fetchCall()[1].method).toBe('DELETE');
    });


    test('should prefer data-url over the "action" attribute', async () => {
      setup({ dataset: { url: '/from-dataset' } });

      await fetchData(makeForm('action="/from-action"'));

      expect(fetchCall()[0]).toBe('/from-dataset');
    });


    test('should mix data-method with the "action" attribute and vice versa', async () => {
      setup({ dataset: { method: 'put' } });
      await fetchData(makeForm('method="get" action="/from-action"'));

      expect(fetchCall()[0]).toBe('/from-action');
      expect(fetchCall()[1].method).toBe('PUT');

      global.fetch.mockClear();
      setup({ dataset: { url: '/from-dataset' } });
      await fetchData(makeForm('method="get" action="/from-action"'));

      expect(fetchCall()[0]).toBe('/from-dataset');
      expect(fetchCall()[1].method).toBe('GET');
    });


    test('should default to POST and "/" when the form has neither attribute (not the browser GET / current URL)', async () => {
      await fetchData(makeForm());

      expect(fetchCall()[0]).toBe('/');
      expect(fetchCall()[1].method).toBe('POST');
    });


    test('should fall back to the defaults for empty "method" and "action" attributes', async () => {
      await fetchData(makeForm('method="" action=""'));

      expect(fetchCall()[0]).toBe('/');
      expect(fetchCall()[1].method).toBe('POST');
    });


    test('should send params as FormData for a form without method (default POST)', async () => {
      setup({ params: { name: 'Avi' } });

      await fetchData(makeForm('action="/save"'));

      const body = fetchCall()[1].body;
      expect(body).toBeInstanceOf(FormData);
      expect(Object.fromEntries(body.entries())).toEqual({ name: 'Avi' });
    });


    test('should append params to the "action" url with "&" when it has a query string', async () => {
      setup({ params: { a: 1 } });

      await fetchData(makeForm('method="get" action="/items?page=2"'));

      expect(fetchCall()[0]).toBe('/items?page=2&a=1');
    });


    test('should let "opt" params override the "method" and "action" attributes', async () => {
      setup({ opts: { method: 'PATCH', url: '/from-opt' } });

      await fetchData(makeForm('method="get" action="/from-action"'));

      expect(fetchCall()[0]).toBe('/from-opt');
      expect(fetchCall()[1].method).toBe('PATCH');
    });


    test('should ignore "method" and "action" attributes on non-<form> elements', async () => {
      element.setAttribute('method', 'get');
      element.setAttribute('action', '/ignored');

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/');
      expect(fetchCall()[1].method).toBe('POST');
    });


    test('should ignore "method" and "action" attributes on an <a> element and keep using its href', async () => {
      document.body.innerHTML = '<a id="link" href="/from-href" method="get" action="/ignored">Link</a>';

      await fetchData(document.getElementById('link'));

      expect(fetchCall()[0]).toBe('/from-href');
      expect(fetchCall()[1].method).toBe('POST');
    });

  });


  // -------------------------------------------------------------------------
  // GET / HEAD
  // -------------------------------------------------------------------------
  describe('GET and HEAD requests', () => {

    test.each(['GET', 'HEAD'])('%s should append params to the url with "?"', async (method) => {
      setup({ dataset: { method, url: '/items' }, params: { a: 1, b: 'x y' } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/items?a=1&b=x+y');
    });


    test('should append params with "&" when the url already has a query string', async () => {
      setup({ dataset: { method: 'GET', url: '/items?page=2' }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/items?page=2&a=1');
    });


    test('should leave the url unchanged when there are no params', async () => {
      setup({ dataset: { method: 'GET', url: '/items' }, params: {} });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/items');
    });


    test.each(['GET', 'HEAD'])('%s should not send a body', async (method) => {
      setup({ dataset: { method, url: '/items' }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[1].body).toBeUndefined();
    });


    test.each(['GET', 'HEAD'])('%s should not send a Content-Type header', async (method) => {
      setup({ dataset: { method }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[1].headers.has('Content-Type')).toBe(false);
    });

  });


  // -------------------------------------------------------------------------
  // POST / PUT
  // -------------------------------------------------------------------------
  describe('POST and PUT requests', () => {

    test.each(['POST', 'PUT'])('%s should send params as FormData', async (method) => {
      setup({ dataset: { method }, params: { name: 'Avi', age: 5 } });

      await fetchData(element);

      const body = fetchCall()[1].body;
      expect(body).toBeInstanceOf(FormData);
      expect(Object.fromEntries(body.entries())).toEqual({ name: 'Avi', age: '5' });
    });


    test.each(['POST', 'PUT'])('%s should send an empty FormData when there are no params', async (method) => {
      setup({ dataset: { method }, params: {} });

      await fetchData(element);

      const body = fetchCall()[1].body;
      expect(body).toBeInstanceOf(FormData);
      expect([...body.entries()]).toEqual([]);
    });


    test.each(['POST', 'PUT'])('%s should not add a Content-Type header (browser sets multipart boundary)', async (method) => {
      setup({ dataset: { method }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[1].headers.has('Content-Type')).toBe(false);
    });


    test('should not append params to the url', async () => {
      setup({ dataset: { method: 'POST', url: '/save' }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/save');
    });

  });


  // -------------------------------------------------------------------------
  // DELETE / PATCH
  // -------------------------------------------------------------------------
  describe('DELETE and PATCH requests', () => {

    test.each(['DELETE', 'PATCH'])('%s should send params as a JSON string', async (method) => {
      setup({ dataset: { method }, params: { id: 7, tag: 'x' } });

      await fetchData(element);

      expect(fetchCall()[1].body).toBe(JSON.stringify({ id: 7, tag: 'x' }));
    });


    test.each(['DELETE', 'PATCH'])('%s should send the JSON Content-Type header', async (method) => {
      setup({ dataset: { method }, params: { id: 7 } });

      await fetchData(element);

      expect(fetchCall()[1].headers.get('Content-Type')).toBe('application/json; charset=UTF-8');
    });


    test.each(['DELETE', 'PATCH'])('%s should not send a body when there are no params', async (method) => {
      setup({ dataset: { method }, params: {} });

      await fetchData(element);

      expect(fetchCall()[1].body).toBeUndefined();
    });


    test('should not append params to the url', async () => {
      setup({ dataset: { method: 'DELETE', url: '/items/1' }, params: { a: 1 } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/items/1');
    });

  });


  // -------------------------------------------------------------------------
  // Headers and options
  // -------------------------------------------------------------------------
  describe('headers and options', () => {

    test('should always send X-Requested-With: XMLHttpRequest', async () => {
      await fetchData(element);

      expect(fetchCall()[1].headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    });


    test('should only pass body, headers and method to fetch', async () => {
      setup({ dataset: { method: 'DELETE' }, params: { id: 1 } });

      await fetchData(element);

      expect(Object.keys(fetchCall()[1]).sort()).toEqual(['body', 'headers', 'method']);
    });


    test('should let "opt" params override the url', async () => {
      setup({ dataset: { url: '/original' }, opts: { url: '/override' } });

      await fetchData(element);

      expect(fetchCall()[0]).toBe('/override');
    });


    test('should let "opt" params override the method', async () => {
      setup({ dataset: { method: 'POST' }, params: { a: 1 }, opts: { method: 'PUT' } });

      await fetchData(element);

      expect(fetchCall()[1].method).toBe('PUT');
      expect(fetchCall()[1].body).toBeInstanceOf(FormData);
    });

  });


  // -------------------------------------------------------------------------
  // Response parsing
  // -------------------------------------------------------------------------
  describe('response parsing', () => {

    test('should resolve with parsed JSON for application/json', async () => {
      const response = makeResponse({ contentType: 'application/json', json: { items: [1, 2] } });
      global.fetch.mockResolvedValue(response);

      const result = await fetchData(element);

      expect(result).toEqual({ items: [1, 2] });
      expect(response.json).toHaveBeenCalled();
      expect(response.text).not.toHaveBeenCalled();
    });


    test('should resolve with text for text/html', async () => {
      const response = makeResponse({ contentType: 'text/html', text: '<p>Hello</p>' });
      global.fetch.mockResolvedValue(response);

      const result = await fetchData(element);

      expect(result).toBe('<p>Hello</p>');
      expect(response.text).toHaveBeenCalled();
      expect(response.json).not.toHaveBeenCalled();
    });


    test('should treat "text/html; charset=utf-8" as HTML', async () => {
      const response = makeResponse({ contentType: 'text/html; charset=utf-8', text: '<b>x</b>' });
      global.fetch.mockResolvedValue(response);

      await expect(fetchData(element)).resolves.toBe('<b>x</b>');
    });


    test('should parse as JSON when there is no content-type header', async () => {
      const response = makeResponse({ contentType: null, json: { ok: true } });
      global.fetch.mockResolvedValue(response);

      await expect(fetchData(element)).resolves.toEqual({ ok: true });
      expect(response.text).not.toHaveBeenCalled();
    });


    test('should parse as JSON for any non-HTML content-type', async () => {
      const response = makeResponse({ contentType: 'text/plain', json: { a: 1 } });
      global.fetch.mockResolvedValue(response);

      await expect(fetchData(element)).resolves.toEqual({ a: 1 });
    });

  });


  // -------------------------------------------------------------------------
  // HTTP status: a response that is not ok is an error
  // -------------------------------------------------------------------------
  describe('HTTP status', () => {

    test.each([
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [404, 'Not Found'],
      [500, 'Internal Server Error'],
      [503, 'Service Unavailable'],
    ])('should reject with "HTTP %i %s" when the response is not ok', async (status, statusText) => {
      global.fetch.mockResolvedValue(makeResponse({ ok: false, status, statusText }));

      const promise = fetchData(element);

      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toThrow(`HTTP ${status} ${statusText}`);
    });


    test.each(['', '   '])('should not leave a trailing space in the message when statusText is %j (HTTP/2)', async (statusText) => {
      const response = { ...makeResponse({ ok: false, status: 404 }), statusText };
      global.fetch.mockResolvedValue(response);

      const error = await fetchData(element).catch((err) => err);

      expect(error).toBeInstanceOf(Error);
      expect(error.message.startsWith('HTTP 404')).toBe(true);
      expect(error.message).toBe(error.message.trim());
    });


    test('should give exactly "HTTP 404" when statusText is empty', async () => {
      global.fetch.mockResolvedValue(makeResponse({ ok: false, status: 404, statusText: '' }));

      await expect(fetchData(element)).rejects.toThrow(/^HTTP 404$/);
    });


    test('should not read the body of a response that is not ok', async () => {
      const response = makeResponse({ ok: false, status: 404, statusText: 'Not Found', json: { a: 1 }, text: '<p>404</p>' });
      global.fetch.mockResolvedValue(response);

      await expect(fetchData(element)).rejects.toThrow('HTTP 404 Not Found');

      expect(response.headers.get).not.toHaveBeenCalled();
      expect(response.json).not.toHaveBeenCalled();
      expect(response.text).not.toHaveBeenCalled();
    });


    test('should not return an HTML error page as data', async () => {
      global.fetch.mockResolvedValue(
        makeResponse({ ok: false, status: 404, statusText: 'Not Found', contentType: 'text/html', text: '<h1>404</h1>' })
      );

      await expect(fetchData(element)).rejects.toThrow('HTTP 404 Not Found');
    });


    test('should not call the success or fail hooks when the response is not ok', async () => {
      global.fetch.mockResolvedValue(
        makeResponse({ ok: false, status: 422, statusText: 'Unprocessable Entity', json: { success: false } })
      );
      const done = jest.fn();
      const fail = jest.fn();
      const flow = makeFlow({ done, fail });
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toThrow('HTTP 422 Unprocessable Entity');

      expect(done).not.toHaveBeenCalled();
      expect(fail).not.toHaveBeenCalled();
      expect(flow.resolveAction).not.toHaveBeenCalled();
    });


    test('should clear the pending state when the response is not ok', async () => {
      global.fetch.mockResolvedValue(makeResponse({ ok: false, status: 500, statusText: 'Internal Server Error' }));

      await expect(fetchData(element)).rejects.toThrow('HTTP 500');

      expect(AviElement.togglePendingState).toHaveBeenNthCalledWith(1, element, true);
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });


    test.each([200, 201, 204, 299])('should resolve normally for the ok status %i', async (status) => {
      global.fetch.mockResolvedValue(makeResponse({ ok: true, status, json: { done: true } }));

      await expect(fetchData(element)).resolves.toEqual({ done: true });
    });

  });


  // -------------------------------------------------------------------------
  // Hooks: onSuccess / onFail
  // -------------------------------------------------------------------------
  describe('success and fail hooks', () => {

    test('should call the onSuccess hook with (data, element, event, target, flow)', async () => {
      const data = { success: true, id: 1 };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const onDone = jest.fn();
      const flow = makeFlow({ done: onDone });
      const event = new Event('click');
      setup({ dataset: { onSuccess: 'done' } });

      await fetchData(element, event, '#target', flow);

      expect(flow.resolveAction).toHaveBeenCalledWith('done');
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(data, element, event, '#target', flow);
    });


    test('should call the onSuccess hook with its owner as "this"', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const owner = { name: 'owner' };
      let receivedThis;
      const flow = makeFlow({ done() { receivedThis = this; } }, owner);
      setup({ dataset: { onSuccess: 'done' } });

      await fetchData(element, null, '#t', flow);

      expect(receivedThis).toBe(owner);
    });


    test('should not call onFail when success is truthy', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const onDone = jest.fn();
      const onFail = jest.fn();
      const flow = makeFlow({ done: onDone, fail: onFail });
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await fetchData(element, null, '#t', flow);

      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onFail).not.toHaveBeenCalled();
    });


    test('should call the onFail hook with (data, element, event, target, flow) when success is falsy', async () => {
      const data = { success: false, message: 'nope' };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const onDone = jest.fn();
      const onFail = jest.fn();
      const flow = makeFlow({ done: onDone, fail: onFail });
      const event = new Event('click');
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await fetchData(element, event, '#target', flow);

      expect(flow.resolveAction).toHaveBeenCalledWith('fail');
      expect(onFail).toHaveBeenCalledWith(data, element, event, '#target', flow);
      expect(onDone).not.toHaveBeenCalled();
    });


    test('should call the onFail hook with its owner as "this"', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: false } }));
      const owner = { name: 'owner' };
      let receivedThis;
      const flow = makeFlow({ fail() { receivedThis = this; } }, owner);
      setup({ dataset: { onFail: 'fail' } });

      await fetchData(element, null, '#t', flow);

      expect(receivedThis).toBe(owner);
    });


    test('should treat a JSON object without a success key as a fail', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { items: [] } }));
      const onFail = jest.fn();
      const flow = makeFlow({ fail: onFail });
      setup({ dataset: { onFail: 'fail' } });

      await fetchData(element, null, '#t', flow);

      expect(onFail).toHaveBeenCalledTimes(1);
    });


    test('should resolve with the response data after calling a hook', async () => {
      const data = { success: true, value: 42 };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const flow = makeFlow({ done: jest.fn() });
      setup({ dataset: { onSuccess: 'done' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe(data);
    });


    test('should not call any hook when the response is HTML (string)', async () => {
      global.fetch.mockResolvedValue(makeResponse({ contentType: 'text/html', text: '<p>ok</p>' }));
      const flow = makeFlow({ done: jest.fn(), fail: jest.fn() });
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe('<p>ok</p>');
      expect(flow.resolveAction).not.toHaveBeenCalled();
    });


    test('should not call any hook when the JSON response is null', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: null }));
      const flow = makeFlow();
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBeNull();
      expect(flow.resolveAction).not.toHaveBeenCalled();
    });


    test('should resolve normally when resolveAction finds no action', async () => {
      const data = { success: true };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const flow = makeFlow();
      setup({ dataset: { onSuccess: 'unknown' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe(data);
      expect(flow.resolveAction).toHaveBeenCalledWith('unknown');
    });


    test('should resolve normally when the dataset has no hooks', async () => {
      const data = { success: true };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const flow = makeFlow({ done: jest.fn() });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe(data);
    });


    test('should resolve normally when no flow is provided', async () => {
      const data = { success: true };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      setup({ dataset: { onSuccess: 'done', onFail: 'fail' } });

      await expect(fetchData(element)).resolves.toBe(data);
    });


    test('should reject when a hook throws and clear the pending state (onError is left to the engine)', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const error = new Error('hook failed');
      const onError = jest.fn();
      const flow = makeFlow({ done: () => { throw error; }, err: onError });
      setup({ dataset: { onSuccess: 'done', onError: 'err' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toBe(error);

      expect(onError).not.toHaveBeenCalled();
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });

  });


  // -------------------------------------------------------------------------
  // Errors: propagated to the caller. The `data-on-error` hook is handled by
  // AviFlowCoreEngine.eventHandler, not by fetchData.
  // -------------------------------------------------------------------------
  describe('errors', () => {

    test('should reject with the original error when fetch fails', async () => {
      const error = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValue(error);

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should reject when the response body is not valid JSON', async () => {
      const error = new SyntaxError('Unexpected token');
      global.fetch.mockResolvedValue(makeResponse({ jsonError: error }));

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should reject when reading the response headers fails', async () => {
      const error = new Error('bad headers');
      global.fetch.mockResolvedValue({ ok: true, headers: { get: () => { throw error; } } });

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should reject with the original error when there is no flow', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should reject with the original error and NOT call the onError hook (the engine does)', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      const onError = jest.fn();
      const flow = makeFlow({ err: onError });
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element, new Event('click'), '#target', flow)).rejects.toBe(error);

      expect(flow.resolveAction).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });


    test('should clear the pending state after an error', async () => {
      global.fetch.mockRejectedValue(new Error('network'));

      await expect(fetchData(element)).rejects.toThrow('network');

      expect(AviElement.togglePendingState).toHaveBeenNthCalledWith(1, element, true);
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });


    test('should not call the onError hook on a successful request', async () => {
      const onError = jest.fn();
      const flow = makeFlow({ err: onError });
      setup({ dataset: { onError: 'err' } });

      await fetchData(element, null, '#t', flow);

      expect(onError).not.toHaveBeenCalled();
    });

  });

});
