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
Download or reference `dist/aviflow.min.js` in your HTML page:

```html
<script src="path/to/dist/aviflow.min.js"></script>
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
Simply apply data-action="fetch" to any interactive HTML element.

### Example 1: Simple GET Request (Content Injection)
Fetch data from an API and automatically inject the response text/HTML directly into another DOM container using data-target.

```html
<button 
  data-action="fetch" 
  data-url="[https://jsonplaceholder.typicode.com/users/1](https://jsonplaceholder.typicode.com/users/1)" 
  data-target="#result-box">
  Load User Info
</button>

<div id="result-box">Profile data will render here...</div>
```

### Example 2: Interactive POST Request with Payload
Use standard attributes to pass customized HTTP methods and structured JSON payloads.

```html
<a href="#" 
   data-action="fetch" 
   data-url="/api/posts" 
   data-method="POST" 
   data-body='{"title": "Hello World", "body": "AviFlow is fast."}'
   data-target="#response-log">
   Submit Post
</a>

<div id="response-log"></div>
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
Builds both dist/aviflow.js (ES Module) and dist/aviflow.min.js (minified fallback) via your package configuration:
```bash
npm run build
```

### 3. Development Watch Mode:
```bash
npm run watch
```

## 📝 License

This project is open-sourced software licensed under the **Apache 2.0 License**.