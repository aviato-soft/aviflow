import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools / executeCallback Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });

    if (!document.getElementById('button-test-simple')) {
        mock.element.button.test.setAttribute('data-on-pending', 'alert');
        mock.element.button.test.setAttribute('data-on-success', 'flow.fn.success');
        mock.element.button.test.setAttribute('data-on-test-eval', 'console.log(\'executed\')');
        mock.element.button.test.setAttribute('data-on-test-error', 'throw new Error(\'callback-fail\')');
        document.body.appendChild(mock.element.button.test);
    }

    test('returns undefined if no callback string is provided', async () => {
        const result = aviflow.tools.executeCallback(mock.element.button.test);
        expect(result).toBeUndefined();

        //empty dataset value → should return undefined
        const resultEmpty = aviflow.tools.executeCallback(mock.element.button.test, 'onError');
        expect(resultEmpty).toBeUndefined();
    });


    test('calls global function if it exists in window', () => {
        //global function path exists in window → calls the function
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        aviflow.tools.executeCallback(mock.element.button.test, 'onPending');
        expect(alertSpy).toHaveBeenCalled();
        alertSpy.mockRestore();

        //dotted function path in window → calls the global namespace function
        const fakeFn = jest.fn();
        let fakeFlowRef;
        Object.defineProperty(window, 'flow', {
            get() {
                return (fakeFlowRef || (fakeFlowRef = { fn: { success: fakeFn } }));
            },
            configurable: true
        });
        aviflow.tools.executeCallback(mock.element.button.test, 'onSuccess');
        expect(fakeFn).toHaveBeenCalled();
        delete window.flow; // Clean up specifically
    });


    test('returns error if code evaluation throws an error', () => {
        //code evaluation branch → dot-separated path resolves to non-function object property,
        //falls through and evaluates the string as JS code via new Function()
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        aviflow.tools.executeCallback(mock.element.button.test, 'onTestEval');
        expect(logSpy).toHaveBeenCalledWith('executed');

        //error handling → code evaluation throws an error,
        //the catch block returns the error as a return value (not undefined)
        const errResult = aviflow.tools.executeCallback(mock.element.button.test, 'onTestError');
        expect(errResult).toBeInstanceOf(Error);
    });

/*
    test('handles scenario where window is undefined (Node-like environment)', () => {
        // This test targets the branch: let func = typeof window !== 'undefined' ? window : null;
        // when typeof window === 'undefined'.
        const originalWindow = global.window;

        // In many test environments (like JSDOM), window is read-only and not configurable directly on 'global'
        // We attempt to simulate the absence of window.
        const isConfigurable = Object.getOwnPropertyDescriptor(global, 'window')?.configurable;

        //if (isConfigurable) {
            Object.defineProperty(global, 'window', { value: undefined, configurable: true });
            try {
                const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
                const element = { dataset: { onTestEval: 'console.log("fallback working")' } };
                aviflow.tools.executeCallback(element, 'onTestEval');
                expect(logSpy).toHaveBeenCalledWith('fallback working');
                logSpy.mockRestore();
            } finally {
                Object.defineProperty(global, 'window', { value: originalWindow, configurable: true });
            }
        //} else {
            // If we can't redefine window, we acknowledge the limitation of the test environment
            // rather than failing the whole suite.
        //    console.warn('Skipping "func = null" branch test: window is not configurable in this environment.');
        //}
    });
*/
})