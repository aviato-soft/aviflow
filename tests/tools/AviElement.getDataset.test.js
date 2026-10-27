import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / getDataset', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns empty object when element or element.dataset is missing or invalid', () => {
    expect(AviElement.getDataset(null)).toEqual({});
    expect(AviElement.getDataset(undefined)).toEqual({});
    expect(AviElement.getDataset({})).toEqual({});
  });


  test('returns dataset of a standalone element without data-parent', () => {
    const element = document.createElement('div');
    element.dataset.role = 'admin';
    element.dataset.id = '123';

    expect(AviElement.getDataset(element)).toEqual({
      role: 'admin',
      id: '123'
    });
  });


  test('merges dataset with parent dataset and overwrites matching keys', () => {
    document.body.innerHTML = `
            <div id="parent" data-theme="dark" data-role="guest" data-category="general"></div>
            <button id="child" data-parent="#parent" data-role="admin"></button>
        `;

    const child = document.getElementById('child');

    expect(AviElement.getDataset(child)).toEqual({
      parent: '#parent',
      theme: 'dark',
      category: 'general',
      role: 'admin' // child value overwrites parent value
    });
  });


  test('returns element dataset as-is if dataset.parent target does not exist', () => {
    const element = document.createElement('div');
    element.dataset.parent = '#non-existent';
    element.dataset.id = '999';

    expect(AviElement.getDataset(element)).toEqual({
      parent: '#non-existent',
      id: '999'
    });
  });

  test('handles multi-level recursive parent inheritance', () => {
    document.body.innerHTML = `
            <div id="grandparent" data-a="1" data-b="1"></div>
            <div id="parent" data-parent="#grandparent" data-b="2" data-c="2"></div>
            <div id="child" data-parent="#parent" data-c="3" data-d="3"></div>
        `;

    const child = document.getElementById('child');

    expect(AviElement.getDataset(child)).toEqual({
      parent: '#parent',
      a: '1',
      b: '2',
      c: '3',
      d: '3'
    });
  });


  test('data-param attributes', () => {
    document.body.innerHTML = `
      <div id="main" data-param-attr="1" data-param-attr-subAttr="2"></div>
    `;
    const element = document.getElementById('main');
    expect(AviElement.getDataset(element)).toEqual({
      'paramAttr': '1',
      'paramAttrSubattr': '2',
    });
  });


  test('check for circular dependencies', () => {
    document.body.innerHTML = `
      <div id="container-1" data-parent="#container-2" data-test="1">1</div>
      <div id="container-2" data-parent="#container-1" data-test="2">2</div>
    `;
    const element = document.getElementById('container-1');
    expect(AviElement.getDataset(element)).toEqual({
      'parent': '#container-2',
      'test': '1'
    });
  });


  test('check for invalid parent', () => {
    document.body.innerHTML = `<div id="container" data-parent="[]">x</div>`;
    const element = document.getElementById('container');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    const parentSelector = "[]";
    
    expect(AviElement.getDataset(element)).toEqual({
      'parent': parentSelector
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.tools.element.getDataset] Invalid parent selector`, parentSelector, expect.any(Error));
  })

});