import { expect, jest, test } from '@jest/globals';
import AviElement from '../../src/tools/AviElement.js';

describe('AviElement / setElementContent', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('should just works...', () => {
        expect(AviElement.getParams(null)).toEqual({});
    });

});