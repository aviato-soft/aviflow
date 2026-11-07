import { expect, jest, test } from '@jest/globals';
import AviFlow from '../src/AviFlow.js';

// ---------------------------------------------------------------------------
// Test environment helpers
// ---------------------------------------------------------------------------

// jsdom does not always provide Headers; add a minimal polyfill when missing.
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    #map = new Map();
    constructor(init = {}) {
      Object.entries(init).forEach(([k, v]) => this.append(k, v));
    }
    append(name, value) {
      const key = String(name).toLowerCase();
      this.#map.set(key, this.#map.has(key) ? `${this.#map.get(key)}, ${value}` : String(value));
    }
    set(name, value) {
      this.#map.set(String(name).toLowerCase(), String(value));
    }
    get(name) {
      const key = String(name).toLowerCase();
      return this.#map.has(key) ? this.#map.get(key) : null;
    }
    has(name) {
      return this.#map.has(String(name).toLowerCase());
    }
  };
}

// Builds a fake fetch Response.
const makeResponse = ({ contentType = 'application/json', json = {}, text = '', jsonError = null } = {}) => ({
  headers: {
    get: jest.fn((name) => (String(name).toLowerCase() === 'content-type' ? contentType : null))
  },
  json: jest.fn(() => (jsonError ? Promise.reject(jsonError) : Promise.resolve(json))),
  text: jest.fn(() => Promise.resolve(text))
});

// Returns [url, init] of the first fetch call.
const fetchCall = () => global.fetch.mock.calls[0];



