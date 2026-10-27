import { expect, jest, test } from '@jest/globals';
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
    expect(result).toStrictEqual({
      action: 'formatText',
      event: 'keyup',
      prevent: false,
      stop: false,
      target: '#output',
    });
  });


  // Short usage, default action = click
  test('should parse 2 items: action -> target and default event to "click"', () => {
    result = flowCoreEngine.parseFlow('getTime -> #timer');
    expect(result).toStrictEqual({
      action: 'getTime',
      event: 'click',
      prevent: false,
      stop: false,
      target: '#timer',
    });
  });


  // Short usage, default action = click, missing target => return null
  test('should parse 1 item: action only, default event to "click" and target to null', () => {
    result = flowCoreEngine.parseFlow('logAnalytics');
    expect(result).toStrictEqual({
      action: 'logAnalytics',
      event: 'click',
      prevent: false,
      stop: false,
      target: null,
    });
  });


  // Missing flow string, return null:
  test('should return null for empty or missing flow string', () => {
    expect(flowCoreEngine.parseFlow()).toBeNull();
    expect(flowCoreEngine.parseFlow('')).toBeNull();
    expect(flowCoreEngine.parseFlow(null)).toBeNull();
    expect(flowCoreEngine.parseFlow(undefined)).toBeNull();
  });


  // Test trim parameters
  test('should trim surrounding whitespaces around syntax delimiters', () => {
    result = flowCoreEngine.parseFlow(' submit  ->   submitForm   ->   .result-box ');
    expect(result).toStrictEqual({
      action: 'submitForm',
      event: 'submit',
      prevent: false,
      stop: false,
      target: '.result-box',
    });
  });


  // Test propagations:
  test('should pass event propagation properties', () => {
    result = flowCoreEngine.parseFlow('click .prevent.stop->submitForm   ->   .result-box ');
    expect(result).toStrictEqual({
      action: 'submitForm',
      event: 'click',
      prevent: true,
      stop: true,
      target: '.result-box',
    });
  });


  // Test no target specific
  test('should works with no target specified: event -> action -|', () => {
    result = flowCoreEngine.parseFlow('keyup->formatText-|');
    expect(result).toStrictEqual({
      action: 'formatText',
      event: 'keyup',
      prevent: false,
      stop: false,
      target: null,
    });

    result = flowCoreEngine.parseFlow('formatText-|');
    expect(result).toStrictEqual({
      action: 'formatText',
      event: 'click',
      prevent: false,
      stop: false,
      target: null,
    });

    result = flowCoreEngine.parseFlow('formatText');
    expect(result).toStrictEqual({
      action: 'formatText',
      event: 'click',
      prevent: false,
      stop: false,
      target: null,
    });
  });


  test('should return a warnging: too many parts error: -> -> -> -> ... -> ', () => {
    result = flowCoreEngine.parseFlow('click -> keyup -> formatText -> another target');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseFlow] Too many "->" parts (max: event -> action -> target)');

    result = flowCoreEngine.parseFlow('click -> keyup -> formatText -> another target -|');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AviFlow.core.parseFlow] Too many parts before "-|" (max: event -> action -|)')
    );
  });


  test('should return a warning for: Missing action', () => {
    result = flowCoreEngine.parseFlow('keyup -> -> #target');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AviFlow.core.parseFlow] Missing "action"')
    );
  });


  test('should return a warning for empty target', () => {
    result = flowCoreEngine.parseFlow('keyup -> action -> ');
    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`[AviFlow.core.parseFlow] Empty target: end the flow with "-|" when there is no target`)
    );
  })

  test('sould return click for a (.)dot event', () => {
    result = flowCoreEngine.parseFlow('.stop -> action -> #target');
      expect(result).toStrictEqual({
        action: 'action',
        event: 'click',
        prevent: false,
        stop: true,
        target: '#target',
      });
  }) 



});