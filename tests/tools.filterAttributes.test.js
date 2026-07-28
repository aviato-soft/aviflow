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

    test('tools / filterAttributes', async () => {
        const result = aviflow.tools.filterAttributes(mock.element.button.test);
        expect(result).toStrictEqual([
            ["id", "button-test-simple"],
            ['data-action', 'fetch'],
            ['data', ''],
            ["data-on-pending", "alert"],
            ["data-on-success", "flow.fn.success"],
            ["data-on-test-eval", "console.log(\"executed\")"],
            ["data-on-test-error", "throw new Error(\"callback-fail\")"],
            ["data-on-test-args", "function(data) { return data * 2; }"],
            ["data-param-item", "test"],
            ["data-param-item1", "a"],
            ["data-param-item2", "b"],
            ["data-param-test", "action"], /*
            ["data-item", "testItem"],
            ["data-test", "testAction"]
            */
        ]);

        const resultParam = aviflow.tools.filterAttributes(mock.element.button.test, 'data-param-');
        expect(resultParam).toStrictEqual([
            ['item', 'test'],
            ['item1', 'a'],
            ['item2', 'b'],
            ['test', 'action']
        ]);

        const resultCapitalized = aviflow.tools.filterAttributes(mock.element.button.test, 'data-param-', true);
        expect(resultCapitalized).toStrictEqual([
            ['Item', 'test'],
            ['Item1', 'a'],
            ['Item2', 'b'],
            ['Test', 'action']
        ]);
    });
})