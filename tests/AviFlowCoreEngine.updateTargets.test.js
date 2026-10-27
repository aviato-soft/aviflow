import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / eventHandler', () => {  
  const flowCoreEngine = AviFlowCoreEngine;
  let targetEl1;
  let targetEl2;
  let warnSpy;

  beforeEach(() => {
    document.body.innerHTML = `
    <div id="target1" class="target"></div>
    <div id="target2" class="target"></div>
    `;
    targetEl1 = document.querySelector('#target1');
    targetEl2 = document.querySelector('#target2');
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('should update one target content DOM', () => {
    flowCoreEngine.updateTargets('#target1', 'test-1');

    expect(targetEl1.innerHTML).toBe('test-1');
    expect(targetEl2.innerHTML).toBe('');
  });


  test('should update multiple targets content DOM', () => {
    flowCoreEngine.updateTargets('.target', 'test-2.1');

    expect(targetEl1.innerHTML).toBe('test-2.1');
    expect(targetEl2.innerHTML).toBe('test-2.1');

    flowCoreEngine.updateTargets('#target1, #target2', 'test-2.2');

    expect(targetEl1.innerHTML).toBe('test-2.2');
    expect(targetEl2.innerHTML).toBe('test-2.2');
  });

  test('should not update DOM content if content is missing or invalid', () => {
    let result = flowCoreEngine.updateTargets('div');
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets('div', undefined);
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');
  });

  test('different expectations for update DOM content based on content type', () => {
    let result = flowCoreEngine.updateTargets('div', null);
    expect(result).toBeNull();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets('div', false);
    expect(result).toBe(false);
    expect(targetEl1.innerHTML).toBe('false');
    expect(targetEl2.innerHTML).toBe('false');

    result = flowCoreEngine.updateTargets('div', true);
    expect(result).toBe(true);
    expect(targetEl1.innerHTML).toBe('true');
    expect(targetEl2.innerHTML).toBe('true');

    result = flowCoreEngine.updateTargets('div', []);
    expect(result).toEqual([]);
    expect(targetEl1.innerHTML).toBe('[]');
    expect(targetEl2.innerHTML).toBe('[]');

    result = flowCoreEngine.updateTargets('div', {});
    expect(result).toEqual({});
    expect(targetEl1.innerHTML).toBe('{}');
    expect(targetEl2.innerHTML).toBe('{}');

    flowCoreEngine.updateTargets('div', { a: 1, b: { b1: 1.1, b2: 1.2 } });
    expect(targetEl1.innerHTML).toBe(`{"a":1,"b":{"b1":1.1,"b2":1.2}}`);
    expect(targetEl2.innerHTML).toBe(`{"a":1,"b":{"b1":1.1,"b2":1.2}}`);

  });


  test('should not update DOM content if target selector is missing or invalid', () => {
    let result = flowCoreEngine.updateTargets(null, 'test-4');
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets({}, 'test');
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets([], 'test');
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets(false, 'test');
    expect(result).toBeUndefined();
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    result = flowCoreEngine.updateTargets('<->', 'test-4');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[AviFlow.core.updateTargets] Invalid target selector "<->"`)
    );
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');
  });


  test('should not block update DOM content if target selector is not existing in dom', () => {
    let result = flowCoreEngine.updateTargets('button, img, select, #target1', 'test-7');
    expect(result).toBe('test-7');
//    expect(warnSpy).toHaveBeenCalledTimes(3);
    expect(targetEl1.innerHTML).toBe('test-7');
    expect(targetEl2.innerHTML).toBe('');
  });

});