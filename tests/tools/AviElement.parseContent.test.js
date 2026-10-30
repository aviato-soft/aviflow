import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / parseContent', () => {
  let expected;
  let testCase;
  let result;

  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  
  test('serializes a plain object to JSON text', () => {
    expect(AviElement.parseContent({ a: 1, b: 'x' })).toEqual({
      kind: 'text',
      value: '{"a":1,"b":"x"}'
    });
  });


  test('serializes nested objects and arrays (arrays have no own "html")', () => {
    expect(AviElement.parseContent({ list: [1, { n: true }] })).toEqual({
      kind: 'text',
      value: '{"list":[1,{"n":true}]}'
    });

    expect(AviElement.parseContent([1, 2, 3])).toEqual({
      kind: 'text',
      value: '[1,2,3]'
    });
  });


  test('an inherited "html" property does not make the object HTML', () => {
    const proto = { html: '<b>inherited</b>' };
    const obj = Object.create(proto);
    obj.name = 'own';

    const result = AviElement.parseContent(obj);

    expect(result.kind).toBe('text');
    expect(result.value).toBe('{"name":"own"}');
  });


  test('markup inside the data stays text (never kind "html")', () => {
    const result = AviElement.parseContent({ name: '<img src=x onerror=alert(1)>' });

    expect(result.kind).toBe('text');
    expect(result.value).toContain('<img');
  });


  // Covers the `?? ''` fallback: JSON.stringify returns undefined
  // when toJSON() returns undefined.
  test('falls back to an empty string when JSON.stringify returns undefined', () => {
    const obj = { toJSON() { return undefined; } };

    expect(JSON.stringify(obj)).toBeUndefined(); // sanity check

    expect(AviElement.parseContent(obj)).toEqual({
      kind: 'text',
      value: ''
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // Counterpart: only undefined is replaced; a valid "null" JSON is kept.
  test('keeps a non-undefined JSON result (toJSON returning null gives "null")', () => {
    const obj = { toJSON() { return null; } };

    expect(AviElement.parseContent(obj)).toEqual({
      kind: 'text',
      value: 'null'
    });
  });


  test('circular structure: warns and falls back to String(value)', () => {
    const circular = {};
    circular.self = circular;

    const result = AviElement.parseContent(circular);

    expect(result).toEqual({ kind: 'text', value: '[object Object]' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('[AviFlow.tools.element.parseContent]');
  });

  
  test('BigInt inside an object: warns and falls back to String(value)', () => {
    const result = AviElement.parseContent({ big: 10n });

    expect(result).toEqual({ kind: 'text', value: '[object Object]' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
  

  test('parse Node', () => {
    let testEl = document.createElement('div');
    expected = { kind: "node", value: testEl };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);
  });


  test('parse string html', () => {
    let testEl = '<div class="container">Test</div>';
    expected = { kind: "html", value: testEl };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = 'Test';
    expected = { kind: "html", value: testEl };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);
  });


  test('parse object', () => {
    let testEl = { test: '<div class="container">Test</div>' };
    expected = { kind: "text", value: JSON.stringify(testEl) };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: '<div class="container">Test</div>', success: false };
    expected = { kind: "html", value: testEl.html };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: false, success: false };
    expected = { kind: "html", value: String(testEl.html) };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: undefined, success: false };
    expected = { kind: "html", value: "" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: NaN, success: false };
    expected = { kind: "html", value: "null" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: null, success: false };
    expected = { kind: "html", value: "" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: [], success: false };
    expected = { kind: "html", value: "[]" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: {}, success: false };
    expected = { kind: "html", value: "{}" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: "", success: false };
    expected = { kind: "html", value: "" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: { a: 1, b: true, c: null, d: false, e: { f: undefined, g: -1, h: 0 } }, success: true };
    expected = { kind: "html", value: '{"a":1,"b":true,"c":null,"d":false,"e":{"g":-1,"h":0}}' };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: { a: 1, b: true, c: null, d: false, e: { f: undefined, g: -1, h: 0 } }, success: true };
    expected = { kind: "html", value: '{"a":1,"b":true,"c":null,"d":false,"e":{"g":-1,"h":0}}' };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: function () { return 'foo'; }, success: false };
    expected = { kind: "html", value: "" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { html: testEl.self }; //test circular object
    expected = { kind: "text", value: "" };
    result = AviElement.parseContent(testEl.self);
    expect(result).toEqual(expected);

    testEl = { html: { invalid: Symbol() }, success: false };
    expected = { kind: "html", value: "{}" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = {function () { return 'foo'; }};
    expected = { kind: "text", value: "{}" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = () => {};
    expected = { kind: "text", value: "() => {}" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = function() { return };
    expected = { kind: "text", value: "function() { return }" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

    testEl = { self: function() { return testEl.self; }};
    expected = { kind: "text", value: "{}" };
    result = AviElement.parseContent(testEl);
    expect(result).toEqual(expected);

  });


  test('returns empty string for null or invalid content', () => {
    expected = { kind: "text", value: '' };

    result = AviElement.parseContent();
    expect(result).toEqual(expected);

    testCase = null;
    result = AviElement.parseContent(testCase);
    expect(result).toEqual(expected);

    testCase = undefined;
    result = AviElement.parseContent(testCase);
    expect(result).toEqual(expected);

  });



});