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

    test('tools / formData', async () => {
        const testData = {
            item: 'test',
            item1: 'a',
            item2: 'b',
            test: 'action'
        };
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        const result = aviflow.tools.formData(mock.element.button.test);

        expect(result).toStrictEqual(expected);
    });

    test('tools / formData / skips null and undefined values', () => {
        const spy = jest.spyOn(aviflow.tools, 'formEntries').mockReturnValue({
            valid: 'value',
            nullVal: null,
            undefVal: undefined
        });

        const result = aviflow.tools.formData(mock.element.button.test);

        expect(result.get('valid')).toBe('value');
        expect(result.has('nullVal')).toBe(false);
        expect(result.has('undefVal')).toBe(false);

        spy.mockRestore();
    });
})