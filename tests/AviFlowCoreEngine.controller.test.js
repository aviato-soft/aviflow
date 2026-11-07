import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';
import AviFlowCoreEngine from '../src/AviFlowCoreEngine.js';

const click = () => new MouseEvent('click', { bubbles: true, cancelable: true });

describe('AviFlowCoreEngine / controller', () => {
  const flow = new AviFlow({
    company: 'Aviato Soft',
    getGreeting: () => 'Hello World',
    getNothing: () => { },
    getError: () => { throw new Error('Test Error for synchronous failure'); },
    asyncGetData: async () => {
      return new Promise((resolve) => setTimeout(() => resolve('Async Result'), 50));
    },
    asyncGetDataWithError: async () => {
      return new Promise((_, reject) => setTimeout(() => reject(new Error('Test Error')), 50));
    },
  });
  const flowEngine = new AviFlowCoreEngine(flow);

  let targetEl;
  let triggerEl;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="trigger" data-flow="click -> getGreeting -> #target"></button>
      <div id="target"></div>
    `;
    targetEl = document.querySelector('#target');
    triggerEl = document.getElementById('trigger');
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    // removes any listener (including window ones) left by the test
    flowEngine.destroy(triggerEl);
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // basics
  // ---------------------------------------------------------------------------
  test('should just works', () => {
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(targetEl.innerHTML).toBe('Hello World');
  });

  test('should not assign duplicate event', () => {
    const handleClick = jest.fn().mockReturnValue('Clicked!');
    triggerEl.dataset.flow = 'click -> handleClick -> #target';
    flow.action.handleClick = handleClick;

    flowEngine.controller(triggerEl);
    flowEngine.controller(triggerEl);
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(targetEl.innerHTML).toBe('Clicked!');
  });

  test('should return undefined if element is invalid', () => {
    expect(flowEngine.controller()).toBeUndefined();
    expect(flowEngine.controller(null)).toBeUndefined();
    expect(flowEngine.controller({})).toBeUndefined(); // no dataset
  });

  test('should bind nothing when the element has no data-flow', () => {
    triggerEl.removeAttribute('data-flow');

    expect(flowEngine.controller(triggerEl)).toBeUndefined();
    expect(flowEngine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should bind nothing and not call destroy when data-flow is invalid and nothing was bound', () => {
    const destroySpy = jest.spyOn(flowEngine, 'destroy');
    triggerEl.dataset.flow = 'a -> b -> c -> d'; // too many parts

    flowEngine.controller(triggerEl);

    expect(destroySpy).not.toHaveBeenCalled();
    expect(flowEngine.boundElements.has(triggerEl)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // re-sync: data-flow removed / changed
  // ---------------------------------------------------------------------------
  test('should detach listeners when data-flow becomes invalid or is removed', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    triggerEl.dataset.flow = 'click -> handleClick -> #target';
    flowEngine.controller(triggerEl);
    const destroySpy = jest.spyOn(flowEngine, 'destroy');

    triggerEl.removeAttribute('data-flow');
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(click());

    expect(destroySpy).toHaveBeenCalledWith(triggerEl);
    expect(flowEngine.boundElements.has(triggerEl)).toBe(false);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('should remove listeners of events that are no longer declared', () => {
    const onClick = jest.fn();
    const onKeydown = jest.fn();
    flow.action.onClick = onClick;
    flow.action.onKeydown = onKeydown;

    triggerEl.dataset.flow = '[click -> onClick -> #target][keydown -> onKeydown -> #target]';
    flowEngine.controller(triggerEl);
    expect(flowEngine.boundElements.get(triggerEl).size).toBe(2);

    triggerEl.dataset.flow = 'click -> onClick -> #target';
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(new Event('keydown'));
    triggerEl.dispatchEvent(click());

    expect(flowEngine.boundElements.get(triggerEl).size).toBe(1);
    expect(onKeydown).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('should keep tracking the element when ALL declared events are replaced by new ones', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;

    triggerEl.dataset.flow = 'click -> handleClick -> #target';
    flowEngine.controller(triggerEl);
    triggerEl.dataset.flow = 'focus -> handleClick -> #target';
    flowEngine.controller(triggerEl);

    // the element must still be registered so destroy() can clean it up
    expect(flowEngine.boundElements.has(triggerEl)).toBe(true);

    triggerEl.dispatchEvent(click());
    expect(handleClick).not.toHaveBeenCalled(); // old event is gone

    flowEngine.destroy(triggerEl);
    triggerEl.dispatchEvent(new Event('focus'));
    expect(handleClick).not.toHaveBeenCalled(); // new event is gone after destroy
  });

  test('should reuse the listener and only swap the flows when the options are unchanged', () => {
    const handleA = jest.fn();
    const handleB = jest.fn();
    flow.action.handleA = handleA;
    flow.action.handleB = handleB;
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');

    triggerEl.dataset.flow = 'click -> handleA -> #target';
    flowEngine.controller(triggerEl);
    triggerEl.dataset.flow = 'click -> handleB -> #target';
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(click());

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(handleA).not.toHaveBeenCalled();
    expect(handleB).toHaveBeenCalledTimes(1);
  });

  test('should replace the listener when the passive option changes', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');

    triggerEl.dataset.flow = 'click.passive -> handleClick -> #target';
    flowEngine.controller(triggerEl);
    const firstSignal = addSpy.mock.calls[0][2].signal;

    triggerEl.dataset.flow = 'click -> handleClick -> #target';
    flowEngine.controller(triggerEl);
    const secondSignal = addSpy.mock.calls[1][2].signal;

    triggerEl.dispatchEvent(click());

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal.aborted).toBe(false);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // grouping & modifiers
  // ---------------------------------------------------------------------------
  test('should share one listener between several flows on the same event', () => {
    const first = jest.fn().mockReturnValue('first');
    const second = jest.fn().mockReturnValue('second');
    flow.action.first = first;
    flow.action.second = second;
    document.body.insertAdjacentHTML('beforeend', '<div id="target2"></div>');
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');

    triggerEl.dataset.flow = '[click -> first -> #target][click -> second -> #target2]';
    flowEngine.controller(triggerEl);
    triggerEl.dispatchEvent(click());

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(targetEl.innerHTML).toBe('first');
    expect(document.querySelector('#target2').innerHTML).toBe('second');
  });

  test('should register a passive listener when the flow uses .passive', () => {
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');
    triggerEl.dataset.flow = 'click.passive -> getGreeting -> #target';

    flowEngine.controller(triggerEl);

    const options = addSpy.mock.calls[0][2];
    expect(options.passive).toBe(true);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('should not register a passive option by default', () => {
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');

    flowEngine.controller(triggerEl);

    const options = addSpy.mock.calls[0][2];
    expect(options).not.toHaveProperty('passive');
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  test('should warn and let "prevent" win when passive and prevent share an event', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    const addSpy = jest.spyOn(triggerEl, 'addEventListener');
    triggerEl.dataset.flow = '[click.passive -> handleClick -> #target][click.prevent -> handleClick -> #target]';

    flowEngine.controller(triggerEl);
    const notPrevented = triggerEl.dispatchEvent(click());

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"passive" ignored for "click"'));
    expect(addSpy.mock.calls[0][2]).not.toHaveProperty('passive');
    expect(handleClick).toHaveBeenCalledTimes(2);
    expect(notPrevented).toBe(false); // preventDefault() was honoured
  });

  test('should apply prevent and stop modifiers', () => {
    const parentListener = jest.fn();
    document.body.addEventListener('click', parentListener);
    triggerEl.dataset.flow = 'click.prevent.stop -> getGreeting -> #target';

    flowEngine.controller(triggerEl);
    const notPrevented = triggerEl.dispatchEvent(click());
    document.body.removeEventListener('click', parentListener);

    expect(notPrevented).toBe(false);
    expect(parentListener).not.toHaveBeenCalled();
    expect(targetEl.innerHTML).toBe('Hello World');
  });

  // ---------------------------------------------------------------------------
  // window scope
  // ---------------------------------------------------------------------------
  test('should listen on window when the flow uses .window', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    const elementAddSpy = jest.spyOn(triggerEl, 'addEventListener');
    const windowAddSpy = jest.spyOn(window, 'addEventListener');
    triggerEl.dataset.flow = 'click.window -> handleClick -> #target';

    flowEngine.controller(triggerEl);
    window.dispatchEvent(new Event('click'));

    expect(elementAddSpy).not.toHaveBeenCalled();
    expect(windowAddSpy).toHaveBeenCalledWith('click', expect.any(Function), expect.any(Object));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should unbind a window listener once its element is detached from the DOM', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    triggerEl.dataset.flow = 'click.window -> handleClick -> #target';
    flowEngine.controller(triggerEl);

    triggerEl.remove();
    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('click'));

    expect(handleClick).not.toHaveBeenCalled();
    expect(flowEngine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should not throw when a window listener fires for an element that is no longer in boundElements', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    triggerEl.dataset.flow = 'click.window -> handleClick -> #target';
    flowEngine.controller(triggerEl);

    // simulate lost bookkeeping: the listener is alive but its config is gone
    flowEngine.boundElements.delete(triggerEl);
    triggerEl.remove();

    expect(() => window.dispatchEvent(new Event('click'))).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled(); // jsdom reports listener errors via console.error
    expect(handleClick).not.toHaveBeenCalled();
    expect(flowEngine.boundElements.has(triggerEl)).toBe(false);
  });

  test('should not throw when a window listener fires for a key that is no longer in the element config', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    triggerEl.dataset.flow = 'click.window -> handleClick -> #target';
    flowEngine.controller(triggerEl);

    // the element is still tracked, but this event's entry is missing
    const configs = flowEngine.boundElements.get(triggerEl);
    configs.delete('window:click');
    triggerEl.remove();

    expect(() => window.dispatchEvent(new Event('click'))).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
    expect(flowEngine.boundElements.get(triggerEl)).toBe(configs); // untouched by the early return
  });

  test('should keep a window listener while its element is still connected', () => {
    const handleClick = jest.fn();
    flow.action.handleClick = handleClick;
    triggerEl.dataset.flow = 'click.window -> handleClick -> #target';
    flowEngine.controller(triggerEl);

    window.dispatchEvent(new Event('click'));
    window.dispatchEvent(new Event('click'));

    expect(handleClick).toHaveBeenCalledTimes(2);
    expect(flowEngine.boundElements.has(triggerEl)).toBe(true);
  });
});

// =============================================================================
// eventHandler (called by the controller listeners)
// =============================================================================
describe('AviFlowCoreEngine / eventHandler', () => {
  const flow = new AviFlow({});
  const flowEngine = new AviFlowCoreEngine(flow);

  let targetEl;
  let triggerEl;
  let errorSpy;
  let warnSpy;
  let initSpy;
  let event;

  /** Makes flow.resolveAction return the given function (and owner). */
  const stubAction = (fn, owner = {}) =>
    jest.spyOn(flow, 'resolveAction').mockReturnValue({ fn, owner });

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="trigger"></button>
      <div id="target"></div>
    `;
    targetEl = document.querySelector('#target');
    triggerEl = document.getElementById('trigger');
    event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    initSpy = jest.spyOn(flow, 'init').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should call preventDefault and stopPropagation only when requested', () => {
    stubAction(() => undefined);

    flowEngine.eventHandler(triggerEl, event, 'act', null, false, false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();

    flowEngine.eventHandler(triggerEl, event, 'act', null, true, true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  test('should not throw when the event is missing or has no preventDefault/stopPropagation', () => {
    stubAction(() => 'ok');

    expect(() => flowEngine.eventHandler(triggerEl, undefined, 'act', null, true, true)).not.toThrow();
    expect(() => flowEngine.eventHandler(triggerEl, {}, 'act', null, true, true)).not.toThrow();
  });

  test('should warn and return undefined when the action is not defined', () => {
    jest.spyOn(flow, 'resolveAction').mockReturnValue(undefined);

    const result = flowEngine.eventHandler(triggerEl, event, 'missing', '#target');

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('[AviFlow.core.eventHandler] Action "missing" is not defined');
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should call the action with its owner as "this" and (element, event, target, flow)', () => {
    const owner = { name: 'owner' };
    const fn = jest.fn(function () { return this; });
    stubAction(fn, owner);

    flowEngine.eventHandler(triggerEl, event, 'act', '#target');

    expect(flow.resolveAction).toHaveBeenCalledWith('act');
    expect(fn).toHaveBeenCalledWith(triggerEl, event, '#target', flow);
    expect(fn.mock.contexts[0]).toBe(owner);
  });

  test('should apply a sync result to the target, init the target and return the content', () => {
    stubAction(() => 'Sync Content');

    const result = flowEngine.eventHandler(triggerEl, event, 'act', '#target');

    expect(result).toBe('Sync Content');
    expect(targetEl.innerHTML).toBe('Sync Content');
    expect(initSpy).toHaveBeenCalledWith('#target');
  });

  test('should not init the target when the action returns undefined', () => {
    stubAction(() => undefined);

    const result = flowEngine.eventHandler(triggerEl, event, 'act', '#target');

    expect(result).toBeUndefined();
    expect(targetEl.innerHTML).toBe('');
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should return the content without touching the DOM when there is no target', () => {
    stubAction(() => 'No Target');

    expect(flowEngine.eventHandler(triggerEl, event, 'act', null)).toBe('No Target');
    expect(targetEl.innerHTML).toBe('');
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should still init the target (and warn) when the selector matches nothing', () => {
    stubAction(() => 'Content');

    flowEngine.eventHandler(triggerEl, event, 'act', '#does-not-exist');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No element matches "#does-not-exist"'));
    expect(initSpy).toHaveBeenCalledWith('#does-not-exist');
  });

  test('should log and swallow an error thrown by a sync action', () => {
    const error = new Error('Test Error for synchronous failure');
    stubAction(() => { throw error; });

    const result = flowEngine.eventHandler(triggerEl, event, 'boom', '#target');

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith('[AviFlow.core.eventHandler] Error on action "boom"', error);
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should log an error (and still return the content) when applying the result fails', () => {
    const error = new Error('init failed');
    initSpy.mockImplementation(() => { throw error; });
    stubAction(() => 'Content');

    const result = flowEngine.eventHandler(triggerEl, event, 'act', '#target');

    expect(result).toBe('Content');
    expect(errorSpy).toHaveBeenCalledWith(
      '[AviFlow.core.eventHandler] Error applying result of action "act"',
      error
    );
  });

  test('should apply an async result once the promise resolves', async () => {
    stubAction(async () => 'Async Content');

    const promise = flowEngine.eventHandler(triggerEl, event, 'act', '#target');
    expect(promise).toBeInstanceOf(Promise);
    expect(targetEl.innerHTML).toBe(''); // nothing yet

    await expect(promise).resolves.toBe('Async Content');
    expect(targetEl.innerHTML).toBe('Async Content');
    expect(initSpy).toHaveBeenCalledWith('#target');
  });

  test('should support thenables returned by an action', async () => {
    stubAction(() => ({ then: (resolve) => resolve('Thenable Content') }));

    await expect(flowEngine.eventHandler(triggerEl, event, 'act', '#target')).resolves.toBe('Thenable Content');
    expect(targetEl.innerHTML).toBe('Thenable Content');
  });

  test('should resolve an async result when there is no target', async () => {
    stubAction(async () => 'Async No Target');

    await expect(flowEngine.eventHandler(triggerEl, event, 'act', null)).resolves.toBe('Async No Target');
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should log a rejected async action and resolve with undefined', async () => {
    const error = new Error('Test Error');
    stubAction(() => Promise.reject(error));

    await expect(flowEngine.eventHandler(triggerEl, event, 'asyncBoom', '#target')).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith('[AviFlow.core.eventHandler] Error on action "asyncBoom"', error);
    expect(initSpy).not.toHaveBeenCalled();
  });

  test('should discard a stale async result when a newer call targets the same selector', async () => {
    let resolveSlow;
    const slow = new Promise((resolve) => { resolveSlow = resolve; });
    const fn = jest.fn().mockReturnValueOnce(slow).mockReturnValueOnce('Fast Content');
    stubAction(fn);

    const first = flowEngine.eventHandler(triggerEl, event, 'act', '#target');
    const second = flowEngine.eventHandler(triggerEl, event, 'act', '#target');
    expect(second).toBe('Fast Content');
    expect(targetEl.innerHTML).toBe('Fast Content');

    resolveSlow('Slow Content');

    await expect(first).resolves.toBeUndefined(); // discarded
    expect(targetEl.innerHTML).toBe('Fast Content');
    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});
