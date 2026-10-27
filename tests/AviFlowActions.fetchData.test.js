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
    text: '<span>Success API Response</span>',
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
  });

  test('Simple test with url set on object creation', async () => {
    result = await AviFlowActions.fetchData(trigger);

    // Wait for promises to resolve and DOM updates
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);
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
    expect(result).toBe(expectData.json);

    //add params:
    trigger.dataset.paramTestText = 'test 1';
    trigger.dataset.paramTestBoolean = true;
    
    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);

    //complex url
    trigger.dataset.url = '/api?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);

  });


  test('Call using method POST + url + params', async () => {
    trigger.dataset.method = 'post';
    
    //simple url + no params
    trigger.dataset.url = '/api';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);

    //add params:
    trigger.dataset.paramTestText = 'test 1';
    trigger.dataset.paramTestBoolean = true;
    
    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);

    //complex url
    trigger.dataset.url = '/api?test-text=test 1&test-boolean=true';

    result = await AviFlowActions.fetchData(trigger);
    await new Promise(process.nextTick);
    expect(result).toBe(expectData.json);
  });


  test('success false result', async () => {
    trigger.dataset.url = '/api';


    result = await AviFlowActions.fetchData(trigger, {success: false});
    await new Promise(process.nextTick);

    //console.log(result);

    expect(result.success).toBe(true);
  });


  test('Error case: Rejects with data.error field present', async () => {
    trigger.dataset.url = '/api/error';

    try{
      result = await AviFlowActions.fetchData(trigger);
      fail('Expected promise to reject');


    } catch (err) {
      expect(err).toEqual( 'Error fetching data');
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

    // Restore fetch mock
    global.fetch = originalFetch;
  });
});