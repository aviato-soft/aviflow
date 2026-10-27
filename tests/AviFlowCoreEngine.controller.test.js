import { afterEach, expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / eventHandler', () => {
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
  let triggerEl;
  let errorSpy;
  let warnSpy;

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    document.body.innerHTML = `
    <button id="trigger" data-flow="click -> getGreeting -> #target">
    <div id="target"></div>
    `;
    targetEl = document.querySelector('#target');
    triggerEl = document.getElementById('trigger');
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
  });


  test('should just works', () => {
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(targetEl.innerHTML).toBe('Hello World');
  });


  test('should not assign duplicate event', () => {
    const handleClick = jest.fn().mockReturnValue('Clicked!');
    triggerEl.dataset.flow = 'click -> handleClick -> #target';
    flow.register('handleClick', handleClick);

    flowEngine.controller(triggerEl);
    flowEngine.controller(triggerEl);
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(targetEl.innerHTML).toBe('Clicked!');
  });


  test('should return with null if element is invalid', () => {
    result = flowEngine.controller();
    expect(result).toBeUndefined();
  })




});