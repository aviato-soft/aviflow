import { afterEach, expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / controller', () => {
  const flow = new AviFlow({
    company: 'Aviato Soft',
    getGreeting: () => 'Hello World',
    getNothing: () => { },
    getError: () => { throw new Error('Test Error for synchronous failure'); },
    asyncGetData: async () => {
      return new Promise((resolve) => setTimeout(() => resolve('Async Result'), 50));
    },
    asyncGetDataWithError: async () => {
      return new Promise((_, reject) => setTimeout(() => reject(new Error('Test Error')), 50));
    },
  });
  const flowEngine = new AviFlowCoreEngine(flow);

  const mock = {
    event: new Event('click'),
    triggerElement: document.createElement('button')
  };
  
  let result;
  let targetEl;
  let errorSpy;
  let warnSpy;

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    document.body.innerHTML = `<div id="target"></div>`;
    targetEl = document.querySelector('#target');
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
  });

  
  test('should execute synchronous action and update target DOM', () => {
    flowEngine.eventHandler(mock.triggerElement, mock.event, 'getGreeting', '#target');
    expect(targetEl.innerHTML).toBe('Hello World');
  });


  test('should handle the propagation', () => {
    flowEngine.eventHandler(mock.triggerElement, mock.event, 'getGreeting', '#target', true, true);
    expect(targetEl.innerHTML).toBe('Hello World');
  })


  test('should return undefined and rise a warning if action is not a function', () => {
    //call a non function action:
    result = flowEngine.eventHandler(mock.triggerElement, mock.event, 'company', '#target');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.eventHandler] Action "company" is not defined');
  });


  test('should return the action result no matter of target selector', () => {
    result = flowEngine.eventHandler(mock.triggerElement, mock.event, 'getGreeting', null);
    expect(result).toBe('Hello World');
    expect(targetEl.innerHTML).toBe('');

    result = flowEngine.eventHandler(mock.triggerElement, mock.event, 'getGreeting', []);
    expect(result).toBe('Hello World');
    expect(targetEl.innerHTML).toBe('');

    result = flowEngine.eventHandler(mock.triggerElement, mock.event, 'getGreeting', false);
    expect(result).toBe('Hello World');
    expect(targetEl.innerHTML).toBe('');
  });


  test('should trow an error and return nothing', () => {
    result = flowEngine.eventHandler(mock.triggerElement, mock.event, 'getError', '#target');
    expect(result).toBeUndefined();
    expect(targetEl.innerHTML).toBe('');
    expect(errorSpy).toHaveBeenCalledWith(
      `[AviFlow.core.eventHandler] Error on action "getError"`,
      expect.any(Error)
    );

  });


  test('should show works with asynchronous actions', async () => {
    const handlePromise = flowEngine.eventHandler(mock.triggerElement, mock.event, 'asyncGetData', '#target');
    const targetEl = document.querySelector('#target');

    await handlePromise;
    expect(targetEl.innerHTML).toBe('Async Result');
  });


  test('should catch errors from asynchronous actions and log them', async () => {
    // We expect the promise returned by eventHandler to be rejected/catch the error
    const handlePromise = flowEngine.eventHandler(mock.triggerElement, mock.event, 'asyncGetDataWithError', '#target');

    try {
      await handlePromise;
    } catch (e) {
      // Error is caught here
    }

    // Verify console.error was called with the correct message format
    expect(errorSpy).toHaveBeenCalledWith(
      `[AviFlow.core.eventHandler] Error on action "asyncGetDataWithError"`,
      expect.any(Error)
    );
  });
});