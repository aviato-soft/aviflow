/**
 * @jest-environment node
 */

import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';

describe('AviFlow class (Node environment)', () => {

  test('AviFlow / constructor: Test if document is undefined', () => {
    // In the 'node' environment, document is naturally undefined
    let flow = new AviFlow({}, { autoInit: false });
    
    expect(flow.option.root).toBeNull();
  });
});