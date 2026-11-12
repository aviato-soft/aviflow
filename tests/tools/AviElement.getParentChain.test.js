import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement.getParentChain', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('returns [] for null, undefined and non-elements', () => {
    expect(AviElement.getParentChain(null)).toEqual([]);
    expect(AviElement.getParentChain(undefined)).toEqual([]);
    expect(AviElement.getParentChain({})).toEqual([]);
  });

  test('returns [element] when there is no data-parent', () => {
    document.body.innerHTML = '<form><select id="s"></select></form>';
    const select = document.getElementById('s');

    expect(AviElement.getParentChain(select)).toEqual([select]);
  });

  test('resolves data-parent to the closest ancestor, root first', () => {
    document.body.innerHTML = '<form id="f"><p><select id="s" data-parent="form"></select></p></form>';
    const form = document.getElementById('f');
    const select = document.getElementById('s');

    expect(AviElement.getParentChain(select)).toEqual([form, select]);
  });

  test('picks the nearest matching ancestor', () => {
    document.body.innerHTML = `
      <div class="box" id="outer">
        <div class="box" id="inner"><button id="b" data-parent=".box"></button></div>
      </div>`;
    const inner = document.getElementById('inner');
    const button = document.getElementById('b');

    expect(AviElement.getParentChain(button)).toEqual([inner, button]);
  });

  test('falls back to document.querySelector when the parent is not an ancestor', () => {
    document.body.innerHTML = '<form id="f"></form><button id="b" data-parent="#f"></button>';
    const form = document.getElementById('f');
    const button = document.getElementById('b');

    expect(AviElement.getParentChain(button)).toEqual([form, button]);
  });

  test('follows a multi-level chain, root ancestor first', () => {
    document.body.innerHTML = `
      <section id="root">
        <div id="mid" data-parent="#root">
          <button id="b" data-parent="#mid"></button>
        </div>
      </section>`;
    const root = document.getElementById('root');
    const mid = document.getElementById('mid');
    const button = document.getElementById('b');

    expect(AviElement.getParentChain(button)).toEqual([root, mid, button]);
  });

  test('stops on cycles instead of looping forever', () => {
    document.body.innerHTML = '<div id="a" data-parent="#b"></div><div id="b" data-parent="#a"></div>';
    const a = document.getElementById('a');
    const b = document.getElementById('b');

    expect(AviElement.getParentChain(a)).toEqual([b, a]);
  });

  test('stops when the parent selector matches nothing', () => {
    document.body.innerHTML = '<button id="b" data-parent="#missing"></button>';
    const button = document.getElementById('b');

    expect(AviElement.getParentChain(button)).toEqual([button]);
  });

  test('warns and returns the partial chain on an invalid selector', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<button id="b" data-parent="[["></button>';
    const button = document.getElementById('b');

    expect(AviElement.getParentChain(button)).toEqual([button]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
