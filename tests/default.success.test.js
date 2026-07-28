import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow default.success Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        aviflow = new AviFlow({});
    });

    test('Should dispatch aviflow:success event when default.success is called', () => {
        const element = document.createElement('div');
        const data = { message: 'success data' };
        const spy = jest.fn();

        element.addEventListener('aviflow:success', spy);

        aviflow.default.success(data, element);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0].detail).toEqual(data);
    });

    test('Should dispatch aviflow:success event even without data passed', () => {
        const element = document.createElement('div');
        const spy = jest.fn();

        element.addEventListener('aviflow:success', spy);

        aviflow.default.success(undefined, element);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0].detail).toBeNull();
    });
});
