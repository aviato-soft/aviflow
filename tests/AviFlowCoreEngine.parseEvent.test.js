import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / parseEvent', () => {
  const flowCoreEngine = AviFlowCoreEngine;
  let result;
  let testString;
  let warnSpy;

  const KNOWN = '(known: prevent, stop, passive, window)';

  /** A parsed event with the defaults, overridden by `overrides`. */
  const eventOf = (overrides) => ({
    event: 'click',
    prevent: false,
    stop: false,
    onWindow: false,
    passive: false,
    ...overrides,
  });

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('should return the result of: click.prevent.stop', () => {
    testString = 'click.prevent.stop';
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: true, stop: true, onWindow: false, passive: false });
  });

  test('should return the result of: ..', () => {
    testString = '..';
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: false, stop: false, onWindow: false, passive: false });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseEvent] Unknown modifier "" in ".." (known: prevent, stop, passive, window)');

  });

  test('should return the result of: ""', () => {
    testString = "";
    result = flowCoreEngine.parseEvent(testString);
    expect(result).toStrictEqual({ event: 'click', prevent: false, stop: false, onWindow: false, passive: false });
  });

  // ---------------------------------------------------------------------------
  // event name
  // ---------------------------------------------------------------------------
  describe('event name', () => {
    test.each(['click', 'keyup', 'mouseover', 'DOMContentLoaded', 'my-event', 'htmx:afterSwap'])(
      'should keep "%s" as is, without warning',
      (name) => {
        expect(flowCoreEngine.parseEvent(name)).toStrictEqual(eventOf({ event: name }));
        expect(warnSpy).not.toHaveBeenCalled();
      }
    );

    test('should not change the case of the event name', () => {
      expect(flowCoreEngine.parseEvent('Click').event).toBe('Click');
      expect(flowCoreEngine.parseEvent('KeyUp.prevent').event).toBe('KeyUp');
    });

    test('should return the defaults when the event is undefined (missing argument)', () => {
      const expected = { event: 'click', prevent: false, stop: false, passive: false, onWindow: false };

      expect(flowCoreEngine.parseEvent()).toStrictEqual(expected);
      expect(flowCoreEngine.parseEvent(undefined)).toStrictEqual(expected);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should default to "click" for an empty or blank name', () => {
      expect(flowCoreEngine.parseEvent('')).toStrictEqual(eventOf());
      expect(flowCoreEngine.parseEvent('   ')).toStrictEqual(eventOf());
      expect(flowCoreEngine.parseEvent(' \t\n ')).toStrictEqual(eventOf());
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should default to "click" when only modifiers are given (".modifier")', () => {
      expect(flowCoreEngine.parseEvent('.prevent')).toStrictEqual(eventOf({ prevent: true }));
      expect(flowCoreEngine.parseEvent('.stop.passive')).toStrictEqual(eventOf({ stop: true, passive: true }));
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should trim spaces around the name and the modifiers', () => {
      expect(flowCoreEngine.parseEvent('  keyup  .  prevent \t. stop ')).toStrictEqual(
        eventOf({ event: 'keyup', prevent: true, stop: true })
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should treat a modifier word used as the event name as a plain event name', () => {
      expect(flowCoreEngine.parseEvent('window')).toStrictEqual(eventOf({ event: 'window' }));
      expect(flowCoreEngine.parseEvent('prevent.prevent')).toStrictEqual(
        eventOf({ event: 'prevent', prevent: true })
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should split an event name that contains a dot (documented limitation)', () => {
      // "app.ready" is read as event "app" + modifier "ready"
      expect(flowCoreEngine.parseEvent('app.ready')).toStrictEqual(eventOf({ event: 'app' }));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.core.parseEvent] Unknown modifier "ready" in "app.ready" ${KNOWN}`);
    });
  });

  // ---------------------------------------------------------------------------
  // known modifiers
  // ---------------------------------------------------------------------------
  describe('known modifiers', () => {
    test.each([
      ['prevent', { prevent: true }],
      ['stop', { stop: true }],
      ['passive', { passive: true }],
      ['window', { onWindow: true }],
    ])('should set only the flag of ".%s"', (modifier, flags) => {
      expect(flowCoreEngine.parseEvent(`keyup.${modifier}`)).toStrictEqual(eventOf({ event: 'keyup', ...flags }));
      expect(warnSpy).not.toHaveBeenCalled();
    });

    // every combination of the 4 modifiers (16 subsets), in declaration order
    const MODS = ['prevent', 'stop', 'passive', 'window'];
    const FLAG = { prevent: 'prevent', stop: 'stop', passive: 'passive', window: 'onWindow' };
    const subsets = MODS.reduce((acc, m) => acc.concat(acc.map((s) => [...s, m])), [[]]);
    const flagsOf = (subset) => Object.fromEntries(subset.map((m) => [FLAG[m], true]));

    test.each(subsets.map((s) => [s.join('.') || '(no modifier)', s]))(
      'should handle the combination: %s',
      (_label, subset) => {
        const str = ['scroll', ...subset].join('.');

        expect(flowCoreEngine.parseEvent(str)).toStrictEqual(eventOf({ event: 'scroll', ...flagsOf(subset) }));
        expect(warnSpy).not.toHaveBeenCalled();
      }
    );

    test('should not depend on the order of the modifiers', () => {
      const forward = flowCoreEngine.parseEvent('click.prevent.stop.passive.window');
      const backward = flowCoreEngine.parseEvent('click.window.passive.stop.prevent');

      expect(forward).toStrictEqual(eventOf({ prevent: true, stop: true, passive: true, onWindow: true }));
      expect(backward).toStrictEqual(forward);
    });

    test('should treat a repeated modifier like a single one', () => {
      expect(flowCoreEngine.parseEvent('click.stop.stop.stop')).toStrictEqual(eventOf({ stop: true }));
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // unknown modifiers
  // ---------------------------------------------------------------------------
  describe('unknown modifiers', () => {
    test('should warn with the modifier and the original string, and ignore the modifier', () => {
      expect(flowCoreEngine.parseEvent('click.foo')).toStrictEqual(eventOf());
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.core.parseEvent] Unknown modifier "foo" in "click.foo" ${KNOWN}`);
    });

    test('should show the original (untrimmed) string in the warning', () => {
      flowCoreEngine.parseEvent(' click . foo ');
      expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.core.parseEvent] Unknown modifier "foo" in " click . foo " ${KNOWN}`);
    });

    test('should warn once per unknown modifier, in order, and keep the known ones', () => {
      result = flowCoreEngine.parseEvent('click.foo.prevent.bar.window');

      expect(result).toStrictEqual(eventOf({ prevent: true, onWindow: true }));
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('Unknown modifier "foo"'));
      expect(warnSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('Unknown modifier "bar"'));
    });

    test('should warn only once for a repeated unknown modifier', () => {
      flowCoreEngine.parseEvent('click.foo.foo.foo');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    test('should be case sensitive: ".Prevent" is unknown', () => {
      expect(flowCoreEngine.parseEvent('click.Prevent')).toStrictEqual(eventOf());
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown modifier "Prevent"'));
    });

    test('should warn about an empty modifier from a trailing dot', () => {
      expect(flowCoreEngine.parseEvent('click.')).toStrictEqual(eventOf());
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.core.parseEvent] Unknown modifier "" in "click." ${KNOWN}`);
    });

    test('should warn once for empty modifiers from consecutive dots and keep the known ones', () => {
      expect(flowCoreEngine.parseEvent('click..prevent...stop')).toStrictEqual(
        eventOf({ prevent: true, stop: true })
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown modifier ""'));
    });

    test('should treat a blank modifier (spaces between dots) as an empty modifier', () => {
      expect(flowCoreEngine.parseEvent('click. .prevent')).toStrictEqual(eventOf({ prevent: true }));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown modifier ""'));
    });
  });

  // ---------------------------------------------------------------------------
  // result shape
  // ---------------------------------------------------------------------------
  describe('result shape', () => {
    test('should return exactly the five documented keys with strict booleans', () => {
      result = flowCoreEngine.parseEvent('click.prevent');

      expect(Object.keys(result).sort()).toEqual(['event', 'onWindow', 'passive', 'prevent', 'stop']);
      expect(typeof result.event).toBe('string');
      for (const flag of ['prevent', 'stop', 'passive', 'onWindow']) {
        expect(typeof result[flag]).toBe('boolean');
      }
    });

    test('should return a new, unfrozen object on every call', () => {
      const a = flowCoreEngine.parseEvent('click.stop');
      const b = flowCoreEngine.parseEvent('click.stop');

      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(Object.isFrozen(a)).toBe(false);
    });
  });

});
