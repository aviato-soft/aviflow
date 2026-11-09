import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / setContent', () => {
  let div;
  let span;
  let result;
  let target;
  let warnSpy;

  afterEach(() => {
    warnSpy.mockRestore();
  });

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<main><section id="target"></section></main>';
    target = document.getElementById('target');
    div = document.createElement('div');
    span = document.createElement('span');

  });


  test('Invalid element', () => {
    result = AviElement.setContent();
    expect(result).toBeNull();
  });


  test('Content node', () => {
    result = AviElement.setContent(target, div);
    expect(document.body.innerHTML).toBe('<main><section id="target"><div></div></section></main>');
    result = AviElement.setContent(target, span);
    expect(document.body.innerHTML).toBe('<main><section id="target"><span></span></section></main>');
    expect(result).toBe(target);
    
  });

  test('Content string (html, text ... )', () => {
    //empty content:
    result = AviElement.setContent(target, '');
    expect(document.body.innerHTML).toBe('<main><section id="target"></section></main>');
    expect(result).toBe(target);

    //element has value, content html
    result = AviElement.setContent(target, {html: '<div></div>'});
    expect(result).toBe(target);
    expect(document.body.innerHTML).toBe('<main><section id="target"><div></div></section></main>');

    //element has value, content text
    result = AviElement.setContent(target, {json: 'div'});
    expect(result).toBe(target);
    expect(document.body.innerHTML).toBe('<main><section id="target">{"json":"div"}</section></main>');
  });


  test('Target is an input element', () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    result = AviElement.setContent(input, 'test');
    expect(result).toBe(input);
    expect(input.value).toBe('test');

    result = AviElement.setContent(input, 123);
    expect(result).toBe(input);
    expect(input.value).toBe('123');

    input.setAttribute('type', 'file');
    result = AviElement.setContent(input, 123);
    expect(result).toBe(input);
    expect(input.value).toBe('');
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.tools.element.setContent] A file input value can only be cleared');

    const button = document.createElement('button');
    button.constructor.formAssociated = true;
    result = AviElement.setContent(button, 123);
    expect(result).toBe(button);
    expect(button.value).toBe('123');


  });


  test('should render objects and arrays formatted as JSON code blocks', () => {
    const dataObj = { 
      status: 'success', 
      code: 200 
    };

    AviElement.setContent(target, dataObj);
    expect(target.innerHTML).toContain('{"status":"success","code":200}');
  });

  test('should update content using html propriety', () => {
    const dataObj = { success: true };
    dataObj.html = '<h1>Aviato Soft</h1>';
    result = AviElement.setContent(target, dataObj);
    expect(target.innerHTML).toBe('<h1>Aviato Soft</h1>');
    expect(result).toBe(target);

    dataObj.html = { 'users': [
      {
        'id': 1,
      },
      {
        'id': 2
      }
    ]};
    result = AviElement.setContent(target, dataObj);
    expect(target.innerHTML).toBe('{"users":[{"id":1},{"id":2}]}');
    expect(result).toBe(target);
    
  });


  test('invalid element', () => {
    result = AviElement.setContent();
    expect(result).toBeNull();
  });


  test('sanitizer', () => {
    AviElement.sanitizer = (html) => (JSON.stringify(html)); //bad sanitizer - do not do it in production!
    result = AviElement.setContent(target, {html: {html: "html"}});
    expect(target.innerHTML).toBe('"{\\"html\\":\\"html\\"}"');
    expect(result).toBe(target);
  });


  test('select element', () => {
    document.body.innerHTML = `
      <select id="target">
      <option value="1" selected>one<option>
      <option value="2">two</option>
      </select>`;
    target = document.getElementById('target');
    result = AviElement.setContent(target, 2);
    expect(target.value).toBe("2");
  })

});