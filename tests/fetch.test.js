// fetch.test.js - Import kept for Jest file discovery (tests moved to index.test.js master suite)

import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Basse Test Unit', () => {
    let mockFetch;

    const expectedResponse = {
        bool: true,
        json: {
            status: 'success',
            data: {
                message: 'Success API Response'
            }
        },
        text: '<span>Success API Response</span>',
    }

    beforeEach(() => {
        // Reset the DOM body for each test
        document.body.innerHTML = '';

        // Mock global fetch with a successful response
        mockFetch = jest.fn(() =>
            Promise.resolve({
                ok: expectedResponse.bool,
                text: () => Promise.resolve(expectedResponse.text),
                json: () => Promise.resolve(expectedResponse.json),
            })
        );
        global.fetch = mockFetch;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    // TEST 1:
    test('should trigger fetch on elements with data-action="fetch"', async () => {
        // 1. Set up a mock DOM container and trigger element
        document.body.innerHTML = `
      <button id="trigger" data-action="fetch" data-url="/api/test" data-target="#output"></button>
      <div id="output">Original Content</div>
    `;

        // 2. Initialize AviFlow
        new AviFlow();

        // 3. Simulate a user click on the trigger button
        const button = document.getElementById('trigger');
        button.click();

        // 4. Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // 5. Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(expectedResponse.text);
    });


    //TEST 2:
    test('should fall back to href attribute if data-url is missing on anchor tags', async () => {
        // 1. Set up a mock DOM container and trigger element
        document.body.innerHTML = `
      <a id="link" data-action="fetch" href="/api/fallback-url" data-target="#output">Link</a>
      <div id="output"></div>
    `;
        // 2. Initialize AviFlow
        new AviFlow();

        // 3. Simulate a user click on the trigger button
        const link = document.getElementById('link');
        link.click();

        // 4. Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith('/api/fallback-url', expect.any(Object));
    });
});
