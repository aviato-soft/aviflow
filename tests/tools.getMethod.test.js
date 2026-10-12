// tools.getUniqueEventsBySelector.test.js

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '<form method="POST"></form><div id="test-div"></div><div id="test-put" data-method="PUT"></div>';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });


    test('tools / getMethod', async () => {
/*
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }
*/        
        // Missing element - get default
        let result = aviflow.tools.getMethod();
        expect(result).toBe('POST');

        // Missing default
        aviflow.options.method = null;
        result = aviflow.tools.getMethod();
        expect(result).toBeNull();

        // We have element, but not method
        result = aviflow.tools.getMethod(mock.element.button.test);
        expect(result).toBeNull();

        const form = document.querySelector('form');
        result = aviflow.tools.getMethod(form);
        expect(result).toBe('POST');
        
        
        // Missing element - get the default
        aviflow.options.method = 'POST';
        result = aviflow.tools.getMethod();
        expect(result).toBe('POST');


        // Missing element.method, missing element attribute method, try to get from parent
        mock.element.button.test.setAttribute('data-parent', 'form');
        result = aviflow.tools.getMethod(mock.element.button.test);
        expect(result).toBe('POST');

        // Missing element.method, missing element attribute method, try to get from parent, missing in parent
        mock.element.button.test.setAttribute('data-parent', '#test-div');
        result = aviflow.tools.getMethod(mock.element.button.test);
        expect(result).toBe('POST');

        // Missing element.method, missing element attribute method, try to get from parent, parent with data-method set
        mock.element.button.test.setAttribute('data-parent', '#test-put');
        result = aviflow.tools.getMethod(mock.element.button.test);
        expect(result).toBe('PUT');

/*
        // Missing element.url, missing element href, try to get from parent which has url
        form = document.querySelector('form');
        form.setAttribute('data-url', '#form')
        mock.element.button.test.setAttribute('data-parent', 'form');
        result = aviflow.tools.getUrl(mock.element.button.test);
        expect(result).toBe('#form');

        //Check an anchor for url:
        mock.element.anchor = document.createElement('a');
        mock.element.anchor.setAttribute('href', '#anchor');
        result = aviflow.tools.getUrl(mock.element.anchor);
        expect(result).toBe('#anchor');
*/
        // Usual case
        mock.element.button.test.setAttribute('data-method', 'GET');
        result = aviflow.tools.getMethod(mock.element.button.test);
        expect(result).toBe('GET');

    });
})