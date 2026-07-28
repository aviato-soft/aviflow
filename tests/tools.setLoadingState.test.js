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

    test('tools / setLoadingState', async () => {
        const originalContent = 'Click me';
        mock.element.button.test.innerHTML = originalContent;

        // Test loading state ON
        aviflow.tools.setLoadingState(mock.element.button.test, true);
        expect(mock.element.button.test.classList.contains('pending')).toBe(true);
        expect(mock.element.button.test.disabled).toBe(true);
        expect(mock.element.button.test.hasAttribute('disabled')).toBe(true);
        expect(mock.element.button.test.style.opacity).toBe('0.6');
        expect(mock.element.button.test.style.pointerEvents).toBe('none');

        // Test loading state OFF
        aviflow.tools.setLoadingState(mock.element.button.test, false, originalContent);
        expect(mock.element.button.test.classList.contains('pending')).toBe(false);
        expect(mock.element.button.test.disabled).toBe(false);
        expect(mock.element.button.test.hasAttribute('disabled')).toBe(false);
        expect(mock.element.button.test.innerHTML).toBe(originalContent);
        expect(mock.element.button.test.style.opacity).toBe('');
        expect(mock.element.button.test.style.pointerEvents).toBe('');

        //Test branch: element.dataset['data-on-progress']
        mock.element.button.test.setAttribute('data-on-progress', 'testDataOnProgress');
        aviflow.tools.setLoadingState(mock.element.button.test, true);
        expect(mock.element.button.test.classList.contains('testDataOnProgress')).toBe(true);
    });
})