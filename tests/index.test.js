import { expect, jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Test Unit', () => {
    test ('Instantiate AviFlow Object', async() => {
        let aviflow = new AviFlow();
        expect(aviflow).toBeInstanceOf(AviFlow);
    })


    test ('data-action', async () => {

    })

    test('AviFlow parameters test"', async () => {
        const options = {
            flow: 'selector',
            test: 'AviTest'
        }
        let aviflow = new AviFlow(options);
        
        const test = {
            datasetSelectorName: 'action',
            url: '#',
            method: 'POST',
            pendingClass: 'pending',
            ...options
        }
        const result = aviflow.options;

        expect(test).toStrictEqual(result);


/* Supported data-attributes on triggered elements:
 * @param [data-action="fetch"] 
 *  Mandatory for selecting the object click trigger.
 *  
 * @param [data-url] 
 *  The URL to fetch. Falls back to the element's `href` if not set.
 *  Optional attribute – if missing, page url is used.
 *  
 * @param [data-method] 
 *  HTTP method (e.g., GET, POST). 
 *  Defaults to `'POST'`.
 *  
 * @param [data-target] 
 *  CSS selector of a container whose innerHTML will be replaced with the response.
 *  If JSON content-type is returned it is `JSON.stringify()`d before insertion.
 * 
 * @param [data-param-*] 
 *  A collection of data-attributes prefixed `data-param-*`.
 *  All attributes are collected into a FormData object via `tools.formData(element)`
 *  and sent as the request body for non-GET methods.
 *  The `*` is replaced with the attribute name (e.g. `action`, `body`).
 * 
 * @param [data-parent]
 *  Get the parameters from parent.
 *  Trigger parameters will overwrite the parent parameters having same name.
 *  
 * @param [data-on-error]
 *  function to be called on error
 *  
 * @param [data-on-success]
 *  function to be called on success

/*            
        // Custom callback shared across cases — must be on options, not the instance directly
        aviflow.on.success = (data, element) => { console.log('[OK]', data, element); return true};
        aviflow.on.error = (data, element, error) => { console.error('[ERR]', data, element, error); return false};
*/

    });
});