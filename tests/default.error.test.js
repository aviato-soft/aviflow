import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow default.error Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        aviflow = new AviFlow({});
    });

    test('Should dispatch aviflow:error event when default.error is called', () => {
        const element = document.createElement('div');
        const data = { message: 'some error data' };
        const error = new Error('Test error');
        const spy = jest.fn();

        element.addEventListener('aviflow:error', spy);

        aviflow.default.error(data, element, error);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0].detail).toEqual(data);
        expect(spy.mock.calls[0][0].error).toBe(error);
    });

    test('Should dispatch aviflow:error event even without data or error passed', () => {
        const element = document.createElement('div');
        const spy = jest.fn();

        element.addEventListener('aviflow:error', spy);

        aviflow.default.error(undefined, element, undefined);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0][0].detail).toBeNull();
        expect(spy.mock.calls[0][0].error).toBeUndefined();
    });
});