describe('AviFlow / Examples', () => {


  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(makeResponse());
  });


  test('Example 01: Full Flow', () => {
    document.body.innerHTML = `
<div class="form">
  <label for="input-1">Type text to transform (event: input):</label>
  <input type="text" id="input-1" data-flow="input -> transformText -> #output-1" placeholder="Type something here...">
</div>

<div class="output" id="output-1">
  <em>Output will appear here as you type...</em>
</div>`;
    const flow = new AviFlow({
      transformText: (element) => {
        const value = element.value.trim();
        if (!value) return '<em>Output will appear here as you type...</em>';
        return `<strong>Uppercase:</strong> ${value.toUpperCase()} | <strong>Length:</strong> ${value.length}`;
      },
    });

    const trigger = document.querySelector('#input-1');
    const target = document.querySelector('#output-1');

    // Simulate input on the trigger element
    const simulatedValue = 'Hello!';
    trigger.value = simulatedValue;
    const inputEvent = new Event('input', { bubbles: true });
    trigger.dispatchEvent(inputEvent);

    // Add assertion here to verify the flow worked, e.g.
    expect(target.innerHTML).toContain(simulatedValue.toUpperCase());

  });



  test('Example 02: Default Event (Click)', () => {
    document.body.innerHTML = `
<div class="form">
  <button id="trigger-2" data-flow="generateTimestamp -> #output-2">Generate Timestamp</button>
</div>

<div class="output" id="output-2">
  <em>Click button to see timestamp...</em>
</div>`;

    const flow = new AviFlow({
      generateTimestamp: () => {
        const now = new Date();
        return `<strong>Current Time:</strong> ${now.toLocaleTimeString()} (${now.toLocaleDateString()})`;
      }
    });
    const trigger = document.getElementById('trigger-2');
    const target = document.querySelector('#output-2');

    // Simulate click on the trigger element
    trigger.click();

    // Add assertion here to verify the flow worked.
    // Since the timestamp is dynamic, we check if the output contains the expected format.
    expect(target.innerHTML).toContain('Current Time:');

  });


  test('Example 03: No target', () => {
    document.body.innerHTML = `
<div class="form">
  <button id="trigger-3" data-flow="click -> alertTimestamp -|">Alert Timestamp</button>
</div>`;
    const flow = new AviFlow({
      alertTimestamp: () => {
        const now = new Date();
        alert(`Current Time: ${now.toLocaleTimeString()} (${now.toLocaleDateString()})`);
      }
    });
    const trigger = document.getElementById('trigger-3');

    // Mock alert for testing
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => { });

    // Simulate click on the trigger element
    trigger.click();

    // Assert that alert was called with the correct message format
    expect(mockAlert).toHaveBeenCalledTimes(1);
    const alertMessage = mockAlert.mock.calls[0][0];
    expect(alertMessage).toMatch(/Current Time:.*$/);

    // Restore alert
    mockAlert.mockRestore();
  });


  test('Example 04: Action only flow', () => {
    document.body.innerHTML = `
<div class="form">
  <button id="trigger-4" data-flow="alertTimestamp">Alert Timestamp</button>
</div>`;
    const flow = new AviFlow({
      alertTimestamp: () => {
        const now = new Date();
        alert(`Current Time: ${now.toLocaleTimeString()} (${now.toLocaleDateString()})`);
      }
    });
    const trigger = document.getElementById('trigger-4');

    // Mock alert for testing
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => { });

    // Simulate click on the trigger element
    trigger.click();

    // Assert that alert was called with the correct message format
    expect(mockAlert).toHaveBeenCalledTimes(1);
    const alertMessage = mockAlert.mock.calls[0][0];
    expect(alertMessage).toMatch(/Current Time:.*$/);

    // Restore alert
    mockAlert.mockRestore();
  });


  test('Example 05: Multiple flows per element', () => {
    document.body.innerHTML = `
<div class="form">
  <button name="Buton A" id="button-a" data-flow="[getTrigger.name -> #output-5-1][getTrigger.name -> #output-5-2]">Button A</button>
  <button name="Buton B" id="button-b" data-flow="[getTrigger.name -> #output-5-1][getTrigger.id -> #output-5-1]">Button B</button>
  <button name="Buton C" id="button-c" data-flow="[getTrigger.name -> #output-5-1][dblclick -> getTrigger.name -> #output-5-1]">Button C</button>
  <button name="Buton D" id="button-d" data-flow="[getTrigger.name -> #output-5-1][dblclick -> getTrigger.id -> #output-5-2]">Button D</button>
</div>

<div class="output example-5">
  <span>Output 1:</span>
  <div id="output-5-1"><em>Output will appear here...</em></div>
  <span>Output 2:</span>
  <div id="output-5-2"><em>...and here...</em></div>
</div>`;

    const flow = new AviFlow({
      getTrigger: {
        id: (element) => {
          const elId = element.getAttribute('id');
          return `click trigger with id: ${elId}`;
        },
        name: (element) => {
          const elName = element.getAttribute('name');
          return `click trigger with name: ${elName}`;
        }
      }
    });

    const buttonA = document.getElementById('button-a');
    const buttonB = document.getElementById('button-b');
    const buttonC = document.getElementById('button-c');
    const buttonD = document.getElementById('button-d');
    const target1 = document.getElementById('output-5-1');
    const target2 = document.getElementById('output-5-2');

    // --- Button A (Click) ---
    buttonA.click();
    expect(target1.innerHTML).toContain('click trigger with name: Buton A');
    expect(target2.innerHTML).toContain('click trigger with name: Buton A');

    // --- Button B (Click) ---
    buttonB.click();
    //expect(target1.innerHTML).toContain('click trigger with name: Buton B');
    expect(target1.innerHTML).toContain('click trigger with id: button-b');

    // --- Button C (Click) ---
    buttonC.click();
    expect(target1.innerHTML).toContain('click trigger with name: Buton C');

    // --- Button C (Double Click) ---
    buttonC.dispatchEvent(new Event('dblclick', { bubbles: true }));
    expect(target1.innerHTML).toContain('click trigger with name: Buton C');

    // --- Button D (Click) ---
    buttonD.click();
    expect(target1.innerHTML).toContain('click trigger with name: Buton D');

    // --- Button D (Double Click) ---
    buttonD.dispatchEvent(new Event('dblclick', { bubbles: true }));
    expect(target2.innerHTML).toContain('click trigger with id: button-d');
  });

  // ... //

  
  test('Example 10: Action Fetch Minimal', async () => {
    const mockData = { id: 101, title: 'Simulated Post' };

    document.body.innerHTML = `
  <div class="form">
    <button
      data-flow="fetch -> #output-10"
      data-url="https://jsonplaceholder.typicode.com/posts"
      id="button-10">Get data using POST</button>
  </div>

  <div id="output-10" class="output"><em>Output will appear here...</em></div>`;

    const button10 = document.getElementById('button-10');
    const target = document.getElementById('output-10');

    const flow = new AviFlow();

    global.fetch.mockResolvedValue(makeResponse({ json: mockData }));

    button10.click();
    await new Promise(process.nextTick);

    // Assuming AviFlow serializes the object to string, or we can check for key presence.
    // Adjust this assertion based on how AviFlow displays the fetched data.
    expect(fetchCall()[1].method).toBe('POST');
    expect(target.innerHTML).toContain(mockData.title);

    fetch.mockClear();
  });


  test('Example 12: Action Fetch Basic', async () => {
    const mockData = { id: 101, title: 'Simulated User' };

    document.body.innerHTML = `
  <div class="form">
    <button
      data-flow="fetch -> #output-11"
      data-method="get"
      data-url="https://jsonplaceholder.typicode.com/users/1"
      id="button-11">Load User Info</button>
  </div>

  <div id="output-11" class="output"><em>Output will appear here...</em></div>`;

    const trigger = document.getElementById('button-11');
    const target = document.getElementById('output-11');

    const flow = new AviFlow();

    global.fetch.mockResolvedValue(makeResponse({ json: mockData }));

    trigger.click();
    await new Promise(process.nextTick);

    // Assuming AviFlow serializes the object to string, or we can check for key presence.
    // Adjust this assertion based on how AviFlow displays the fetched data.
    expect(fetchCall()[1].method).toBe('GET');
    expect(target.innerHTML).toContain(mockData.title);

    fetch.mockClear();
  });

  test('Example 12: Action Fetch Basic', async () => {
    document.body.innerHTML = `
  <div class="form">
    <button 
      data-flow="fetch -> #output-12" 
      data-method="get"
      data-url='data:application/json;charset=utf-8,"This is a string returned as result."'
      id="button-a">Button A</button>
    
    <button 
      data-flow="fetch -> #output-12" 
      data-method="get"
      data-url='data:application/json;charset=utf-8,"<p>This is a <b>html</b> formated <em>string</em> returned as result.</p>"'
      id="button-b">Button B</button>

    <button 
      data-flow="fetch -> #output-12" 
      data-method="get"
      data-url='data:application/json;charset=utf-8,{"success":true,"message":"<p>This JSON does not have html property.</p>"}'
      id="button-c">Button C</button>

    <button 
      data-flow="fetch -> #output-12" 
      data-method="get"
      data-url='data:application/json;charset=utf-8,{"success":true,"html":"<p>This is html property of returned JSON.</p>"}'
      id="button-d">Button D</button>
  </div>

  <div id="output-12" class="output"><em>Output will appear here...</em></div>`;

    const triggerA = document.getElementById('button-a');
    const triggerB = document.getElementById('button-a');
    const triggerC = document.getElementById('button-a');
    const triggerD = document.getElementById('button-a');
    const target = document.getElementById('output-12');

    const flow = new AviFlow();
    const mockData = {
      a: "This is a string returned as result.",
      b: "<p>This is a <b>html</b> formated <em>string</em> returned as result.</p>",
      c: {
        success: true,
        message: "<p>This JSON does not have html property.</p>"
      },
      d: {
        success: true,
        html: "<p>This is html property of returned JSON.</p>"
      }
    };

    global.fetch.mockResolvedValue(makeResponse({ json: mockData.a }));
    triggerA.click();
    await new Promise(process.nextTick);
    expect(fetchCall()[1].method).toBe('GET');
    expect(target.innerHTML).toBe(mockData.a);

    global.fetch.mockResolvedValue(makeResponse({ json: mockData.b }));
    triggerB.click();
    await new Promise(process.nextTick);
    expect(fetchCall()[1].method).toBe('GET');
    expect(target.innerHTML).toBe(mockData.b);

    global.fetch.mockResolvedValue(makeResponse({ json: mockData.c }));
    const testTextarea = document.createElement('textarea');
    testTextarea.innerHTML = JSON.stringify(mockData.c);
    triggerC.click();
    await new Promise(process.nextTick);
    expect(fetchCall()[1].method).toBe('GET');
    expect(target.innerHTML).toEqual(testTextarea.innerHTML);

    global.fetch.mockResolvedValue(makeResponse({ json: mockData.d }));
    triggerD.click();
    await new Promise(process.nextTick);
    expect(fetchCall()[1].method).toBe('GET');
    expect(target.innerHTML).toBe(mockData.d.html);

    fetch.mockClear();
  });

});