// fetch.test.js - Import kept for Jest file discovery (tests moved to index.test.js master suite)

import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Basse Test Unit', () => {

    const htmlOk = "<p>okay!</p>"
    const testUrl = {
        "json": `data:application/json;charset=utf-8,{"success":true,"html":"<p>okay!</p>"}`,
        'href': '/api/fallback-url',
        "test": '/api/test',
        'error': '/api/error-500'
    }
    const htmlBody = `
<button id="btn-trigger-1" data-action="fetch" data-url="${testUrl.test}" data-target="#output">click</button>
<button id="btn-trigger-2" data-action="fetch" data-url='${testUrl.json}' data-target="#output" data-param-a="A">click</button>
<button id="btn-trigger-3" data-action="fetch" data-url='${testUrl.json}' data-param-a="A"  data-on-success="actionSuccess">click</button>
<button id="btn-trigger-5" data-action="fetch" data-url='${testUrl.error}' data-param-a="A"  data-on-error="actionError">click</button>
<a id="link-trigger" data-action="fetch" href="${testUrl.href}">click</a>
<div id="output">Original content</div>`;

    let mockFetch;

    const expectedResponse = {
        bool: true,
        json: {
            status: 'success',
            html: '<p>Success API Response</p>',
            data: {
                message: 'Success API Response!',
                success: true
            }
        },
        text: '<span>Success API Response</span>',
    }

    beforeEach(() => {
        // Mock global fetch with a successful response
        mockFetch = jest.fn((url) => {
            const isJson = url && (url.includes('json') || url.includes('application/json'));
            const isError = url && url.includes('error');
            return Promise.resolve({
                ok: isError ? false : expectedResponse.bool,
                status: isError ? 500 : 200,
                headers: new Headers({
                    'content-type': isJson ? 'application/json' : 'text/html'
                }),
                text: () => Promise.resolve(isError ? 'Error occurred' : expectedResponse.text),
                json: () => Promise.resolve(expectedResponse.json)
            });
        });
        global.fetch = mockFetch;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    // Set up a mock DOM container and trigger element
    document.body.innerHTML = htmlBody;

    // Initialize AviFlow
    new AviFlow();

    // TEST 1:
    test('Simple trigger elements having data-action="fetch" and text response', async () => {

        // Simulate a user click on the trigger button
        const mockButtonElement = document.getElementById('btn-trigger-1');
        mockButtonElement.click();

        // Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith(testUrl.test, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(expectedResponse.text);
    });

    //TEST 2
    test('Should fall back to href attribute if data-url is missing on anchor tags', async () => {

        // Simulate a user click on the trigger button
        const mockLinkElement = document.getElementById('link-trigger');
        mockLinkElement.click();

        // Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith(testUrl.href, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);
    });


    // TEST 3:
    test('Simple trigger elements having data-action="fetch" and json response', async () => {

        // Simulate a user click on the trigger button
        const mockButtonElement = document.getElementById('btn-trigger-2');
        mockButtonElement.click();

        // Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith(testUrl.json, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(expectedResponse.json.html);
    });


    // TEST 4:
    test('Simple trigger action on success', async () => {

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        const actionSuccess = alert('success');

        // Simulate a user click on the trigger button
        const mockButtonElement = document.getElementById('btn-trigger-3');
        mockButtonElement.click();

        // Assert fetch was invoked with correct parameters
        expect(mockFetch).toHaveBeenCalledWith(testUrl.json, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(expectedResponse.json.html);
        expect(alertSpy).toHaveBeenCalled();
    });
    

    // TEST 5:
    test('Should throw error for non-ok response and call custom/default error handlers', async () => {
        // 1. Custom Error Handler (via btn-trigger-5 with data-on-error="actionError")
        const customErrorSpy = jest.fn();
        window.actionError = customErrorSpy;

        const mockButtonElement = document.getElementById('btn-trigger-5');
        mockButtonElement.click();

        await new Promise(process.nextTick);

        expect(mockFetch).toHaveBeenCalledWith(testUrl.error, expect.any(Object));
        expect(customErrorSpy).toHaveBeenCalled();

        // 2. Default Error Handler (via btn-trigger-1, dynamically setting data-url to error url)
        const defaultErrorEventSpy = jest.fn();
        document.body.addEventListener('aviflow:error', defaultErrorEventSpy);

        const btn1 = document.getElementById('btn-trigger-1');
        const originalUrl = btn1.getAttribute('data-url');
        btn1.setAttribute('data-url', testUrl.error);

        btn1.click();

        await new Promise(process.nextTick);

        expect(mockFetch).toHaveBeenCalledWith(testUrl.error, expect.any(Object));
        expect(defaultErrorEventSpy).toHaveBeenCalled();

        // Cleanup
        btn1.setAttribute('data-url', originalUrl);
        document.body.removeEventListener('aviflow:error', defaultErrorEventSpy);
    });
});
