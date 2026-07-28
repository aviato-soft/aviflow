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
    test('handles undefined window when executing callback (line 121 null branch)', () => {
        const originalWindow = global.window;
        try {
            // Attempt to temporarily delete window from global scope
            delete global.window;
            
            // If delete global.window does not change typeof window (due to JSDOM configuration),
            // redefine window as undefined.
            if (typeof window !== 'undefined') {
                Object.defineProperty(global, 'window', {
                    value: undefined,
                    configurable: true,
                    writable: true
                });
            }

            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            
            // Should fallback to evaluating 'console.log('executed')' because window is undefined/null
            aviflow.tools.executeCallback(mock.element.button.test, 'onTestEval');
            
            expect(logSpy).toHaveBeenCalledWith('executed');
            logSpy.mockRestore();
        } finally {
            // Restore original window object
            if (originalWindow) {
                Object.defineProperty(global, 'window', {
                    value: originalWindow,
                    configurable: true,
                    writable: true
                });
            }
        }
    });
    */

    test('handles nonexistent dotted path safely (covers loop if condition)', () => {
        // Using a non-existent dotted path with multiple parts (e.g. console.log.nonexistent.subpart)
        // will set func to undefined, causing 'if (func)' to be falsy for the remaining parts.
        // Then it will fall back to evaluating the attribute as code.
        mock.element.button.test.setAttribute('data-on-success', 'console.log.nonexistent.subpart');
        const errResult = aviflow.tools.executeCallback(mock.element.button.test, 'onSuccess');
        
        expect(errResult).toBeInstanceOf(TypeError);
    });
})