import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / parseSingleFlow', () => {
  const parse = (s) => AviFlowCoreEngine.parseSingleFlow(s);
  let warnSpy;

  /** A parsed flow with the defaults, overridden by `overrides`. */
  const flowOf = (overrides) => ({
    event: 'click',
    action: 'action',
    target: null,
    prevent: false,
    stop: false,
    passive: false,
    onWindow: false,
    ...overrides,
  });

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // invalid input
  // ---------------------------------------------------------------------------
  describe('missing or non-string input', () => {
    test.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
      ['a number', 123],
      ['an object', {}],
      ['an array', ['click -> action -> #target']],
      ['false', false],
    ])('should return null without warning for %s', (_label, input) => {
      expect(parse(input)).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should return null with a "Missing action" warning for a blank string', () => {
      expect(parse('   ')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseSingleFlow] Missing "action"');
    });
  });

  // ---------------------------------------------------------------------------
  // with target
  // ---------------------------------------------------------------------------
  describe('flows with a target', () => {
    test('should parse event -> action -> target', () => {
      expect(parse('keyup -> formatText -> #output')).toStrictEqual(
        flowOf({ event: 'keyup', action: 'formatText', target: '#output' })
      );
    });

    test('should parse action -> target and default the event to "click"', () => {
      expect(parse('getTime -> #timer')).toStrictEqual(
        flowOf({ event: 'click', action: 'getTime', target: '#timer' })
      );
    });

    test('should parse a lone action: event "click" and target null, without warning', () => {
      expect(parse('logAnalytics')).toStrictEqual(flowOf({ action: 'logAnalytics', target: null }));
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should trim the whole string and every part', () => {
      expect(parse('  submit \t->  submitForm  -> \n .result-box  ')).toStrictEqual(
        flowOf({ event: 'submit', action: 'submitForm', target: '.result-box' })
      );
    });

    test('should accept arrows without spaces', () => {
      expect(parse('keyup->formatText->#output')).toStrictEqual(
        flowOf({ event: 'keyup', action: 'formatText', target: '#output' })
      );
    });

    test('should keep arrows inside a selector (brackets and quotes) in the target', () => {
      expect(parse('click -> act -> [data-x="a->b"]')).toStrictEqual(
        flowOf({ action: 'act', target: '[data-x="a->b"]' })
      );
    });

    test('should keep a complex selector as the target', () => {
      expect(parse('click -> act -> ul.list > li:first-child, #other')).toStrictEqual(
        flowOf({ action: 'act', target: 'ul.list > li:first-child, #other' })
      );
    });

    test('should return a new, unfrozen object on every call (no caching here)', () => {
      const a = parse('click -> act -> #t');
      const b = parse('click -> act -> #t');

      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(Object.isFrozen(a)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // without target ("-|")
  // ---------------------------------------------------------------------------
  describe('flows without a target ("-|")', () => {
    test('should parse event -> action -|', () => {
      expect(parse('keyup -> formatText -|')).toStrictEqual(
        flowOf({ event: 'keyup', action: 'formatText', target: null })
      );
    });

    test('should parse action -| and default the event to "click"', () => {
      expect(parse('formatText -|')).toStrictEqual(flowOf({ action: 'formatText', target: null }));
    });

    test('should accept "-|" without spaces and with trailing whitespace', () => {
      expect(parse('keyup->formatText-|')).toStrictEqual(flowOf({ event: 'keyup', action: 'formatText' }));
      expect(parse('formatText-|  \n')).toStrictEqual(flowOf({ action: 'formatText' }));
    });

    test('should default the event when it is left empty before the action', () => {
      expect(parse(' -> formatText -|')).toStrictEqual(flowOf({ action: 'formatText' }));
    });

    test('should apply event modifiers', () => {
      expect(parse('submit.prevent -> save -|')).toStrictEqual(
        flowOf({ event: 'submit', action: 'save', prevent: true })
      );
    });

    test('should warn and return null when there are more than 2 parts before "-|"', () => {
      expect(parse('click -> keyup -> formatText -|')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AviFlow.core.parseSingleFlow] Too many parts before "-|" (max: event -> action -|)'
      );
    });

    test('should warn "Missing action" for "-|" alone or an empty action', () => {
      expect(parse('-|')).toBeNull();
      expect(parse('click -> -|')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseSingleFlow] Missing "action"');
    });
  });

  // ---------------------------------------------------------------------------
  // warnings
  // ---------------------------------------------------------------------------
  describe('invalid flows (return null and warn)', () => {
    test('should warn when there are more than 3 parts', () => {
      expect(parse('click -> keyup -> formatText -> another')).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AviFlow.core.parseSingleFlow] Too many "->" parts (max: event -> action -> target)'
      );
    });

    test.each([
      ['3 parts with an empty action', 'keyup -> -> #target'],
      ['2 parts with an empty action', ' -> #target'],
      ['a lone arrow', '->'],
    ])('should warn "Missing action" for %s', (_label, input) => {
      expect(parse(input)).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.parseSingleFlow] Missing "action"');
    });

    test.each([
      ['3 parts', 'keyup -> action -> '],
      ['2 parts', 'action -> '],
      ['2 parts without spaces', 'action->'],
    ])('should warn about an empty target for %s', (_label, input) => {
      expect(parse(input)).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AviFlow.core.parseSingleFlow] Empty target: end the flow with "-|" when there is no target'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // event part & modifiers (parseEvent)
  // ---------------------------------------------------------------------------
  describe('event modifiers', () => {
    test('should read every known modifier', () => {
      expect(parse('click.prevent.stop.passive.window -> act -> #t')).toStrictEqual(
        flowOf({ action: 'act', target: '#t', prevent: true, stop: true, passive: true, onWindow: true })
      );
    });

    test.each([
      ['prevent', { prevent: true }],
      ['stop', { stop: true }],
      ['passive', { passive: true }],
      ['window', { onWindow: true }],
    ])('should set only "%s" for a single modifier', (modifier, expected) => {
      expect(parse(`keyup.${modifier} -> act -> #t`)).toStrictEqual(
        flowOf({ event: 'keyup', action: 'act', target: '#t', ...expected })
      );
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test('should trim spaces around the event name and modifiers', () => {
      expect(parse('click . prevent . stop -> act -> #t')).toStrictEqual(
        flowOf({ action: 'act', target: '#t', prevent: true, stop: true })
      );
    });

    test('should treat a repeated modifier like a single one', () => {
      expect(parse('click.stop.stop -> act -> #t')).toStrictEqual(
        flowOf({ action: 'act', target: '#t', stop: true })
      );
    });

    test('should read a leading ".modifier" as "click.modifier"', () => {
      expect(parse('.prevent -> act -> #t')).toStrictEqual(
        flowOf({ action: 'act', target: '#t', prevent: true })
      );
      expect(parse('.window.passive -> act -|')).toStrictEqual(
        flowOf({ action: 'act', passive: true, onWindow: true })
      );
    });

    test('should warn about an unknown modifier but still return the flow', () => {
      expect(parse('click.foo -> act -> #t')).toStrictEqual(flowOf({ action: 'act', target: '#t' }));
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        '[AviFlow.core.parseEvent] Unknown modifier "foo" in "click.foo" (known: prevent, stop, passive, window)'
      );
    });

    test('should warn once per unknown modifier and keep the known ones', () => {
      expect(parse('click.foo.prevent.bar -> act -> #t')).toStrictEqual(
        flowOf({ action: 'act', target: '#t', prevent: true })
      );
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown modifier "foo"'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown modifier "bar"'));
    });

    test('should not warn when all modifiers are known', () => {
      parse('click.prevent.stop -> act -> #t');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
