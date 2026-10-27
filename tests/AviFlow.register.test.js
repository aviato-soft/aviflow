import { expect, jest } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';

describe('AviFlow / register', () => {
  let flow;
  let warnSpy;
  

  afterEach(() => {
    warnSpy.mockRestore();
  });

  beforeEach(() => {
    flow = new AviFlow();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });
  

  test('should register a single action using key-value parameters', () => {
    const dummyFn = () => 'hello';
    flow.register('greet', dummyFn);

    expect(flow.action.greet).toBe(dummyFn);
  });
  

  test('should register multiple actions when passed an object', () => {
    const actions = {
      actionOne: () => 1,
      actionTwo: () => 2,
    };

    flow.register(actions);

    expect(flow.action.actionOne).toBe(actions.actionOne);
    expect(flow.action.actionTwo).toBe(actions.actionTwo);
  });
  

  test('should overwrite existing action functions with the same key', () => {
    const oldFn = () => 'old';
    const newFn = () => 'new';

    flow.register('test', oldFn);
    flow.register('test', newFn);

    expect(flow.action.test).toBe(newFn);
  });


  test('should not register invalid object', () => {
    const test = {
      branch: {
        leaf: () => {
          return 'test';
        }
      }
    }
    flow.register('test', test);
    expect(flow.action.test).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("AviFlow.register: expected (string, function) or an object of functions.")
    );

  });
});