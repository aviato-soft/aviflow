// tests/index.test.js
import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Test Unit', () => {
    let mockFetch;

    const expectedResponse = {
        bool: true,
        json: { 
            status: 'success', 
            data: {
                message: 'Success API Response'
            }},
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


    //TEST 3 - form data:
    test('should pass custom HTTP methods and bodies cleanly', async () => {
        document.body.innerHTML = `
      <button id="post-trigger"
        data-action="fetch"
        data-url="/api/submit"
        data-method="POST"
        data-param-item="test"
        data-param-test="action">
      </button>
    `;

        let aviflow = new AviFlow();
        const result = aviflow.formData(document.body.innerHtml);
        
        expect(result).toContain({
            item: "test",
            test: "action"
        });

        //document.getElementById('post-trigger').click();

        expect(mockFetch).toHaveBeenCalledWith('/api/submit', expect.any(Object));
    });
});

/*
describe('AviFlow Test Unit', () => {
    let mockFetch;




    test('should pass custom HTTP methods and bodies cleanly', async () => {
        document.body.innerHTML = `
      <button id="post-trigger"
              data-action="fetch"
              data-url="/api/submit"
              data-method="POST"
              data-body-item="test"
              data-body-test="action">
      </button>
    `;

        new AviFlow();

        document.getElementById('post-trigger').click();

        expect(mockFetch).toHaveBeenCalledWith('/api/submit', expect.objectContaining({
            method: 'POST',
            body: '{"item":"test","test":"action"}'
        }));
    });

    describe('error handling', () => {

        test('should invoke onError callback when fetch rejects (network-level error — covers line 87 await fetch)', async () => {
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
    });
});
*/