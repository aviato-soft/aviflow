import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/index.js';
import mock from './_mock.test.js';

describe('AviFlow Constructor Test Unit', () => {
    let aviflow;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        // No automatic initialization in beforeEach here since we want to test constructor options specifically
    });

    test('Should initialize with default options when no options are provided', () => {
        aviflow = new AviFlow();
        
        expect(aviflow.options.selector).toBe('[data-action="fetch"]');
        expect(aviflow.options.url).toBe('#');
        expect(aviflow.options.method).toBe('POST');
        expect(aviflow.options.pendingClass).toBe('pending');
    });

    test('Should initialize with custom options', () => {
        const customOptions = {
            selector: '.custom-selector',
            url: '/api/custom',
            method: 'GET',
            pendingClass: 'loading'
        };
        aviflow = new AviFlow(customOptions);
        
        expect(aviflow.options.selector).toBe('.custom-selector');
        expect(aviflow.options.url).toBe('/api/custom');
        expect(aviflow.options.method).toBe('GET');
        expect(aviflow.options.pendingClass).toBe('loading');
    });

    test('Should merge custom options with defaults', () => {
        const customOptions = {
            url: '/api/merged-url',
            method: 'PUT'
        };
        aviflow = new AviFlow(customOptions);
        
        expect(aviflow.options.selector).toBe('[data-action="fetch"]'); // From default
        expect(aviflow.options.url).toBe('/api/merged-url'); // Overridden
        expect(aviflow.options.method).toBe('PUT'); // Overridden
        expect(aviflow.options.pendingClass).toBe('pending'); // From default
    });

    test('Should initialize with default on hooks', () => {
        aviflow = new AviFlow();
        
        expect(typeof aviflow.on.success).toBe('function');
        expect(typeof aviflow.on.error).toBe('function');
    });

    test('Should call init() upon construction', () => {
        // Spy on prototype to see if init is called during constructor
        const spy = jest.spyOn(AviFlow.prototype, 'init');
        aviflow = new AviFlow();
        
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
