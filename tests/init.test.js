// init.test.js - Import kept for Jest file discovery (tests moved to index.test.js master suite)

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Init Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow({ url: mock.url.json });
    });


    test('Should do nothing when clicking the body directly if no matcher is found', async () => {
        // Simulate clicking directly on the body
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        // Allow time for the async event listener callback to execute
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verification: fetch should NOT be called when clicking the body
        expect(mock.fetch).not.toHaveBeenCalled();
    });
    
    
    test('Simple test with no elements suitable for flow', async () => {
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        // Ensure button is in the DOM for event delegation to work
        if (!document.getElementById('button-test-noflow')) {
            document.body.appendChild(mock.element.button.testNoFlow);
        }
        mock.element.button.testNoFlow.click();

        // Wait for the click event and subsequent async handler to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalled();
    });
    

    test('Simple test with at least one element has flow', async () => {
        // Ensure button is in the DOM for event delegation to work
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        mock.element.button.test.click();

        // Wait for the click event and subsequent async handler to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.json, expect.any(Object));
    });

});
