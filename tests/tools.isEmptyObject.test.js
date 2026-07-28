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

    test('tools / isEmptyObject', async () => {
        let result = aviflow.tools.isEmptyObject({});
        let expected = true;
        expect(result).toBe(expected);
        
        result = aviflow.tools.isEmptyObject([]);
        expected = false;
        expect(result).toBe(expected);

        result = aviflow.tools.isEmptyObject('');
        expect(result).toBe(expected);

        result = aviflow.tools.isEmptyObject(null);
        expect(result).toBe(expected);

        result = aviflow.tools.isEmptyObject(undefined);
        expect(result).toBe(expected);

        result = aviflow.tools.isEmptyObject({company: 'Aviato Soft'});
        expect(result).toBe(expected);
    });
})