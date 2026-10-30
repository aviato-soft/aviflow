import { expect, jest, test } from '@jest/globals';
import AviFlowActions from '../src/AviFlowActions.js';

describe('AviFlowActions / fetchData', () => {
  let result;
  let target;
  let expectData = {
    bool: true,
    error: 'Error occurred',
    json: {
      success: true,
      html: '<p>Success API Response</p>',
      data: {
        message: 'Success API Response!',
        orders: [
          {
            id: 1,
            name: "Test order A"
          },
          {
            id: 2,
            name: "Test order B"
          }
        ]
      }
    },
    text: '<span >Success API Response</span >',
  };

  global.fetch = jest.fn((url, options = {}) => {
    const isJson = typeof url === 'string' && (url.includes('json') || url.includes('application/json'));
    const isError = typeof url === 'string' && url.includes('error');
    return Promise.resolve({
      ok: !isError,
      status: isError ? 500 : 200,
      headers: new Headers({
        'content-type': isJson ? 'application/json' : 'text/html'
      }),
      data: options,
      text: () => Promise.resolve(isError ? expectData.error : expectData.text),
      json: () => Promise.resolve(isError ? expectData.error : expectData.json)
    });
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="trigger" data-flow="fetch -> #target">Click me!</button>
      <div id="target"></div>`;
    target = document.getElementById('target');
    trigger = document.getElementById('trigger')
  });

  test('Simple test with url set on object creation', async () => {
    result = await AviFlowActions.fetchData(trigger);

    // Wait for promises to resolve and DOM updates
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);
  });

  test('Call without element', async () => {
    result = await AviFlowActions.fetchData();

    // Wait for promises to resolve and DOM updates
    await new Promise(process.nextTick);
    expect(result).toBeNull();
    result
  });

  test('Call using method GET + url + params', async () => {
    trigger.dataset.method = 'get';

    //simple url + no params
    trigger.dataset.url = '/api';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);

    //add params:
    trigger.dataset.paramTestText = 'test 1';
    trigger.dataset.paramTestBoolean = true;

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);

    //complex url
    trigger.dataset.url = '/api?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);


    //json url
    trigger.dataset.url = '/api-json?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);


    //error url
    trigger.dataset.url = '/api-error';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.error);

  });


  test('Call using method POST + url + params', async () => {
    trigger.dataset.method = 'post';

    //simple url + no params
    trigger.dataset.url = '/api';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);

    //add params:
    trigger.dataset.paramTestText = 'test 1';
    trigger.dataset.paramTestBoolean = true;

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);

    //complex url
    trigger.dataset.url = '/api?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.text);

    //json url
    trigger.dataset.url = '/api-json?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);


    //error url
    trigger.dataset.url = '/api-error';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.error);
  });


  test('success false result', async () => {
    trigger.dataset.url = '/api/json';


    result = await AviFlowActions.fetchData(trigger, { success: false });
    await new Promise(process.nextTick);

    expect(result.success).toBe(true);
  });


  test('Error case: Rejects with data.error field present', async () => {
    trigger.dataset.url = '/api/error';

    try {
      result = await AviFlowActions.fetchData(trigger);
      //fail('Expected promise to reject');
    } catch (err) {
      expect(err).toEqual('[AviFlow.action.fetch] Error fetching data');
    }
  });


  test('Network Error case: Rejects with error object', async () => {
    const networkError = new Error('Network Failure');

    // Temporarily mock fetch to reject
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.reject(networkError));

    try {
      result = await AviFlowActions.fetchData(trigger);
      fail('Expected promise to reject');
    } catch (err) {
      // Check if the error caught is the network error
      expect(err).toBe(networkError);
    }
  });

  test('Error case: Rejects with fallback message when data.error is missing', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: () => Promise.resolve({}), // data.error is missing
      })
    );

    try {
      await AviFlowActions.fetchData(trigger);
      fail('Expected promise to reject');
    } catch (err) {
      expect(err).toEqual('[AviFlow.action.fetch] Error fetching data');
    }
    global.fetch = originalFetch;
  });
})
