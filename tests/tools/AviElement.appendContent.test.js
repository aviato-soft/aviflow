import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / appendContent', () => {
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
    result = AviElement.appendContent();
    expect(result).toBeNull();
  });

/*
  test('Missing parent', () => {
    result = AviElement.appendContent(div);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.tools.element.appendContent] Element has no parent');

  })
*/
  test('Content node', () => {
    result = AviElement.appendContent(target, div);
    result = AviElement.appendContent(target, span);
    expect(result).toBe(target);
    expect(document.body.innerHTML).toBe('<main><section id="target"><div></div><span></span></section></main>');
  });

  test('Content string (html, text ... )', () => {
    //empty content:
    result = AviElement.appendContent(target, '');
    expect(result).toBe(target);

    //element has value, content html
    result = AviElement.appendContent(target, {html: '<div></div>'});
    target = document.getElementById('target');
    expect(result).toBe(target);
    expect(document.body.innerHTML).toBe('<main><section id="target"><div></div></section></main>');

    //element has value, content text
    result = AviElement.appendContent(target, {json: 'div'});
    expect(result).toBe(target);
    expect(document.body.innerHTML).toBe('<main><section id="target"><div></div>{"json":"div"}</section></main>');

  });

/*
  test('should append DOM elements when content is an HTMLElement', () => {
    const newChild = document.createElement('span');
    newChild.textContent = 'Hello Element';

    AviElement.updateContent(target, newChild);
    expect(target.innerHTML).toBe('<span>Hello Element</span>');
  });

  test('should set .value when target is an HTMLInputElement or HTMLTextAreaElement', () => {
    const input = document.createElement('input');
    AviElement.updateContent(input, 'New Input Value');
    expect(input.value).toBe('New Input Value');

    const textarea = document.createElement('textarea');
    AviElement.updateContent(textarea, 'Textarea Content');
    expect(textarea.value).toBe('Textarea Content');
  });

  test('should render objects and arrays formatted as JSON code blocks', () => {
    const dataObj = { 
      status: 'success', 
      code: 200 
    };

    AviElement.updateContent(target, dataObj);
    expect(target.innerHTML).toContain('{"status":"success","code":200}');
  });

  test('should set primitive string or number directly to innerHTML', () => {
    AviElement.updateContent(target, 'Simple String');
    expect(target.innerHTML).toBe('Simple String');
  });


  test('should update content using html propriety', () => {
    const dataObj = { success: true };
    dataObj.html = '<h1>Aviato Soft</h1>';
    result = AviElement.updateContent(target, dataObj);
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
    result = AviElement.updateContent(target, dataObj);
    expect(target.innerHTML).toBe('{"users":[{"id":1},{"id":2}]}');
    expect(result).toBe(target);
    
  });


  test('invalid element', () => {
    result = AviElement.updateContent();
    expect(result).toBeNull();
  });


  test('sanitizer', () => {
    AviElement.sanitizer = (html) => (JSON.stringify(html)); //bad sanitizer - do not do it in production!
    result = AviElement.updateContent(target, {html: {html: "html"}});
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
    result = AviElement.updateContent(target, 2);
    expect(target.value).toBe("2");
  })


*/
});