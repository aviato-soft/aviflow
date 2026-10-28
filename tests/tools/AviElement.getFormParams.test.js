import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / getFormParams', () => {

  beforeEach(() => {
    document.body.innerHTML = `<form>
            <input type="text" name="textInput" value="Some Dummy Text" placeholder="Text Input">
            <input type="password" name="passwordInput" value="dummy_password" placeholder="Password">
            <input type="email" name="emailInput" value="user@example.com" placeholder="Email">
            <input type="tel" name="telInput" value="1234567890" placeholder="Telephone">
            <input type="url" name="urlInput" value="https://dummy.example.com" placeholder="URL">
            <input type="number" name="numberInput" value="123" placeholder="Number">
            <input type="range" name="rangeInput" min="0" max="100" value="75" placeholder="Range">
            <input type="date" name="dateInput" value="2023-10-27" placeholder="Date">
            <input type="time" name="timeInput" value="14:30:00" placeholder="Time">
            <input type="checkbox" name="checkboxInput1" value="1" checked>
            <input type="checkbox" name="checkboxInput2" value="1">
            <input type="radio" name="radioInput" value="a" checked>
            <select name="selectInput">
            <option value="1">Option 1</option>
            <option value="2" selected>Option 2</option>
            </select>
            <textarea name="textAreaInput" placeholder="Text Area">Some dummy content</textarea>
            <button id="btnSubmit" type="submit">Submit</button>
            </form>
            <div id="form-out-container">
            <button id="btnTest">Click me!</button>
            </div>

            `;
  });

  test('returns empty object when element or attributes are missing', () => {
    expect(AviElement.getFormParams(null)).toEqual({});
    expect(AviElement.getFormParams(undefined)).toEqual({});
    expect(AviElement.getFormParams({})).toEqual({});
    expect(AviElement.getFormParams(document.getElementById('btnSubmit'))).toEqual({});
  });


  test('parses all form elements', () => {
    const test = {
      checkboxInput1: '1',
      dateInput: '2023-10-27',
      emailInput: 'user@example.com',
      numberInput: '123',
      passwordInput: 'dummy_password',
      radioInput: 'a',
      rangeInput: '75',
      selectInput: '2',
      telInput: '1234567890',
      textAreaInput: 'Some dummy content',
      textInput: 'Some Dummy Text',
      timeInput: '14:30:00',
      urlInput: 'https://dummy.example.com',
    }
    const result = AviElement.getFormParams(document.querySelector('form'));
    expect(result).toEqual(test);
  });


  test('handles multiple values for the same key by converting to array', () => {
    // Reset DOM for this specific test case to ensure isolation
    document.body.innerHTML = `<form>
            <input type="text" name="multipleKey" value="one">
            <input type="text" name="multipleKey" value="two">
            <input type="text" name="multipleKey" value="three">
            <input type="radio" name="singleRadio" id="radioTest1" value="1">
            <input type="radio" name="singleRadio" id="radioTest2" value="2" checked>
            <input type="radio" name="singleRadio" id="radioTest3" value="3">
        </form>`;

    const formElement = document.querySelector('form');
    const result = AviElement.getFormParams(formElement);

    expect(result.multipleKey).toEqual(['one', 'two', 'three']);
    expect(result.singleRadio).toBe('2');
  });


  test('call from an element inside form', () => {
    const buttonSubmit = document.getElementById('btnSubmit');
    const buttonTest = document.getElementById('btnTest');
    const test = {
      checkboxInput1: '1',
      dateInput: '2023-10-27',
      emailInput: 'user@example.com',
      numberInput: '123',
      passwordInput: 'dummy_password',
      radioInput: 'a',
      rangeInput: '75',
      selectInput: '2',
      telInput: '1234567890',
      textAreaInput: 'Some dummy content',
      textInput: 'Some Dummy Text',
      timeInput: '14:30:00',
      urlInput: 'https://dummy.example.com',
    }
    let result = AviElement.getFormParams(buttonSubmit, true);
    expect(result).toEqual(test);

    result = AviElement.getFormParams(buttonTest, true);
    expect(result).toEqual({});

  });


  test('__proto__ html element', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="__proto__" value="hello">
        <input type="file" name="__proto__">
        <input type="text" name="name" value="normal field">
      </form>`;
    const formElement = document.querySelector('form');
    const result = AviElement.getFormParams(formElement);
    expect(result).toEqual({"name": "normal field"});
  });

});