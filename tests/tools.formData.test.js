import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {

    const formDataToObject = (formData) => {
        if (!formData) return {};

        const values = {};
        formData.forEach((value, key) => {
            if (!values[key]) {
                values[key] = [];
            }
            values[key].push(value);
        });

        const sortedKeys = Object.keys(values).sort();
        const obj = {};
        sortedKeys.forEach(key => {
            obj[key] = values[key];
        });

        return obj;
    };

    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });

    if (!document.getElementById('button-test-simple')) {
        mock.element.button.test.setAttribute('data-param-item', 'test');
        mock.element.button.test.setAttribute('data-param-item1', 'a');
        mock.element.button.test.setAttribute('data-param-item2', 'b');
        mock.element.button.test.setAttribute('data-param-test', 'action');
        document.body.setAttribute('data-param-item1', 'Body-A');
        document.body.setAttribute('data-param-itemBody', 'Body-B');
    } else {
        console.log('Missing mock #button-test-simple');
        return false;
    }


    test('empty element', async () => {
        const expected = new FormData();
        let result = aviflow.tools.formData(null);
        expect(result).toStrictEqual(expected);
        
        result = aviflow.tools.formData(undefined);
        expect(result).toStrictEqual(expected);

        result = aviflow.tools.formData
    });


    test('simple formData', async () => {
        const testData = {
            item: 'test',
            item1: 'a',
            item2: 'b',
            test: 'action'
        };
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        document.body.appendChild(mock.element.button.test);
        
        const result = aviflow.tools.formData(mock.element.button.test);

        expect(result).toStrictEqual(expected);
    });


    test('parent data- attributes', async () => {
        const testData = {
            item: 'test',
            item1: 'a',
            item2: 'b',
            itembody: 'Body-B',
            test: 'action'
        };
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        mock.element.button.test.setAttribute('data-parent', 'body');
        document.body.appendChild(mock.element.button.test);

        let result = aviflow.tools.formData(mock.element.button.test, 'param', true);
        expect(formDataToObject(result)).toStrictEqual(formDataToObject(expected));
    });


    test('missing parent element from dom', async () => {
        const testData = {
            item: 'test',
            item1: 'a',
            item2: 'b',
            test: 'action'
        };
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        mock.element.button.test.setAttribute('data-parent', 'x-body');
        document.body.appendChild(mock.element.button.test);

        let result = aviflow.tools.formData(mock.element.button.test, 'param', true);
        expect(formDataToObject(result)).toStrictEqual(formDataToObject(expected));
    });


     test('tools / formData / skips null and undefined values', () => {
        const spy = jest.spyOn(aviflow.tools, 'formEntries').mockReturnValue({
            valid: 'value',
            nullVal: null,
            undefVal: undefined
        });

        const result = aviflow.tools.formData(mock.element.button.test);

        expect(result.get('valid')).toBe('value');
        expect(result.has('nullVal')).toBe(false);
        expect(result.has('undefVal')).toBe(false);

        spy.mockRestore();
    });



    

/*
    test('should handle null and undefined values using mock', async () => {
        mock.element.button.test.setAttribute('data-param', null);
        document.body.appendChild(mock.element.button.test);


        const testData = {
            item: 'test',
            item1: 'a',
            item2: 'b',
            test: 'action',
        };
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        let result = aviflow.tools.formData(mock.element.button.test);
        expect(formDataToObject(result)).toStrictEqual(formDataToObject(expected));
/*

        // Mock the element to return specific values for attributes
        const testElement = mock.element.button.test;
        testElement.getAttribute = jest.fn((attr) => {
            if (attr === 'data-param-null') return null; // Simulates null attribute
            if (attr === 'data-param-undefined') return undefined; // Simulates missing attribute value
            return null;
        });

        // Setup the element in the body
        document.body.appendChild(testElement);

        // Test case 1: Null value simulation
        const resultNull = aviflow.tools.formData(testElement);
        const nullValue = formDataToObject(resultNull.get('param-null'));
        expect(nullValue).toEqual({}); // Or assert that the key is not in the object

        // Test case 2: Undefined value simulation
        // For undefined, we rely on the mocked getAttribute returning undefined,
        // but since getAttribute usually returns null if missing, we must mock the internal reading mechanism if possible,
        // or rely on the attribute being truly absent if the internal logic handles missing attributes correctly.
        // Assuming the mock above handles 'data-param-undefined' being requested.
        const resultUndefined = aviflow.tools.formData(testElement);
        const undefinedValue = formDataToObject(resultUndefined.get('param-undefined'));
        expect(undefinedValue).toEqual({});

        // Clean up the mock
        testElement.getAttribute.mockRestore();
        document.body.removeChild(testElement);

    });
*/
})