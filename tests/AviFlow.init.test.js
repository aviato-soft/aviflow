import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';

describe('AviFlow / init', () => {

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btn1" data-flow="handleClick -> #result">Btn 1</button>
      <input id="inp1" data-flow="input -> handleInput -> #result">
      <div id="result"></div>
      <button id="btn2" data-flow="">Btn Invalid Flow</button>
    `;
  });


  test('should return instance of flow', () => {
    const flow = new AviFlow({}, { autoInit: false });
    const result = flow.init();

    expect(result).toBe(flow);
  });


  test('should return instance flow on invalid root', () => {
    const flow = new AviFlow({}, { autoInit: false });
    let result = flow.init(false);
    expect(result).toBe(flow);

    result = flow.init(null);
    expect(result).toBe(flow);

    result = flow.init([]);
    expect(result).toBe(flow);

    result = flow.init({});
    expect(result).toBe(flow);

  });


  test('should attach event listeners to [data-flow] elements and execute bound action', () => {
    const handleClick = jest.fn().mockReturnValue('Clicked!');
    const flow = new AviFlow({ handleClick });

    const btn = document.querySelector('#btn1');

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).toHaveBeenCalled();
    expect(document.getElementById('result').innerHTML).toBe('Clicked!');
  });


  test('should not attach duplicate event listeners if init() is called multiple times', () => {
    const handleClick = jest.fn().mockReturnValue('Clicked!');
    const flow = new AviFlow({ handleClick });

    flow.init(); // Second call
    flow.init(); // 3rd call

    const btn = document.querySelector('#btn1');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(document.getElementById('result').innerHTML).toBe('Clicked!');
  });


  test('should scope element scanning when a custom root element is provided', () => {
    const handleClick1 = jest.fn().mockReturnValue('Clicked1!');
    const handleClick2 = jest.fn().mockReturnValue('Clicked2!');
    document.body.innerHTML = `
      <div id="container1">
        <button id="btn1" data-flow="action1 -> #result1">Btn 1</button>
      </div>
      <div id="result1"></div>
      <div id="container2">
        <button id="btn2" data-flow="action2 -> #result2">Btn 2</button>
      </div>
      <div id="result2"></div>
    `;

    const flow = new AviFlow({ action1: handleClick1, action2: handleClick2 }, { autoInit: false });

    // Init only within container1
    flow.init(document.querySelector('#container1'));

    const btn1 = document.querySelector('#btn1');
    btn1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('result1').innerHTML).toBe('Clicked1!');

    const btn2 = document.querySelector('#btn2');
    btn2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.getElementById('result2').innerHTML).toBe('');

  });


  test('should use also root flow', () => {
    document.body.innerHTML = `
    <div id="container" data-flow="mouseenter -> onHover -> #target1">
      <div id="not-flow">No Flow Here</div>
      <button id="buttonTrigger" data-flow="onClick -> #target2">Click me</button>
    </div>
    <div id="target1"></div>
    <div id="target2"></div>
    `;
    const handleHover = jest.fn().mockReturnValue('hover');
    const handleClick = jest.fn().mockReturnValue('click');
    const target1 = document.getElementById('target1');
    const target2 = document.getElementById('target2');
    const trigger1 = document.getElementById('container');
    const trigger2 = document.getElementById('buttonTrigger');

    const flow = new AviFlow({ onHover: handleHover, onClick: handleClick }, {autoInit: false});
    flow.init(trigger1);
    
    trigger1.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    expect(target1.innerHTML).toBe('hover');

    trigger2.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(target2.innerHTML).toBe('click');

  })


  //similar with previous test
  test('should push root to elements if it is an element and matches [data-flow]', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

    const root = document.createElement('div');
    root.setAttribute('data-flow', 'testFlow');

    const mockAction = jest.fn().mockReturnValue('Root Flow');
    const flowWithAction = new AviFlow({ mockAction });

    root.addEventListener('click', mockAction);

    flowWithAction.init(root);
    root.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(mockAction).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.eventHandler] Action "testFlow" is not defined');
  });


});