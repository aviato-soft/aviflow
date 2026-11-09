import { expect, jest, test } from '@jest/globals';
import AviText from '../../src/tools/AviText.js';

describe('AviText / toCapitalize', () => {


    test('tools / toCapitalize', async () => {
        let result = AviText.toCapitalize('hello!');
        let expected = 'Hello!';
        expect(result).toEqual(expected);

        result = AviText.toCapitalize('hello world!');
        expected = 'Hello world!';
        expect(result).toEqual(expected);


        result = AviText.toCapitalize(' bye space!');
        expected = 'Bye space!';
        expect(result).toEqual(expected);

        result = AviText.toCapitalize('_bye underscore!');
        expected = 'Bye underscore!';
        expect(result).toEqual(expected);
    });
});