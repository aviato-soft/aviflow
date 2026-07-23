// tools.test.js - Import kept for Jest file discovery (tests moved to index.test.js master suite)

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Tools Test Unit', () => {
    const mockElement = document.createElement('button');
    mockElement.setAttribute('id', 'button-test');
    mockElement.setAttribute('data-fetch', true);
    mockElement.setAttribute('data-url', '#');
    mockElement.setAttribute('data-on-pending', 'alert');
    mockElement.setAttribute('data-on-success', 'flow.fn.success');
    mockElement.setAttribute('data-on-test-eval', 'console.log("executed")');
    mockElement.setAttribute('data-on-test-error', 'throw new Error("callback-fail")');
    mockElement.setAttribute('data-on-test-args', 'function(data) { return data * 2; }');
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
        test: 'action'
    };

    //TEST 1 - executeCallback
    test('tools / executeCallback', async () => {
        const expected = undefined;
        const result = aviflow.tools.executeCallback(mockElement);
        expect(result).toEqual(expected);

        //empty dataset value → should return undefined
        const resultEmpty = aviflow.tools.executeCallback(mockElement, 'onError');
        expect(resultEmpty).toBeUndefined();

        //global function path exists in window → calls the function
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });
        aviflow.tools.executeCallback(mockElement, 'onPending');
        expect(alertSpy).toHaveBeenCalled();
        alertSpy.mockRestore();

        //dotted function path in window → calls the global namespace function
        const fakeFn = jest.fn();
        let fakeFlowRef;
        Object.defineProperty(window, 'flow', {
            get() {
                return (fakeFlowRef || (fakeFlowRef = { fn: { success: fakeFn } }));
            }
        });;
        aviflow.tools.executeCallback(mockElement, 'onSuccess');
        expect(fakeFn).toHaveBeenCalled();

        //code evaluation branch → dot-separated path resolves to non-function object property,
        //falls through and evaluates the string as JS code via new Function()
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        aviflow.tools.executeCallback(mockElement, 'onTestEval');
        expect(logSpy).toHaveBeenCalledWith('executed');

        //error handling → code evaluation throws an error,
        //the catch block returns the error as a return value (not undefined)
        const errResult = aviflow.tools.executeCallback(mockElement, 'onTestError');
        expect(errResult).toBeInstanceOf(Error);

        //arguments passed through → evaluated function receives args from spread parameter
//        const multiplyResult = aviflow.tools.executeCallback(mockElement, 'onTestArgs', 5);
//        expect(multiplyResult).toBe(10);
    });


    //TEST 2 - filterAttributes
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
    });;

    //TEST 3 - filterDataset (line 90)
    test('tools / filterDataset', async () => {
        // console.log(Object.entries(mockElement.dataset));
        const expectedNoPrefix = [
            ['fetch', 'true'],
            ['url', '#'],
            ['onPending', 'alert'],
            ['onSuccess', "flow.fn.success"],
            ['onTestEval', "console.log(\"executed\")"],
            ['onTestError', "throw new Error(\"callback-fail\")"],
            ["onTestArgs", "function(data) { return data * 2; }"],
            ['paramItem', 'test'],
            ['paramItem1', 'a'],
            ['paramItem2', 'b'],
            ['paramTest', 'action'],
            ['item', 'testItem'],
            ['test', 'testAction']
        ];
        const resultNoPrefix = aviflow.tools.filterDataset(mockElement, '');
        expect(resultNoPrefix).toStrictEqual(expectedNoPrefix);

        const expectedFilteredWithParam = [
            ['Item', 'test'],
            ['Item1', 'a'],
            ['Item2', 'b'],
            ['Test', 'action']
        ];
        const resultFilteredWithParam = aviflow.tools.filterDataset(mockElement, 'param');
        expect(resultFilteredWithParam).toStrictEqual(expectedFilteredWithParam);
    });;


    //TEST 4 - form entries:
    test('tools / formEntries', async () => {
        const expectedNoPrefix = {
            "fetch": "true",
            "item": "testItem",
            "onPending": "alert",
            "onSuccess": "flow.fn.success",
            "onTestArgs": "function(data) { return data * 2; }",
            "onTestError": "throw new Error(\"callback-fail\")",
            "onTestEval": "console.log(\"executed\")",
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
            "On-pending": "alert",
            "On-success": "flow.fn.success",
            "On-test-args": "function(data) { return data * 2; }",
            "On-test-eval": "console.log(\"executed\")",
            "On-test-error": "throw new Error(\"callback-fail\")",
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
    });;


    //TEST 5 - form data:
    test('tools / formData', async () => {
        const expected = new FormData();
        for (const [k, v] of Object.entries(testData)) {
            expected.append(k, v);
        }

        const result = aviflow.tools.formData(mockElement, 'param');

        expect(result).toStrictEqual(expected);
    });;


    //TEST 6 - Tools / IsEmptyObject
    test('tools / isEmptyObject(str)', async () => {
        let aviflow = new AviFlow();
        const result = [
            aviflow.tools.isEmptyObject({}),
            aviflow.tools.isEmptyObject([]),
            aviflow.tools.isEmptyObject(''),
            aviflow.tools.isEmptyObject(null),
            aviflow.tools.isEmptyObject(undefined),
            aviflow.tools.isEmptyObject({ name: 'Aviato Soft' }),
        ];
        expect(result).toStrictEqual([
            true,
            false,
            false,
            false,
            false,
            false
        ]);
    });;


    //TEST 7 - Tools Test - aviflow.tools.toCamelCase(str)
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
    });;


    //TEST 8 - Tools / toCapitalize
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
    });
});