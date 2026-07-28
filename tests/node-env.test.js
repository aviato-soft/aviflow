/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import AviFlow from '../src/index.js';

describe('AviFlow Node Environment Initialization', () => {
  let windowSpy;

  afterEach(() => {
    // Clean up spy if it was created during a test
    if (windowSpy) {
      windowSpy.mockRestore();
    }
  });

  it('should run in node without window', async () => {
    expect(typeof window).toBe('undefined');

    const module = await import('../src/index.js');
    expect(module.default || module.AviFlow).toBeDefined();

    const mockElement = {
      dataset: {
        onTestEval: 'conslole.log("executed")'
      }
    };

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    let aviflow = new AviFlow();
    aviflow.tools.executeCallback(mockElement, 'onTestEval');
    
    expect(logSpy).not.toHaveBeenCalled();
    
  });
});