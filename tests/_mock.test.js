import { expect, jest, test } from '@jest/globals';

const mock = {
    element: {
        button: {}
    },
    url: {
        "json": 'data:application/json;charset=utf-8,',
        'href': '/api/fallback-url',
        "test": '/api/test',
        "text": '/api/text',
        'error': '/api/error-500',
        'options': '/api/options/url'
    },
    expect: {
        bool: true,
        json: {
            success: true,
            html: '<p>Success API Response</p>',
            data: {
                message: 'Success API Response!',
                orders: [
                    {
                        id: 1,
                        name: "Test order A"
                    },
                    {
                        id: 2,
                        name: "Test order B"
                    }
                ]
            }
        },
        text: '<span>Success API Response</span>',
    }
};

mock.element.button.test = document.createElement('button');
mock.element.button.test.setAttribute('id', 'button-test-simple');
mock.element.button.test.setAttribute('data-action', 'fetch');

mock.element.button.testNoFlow = document.createElement('button');
mock.element.button.testNoFlow.setAttribute('id', 'button-test-noflow');
mock.element.button.testNoFlow.setAttribute('onClick', 'alert("click")');


mock.fetch = jest.fn((url) => {
    const isJson = typeof url === 'string' && (url.includes('json') || url.includes('application/json'));
    const isError = typeof url === 'string' && url.includes('error');
    return Promise.resolve({
        ok: !isError,
        status: isError ? 500 : 200,
        headers: new Headers({
            'content-type': isJson ? 'application/json' : 'text/html'
        }),
        text: () => Promise.resolve(isError ? 'Error occurred' : mock.expect.text),
        json: () => Promise.resolve(mock.expect.json)
    });
});


test('Mock file provides dummy test to satisfy Jest requirement', () => {
    expect(true).toBe(true);
});


global.fetch = mock.fetch;

export default mock;