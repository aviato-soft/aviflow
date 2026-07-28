import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
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
        mock.element.button.test.setAttribute('data', "");
        mock.element.button.test.setAttribute('data-on-pending', 'alert');
        mock.element.button.test.setAttribute('data-on-success', 'flow.fn.success');
        mock.element.button.test.setAttribute('data-on-test-eval', 'console.log(\"executed\")');
        mock.element.button.test.setAttribute('data-on-test-error', 'throw new Error(\"callback-fail\")');
        mock.element.button.test.setAttribute('data-on-test-args', 'function(data) { return data * 2; }');
        mock.element.button.test.setAttribute('data-param-item', 'test');
        mock.element.button.test.setAttribute('data-param-item1', 'a');
        mock.element.button.test.setAttribute('data-param-item2', 'b');
        mock.element.button.test.setAttribute('data-param-test', 'action');
        document.body.appendChild(mock.element.button.test);
    } else {
        console.log('Missing mock #button-test-simple');
        return false;
    }

    test('tools / formEntries', async () => {
        const expectedNoPrefix = {
            "action": "fetch",
            "onPending": "alert",
            "onSuccess": "flow.fn.success",
            "onTestArgs": "function(data) { return data * 2; }",
            "onTestError": "throw new Error(\"callback-fail\")",
            "onTestEval": "console.log(\"executed\")",
            "paramItem": "test",
            "paramItem1": "a",
            "paramItem2": "b",
            "paramTest": "action",
        };
        let result = aviflow.tools.formEntries(mock.element.button.test);
        expect(result).toStrictEqual(expectedNoPrefix);

        const expectedFilteredWithParam = {
            "Item": "test",
            "Item1": "a",
            "Item2": "b",
            "Test": "action",
        }
        result = aviflow.tools.formEntries(mock.element.button.test, 'param');
        expect(result).toStrictEqual(expectedFilteredWithParam);

        const expectedNoPrefixWithAttributes = {
            "Action": "fetch",
            "On-pending": "alert",
            "On-success": "flow.fn.success",
            "On-test-args": "function(data) { return data * 2; }",
            "On-test-eval": "console.log(\"executed\")",
            "On-test-error": "throw new Error(\"callback-fail\")",
            "Param-item": "test",
            "Param-item1": "a",
            "Param-item2": "b",
            "Param-test": "action",
        };
        result = aviflow.tools.formEntries(mock.element.button.test, '', 'attributes');
        expect(result).toStrictEqual(expectedNoPrefixWithAttributes);

        result = aviflow.tools.formEntries(mock.element.button.test, 'param', 'attributes');
        expect(result).toStrictEqual(expectedFilteredWithParam);

        result = aviflow.tools.formEntries(mock.element.button.test, 'param', 'test');
        expect(result).toStrictEqual({});
    });
})