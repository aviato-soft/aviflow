// tests/index.test.js

import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Test Unit', () => {
    test ('Instantiate AviFlow Object', async() => {
        let aviflow = new AviFlow();
        expect(aviflow).toBeInstanceOf(AviFlow);
    })

    test('AviFlow parameters test"', async () => {
        const options = {
            flow: 'selector',
            test: 'AviTest'
        }
        let aviflow = new AviFlow(options);
        
        const test = {
            selector: '[data-action="fetch"]',
            url: '#',
            method: 'POST',
            pendingClass: 'pending',
            ...options
        }
        const result = aviflow.options;

        expect(test).toStrictEqual(result);

/*            
        // Custom callback shared across cases — must be on options, not the instance directly
        aviflow.on.success = (data, element) => { console.log('[OK]', data, element); return true};
        aviflow.on.error = (data, element, error) => { console.error('[ERR]', data, element, error); return false};
*/

    });
});