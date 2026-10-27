import { expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / parseEvent', () => {
  const flowCoreEngine = AviFlowCoreEngine;
  let result;
  let testString;
  /*
    beforeEach(() => {
    });
  
    afterEach(() => {
    });
  */
  test('should return the result of: click.prevent.stop', () => {
    testString = 'click.prevent.stop';
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: true, stop: true });
  });

  test('should return the result of: ..', () => {
    testString = '..';
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: false, stop: false });
  });

  test('should return the result of: ""', () => {
    testString = "";
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: false, stop: false });
  });

});