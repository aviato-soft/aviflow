import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / splitFlows', () => {
  const split = (s) => AviFlowCoreEngine.splitFlows(s);
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('single flow (no leading bracket)', () => {
    test('should return the trimmed string as the only item', () => {
      expect(split('click -> action -> #target')).toEqual(['click -> action -> #target']);
      expect(split('   click -> action -> #target \n ')).toEqual(['click -> action -> #target']);
    });

    test('should return [""] for an empty or blank string', () => {
      expect(split('')).toEqual(['']);
      expect(split('   ')).toEqual(['']);
    });

    test('should not treat brackets in the middle as groups', () => {
      expect(split('click -> action -> [data-x="1"]')).toEqual(['click -> action -> [data-x="1"]']);
    });

    test('should not warn', () => {
      split('click -> action -> #target');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('multi flow (bracket groups)', () => {
    test('should split a single group', () => {
      expect(split('[click -> a -> #t]')).toEqual(['click -> a -> #t']);
    });

    test('should split several groups', () => {
      expect(split('[click -> a -> #t1][keydown -> b -> #t2][c -> #t3]')).toEqual([
        'click -> a -> #t1',
        'keydown -> b -> #t2',
        'c -> #t3',
      ]);
    });

    test('should allow whitespace and new lines between groups', () => {
      expect(split('  [click -> a -> #t1] \n\t [keydown -> b -> #t2]  ')).toEqual([
        'click -> a -> #t1',
        'keydown -> b -> #t2',
      ]);
    });

    test('should keep the inner content of a group untouched (not trimmed)', () => {
      expect(split('[ click -> a -> #t ]')).toEqual([' click -> a -> #t ']);
    });

    test('should return an empty string for an empty group', () => {
      expect(split('[]')).toEqual(['']);
      expect(split('[][click -> a -> #t]')).toEqual(['', 'click -> a -> #t']);
    });

    test('should not warn for valid input', () => {
      split('[click -> a -> #t1][keydown -> b -> #t2]');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('nested brackets (attribute selectors)', () => {
    test('should respect depth inside a group', () => {
      expect(split('[click -> a -> [data-x="1"]]')).toEqual(['click -> a -> [data-x="1"]']);
      expect(split('[click -> a -> input[type=text]][keydown -> b -> #t]')).toEqual([
        'click -> a -> input[type=text]',
        'keydown -> b -> #t',
      ]);
    });

    test('should support deeper nesting', () => {
      expect(split('[click -> a -> :not([data-x=1])]')).toEqual(['click -> a -> :not([data-x=1])']);
      expect(split('[a -> [b[c]]]')).toEqual(['a -> [b[c]]']);
    });
  });

  describe('quotes', () => {
    test('should ignore a closing bracket inside double quotes', () => {
      expect(split('[click -> a -> [data-x="]"]]')).toEqual(['click -> a -> [data-x="]"]']);
    });

    test('should ignore an opening bracket inside single quotes', () => {
      expect(split("[click -> a -> [data-x='[']]")).toEqual(["click -> a -> [data-x='[']"]);
    });

    test('should ignore the arrow-like text and brackets of both quote types together', () => {
      expect(split(`[click -> a -> [t="]"][u='[']][b -> #t]`)).toEqual([
        `click -> a -> [t="]"][u='[']`,
        'b -> #t',
      ]);
    });

    test('should honour backslash-escaped quotes inside quotes', () => {
      // source: [click -> a -> [data-x="a\"]b"]]
      expect(split('[click -> a -> [data-x="a\\"]b"]]')).toEqual(['click -> a -> [data-x="a\\"]b"]']);
      // source: [click -> a -> [data-x='a\']b']]
      expect(split("[click -> a -> [data-x='a\\']b']]")).toEqual(["click -> a -> [data-x='a\\']b']"]);
    });

    test('should treat a different quote character inside a quote as plain text', () => {
      expect(split(`[click -> a -> [data-x="it's ]"]]`)).toEqual([`click -> a -> [data-x="it's ]"]`]);
    });
  });

  describe('invalid input (returns null and warns)', () => {
    test.each([
      ['text between groups', '[a -> b] x [c -> d]', 'Unexpected "x" between flow groups'],
      ['text right after a group', '[a -> b]junk', 'Unexpected "j" between flow groups'],
      ['an extra closing bracket', '[a -> b]]', 'Unexpected "]" between flow groups'],
    ])('should reject %s', (_label, input, message) => {
      expect(split(input)).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.core.splitFlows] ${message}`);
    });

    test.each([
      ['a missing closing bracket', '[a -> b'],
      ['an unclosed nested bracket', '[a -> [b]'],
      ['an unterminated double quote', '[a -> "b]'],
      ['an unterminated single quote', "[a -> 'b]"],
      ['a quote that swallows the closing bracket', '[a -> [data-x="1]]'],
      ['a trailing backslash inside a quote', '[a -> "b\\'],
    ])('should reject %s as unbalanced', (_label, input) => {
      expect(split(input)).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AviFlow.core.splitFlows] Unbalanced brackets or quotes in multi-flow definition'
      );
    });

    test('should reject a valid first group followed by an unbalanced second group', () => {
      expect(split('[a -> b][c -> d')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
