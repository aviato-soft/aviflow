import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

describe('AviFlowCoreEngine / destroy', () => {
  let actions;
  let flow;
  let engine;
  let triggerEl;
  let otherEl;
  let targetEl;

  const click = () => new MouseEvent('click', { bubbles: true });

  beforeEach(() => {
    actions = {
      onClick: jest.fn().mockReturnValue('clicked'),
      onKeydown: jest.fn().mockReturnValue('keydown'),
    };
    // minimal flow stub: the engine only needs resolveAction() and init()
    flow = {
      resolveAction: jest.fn((name) => (actions[name] ? { fn: actions[name], owner: actions } : undefined)),
      init: jest.fn(),
    };
    engine = new AviFlowCoreEngine(flow);

    document.body.innerHTML = `
      <button id="trigger" data-flow="click -> onClick -> #target"></button>
      <button id="other" data-flow="click -> onClick -> #target"></button>
      <div id="target"></div>
    `;
    triggerEl = document.getElementById('trigger');
    otherEl = document.getElementById('other');
    targetEl = document.getElementById('target');
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    engine.destroy(triggerEl);
    engine.destroy(otherEl);
    jest.restoreAllMocks();
  });

  test('should return undefined and do nothing for an element that was never bound', () => {
    expect(engine.destroy(triggerEl)).toBeUndefined();
    expect(engine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should not throw for null, undefined or non-element values', () => {
    expect(() => engine.destroy()).not.toThrow();
    expect(() => engine.destroy(null)).not.toThrow();
    expect(() => engine.destroy({})).not.toThrow();
    expect(() => engine.destroy('#trigger')).not.toThrow();
  });

  test('should remove the element listener so the action no longer runs', () => {
    engine.controller(triggerEl);
    triggerEl.dispatchEvent(click());
    expect(actions.onClick).toHaveBeenCalledTimes(1);

    engine.destroy(triggerEl);
    triggerEl.dispatchEvent(click());

    expect(actions.onClick).toHaveBeenCalledTimes(1);
  });

  test('should delete the element from boundElements', () => {
    engine.controller(triggerEl);
    expect(engine.boundElements.has(triggerEl)).toBe(true);

    engine.destroy(triggerEl);

    expect(engine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should abort the signal of every bound event and clear the config map', () => {
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');
    triggerEl.dataset.flow = '[click -> onClick -> #target][keydown -> onKeydown -> #target]';
    engine.controller(triggerEl);
    const configs = engine.boundElements.get(triggerEl);
    const signals = addSpy.mock.calls.map((call) => call[2].signal);
    expect(signals).toHaveLength(2);
    expect(signals.every((s) => !s.aborted)).toBe(true);

    engine.destroy(triggerEl);

    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(configs.size).toBe(0);

    triggerEl.dispatchEvent(click());
    triggerEl.dispatchEvent(new Event('keydown'));
    expect(actions.onClick).not.toHaveBeenCalled();
    expect(actions.onKeydown).not.toHaveBeenCalled();
  });

  test('should remove window listeners', () => {
    triggerEl.dataset.flow = 'click.window -> onClick -> #target';
    engine.controller(triggerEl);
    window.dispatchEvent(new Event('click'));
    expect(actions.onClick).toHaveBeenCalledTimes(1);

    engine.destroy(triggerEl);
    window.dispatchEvent(new Event('click'));

    expect(actions.onClick).toHaveBeenCalledTimes(1);
  });

  test('should be idempotent', () => {
    engine.controller(triggerEl);

    engine.destroy(triggerEl);
    expect(() => engine.destroy(triggerEl)).not.toThrow();
    expect(engine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should only affect the destroyed element', () => {
    engine.controller(triggerEl);
    engine.controller(otherEl);

    engine.destroy(triggerEl);
    triggerEl.dispatchEvent(click());
    otherEl.dispatchEvent(click());

    expect(engine.boundElements.has(otherEl)).toBe(true);
    expect(actions.onClick).toHaveBeenCalledTimes(1);
    expect(actions.onClick.mock.calls[0][0]).toBe(otherEl);
  });

  test('should allow the element to be bound again afterwards', () => {
    engine.controller(triggerEl);
    engine.destroy(triggerEl);

    engine.controller(triggerEl);
    triggerEl.dispatchEvent(click());

    expect(actions.onClick).toHaveBeenCalledTimes(1);
    expect(targetEl.innerHTML).toBe('clicked');
  });

  test('should be called by controller() when data-flow is removed from a bound element', () => {
    engine.controller(triggerEl);
    const destroySpy = jest.spyOn(engine, 'destroy');

    triggerEl.removeAttribute('data-flow');
    engine.controller(triggerEl);

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(destroySpy).toHaveBeenCalledWith(triggerEl);
    expect(engine.boundElements.has(triggerEl)).toBe(false);
  });
});
