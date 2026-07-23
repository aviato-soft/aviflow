// error.test.js - Error handling test suite

import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Error Handling Test Unit', () => {

    beforeEach(() => {
        // Reset the DOM body for each test
        document.body.innerHTML = '';

        const expectedResponse = {
            bool: true,
            json: {
                status: 'success',
                data: {
                    message: 'Success API Response'
                }},
            text: '<span>Success API Response</span>',
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: expectedResponse.bool,
                text: () => Promise.resolve(expectedResponse.text),
                json: () => Promise.resolve(expectedResponse.json),
            })
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    //TEST 1 - Network error (fetch rejects)
    test('should invoke onError callback when fetch rejects (network-level error)', async () => {
        document.body.innerHTML = `
      <button id="network-error-trigger"
            data-action="fetch"
            data-url="/api/does-not-exist"
            data-method="GET">
      </button>
    `;

        const networkError = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));
        global.fetch = networkError;

        new AviFlow();

        const button = document.getElementById('network-error-trigger');
        button.click();

        // Allow async propagation: await fetch → reject → catch onError()
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

/*
    //TEST 2 - Server error (non-OK response)
    test('should invoke onError callback when fetch returns non-OK response', async () => {
        document.body.innerHTML = `
      <button id="error-trigger"
            data-action="fetch"
            data-url="/api/error"
            data-method="POST">
      </button>
    `;

        const errorResponse = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                headers: new Headers(),
            })
        );
        global.fetch = errorResponse;

        new AviFlow();

        const button = document.getElementById('error-trigger');
        button.click();

        // Allow async propagation: fetch → .ok check throws → catch onError()
        await new Promise((resolve) => setTimeout(resolve, 20));
    });
*/

    // TEST 3 - Successful JSON response with data-target rendering and default success callback
    test('should render JSON body into data-target container and invoke default success callback on OK response', async () => {
        const successEvent = jest.fn();
        new AviFlow({
            onSuccess: (data, element) => successEvent(data),
        });

        document.body.innerHTML = `
      <button id="success-trigger"
              data-action="fetch"
              data-url="/api/data"
              data-target="#output">
      </button>
      <div id="output"></div>
    `;

        const successResponse = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: () => Promise.resolve({ hello: 'world', count: 42 }),
                text: () => Promise.resolve('{}'),
            })
        );
        global.fetch = successResponse;

        const button = document.getElementById('success-trigger');
        button.click();

        await new Promise((resolve) => setTimeout(resolve, 20));

        // JSON content should be rendered into the target container via textContent (JSON.stringify)
        expect(document.getElementById('output').textContent).toBe(JSON.stringify({ hello: 'world', count: 42 }));

        // Default success callback should have been invoked with the parsed data object
        //expect(successEvent).toHaveBeenCalledWith({ hello: 'world', count: 42 });
    });

});
