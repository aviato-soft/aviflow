import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';

describe('AviFlow class', () => {
  const originalDocument = global.document;

  test('Instantiate AviFlow Object', async () => {
    let flow = new AviFlow();
    expect(flow).toBeInstanceOf(AviFlow);
  });

  test('It not run init if autoinit is false', () => {
    let flow = new AviFlow({}, {autoInit: false});
    expect(flow).toBeInstanceOf(AviFlow);
  });
});