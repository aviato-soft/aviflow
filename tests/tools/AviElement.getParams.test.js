import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / getParams', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns empty object when element or attributes are missing', () => {
    expect(AviElement.getParams(null)).toEqual({});
    expect(AviElement.getParams(undefined)).toEqual({});
    expect(AviElement.getParams({})).toEqual({});
  });
  

  test('parses data-param attributes maintaining exact key casing', () => {
    const div = document.createElement('div');
    div.setAttribute('data-param-attr', '1');
    div.setAttribute('data-param-attr-fix', '2');
    div.setAttribute('data-param-testAttr-new', '3');
    div.setAttribute('data-param-Test-attr-New', '4');
    div.setAttribute('data-other-attr', 'ignored');

    expect(AviElement.getParams(div)).toEqual({
      'attr': '1',
      'attr-fix': '2',
      'testattr-new': '3',
      'test-attr-new': '4'
    });
  });

  test('inherits param attributes from parent and overwrites matching keys', () => {
    document.body.innerHTML = `
            <div id="parent" data-param-theme="dark" data-param-role="guest" data-param-attr-fix="10"></div>
            <button id="child" data-parent="#parent" data-param-role="admin" data-param-attr-fix="20"></button>
        `;

    const child = document.getElementById('child');

    expect(AviElement.getParams(child)).toEqual({
      'theme': 'dark',
      'role': 'admin',
      'attr-fix': '20'
    });
  });


  test('invalid parent selector nothing to inherits', () => {
    document.body.innerHTML = `
            <div id="parent" data-param-theme="dark" data-param-role="guest" data-param-attr-fix="10"></div>
            <button id="child" data-parent="#aviato" data-param-role="admin" data-param-attr-fix="20"></button>
        `;

    const child = document.getElementById('child');

    expect(AviElement.getParams(child)).toEqual({
      'attr-fix': '20',
      'role': 'admin'
    });
  });

  test('allows custom prefix overrides', () => {
    const div = document.createElement('div');
    div.setAttribute('data-config-api-url', 'https://api.com');
    div.setAttribute('data-config-Timeout-Ms', '5000');

    expect(AviElement.getParams(div, 'config')).toEqual({
      'api-url': 'https://api.com',
      'timeout-ms': '5000'
    });
  });


  test('creare a complex situation with a parent form and parent of the parent having dataset', () => {
    document.body.innerHTML = `
      <div id="container" 
      data-param-test-1="container-1"
      data-param-test-2="container-2"
      data-param-test-3="container-3">
        <form method="get" url="/api" 
          data-param-test-1="form-1" 
          data-param-test-2="form-2"
          data-parent="#container">
          
          <input type="text" name="test-1" value="input-1">
          <select name="test-2"><option selected value="select-2">2</option></select>
          <input type="hidden" name="test-3" value="hidden-3">
          <input type="checkbox" name="test-4" value="check-4" checked>
          <button name="button-test" id="button"
            data-flow="action -> #output" 
            data-parent="form" 
            data-param-test-1="button-1"
            value="button">Click me!</button>
        </form>
      </div>
      <div id="#output"></div>
    `;
    const button = document.getElementById('button');
/* priorities           #1  #2  #3 #4
1. trigger.dataset       V   -   -  -
2. form.dataset          x   V   -  -
3. container.dataset     x   x   V  -
4. form.element          x   x   x  V
*/
    expect(AviElement.getParams(button)).toEqual({
      "test-1": "button-1",
      "test-2": "form-2",
      "test-3": "container-3",
      "test-4": "check-4",
    });


// form = false
    expect(AviElement.getParams(button, 'param', {form: false})).toEqual({
      "test-1": "button-1",
      "test-2": "form-2",
      "test-3": "container-3"
    });

// parent = false
    expect(AviElement.getParams(button, 'param', {parent: false})).toEqual({
      "test-1": "button-1"
    });
  })


  test('check for empty or different prefix', () => {
    document.body.innerHTML = `<div id="container" 
      data-test="1" 
      data--test="2" 
      data-PARAM-TEST="3"
    >x</div>`;
    const element = document.getElementById('container');
    expect(AviElement.getParams(element, '')).toEqual({
      "test": "1",
      "-test": "2",
      "param-test": "3"
    });
    
    expect(AviElement.getParams(element, '-')).toEqual({
      'test': "2"
    });
    
    expect(AviElement.getParams(element)).toEqual({
      'test': "3"
    });

    expect(AviElement.getParams(element, false)).toEqual({});

    expect(AviElement.getParams(element, null)).toEqual({
      "-test": "2",
      "param-test": "3",
      "test": "1"
    });
  });


  test('check for circular dependencies', () => {
    document.body.innerHTML = `
      <div id="container-1" data-parent="#container-2" data-param-test="1">1</div>
      <div id="container-2" data-parent="#container-1" data-param-test="2">2</div>
    `;
    const element = document.getElementById('container-1');
    expect(AviElement.getParams(element)).toEqual({
      'test': "1"
    });
  });


  test('check for invalid parent', () => {
    document.body.innerHTML = `<div id="container" data-parent="[]">x</div>`;
    const element = document.getElementById('container');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    
    expect(AviElement.getParams(element)).toEqual({});
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(`[AviFlow.tools.element.getParams] Invalid parent selector`, '[]', expect.any(Error));
  })
});