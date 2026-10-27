import { expect, jest, test } from '@jest/globals';
import AviText from '../../src/tools/AviText.js';

describe('AviText / toPascalCase', () => {
    let expected;
    let result;

    test('tools / toPascalCase(str)', () => {
        result = AviText.toPascalCase("hello_world");
        expected = "HelloWorld";
        expect(result).toEqual(expected);

        result = AviText.toPascalCase("Convert-me-now");
        expected = "ConvertMeNow";
        expect(result).toEqual(expected);

        result = AviText.toPascalCase("pascalCase-test-case");
        expected = "PascalCaseTestCase";
        expect(result).toEqual(expected);

        result = AviText.toPascalCase("pages count");
        expected = "PagesCount";
        expect(result).toEqual(expected);

        result = AviText.toPascalCase("__bizarre--mix");
        expected = "BizarreMix";
        expect(result).toEqual(expected);

        result = AviText.toPascalCase('a--');
        expected = 'A';
        expect(result).toEqual(expected);

        result = AviText.toPascalCase('-_-');
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toPascalCase([]);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toPascalCase(undefined);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toPascalCase(null);
        expected = '';
        expect(result).toEqual(expected);

        result = AviText.toPascalCase({});
        expected = '';
        expect(result).toEqual(expected);
    });
});