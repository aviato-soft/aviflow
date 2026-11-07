import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / splitArrows', () => {
  const split = (s) => AviFlowCoreEngine.splitArrows(s);
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    // splitArrows is a pure helper: it must never log
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  describe('basic splitting', () => {
    test('should split three parts', () => {
      expect(split('click -> action -> #target')).toEqual(['click', 'action', '#target']);
    });

    test('should split two parts', () => {
      expect(split('action -> #target')).toEqual(['action', '#target']);
    });

    test('should return a single part when there is no arrow', () => {
      expect(split('action')).toEqual(['action']);
    });

    test('should return [""] for an empty or blank string', () => {
      expect(split('')).toEqual(['']);
      expect(split('   ')).toEqual(['']);
    });

    test('should trim every part', () => {
      expect(split('  click  ->   action\t->  #target \n')).toEqual(['click', 'action', '#target']);
    });

    test('should split arrows written without spaces', () => {
      expect(split('click->action->#target')).toEqual(['click', 'action', '#target']);
    });

    test('should keep the "-|" terminator inside the last part', () => {
      expect(split('click -> action -|')).toEqual(['click', 'action -|']);
    });

    test('should return plain strings in a new array each call', () => {
      const a = split('a -> b');
      const b = split('a -> b');
      expect(a).not.toBe(b);
      expect(a.every((p) => typeof p === 'string')).toBe(true);
    });
  });

  describe('what is (not) an arrow', () => {
    test('should not split on a lone "-" or ">"', () => {
      expect(split('a-b > c')).toEqual(['a-b > c']);
      expect(split('a - > b')).toEqual(['a - > b']);
      expect(split('a > b')).toEqual(['a > b']);
    });

    test('should split on the "->" of "-->" and keep the extra "-" with the left part', () => {
      expect(split('a-->b')).toEqual(['a-', 'b']);
    });

    test('should produce empty parts for consecutive, leading and trailing arrows', () => {
      expect(split('a->->b')).toEqual(['a', '', 'b']);
      expect(split('-> a')).toEqual(['', 'a']);
      expect(split('a ->')).toEqual(['a', '']);
      expect(split('->')).toEqual(['', '']);
    });

    test('should treat a backslash outside quotes as a normal character', () => {
      expect(split('a\\->b')).toEqual(['a\\', 'b']);
    });
  });

  describe('square brackets', () => {
    test('should ignore arrows inside brackets', () => {
      expect(split('click -> a -> [data-x=a->b]')).toEqual(['click', 'a', '[data-x=a->b]']);
    });

    test('should ignore arrows inside nested brackets', () => {
      expect(split('a -> [b[c->d]->e] -> f')).toEqual(['a', '[b[c->d]->e]', 'f']);
      expect(split('a -> :not([x->y]) -> b')).toEqual(['a', ':not([x->y])', 'b']);
    });

    test('should split right after a closing bracket', () => {
      expect(split('[a]->b')).toEqual(['[a]', 'b']);
    });

    test('should not let a stray "]" push the depth below zero', () => {
      expect(split('a] -> b')).toEqual(['a]', 'b']);
      expect(split('a] -> [x->y] -> c')).toEqual(['a]', '[x->y]', 'c']);
    });

    test('should stop splitting after an unclosed "["', () => {
      expect(split('a -> [b -> c')).toEqual(['a', '[b -> c']);
    });
  });

  describe('quotes', () => {
    test('should ignore arrows inside double quotes', () => {
      expect(split('a -> "x->y" -> b')).toEqual(['a', '"x->y"', 'b']);
    });

    test('should ignore arrows inside single quotes', () => {
      expect(split("a -> 'x->y' -> b")).toEqual(['a', "'x->y'", 'b']);
    });

    test('should ignore arrows inside a quoted attribute value in a selector', () => {
      expect(split('click -> a -> [data-x="a->b"]')).toEqual(['click', 'a', '[data-x="a->b"]']);
    });

    test('should treat the other quote character as plain text inside a quote', () => {
      expect(split(`a -> "it's -> ok" -> b`)).toEqual(['a', `"it's -> ok"`, 'b']);
      expect(split(`a -> 'say "x -> y"' -> b`)).toEqual(['a', `'say "x -> y"'`, 'b']);
    });

    test('should honour backslash-escaped quotes', () => {
      // source: a -> "x\"->y" -> b
      expect(split('a -> "x\\"->y" -> b')).toEqual(['a', '"x\\"->y"', 'b']);
      // source: a -> 'x\'->y' -> b
      expect(split("a -> 'x\\'->y' -> b")).toEqual(['a', "'x\\'->y'", 'b']);
    });

    test('should honour an escaped backslash followed by a closing quote', () => {
      // source: a -> "x\\" -> b   (the escaped backslash does not escape the closing quote)
      expect(split('a -> "x\\\\" -> b')).toEqual(['a', '"x\\\\"', 'b']);
    });

    test('should not count brackets inside quotes', () => {
      expect(split('a -> "[" -> b')).toEqual(['a', '"["', 'b']);
      expect(split('a -> [x="]" -> y]')).toEqual(['a', '[x="]" -> y]']);
    });

    test('should resume splitting after a quote is closed', () => {
      expect(split('"a->b" -> c')).toEqual(['"a->b"', 'c']);
    });

    test('should stop splitting after an unterminated quote', () => {
      expect(split('a -> "b -> c')).toEqual(['a', '"b -> c']);
      expect(split("a -> 'b -> c")).toEqual(['a', "'b -> c"]);
    });

    test('should handle a trailing backslash inside a quote', () => {
      expect(split('a -> "b\\')).toEqual(['a', '"b\\']);
    });
  });
});
