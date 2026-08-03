// bind.test.js

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Bind Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow({ url: mock.url.json });
    });


    test('Assing click to an undefined function', async () => {
        /*
        aviflow.fn.test = jest.fn(function(element) {
            element.dataset.success = true;
        });
        */
        mock.element.button.testAction = document.createElement('button');
        mock.element.button.testAction.dataset.action = 'testNonExists';
        mock.element.button.testAction.dataset.success = false;
        document.body.appendChild(mock.element.button.testAction);
        mock.element.button.testAction.click();

        // Wait for the click event and subsequent async handler to complete
        await new Promise((resolve) => setTimeout(resolve, 33));

        // Assertion 2: Check the result
        const result = mock.element.button.testAction.dataset.success;
        expect(result).toBe("false");
    })


    test('The FLow = execute actions from aviflow.fn not only fetch', async () => {
        aviflow.fn.test = jest.fn(function(element) {
            element.dataset.success = true;
        });
        mock.element.button.testAction = document.createElement('button');
        mock.element.button.testAction.dataset.action = 'test';
        mock.element.button.testAction.dataset.success = false;
        document.body.appendChild(mock.element.button.testAction);
        aviflow.bind();
        aviflow.bind();
        aviflow.bind();
        
        mock.element.button.testAction.click();

        // Wait for the click event and subsequent async handler to complete
        await new Promise((resolve) => setTimeout(resolve, 33));

        // Assertion 1: Check if the function was called
        expect(aviflow.fn.test).toHaveBeenCalledTimes(1);

        // Assertion 2: Check the result
        const result = mock.element.button.testAction.dataset.success;
        expect(result).toBe("true");
    });
});
