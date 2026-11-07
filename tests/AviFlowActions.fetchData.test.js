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
const makeResponse = ({ contentType = 'application/json', json = {}, text = '', jsonError = null } = {}) => ({
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


    test('should resolve even when the HTTP status is not ok (status is not checked)', async () => {
      const response = { ...makeResponse({ json: { error: 'boom' } }), ok: false, status: 500 };
      global.fetch.mockResolvedValue(response);

      await expect(fetchData(element)).resolves.toEqual({ error: 'boom' });
    });

  });


  // -------------------------------------------------------------------------
  // Hooks: onSucces / onFail
  // -------------------------------------------------------------------------
  describe('success and fail hooks', () => {

    test('should call the onSucces hook with (data, element, event, target, flow)', async () => {
      const data = { success: true, id: 1 };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const onDone = jest.fn();
      const flow = makeFlow({ done: onDone });
      const event = new Event('click');
      setup({ dataset: { onSucces: 'done' } });

      await fetchData(element, event, '#target', flow);

      expect(flow.resolveAction).toHaveBeenCalledWith('done');
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith(data, element, event, '#target', flow);
    });


    test('should call the onSucces hook with its owner as "this"', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const owner = { name: 'owner' };
      let receivedThis;
      const flow = makeFlow({ done() { receivedThis = this; } }, owner);
      setup({ dataset: { onSucces: 'done' } });

      await fetchData(element, null, '#t', flow);

      expect(receivedThis).toBe(owner);
    });


    test('should not call onFail when success is truthy', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const onDone = jest.fn();
      const onFail = jest.fn();
      const flow = makeFlow({ done: onDone, fail: onFail });
      setup({ dataset: { onSucces: 'done', onFail: 'fail' } });

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
      setup({ dataset: { onSucces: 'done', onFail: 'fail' } });

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
      setup({ dataset: { onSucces: 'done' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe(data);
    });


    test('should not call any hook when the response is HTML (string)', async () => {
      global.fetch.mockResolvedValue(makeResponse({ contentType: 'text/html', text: '<p>ok</p>' }));
      const flow = makeFlow({ done: jest.fn(), fail: jest.fn() });
      setup({ dataset: { onSucces: 'done', onFail: 'fail' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBe('<p>ok</p>');
      expect(flow.resolveAction).not.toHaveBeenCalled();
    });


    test('should not call any hook when the JSON response is null', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: null }));
      const flow = makeFlow();
      setup({ dataset: { onSucces: 'done', onFail: 'fail' } });

      await expect(fetchData(element, null, '#t', flow)).resolves.toBeNull();
      expect(flow.resolveAction).not.toHaveBeenCalled();
    });


    test('should resolve normally when resolveAction finds no action', async () => {
      const data = { success: true };
      global.fetch.mockResolvedValue(makeResponse({ json: data }));
      const flow = makeFlow();
      setup({ dataset: { onSucces: 'unknown' } });

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
      setup({ dataset: { onSucces: 'done', onFail: 'fail' } });

      await expect(fetchData(element)).resolves.toBe(data);
    });


    test('should reject when a hook throws, calling onError and clearing pending state', async () => {
      global.fetch.mockResolvedValue(makeResponse({ json: { success: true } }));
      const error = new Error('hook failed');
      const onError = jest.fn();
      const flow = makeFlow({ done: () => { throw error; }, err: onError });
      setup({ dataset: { onSucces: 'done', onError: 'err' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toBe(error);

      expect(onError).toHaveBeenCalledWith(error, element, null, '#t', flow);
      expect(AviElement.togglePendingState).toHaveBeenLastCalledWith(element, false);
    });

  });


  // -------------------------------------------------------------------------
  // Errors and the onError hook
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
      global.fetch.mockResolvedValue({ headers: { get: () => { throw error; } } });

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should reject with the original error when there is no flow', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element)).rejects.toBe(error);
    });


    test('should call the onError hook with (error, element, event, target, flow)', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      const onError = jest.fn();
      const flow = makeFlow({ err: onError });
      const event = new Event('click');
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element, event, '#target', flow)).rejects.toBe(error);

      expect(flow.resolveAction).toHaveBeenCalledWith('err');
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, element, event, '#target', flow);
    });


    test('should call the onError hook with its owner as "this"', async () => {
      global.fetch.mockRejectedValue(new Error('network'));
      const owner = { name: 'owner' };
      let receivedThis;
      const flow = makeFlow({ err() { receivedThis = this; } }, owner);
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toThrow('network');

      expect(receivedThis).toBe(owner);
    });


    test('should still reject with the original error after the onError hook ran', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      const flow = makeFlow({ err: jest.fn() });
      setup({ dataset: { onError: 'err' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toBe(error);
    });


    test('should reject with the original error when the onError action is not found', async () => {
      const error = new Error('network');
      global.fetch.mockRejectedValue(error);
      const flow = makeFlow();
      setup({ dataset: { onError: 'unknown' } });

      await expect(fetchData(element, null, '#t', flow)).rejects.toBe(error);
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
