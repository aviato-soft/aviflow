// tools.setDataEventsFromDataAction.test.js

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });


    test('Should split action ', async () => {
        mock.element.button.test.setAttribute('data-action', 'fetch|click');
        document.body.appendChild(mock.element.button.test);

        // for new elements there is not data-event set
        let result = mock.element.button.test.dataset.event;
        let expected = undefined;
        expect(result).toBe(expected);

        // after call must be data-event set
        // Check if data-event is missing or null
        aviflow.init();
        result = mock.element.button.test.dataset.event;
        expected = 'click';
        expect(result).toBe(expected);

        //data-event exists and it can not be overwritten by data-action 2nd parameter
        mock.element.button.test.setAttribute('data-action', 'fetch|change');
        aviflow.init();
        result = mock.element.button.test.dataset.event;
        expected = 'click';
        expect(result).toBe(expected);
        
    });


    test('Should split action, but missing action', async () => {

        mock.element.button.testNoFlow.setAttribute('data-action', undefined);
        document.body.appendChild(mock.element.button.testNoFlow);

        // after call must be data-event set
        aviflow.init();
        let result = mock.element.button.testNoFlow.dataset.event;
        let expected = undefined;
        expect(result).toBe(expected);
    });

})