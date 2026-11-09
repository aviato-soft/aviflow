import { expect, jest, test } from '@jest/globals';
import AviText from '../../src/tools/AviText.js';

describe('AviText / toCamelCase', () => {

  test('Try to test all case in once', async () => {
        let result = AviText.toCamelCase("hello_world");
        let expected = "helloWorld";
        expect(result).toEqual(expected);

        result = AviText.toCamelCase("Convert-me-now", false);
        expected = "ConvertMeNow";
        expect(result).toEqual(expected);

        result = AviText.toCamelCase("CamelCase-test-case");
        expected = "camelCaseTestCase";
        expect(result).toEqual(expected);

        result = AviText.toCamelCase("pages count");
        expected = "pagesCount";
        expect(result).toEqual(expected);

        result = AviText.toCamelCase("__bizarre--mix");
        expected = "bizarreMix";
        expect(result).toEqual(expected);

        result = AviText.toCamelCase('a--');
        expected = 'a';
        expect(result).toEqual(expected);

        result = AviText.toCamelCase('-_-');
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toCamelCase([]);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toCamelCase(undefined);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toCamelCase(null);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toCamelCase({});
        expected = '';
        expect(result).toEqual(expected);
    });

});