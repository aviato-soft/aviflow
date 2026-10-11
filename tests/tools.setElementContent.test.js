import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });

    test('tools / setElementContent', async () => {
        const content = {
            alert: "Alert click!",
            original: "Click Me!",
            success: "CLick for success!",
        };
        mock.element.button.test.innerHTML = content.original;
        mock.element.button.test.setAttribute('data-content-alert', content.alert);
        mock.element.button.test.setAttribute('data-content-original', content.original);
        mock.element.button.test.setAttribute('data-content-success', content.success);

        // Test no params
        let result = aviflow.tools.setElementContent();
        expect(result).toBeUndefined();

        // Test only element set:
        result = aviflow.tools.setElementContent(mock.element.button.test);
        expect(result).toBeUndefined();

        // Test change content to invalid context id:
        result = aviflow.tools.setElementContent(mock.element.button.test, false);
        expect(result).toBeUndefined();

        // Test current content not set yet, initialization:
        aviflow.tools.setElementContent(mock.element.button.test, 'original');
        expect(mock.element.button.test.innerHTML).toBe(content.original);
        expect(mock.element.button.test.classList.contains('original')).toBe(true);
        expect(mock.element.button.test.dataset.content).toBe('original');

        // Test change the same content:
        result = aviflow.tools.setElementContent(mock.element.button.test, 'original');
        expect(result).toBeUndefined();

        // Test change content to invalid dataset name:
        result = aviflow.tools.setElementContent(mock.element.button.test, 'aviato');
        expect(result).toBeUndefined();

        // Test setting success content
        aviflow.tools.setElementContent(mock.element.button.test, 'success');
        expect(mock.element.button.test.classList.contains('alert')).toBe(false);
        expect(mock.element.button.test.classList.contains('original')).toBe(false);
        expect(mock.element.button.test.classList.contains('success')).toBe(true);
        expect(mock.element.button.test.innerHTML).toBe(content.success);
    });


    // Bootstrap style
    test('tools / setElementContentBootstrap', async () => {
        const content = {
            primary: "Click Me!",
            success: "CLick for success!",
            warning: "We have an issue!"
        };
        mock.element.button.test.innerHTML = content.primary;
        mock.element.button.test.classList.add('btn');
        mock.element.button.test.classList.add('btn-primary');
        mock.element.button.test.setAttribute('data-content-btn-primary', content.primary);
        mock.element.button.test.setAttribute('data-content-btn-success', content.success);
        mock.element.button.test.setAttribute('data-content-btn-warning', content.warning);
              
        // Test setting success content
        expect(mock.element.button.test.classList.contains('btn')).toBe(true);

        aviflow.tools.setElementContent(mock.element.button.test, 'btn-warning');
        expect(mock.element.button.test.classList.contains('btn')).toBe(true);
        // be carefull data-content was not set to 'btn-primary' so the previous state remains!
        expect(mock.element.button.test.classList.contains('btn-primary')).toBe(true); 
        expect(mock.element.button.test.classList.contains('btn-warning')).toBe(true);
        expect(mock.element.button.test.classList.contains('btn-success')).toBe(false);
        expect(mock.element.button.test.innerHTML).toBe(content.warning);

        aviflow.tools.setElementContent(mock.element.button.test, 'btn-success');
        expect(mock.element.button.test.classList.contains('btn')).toBe(true);
        expect(mock.element.button.test.classList.contains('btn-primary')).toBe(true);
        expect(mock.element.button.test.classList.contains('btn-warning')).toBe(false);
        expect(mock.element.button.test.classList.contains('btn-success')).toBe(true);
        expect(mock.element.button.test.innerHTML).toBe(content.success);

        aviflow.tools.setElementContent(mock.element.button.test, 'btn-primary');
        expect(mock.element.button.test.classList.contains('btn')).toBe(true);
        expect(mock.element.button.test.classList.contains('btn-primary')).toBe(true);
        expect(mock.element.button.test.classList.contains('btn-warning')).toBe(false);
        expect(mock.element.button.test.classList.contains('btn-success')).toBe(false);
        expect(mock.element.button.test.innerHTML).toBe(content.primary);

    });        
})