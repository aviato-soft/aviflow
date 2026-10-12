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
        document.body.innerHTML = '<form method="POST"></form>';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });


    test('tools / getUrl', async () => {
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }
        
        // Missing element - get default
        let result = aviflow.tools.getUrl();
        expect(result).toBe('#');

        // Missing default
        aviflow.options.url = null;
        result = aviflow.tools.getUrl();
        expect(result).toBeNull();

        // We have element, but not url
        result = aviflow.tools.getUrl(mock.element.button.test);
        expect(result).toBeNull();

        // Missing element - get the default
        aviflow.options.url = '#default';
        result = aviflow.tools.getUrl();
        expect(result).toBe('#default');


        // Missing element.url, missing element href, try to get from parent
        mock.element.button.test.setAttribute('data-parent', 'form');
        result = aviflow.tools.getUrl(mock.element.button.test);
        expect(result).toBe('#default');


        // Missing element.url, missing element href, try to get from parent which has url
        const form = document.querySelector('form');
        form.setAttribute('data-url', '#form')
        mock.element.button.test.setAttribute('data-parent', 'form');
        result = aviflow.tools.getUrl(mock.element.button.test);
        expect(result).toBe('#form');

        //Check an anchor for url:
        mock.element.anchor = document.createElement('a');
        mock.element.anchor.setAttribute('href', '#anchor');
        result = aviflow.tools.getUrl(mock.element.anchor);
        expect(result).toBe('#anchor');

        // Usual case
        mock.element.button.test.setAttribute('data-url', '#button');
        result = aviflow.tools.getUrl(mock.element.button.test);
        expect(result).toBe('#button');
    });
})