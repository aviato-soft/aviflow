import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / togglePendingState', () => {
  let button;
  let container;
  let result;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container"></div>
      <button id="button"></button>
    `;
    container = document.getElementById('container');
    button = document.getElementById('button');

  });

  
  test('should just works...', () => {
    //state change to pending:
    result = AviElement.togglePendingState(container);
    expect(container.style.opacity).toBe("0.6");
    expect(container.style.pointerEvents).toBe("none");
    expect(container.disabled).toBeUndefined();
    expect(container.classList.contains('pending')).toBe(true);
    expect(result).toBe(container);

    //state pending removed:
    result = AviElement.togglePendingState(container);
    expect(container.style.opacity).toBe("");
    expect(container.style.pointerEvents).toBe("");
    expect(container.disabled).toBeUndefined();
    expect(container.classList.contains('pending')).toBe(false);
    expect(result).toBe(container);

    //state change to pending:
    result = AviElement.togglePendingState(button);
    expect(button.style.opacity).toBe("0.6");
    expect(button.style.pointerEvents).toBe("none");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(true);
    expect(result).toBe(button);

    //state pending removed:
    result = AviElement.togglePendingState(button);
    expect(button.style.opacity).toBe("");
    expect(button.style.pointerEvents).toBe("");
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('pending')).toBe(false);
    expect(result).toBe(button);
    
  });


  test('should invalid element or dataset', () => {
    result = AviElement.togglePendingState();
    expect(result).toBeNull();
  });


  test('set the pending flag', () => {
    result = AviElement.togglePendingState(button, true);
    expect(button.style.opacity).toBe("0.6");
    expect(button.style.pointerEvents).toBe("none");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(true);
    expect(result).toBe(button);

    result = AviElement.togglePendingState(button, true);
    expect(button.style.opacity).toBe("0.6");
    expect(button.style.pointerEvents).toBe("none");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(true);
    expect(result).toBe(button);

    //must act as false:
    result = AviElement.togglePendingState(button);
    expect(button.style.opacity).toBe("");
    expect(button.style.pointerEvents).toBe("");
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('pending')).toBe(false);
    expect(result).toBe(button);

    result = AviElement.togglePendingState(button, false);
    expect(button.style.opacity).toBe("");
    expect(button.style.pointerEvents).toBe("");
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('pending')).toBe(false);
    expect(result).toBe(button);

  });


  test('restore the original values', () => {
    //set default state:
    button.style.opacity = .99;
    button.style.pointerEvents = 'auto';
    button.disabled = 'disabled';
    button.classList.add('pending');
    button.setAttribute('aria-busy', 'busy');

    result = AviElement.togglePendingState(button, true);
    expect(button.style.opacity).toBe("0.6");
    expect(button.style.pointerEvents).toBe("none");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(result).toBe(button);

    //restore default state:
    result = AviElement.togglePendingState(button);
    expect(button.style.opacity).toBe("0.99");
    expect(button.style.pointerEvents).toBe("auto");
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('busy');
    //expect(button.classList.contains('pending')).toBe(true);
    expect(result).toBe(button);

    //there is no default state, just exit pending call:
    result = AviElement.togglePendingState(button, false);
    expect(button.style.opacity).toBe("0.99");
    expect(button.style.pointerEvents).toBe("auto");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(result).toBe(button);
  });


  test('test options overwrite', () => {
    button.dataset.optPendingClass = 'waiting';
    button.dataset.optPendingOpacity = '0.5';

    result = AviElement.togglePendingState(button, true, {
      "pending-opacity": 0.4
    });
    expect(button.style.opacity).toBe("0.4");
    expect(button.style.pointerEvents).toBe("none");
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('pending')).toBe(false);
    expect(button.classList.contains('waiting')).toBe(true);
    expect(result).toBe(button);
  });


  test('options diferent values', () => {
    result = AviElement.togglePendingState(button, true, {
      "pending-class": [],
      "pending-opacity": null,
      "pending-pointer": null,
      "pending-disabled": null
    });
    expect(result).toBe(button);

    result = AviElement.togglePendingState(button, false, {
      "pending-class": [],
      "pending-opacity": null,
      "pending-pointer": null,
      "pending-disabled": null
    });
    expect(result).toBe(button);

    result = AviElement.togglePendingState(button, false, {
      "pending-class": [],
    });
    expect(result).toBe(button);

  });


});