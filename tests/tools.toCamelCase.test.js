import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Tools Test Unit', () => {
    const aviflow = new AviFlow()
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

        result = aviflow.tools.toCamelCase('a--');
        expected = 'a';
        expect(result).toEqual(expected);

        result = aviflow.tools.toCamelCase('-_-');
        expected = '';
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
})