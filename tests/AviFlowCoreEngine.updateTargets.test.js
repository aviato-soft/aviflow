import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';
import { AviElement } from '../src/tools/AviElement.js';

describe('AviFlowCoreEngine / updateTargets', () => {
  const flowCoreEngine = AviFlowCoreEngine;
  let targetEl1;
  let targetEl2;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    document.body.innerHTML = `
    <div id="target1" class="target"></div>
    <div id="target2" class="target"></div>
    `;
    targetEl1 = document.querySelector('#target1');
    targetEl2 = document.querySelector('#target2');
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks(); // warnSpy, errorSpy and any AviElement.setContent spy
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
    expect(warnSpy).not.toHaveBeenCalled();
    expect(targetEl1.innerHTML).toBe('test-7');
    expect(targetEl2.innerHTML).toBe('');
  });


  test('should warn and return undefined when no element matches the selector', () => {
    const result = flowCoreEngine.updateTargets('#does-not-exist', 'test-8');

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[AviFlow.core.updateTargets] No element matches "#does-not-exist"'
    );
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');
  });


  test('should only query inside the given root', () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<section id="scope"><div id="target3" class="target"></div></section>'
    );
    const scope = document.querySelector('#scope');
    const targetEl3 = document.querySelector('#target3');

    let result = flowCoreEngine.updateTargets('.target', 'test-9', scope);
    expect(result).toBe('test-9');
    expect(targetEl3.innerHTML).toBe('test-9');
    expect(targetEl1.innerHTML).toBe('');
    expect(targetEl2.innerHTML).toBe('');

    // a target that exists in the document but not inside the root is "no match"
    result = flowCoreEngine.updateTargets('#target1', 'test-9', scope);
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.updateTargets] No element matches "#target1"');
    expect(targetEl1.innerHTML).toBe('');
  });


  test('should log the error and keep updating the other targets when setContent fails', () => {
    const error = new Error('setContent failed');
    jest.spyOn(AviElement, 'setContent').mockImplementationOnce(() => { throw error; });

    const result = flowCoreEngine.updateTargets('.target', 'test-10');

    expect(result).toBe('test-10'); // content is still returned
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('[AviFlow.core.updateTargets] setContent failed', targetEl1, error);
    expect(targetEl1.innerHTML).toBe(''); // the failing element is untouched
    expect(targetEl2.innerHTML).toBe('test-10'); // the next one is still updated
  });

});
