import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / parseFlow', () => {
  const flowCoreEngine = AviFlowCoreEngine;
  let result;
  let warnSpy;
  

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });


  // Default usage:
  test('should parse 3 items: event -> action -> target', () => {
    result = flowCoreEngine.parseFlow('keyup -> formatText -> #output');
    expect(result).toStrictEqual([{
      action: 'formatText',
      event: 'keyup',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: '#output',
    }]);
  });


  // Short usage, default action = click
  test('should parse 2 items: action -> target and default event to "click"', () => {
    result = flowCoreEngine.parseFlow('getTime -> #timer');
    expect(result).toStrictEqual([{
      action: 'getTime',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: '#timer',
    }]);
  });


  // Short usage, default action = click, missing target => return null
  test('should parse 1 item: action only, default event to "click" and target to null', () => {
    result = flowCoreEngine.parseFlow('logAnalytics');
    expect(result).toStrictEqual([{
      action: 'logAnalytics',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: null,
    }]);
  });


  // Missing flow string, return null:
  test('should return null for empty or missing flow string', () => {
    expect(flowCoreEngine.parseFlow()).toBeNull();
    expect(flowCoreEngine.parseFlow('')).toBeNull();
    expect(flowCoreEngine.parseFlow(null)).toBeNull();
    expect(flowCoreEngine.parseFlow(undefined)).toBeNull();
  });


  test('should return null for a non-string flow', () => {
    expect(flowCoreEngine.parseFlow(123)).toBeNull();
    expect(flowCoreEngine.parseFlow({})).toBeNull();
    expect(flowCoreEngine.parseFlow(['click -> action -> #target'])).toBeNull();
  });


  // Test trim parameters
  test('should trim surrounding whitespaces around syntax delimiters', () => {
    result = flowCoreEngine.parseFlow(' submit  ->   submitForm   ->   .result-box ');
    expect(result).toStrictEqual([{
      action: 'submitForm',
      event: 'submit',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: '.result-box',
    }]);
  });


  // Test propagations:
  test('should pass event propagation properties', () => {
    result = flowCoreEngine.parseFlow('click .prevent.stop->submitForm   ->   .result-box ');
    expect(result).toStrictEqual([{
      action: 'submitForm',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: true,
      stop: true,
      target: '.result-box',
    }]);
  });


  // Test no target specific
  test('should works with no target specified: event -> action -|', () => {
    result = flowCoreEngine.parseFlow('keyup->formatText-|');
    expect(result).toStrictEqual([{
      action: 'formatText',
      event: 'keyup',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: null,
    }]);

    result = flowCoreEngine.parseFlow('formatText-|');
    expect(result).toStrictEqual([{
      action: 'formatText',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: null,
    }]);

    result = flowCoreEngine.parseFlow('formatText');
    expect(result).toStrictEqual([{
      action: 'formatText',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: null,
    }]);
  });


  test('should return a warning: too many parts error: -> -> -> -> ... -> ', () => {
    result = flowCoreEngine.parseFlow('click -> keyup -> formatText -> another target');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseSingleFlow] Too many "->" parts (max: event -> action -> target)');

    result = flowCoreEngine.parseFlow('click -> keyup -> formatText -> another target -|');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AviFlow.core.parseSingleFlow] Too many parts before "-|" (max: event -> action -|)')
    );
  });


  test('should return a warning for: Missing action', () => {
    result = flowCoreEngine.parseFlow('keyup -> -> #target');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AviFlow.core.parseSingleFlow] Missing "action"')
    );
  });


  test('should return a warning for empty target', () => {
    result = flowCoreEngine.parseFlow('keyup -> action -> ');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[AviFlow.core.parseSingleFlow] Empty target: end the flow with "-|" when there is no target`)
    );
  })

  test('should return click for a (.)dot event', () => {
    result = flowCoreEngine.parseFlow('.stop -> action -> #target');
      expect(result).toStrictEqual([{
        action: 'action',
        event: 'click',
        onWindow: false,
        passive: false,
        prevent: false,
        stop: true,
        target: '#target',
      }]);
  }) 


  // Multiple flows: [flow1][flow2]
  test('should parse several flows wrapped in square brackets', () => {
    result = flowCoreEngine.parseFlow('[click -> save -> #status][keyup.stop -> validate -|]');
    expect(result).toStrictEqual([
      {
        action: 'save',
        event: 'click',
        onWindow: false,
        passive: false,
        prevent: false,
        stop: false,
        target: '#status',
      },
      {
        action: 'validate',
        event: 'keyup',
        onWindow: false,
        passive: false,
        prevent: false,
        stop: true,
        target: null,
      },
    ]);
  });


  test('should skip the invalid flows and keep the valid ones', () => {
    result = flowCoreEngine.parseFlow('[keyup -> -> #t1][click -> go -> #t2]');
    expect(result).toStrictEqual([{
      action: 'go',
      event: 'click',
      onWindow: false,
      passive: false,
      prevent: false,
      stop: false,
      target: '#t2',
    }]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AviFlow.core.parseSingleFlow] Missing "action"')
    );
  });


  test('should return null when every flow in the string is invalid', () => {
    result = flowCoreEngine.parseFlow('[keyup -> -> #t1][keyup -> act -> ]');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });


  test('should return null when the multi-flow string cannot be split', () => {
    result = flowCoreEngine.parseFlow('[click -> a -> #t');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[AviFlow.core.splitFlows] Unbalanced brackets or quotes in multi-flow definition'
    );
  });


  // Frozen results
  test('should return frozen results', () => {
    result = flowCoreEngine.parseFlow('click -> freezeMe -> #target');

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
    expect(() => { result[0].action = 'changed'; }).toThrow(TypeError);
  });


  // Cache
  test('should return the cached result for the same string', () => {
    const first = flowCoreEngine.parseFlow('click -> cachedAction -> #cached');
    const second = flowCoreEngine.parseFlow('click -> cachedAction -> #cached');

    expect(second).toBe(first); // same reference, not just equal
  });


  test('should cache invalid results too (warn only once)', () => {
    const first = flowCoreEngine.parseFlow('cachedInvalid -> -> #target');
    const second = flowCoreEngine.parseFlow('cachedInvalid -> -> #target');

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });


  test('should evict the oldest cache entries once the cache limit (500) is reached', () => {
    const oldestFlow = 'click -> evictedAction -> #evicted';
    const oldest = flowCoreEngine.parseFlow(oldestFlow);
    expect(flowCoreEngine.parseFlow(oldestFlow)).toBe(oldest); // still cached

    // far more unique entries than the limit: the oldest one must be dropped
    let last;
    for (let i = 0; i < 1000; i++) {
      last = flowCoreEngine.parseFlow(`fill${i} -> #fill`);
    }

    const reparsed = flowCoreEngine.parseFlow(oldestFlow);
    expect(reparsed).not.toBe(oldest); // parsed again => new object
    expect(reparsed).toEqual(oldest); // ...with the same content
    expect(flowCoreEngine.parseFlow('fill999 -> #fill')).toBe(last); // newest still cached
  });

});
