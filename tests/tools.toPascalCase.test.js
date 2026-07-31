import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Tools Test Unit', () => {
    const aviflow = new AviFlow()
    test('tools / toPascalCase(str)', () => {
        let result = aviflow.tools.toPascalCase("hello_world");
        let expected = "HelloWorld";
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase("Convert-me-now");
        expected = "ConvertMeNow";
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase("pascalCase-test-case");
        expected = "PascalCaseTestCase";
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase("pages count");
        expected = "PagesCount";
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase("__bizarre--mix");
        expected = "BizarreMix";
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase('a--');
        expected = 'A';
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase('-_-');
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase([]);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase(undefined);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase(null);
        expected = '';
        expect(result).toEqual(expected);

        result = aviflow.tools.toPascalCase({});
        expected = '';
        expect(result).toEqual(expected);
    });
})