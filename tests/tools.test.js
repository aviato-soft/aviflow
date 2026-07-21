// tools.test.js - Import kept for Jest file discovery (tests moved to index.test.js master suite)

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Tools Test Unit', () => {
    const mockElement = document.createElement('button');
    mockElement.setAttribute('id', 'button-test');
    mockElement.setAttribute('data-fetch', true);
    mockElement.setAttribute('data-url', '#');
    mockElement.setAttribute('data-param-item', 'test');
    mockElement.setAttribute('data-param-item1', 'a');
    mockElement.setAttribute('data-param-item2', 'b');
    mockElement.setAttribute('data-param-test', 'action');
    mockElement.dataset.item = 'testItem';
    mockElement.dataset.test = 'testAction';


    let aviflow = new AviFlow();
    
    let testData = { 
        item: 'test',
        item1: 'a',
        item2: 'b',
        test: 'action' };
    

    //TEST 1 - filterAttributes
    test('tools / filterAttributes', async () => {
        const result = aviflow.tools.filterAttributes(mockElement, 'data-param-');
        expect(result).toStrictEqual([
            ['item', 'test'],
            ['item1', 'a'],
            ['item2', 'b'],
            ['test', 'action']
        ]);

        const resultCapitalized = aviflow.tools.filterAttributes(mockElement, 'data-param-', true);
        expect(resultCapitalized).toStrictEqual([
            ['Item', 'test'],
            ['Item1', 'a'],
            ['Item2', 'b'],
            ['Test', 'action']
        ]);
    });

    //TEST 2 - filterDataset (line 90)
    test('tools / filterDataset', async () => {
        // console.log(Object.entries(mockElement.dataset));
        const expectedNoPrefix = [
            [ 'fetch', 'true' ],
            [ 'url', '#' ],
            [ 'paramItem', 'test' ],
            [ 'paramItem1', 'a' ],
            [ 'paramItem2', 'b' ],
            [ 'paramTest', 'action' ],
            [ 'item', 'testItem' ],
            [ 'test', 'testAction' ]
        ];
        const resultNoPrefix = aviflow.tools.filterDataset(mockElement, '');
        expect(resultNoPrefix).toStrictEqual(expectedNoPrefix);

        const expectedFilteredWithParam = [
            [ 'Item', 'test' ],
            [ 'Item1', 'a' ],
            [ 'Item2', 'b' ],
            [ 'Test', 'action' ]
        ];
        const resultFilteredWithParam = aviflow.tools.filterDataset(mockElement, 'param');
        expect(resultFilteredWithParam).toStrictEqual(expectedFilteredWithParam);
    });


    //TEST 3 - form entries:
    test('tools / formEntries', async () => {
        const expectedNoPrefix = {
            "fetch": "true", 
            "item": "testItem", 
            "paramItem": "test", 
            "paramItem1": "a", 
            "paramItem2": "b", 
            "paramTest": "action", 
            "test": "testAction", 
            "url": "#"
        };

        let result = aviflow.tools.formEntries(mockElement);
        expect(result).toStrictEqual(expectedNoPrefix);

        const expectedFilteredWithParam = {
            "Item": "test", 
            "Item1": "a", 
            "Item2": "b", 
            "Test": "action",
        }
        result = aviflow.tools.formEntries(mockElement, 'param');
        expect(result).toStrictEqual(expectedFilteredWithParam);

        const expectedNoPrefixWithAttributes = {
            "Fetch": "true", 
            "Item": "testItem", 
            "Param-item": "test", 
            "Param-item1": "a", 
            "Param-item2": "b", 
            "Param-test": "action", 
            "Test": "testAction", 
            "Url": "#"
        };
        result = aviflow.tools.formEntries(mockElement, '', 'attributes');
        expect(result).toStrictEqual(expectedNoPrefixWithAttributes);

        result = aviflow.tools.formEntries(mockElement, 'param', 'attributes');
        expect(result).toStrictEqual(expectedFilteredWithParam);

        result = aviflow.tools.formEntries(mockElement, 'param', 'test');
        expect(result).toStrictEqual({});
    });


    //TEST 4 - form data:
    test('tools / formData', async () => {
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        const result = aviflow.tools.formData(mockElement, 'param');

        expect(result).toStrictEqual(expected);
    });


    //TEST 5 - Tools / IsEmptyObject
    test('tools / isEmptyObject(str)', async () => {
        let aviflow = new AviFlow();
        const result = [
            aviflow.tools.isEmptyObject({}),
            aviflow.tools.isEmptyObject([]),
            aviflow.tools.isEmptyObject(''),
            aviflow.tools.isEmptyObject(null),
            aviflow.tools.isEmptyObject(undefined),
            aviflow.tools.isEmptyObject({name: 'Aviato Soft'}),
        ];
        expect(result).toStrictEqual([
            true,
            false,
            false,
            false,
            false,
            false
        ]);
    });


    //TEST 6 - Tools Test - aviflow.tools.toCamelCase(str)
    test('tools / toCamelCase(str)', async () => {
        let result = aviflow.tools.toCamelCase("hello_world");
        let expected = "helloWorld";
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase("Convert-me-now");
        expected = "convertMeNow";
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase("pages count");
        expected = "pagesCount";
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase("__bizarre--mix");
        expected = "bizarreMix";
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase([]);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase(undefined);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase(null);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase({});
        expected = '';
        expect(result).toEqual(expected);
    });
    

    //TEST 7 - Tools / toCapitalize
    test('tools / toCapitalize', async () => {
        let result = aviflow.tools.toCapitalize('hello!');
        let expected = 'Hello!';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCapitalize('hello world!');
        expected = 'Hello world!';
        expect(result).toEqual(expected);


        result = aviflow.tools.toCapitalize(' bye space!');
        expected = 'Bye space!';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCapitalize('_bye underscore!');
        expected = 'Bye underscore!';
        expect(result).toEqual(expected);
    })
});