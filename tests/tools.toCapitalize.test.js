import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Tools Test Unit', () => {
    const aviflow = new AviFlow()
    
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
})