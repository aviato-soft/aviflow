import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Tools Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();
        // Clear document body to prevent interference between tests
        document.body.innerHTML = '';
        // Initialize AviFlow instance
        aviflow = new AviFlow();
    });


    test('tools / getUniqueEventsBySelector', async () => {
        document.body.appendChild(mock.element.button.test);            //missing data-event
        document.body.appendChild(mock.element.button.testNoFlow);      //missing data-action but exists onclick event

        mock.element.button.testClick = document.createElement('button');       //data-action + data-event = click
        mock.element.button.testClick.setAttribute('data-action', 'flow');
        mock.element.button.testClick.setAttribute('data-event', 'click');
        document.body.appendChild(mock.element.button.testClick);

        mock.element.button.testClick2 = document.createElement('button');       //data-action + data-event = click
        mock.element.button.testClick2.setAttribute('data-action', 'flow');      //duplicate - must be unique
        mock.element.button.testClick2.setAttribute('data-event', 'click');
        document.body.appendChild(mock.element.button.testClick2);

        mock.element.button.testChange = document.createElement('button');      //data-action + data-event = change
        mock.element.button.testChange.setAttribute('data-event', 'change');
        mock.element.button.testChange.setAttribute('data-action', '');
        document.body.appendChild(mock.element.button.testChange);

        const result = aviflow.tools.getUniqueEventsBySelector();
        expect(result).toStrictEqual(['click', 'change']);
    });
})