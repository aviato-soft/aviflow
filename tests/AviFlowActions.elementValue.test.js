import { expect, jest, test } from '@jest/globals';

/**
 * @jest-environment jsdom
 */
import { AviFlowActions } from '../src/AviFlowActions.js';

const { elementValue } = AviFlowActions;

// jsdom does not implement `innerText`, so tests that need it define it explicitly.
const withInnerText = (el, text) => {
  Object.defineProperty(el, 'innerText', { value: text, configurable: true });
  return el;
};

const make = (html) => {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
};

describe('AviFlowActions.elementValue', () => {
  describe('no element', () => {
    test.each([null, undefined, false, 0, ''])('returns null for %p', (value) => {
      expect(elementValue(value)).toBeNull();
    });
  });

  describe('checkbox', () => {
    test('returns true when checked', () => {
      expect(elementValue(make('<input type="checkbox" checked>'))).toBe(true);
    });

    test('returns false when not checked', () => {
      expect(elementValue(make('<input type="checkbox">'))).toBe(false);
    });

    test('ignores the checkbox value attribute', () => {
      expect(elementValue(make('<input type="checkbox" value="yes" checked>'))).toBe(true);
      expect(elementValue(make('<input type="checkbox" value="yes">'))).toBe(false);
    });

    test('reflects the live state', () => {
      const el = make('<input type="checkbox">');
      expect(elementValue(el)).toBe(false);
      el.checked = true;
      expect(elementValue(el)).toBe(true);
    });
  });

  describe('elements with a string value', () => {
    test('text input', () => {
      expect(elementValue(make('<input type="text" value="hello">'))).toBe('hello');
    });

    test('empty input returns an empty string, not null', () => {
      expect(elementValue(make('<input type="text">'))).toBe('');
    });

    test('input without type attribute', () => {
      expect(elementValue(make('<input value="abc">'))).toBe('abc');
    });

    test('reflects the live value', () => {
      const el = make('<input type="text" value="a">');
      el.value = 'b';
      expect(elementValue(el)).toBe('b');
    });

    test('number input returns its value as a string', () => {
      expect(elementValue(make('<input type="number" value="42">'))).toBe('42');
    });

    test('radio input returns its value, not its checked state', () => {
      expect(elementValue(make('<input type="radio" value="r1" checked>'))).toBe('r1');
      expect(elementValue(make('<input type="radio" value="r1">'))).toBe('r1');
    });

    test('hidden input', () => {
      expect(elementValue(make('<input type="hidden" value="secret">'))).toBe('secret');
    });

    test('textarea', () => {
      const el = make('<textarea>some text</textarea>');
      expect(elementValue(el)).toBe('some text');
    });

    test('select returns the selected option value', () => {
      const el = make('<select><option value="a">A</option><option value="b" selected>B</option></select>');
      expect(elementValue(el)).toBe('b');
    });

    test('button returns its value attribute', () => {
      expect(elementValue(make('<button value="go">Go</button>'))).toBe('go');
    });

    test('value wins over innerText', () => {
      const el = withInnerText(make('<button value="v">Label</button>'), 'Label');
      expect(elementValue(el)).toBe('v');
    });
  });

  describe('innerText fallback', () => {
    test('div', () => {
      expect(elementValue(withInnerText(make('<div>Hello world</div>'), 'Hello world'))).toBe('Hello world');
    });

    test('span', () => {
      expect(elementValue(withInnerText(make('<span>x</span>'), 'x'))).toBe('x');
    });

    test('empty innerText returns an empty string, not null', () => {
      expect(elementValue(withInnerText(make('<div></div>'), ''))).toBe('');
    });

    test('li (numeric value property) falls back to innerText', () => {
      const el = withInnerText(make('<ul><li>Item</li></ul>').firstElementChild, 'Item');
      expect(typeof el.value).toBe('number');
      expect(elementValue(el)).toBe('Item');
    });

    test('reads innerText at call time', () => {
      const el = make('<p>one</p>');
      let text = 'one';
      Object.defineProperty(el, 'innerText', { get: () => text, configurable: true });
      expect(elementValue(el)).toBe('one');
      text = 'two';
      expect(elementValue(el)).toBe('two');
    });
  });

  describe('nothing readable', () => {
    test('element without value or innerText returns null', () => {
      // jsdom has no innerText, matching elements (e.g. SVG) that do not expose it
      expect(elementValue(make('<div>text</div>'))).toBeNull();
    });

    test('plain object without value or innerText returns null', () => {
      expect(elementValue({ tagName: 'X' })).toBeNull();
    });

    test('non-string innerText returns null', () => {
      expect(elementValue({ tagName: 'X', innerText: 5 })).toBeNull();
    });
  });

  describe('signature', () => {
    test('extra arguments are ignored', () => {
      const el = make('<input value="x">');
      expect(elementValue(el, new Event('input'), '#target', {})).toBe('x');
    });

    test('is synchronous (does not return a Promise)', () => {
      expect(elementValue(make('<input value="x">'))).not.toBeInstanceOf(Promise);
    });

    test('does not modify the element', () => {
      const el = make('<input type="checkbox" checked>');
      const before = el.outerHTML;
      elementValue(el);
      expect(el.outerHTML).toBe(before);
      expect(el.checked).toBe(true);
    });
  });
});
