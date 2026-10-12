import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '<div id="output">Original content</div>';        
        
        // Initialize AviFlow instance
        aviflow = new AviFlow();
        aviflow.fn.test = function(e) {
            return 'Expect the unexpected!';
        }
    });

    test('tools / setTargetContent', async () => {
        // Test button
        if (!document.getElementById('button-test-simple')) {
            document.body.appendChild(mock.element.button.test);
        }

        // TEST Exceptions:

        // Test no params
        let result = aviflow.tools.setTargetContent();
        expect(result).toBeUndefined();

        // Test only element but no data:
        result = aviflow.tools.setTargetContent(mock.element.button.test);
        expect(result).toBeUndefined();

        // Test the element and data, but no target:
        result = aviflow.tools.setTargetContent(mock.element.button.test, true);
        expect(result).toBeUndefined();

        // Test the elemenat and data, but invalid target
        mock.element.button.test.setAttribute('data-target', 'aviato');
        result = aviflow.tools.setTargetContent(mock.element.button.test, true);
        expect(result).toBeUndefined();

        
        // The real test:
        const outputElement = document.getElementById('output');
        mock.element.button.test.setAttribute('data-target', '#output');

        //data as sctring with html content
        aviflow.tools.setTargetContent(mock.element.button.test, '<b>Great!</b>');
        result = outputElement.innerHTML
        expect(result).toBe('<b>Great!</b>');

        //null object data
        aviflow.tools.setTargetContent(mock.element.button.test, null);
        result = outputElement.innerHTML
        expect(result).toBe('null');

        //empty object data
        aviflow.tools.setTargetContent(mock.element.button.test, {});
        result = outputElement.innerHTML
        expect(result).toBe('{}');

        //empty array data
        aviflow.tools.setTargetContent(mock.element.button.test, []);
        result = outputElement.innerHTML
        expect(result).toBe('[]');

        //data with html content
        aviflow.tools.setTargetContent(mock.element.button.test, {html: '<b>Great!</b>'});
        result = outputElement.innerHTML
        expect(result).toBe('<b>Great!</b>');

        //data with invalid html content
        aviflow.tools.setTargetContent(mock.element.button.test, {html: []});
        result = outputElement.innerHTML
        expect(result).toBe('[]');

        //data with invalid object
        aviflow.tools.setTargetContent(mock.element.button.test, false);
        result = outputElement.innerHTML
        expect(result).toBe('false');


        // The real call test:
        mock.element.button.test.setAttribute('data-action', 'test');
        mock.element.button.test.click();
        aviflow.init();
        //expect(result).toBe('Expect the unexpected!');

    });  
})