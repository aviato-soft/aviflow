# AviFlow 🚀

A lightweight, zero-dependency JavaScript utility to automate network `fetch` requests natively using HTML `data-*` attributes. 

AviFlow enables declarative AJAX interactions directly from your HTML elements via event delegation, working seamlessly on elements added dynamically to the page. It can be dropped directly into legacy setups as a standalone browser script or bundled into modern ES module applications.

---

## ✨ Features

- **Micro-sized & Dependency-free**: Written in pure, modern vanilla JavaScript.
- **Event Delegation**: Listens on the document body—automatically handles any elements added to the DOM dynamically via AJAX without re-binding.
- **Dual-Loading Support**: Supports native ES Module `import` syntax and classic standalone `<script>` tags.
- **Flexible Configuration**: Reads URLs, HTTP methods, target element injection, and payload bodies entirely from your element attributes.
- **Smart Fallbacks**: Safely falls back to an anchor tag's native `href` if `data-url` isn't provided.

---

## 📦 Architecture & Installation

### 1. Standalone Drop-in (Traditional Script)
You can reference `dist/aviflow.min.js` locally or load it directly from jsDelivr:

**Using Local File:**
```html
<script src="path/to/dist/aviflow.min.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new AviFlow();
  });
</script>

**Using jsDelivr CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/aviflow@1.1.3/dist/aviflow.min.js" crossorigin="anonymous" integrity="sha512-svhkJwM1Yhx4Hv1k+epOBd9Q7aR08jv2zPuLG4SY7R66v7cvWMnTCSRFpWhPmf8jszsz0wCzyPGVndRbdegW0A=="></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new AviFlow();
  });
</script>
```


### 2. Modern Application Setup (ES Module)
Import the library inside your JavaScript application bundle:

```js
import AviFlow from './dist/aviflow.js';

const myFlow = new AviFlow();
```

## 🚀 HTML API Usage

For a comprehensive guide to all HTML API usage examples, refer to the documentation at `/examples/readme/index.html`.


### Example 1: Function Execution on Click
Use a custom function defined on the AviFlow instance to execute arbitrary JavaScript code when an element with a specific `data-action` is clicked.

```html
<button data-action="clickTest">Click me</button>
```

```javascript
const myFlow = new AviFlow();
myFlow.fn.clickTest = () => {
  alert('It works!');
};
myFlow.init();
```

### Example 2: Simple GET Request (Content Injection)
Simply apply data-action="fetch" to any interactive HTML element.
Fetch data from an API and automatically inject the response text/HTML directly into another DOM container using data-target.

```html
<button 
  data-action="fetch"
  data-method="get"
  data-url="https://jsonplaceholder.typicode.com/users/1" 
  data-target="#result-box">
  Load User Info
</button>

<div id="result-box">Profile data will render here...</div>
```

### Example 3: Interactive POST Request with Payload
Use standard attributes to pass customized HTTP methods and structured JSON payloads.

```html
<a href="javascript:;" 
   data-action="fetch" 
   data-method="POST" 
   data-url="https://jsonplaceholder.typicode.com/users"
   data-param-id="11"
   data-param-test="AviFlow is fast."
   data-target="#response-log">
   Submit Post
</a>

<div id="response-log">The result of example #3 will be rendered here...</div>
```


## 🛠️ Customization & Callbacks
You can pass an options object during initialization to handle global hooks or catch internal custom events.

## Hook Interception Configuration
``` JavaScript
const flow = new AviFlow({
  selector: '[data-action="fetch"]', // Customize the selector if needed
  onSuccess: (data, element) => {
    console.log('Successfully fetched:', data);
  },
  onError: (error, element) => {
    console.error('Fetch operation failed:', error);
  }
});
```

## Global Custom DOM Events
AviFlow inherently bubbles up custom events. You can attach event listeners to higher-level elements or document.body directly:

```JavaScript
document.body.addEventListener('aviflow:success', (event) => {
  console.log('Global success event received payload:', event.detail);
});

document.body.addEventListener('aviflow:error', (event) => {
  console.error('Global error caught:', event.detail);
});
```

## 🏗️ Developer Setup

If you wish to modify or build AviFlow from source, clone this repository and follow these commands:

### 1. Install Build Tooling (esbuild):
```bash
npm install
```

### 2. Compile Production Distributions:
Build both dist/aviflow.js (ES Module) and dist/aviflow.min.js (minified fallback) via your package configuration:
```bash
npm run build
```

### 3. Development Watch Mode:
```bash
npm run watch
```

## Status

[![jsdeliver](https://data.jsdelivr.com/v1/package/npm/aviflow/badge)](https://www.jsdelivr.com/package/npm/aviflow)
[![npm version](https://img.shields.io/npm/v/aviflow?logo=npm&logoColor=fff)](https://www.npmjs.com/package/aviflow)
![Codecov](https://img.shields.io/codecov/c/github/aviato-soft/aviflow)



## 📝 License

This project is open-sourced software licensed under the **Apache 2.0 License**.