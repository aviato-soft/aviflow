import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;
/*
    const htmlBody = `
<button id="btn-trigger-get" data-action="fetch" data-method="get" data-url="data:application/json">click</button>
<div id="output">Original content</div>`;

    
    let mockFetch;
*/
    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '<div id="output">Original content</div>';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });

    test('Simple test with url set on object creation', async () => {
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }
        aviflow.options.url = mock.url.options;

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.options, expect.any(Object));
    });


    test('Simple trigger elements having data-action="fetch" and text response', async () => {
        mock.element.button.test.setAttribute('data-url', mock.url.text);
        mock.element.button.test.setAttribute('data-target', "#output");
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        mock.element.button.test.click();
        
        // Assert fetch was called correctly
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.text, expect.any(Object));

        // Wait for promises to resolve and DOM updates
        await new Promise(process.nextTick);

        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(mock.expect.text);
    });


    test('Simple trigger elements having data-action="fetch" and invalid response element', async () => {
        mock.element.button.test.setAttribute('data-url', mock.url.text);
        mock.element.button.test.setAttribute('data-target', "#output-missing");
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        mock.element.button.test.click();
        
        // Assert fetch was called correctly
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.text, expect.any(Object));

        // Wait for promises to resolve and DOM updates
//        await new Promise(process.nextTick);

//        const output = document.getElementById('output');
//        expect(output.innerHTML).toBe(output.innerHTM);
    });


    test('Should fall back to href attribute if data-url is missing on anchor tags', async () => {
        mock.element.button.link = document.createElement('a');
        mock.element.button.link.setAttribute('data-action', 'fetch');
        mock.element.button.link.setAttribute('href', mock.url.href);
        document.body.appendChild(mock.element.button.link);

        mock.element.button.link.click();

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.href, expect.any(Object));
    });


    test('Simple trigger elements having data-action="fetch" and json response', async () => {
        mock.url.json = mock.url.json + JSON.stringify(mock.expect.json);
        mock.element.button.test.setAttribute('data-url', mock.url.json);
        mock.element.button.test.setAttribute('data-target', "#output");
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.json, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(mock.expect.json.html);
    });


    test('Simple trigger elements having data-action="fetch" and json response no html response', async () => {
        mock.expect.json.html = null;
        
        mock.element.button.test.setAttribute('data-url', mock.url.json);
        mock.element.button.test.setAttribute('data-target', "#output");
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.json, expect.any(Object));

        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        const result = output.innerHTML;
        const expected = JSON.stringify(mock.expect.json);
        expect(result).toBe(expected);
    });


    test('Simple trigger action on success', async () => {
        mock.expect.json.html = '<p>Success API Response</p>';
        mock.url.json = mock.url.json + JSON.stringify(mock.expect.json);
        
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        const actionSuccess = alert('success');

        mock.element.button.test.setAttribute('data-url', mock.url.json);
        mock.element.button.test.setAttribute('data-on-success', 'actionSuccess');
        mock.element.button.test.setAttribute('data-target', "#output");

        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        // Assert fetch was invoked with correct parameters
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.json, expect.any(Object));
        
        // Wait for microtasks/promises to resolve so DOM updates
        await new Promise(process.nextTick);

        // Assert HTML injection into target container worked flawlessly
        const output = document.getElementById('output');
        expect(output.innerHTML).toBe(mock.expect.json.html);
        expect(alertSpy).toHaveBeenCalled();
    });


    test('Should throw error for non-ok response and call custom/default error handlers', async () => {
        // Default Error Handler (via btn-trigger-1, dynamically setting data-url to error url)
        const defaultErrorEventSpy = jest.fn();
        document.body.addEventListener('aviflow:error', defaultErrorEventSpy);

        mock.element.button.test.setAttribute('data-url', mock.url.error);
        mock.element.button.test.setAttribute('data-target', "#output");
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        await new Promise(process.nextTick);

        expect(mock.fetch).toHaveBeenCalledWith(mock.url.error, expect.any(Object));
        expect(defaultErrorEventSpy).toHaveBeenCalled();



    // Custom Error Handler (via btn-trigger-error with data-on-error="actionError")
        mock.element.button.test.setAttribute('data-on-error', 'actionError');
        
        const customErrorSpy = jest.fn();
        window.actionError = customErrorSpy;

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        await new Promise(process.nextTick);

        expect(mock.fetch).toHaveBeenCalledWith(mock.url.error, expect.any(Object));
        expect(customErrorSpy).toHaveBeenCalled();

        // Cleanup
        document.body.removeEventListener('aviflow:error', defaultErrorEventSpy);
    });


    test('Should set Content-Type to application/json when method is GET', async () => {

        mock.element.button.test.setAttribute('data-url', mock.url.json);
        mock.element.button.test.setAttribute('data-method', 'get');

        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // Simulate a user click on the trigger button
        mock.element.button.test.click();

        // Assert fetch was invoked with correct parameters including Content-Type
        expect(mock.fetch).toHaveBeenCalledWith(mock.url.json, expect.objectContaining({
            headers: expect.objectContaining({
                'Content-Type': 'application/json; charset=UTF-8'
            }),
            method: 'GET'
        }));
    });


    test('should handle null response headers gracefully', async () => {
      mock.element.button.test.setAttribute('data-url', mock.url.text);
      if (!document.getElementById('button-test-simple')) {
        document.body.appendChild(mock.element.button.test);
      }

      // Mock fetch returning a response without headers property or with headers as null
      mock.fetch.mockImplementationOnce(() => {
          return Promise.resolve({
              ok: true,
              status: 200,
              headers: null, // This will trigger the branch in line 376
              text: () => Promise.resolve('some text'),
              json: () => Promise.reject(new Error('Not JSON')),
          });
      });

      mock.element.button.test.click();

      await new Promise(process.nextTick);

      expect(mock.fetch).toHaveBeenCalled();
    });
})