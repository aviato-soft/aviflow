<p align="center">
  <img src="./assets/avi-flow-logo.svg" alt="AviFlow logo" width="160" height="160">
</p>

<h1 align="center">AviFlow</h1>

<p align="center">
  <strong>Declarative data flow for the DOM.</strong><br>
  Describe <em>event → action → target</em> in a single HTML attribute.
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-2.0.0-e33ecb">
  <img alt="module" src="https://img.shields.io/badge/module-ESM-blue">
  <img alt="dependencies" src="https://img.shields.io/badge/dependencies-0-brightgreen">
</p>

<p align="center">
  <a href="https://aviato-soft.github.io/aviflow/docs">Documentation</a> ·
  <a href="https://github.com/aviato-soft/aviflow">GitHub</a>
</p>


---

## Overview

**AviFlow** is a lightweight zero-dependency JavaScript utility that wires up behavior directly in your markup. 
Add a **`data-flow`** attribute to any element, and **AviFlow** binds the event, runs the named action, and delivers the result to the target you specify, with no glue code required.

```html
<button data-flow="fetch -> #list" data-url="/api/items">Load items</button>
<ul id="list"></ul>
```

## Features 

- **Declarative**: behavior lives in HTML, next to the element it affects.
- **Simple grammar**: one `->` delimiter, at most three parts.
- **Event modifiers**: `.prevent` and `.stop` built in.
- **Sync or async actions**: any function can be an action, including `async` ones.
- **Extensible**: register your own actions with a single call.
- **Scoped initialization**: bind a whole document or just a freshly inserted fragment.
- **Strict validation**: malformed flows are logged as warnings and never registered.
- **Micro-sized & Dependency-free**: Written in pure, modern vanilla JavaScript.


## Architecture & Installation

### 1. Standalone Drop-in (Traditional Script)

Download the file directly from the repository, [github.com/aviato-soft/aviflow](https://github.com/aviato-soft/aviflow), and host it yourself:

| File | Description |
| --- | --- |
| `dist/aviflow.min.js` | Minified production build |
| `dist/aviflow.min.map` | Source map, for debugging the minified build |

```html
<script src="/path/to/aviflow.min.js"></script>
```

- Best for offline use, intranets, or when you cannot rely on a third-party CDN.
- Keep the `.map` file next to the `.js` file so browser dev tools can show the original source.


### 2. CDN (jsDelivr)

The quickest way to try AviFlow, with no build step. Add the minified build to your page:

```html
<script src="https://cdn.jsdelivr.net/npm/aviflow@2.0.0/dist/aviflow.min.js" crossorigin="anonymous" integrity="sha512-Wq2p7SfSecIiXY9s0Sc3HAZ66LrQbxadI9ckg+ISl6u4ZyNPRW7E6mHLTPnlBKhZMyAIKnkJ9PjiPblPA9mkGQ=="></script>
```

- The version is pinned (`@2.0.0`), so your page will not change unexpectedly when a new release is published.
- jsDelivr serves the file from a global CDN with caching and compression.
- Best for prototypes, static pages and simple sites.


### 3. npm

Install the package from the npm registry:

```bash
npm i aviflow
```

Then import it in your code:

```js
import AviFlow from 'aviflow';
```

- Best for projects that use a bundler or build tool (Vite, webpack, Rollup, esbuild, etc.).
- Version management is handled by your `package.json` and lock file.

### 4. Modern Application Setup (Local ES Module or CommonJS)

The `dist/` folder also contains builds for specific module systems. Each comes with its own source map.

| File | Format | Typical use |
| --- | --- | --- |
| `aviflow.esm.js` | ES module | Modern browsers (`<script type="module">`) and bundlers that support tree-shaking |
| `aviflow.cjs.js` | CommonJS | Node.js and tooling that uses `require()` |

```js
// ES module
import AviFlow from './dist/aviflow.esm.js';

// CommonJS
const AviFlow = require('./dist/aviflow.cjs.js');
```

## Quick start

```html
<form data-flow="submit.prevent -> fetch -> #result" action="/api/search">
  <input name="q" placeholder="Search…">
  <button>Go</button>
</form>
<div id="result"></div>

<script type="module">
  import AviFlow from './AviFlow.js';

  new AviFlow(); // scans the document and binds every [data-flow] element
</script>
```

## Data flow grammar

A flow string is split on the `->` delimiter.

| Form | Syntax | Behavior |
| --- | --- | --- |
| Full flow | `event -> action -> target` | Runs the action on the event and sends the result to the target. |
| Implicit event | `action -> target` | Same as above, with the event defaulting to `click`. |
| Eventless | `action` | Runs the action on `click`, with no target update. |
| Terminated (with event) | `event -> action -\|` | Runs the action on the event and stops: no target update. |
| Terminated | `action -\|` | Runs the action on `click` and stops: no target update. |

### Components

| Part | Description |
| --- | --- |
| **event** | A DOM event name, optionally followed by modifiers (e.g. `submit.prevent`, `click.prevent.stop`). |
| **action** | The name of a function in the flow's action registry. |
| **target** | A standard CSS selector for the element(s) that receive the action's result. |

### Event modifiers

| Modifier | Effect |
| --- | --- |
| `.prevent` | Calls `event.preventDefault()` before the action runs. |
| `.stop` | Calls `event.stopPropagation()`. |

> Modifiers are recognized only at the **end** of the event part. `my.event` is treated as a plain event name.

### Examples

```html
<!-- click → fetch → update #list -->
<button data-flow="fetch -> #list">Refresh</button>

<!-- click → load -->
<button data-flow="load">Load</button>

<!-- click → fetch, no target -->
<button data-flow="fetch -|">Ping</button>

<!-- focus → fetch, no target -->
<input data-flow="focus -> fetch -|">

<!-- Ajax form -->
<form data-flow="submit.prevent -> fetch -> #result">…</form>

<!-- Ajax form, nothing to update -->
<form data-flow="submit.prevent -> save -|">…</form>
```

### Invalid flows

These are logged as warnings and not registered:

- an empty action
- an empty target, such as `fetch ->`
- more than three parts
- `-|` after three parts

## Custom actions

An action is any function. It is invoked as `action.call(htmlNode, flow)`, where:

- `this` / `htmlNode` is the element that initiated the flow
- `flow` is the `AviFlow` instance

Actions may be synchronous or asynchronous.

```js
import AviFlow from './AviFlow.js';

const flow = new AviFlow({
  // Pass actions at construction time…
  greet() {
    return `Hello from <${this.tagName.toLowerCase()}>`;
  }
});

// …or register them later.
flow.register('save', async function (flow) {
  // `this` is the element that triggered the flow
});

// Register several at once
flow.register({
  hide() { /* … */ },
  show() { /* … */ }
});
```

The built-in `fetch` action is always available.

## API reference

### `new AviFlow(actions?, options?)`

| Parameter | Type | Description |
| --- | --- | --- |
| `actions` | `object` | Map of `name → function`, merged with the built-in actions. |
| `options` | `object` | Engine options (see below). |

**Options**

| Option | Default | Description |
| --- | --- | --- |
| `autoInit` | `true` | Call `init()` automatically after construction. |
| `root` | `document` | Default container scanned for `[data-flow]` elements. |

#### `flow.init(root?)`

Finds every `[data-flow]` element inside `root` (including `root` itself) and binds it. Defaults to `option.root`. Returns the instance, so calls can be chained.

Use it to bind content added to the page after load:

```js
const flow = new AviFlow({}, { autoInit: false });
flow.init();                         // bind the whole document
flow.init(document.querySelector('#new-content')); // bind a fragment
```

#### `flow.register(name, fn)`

Registers an action. Also accepts an object of functions. Returns the instance. Any other argument shape logs a warning.

### Properties

| Property | Description |
| --- | --- |
| `flow.action` | The action registry (`fetch` plus any custom actions). |
| `flow.option` | The resolved options object. |
| `flow.tools` | Helpers available to actions: `element` (`AviElement`) and `text` (`AviText`). |

## Documentation and examples

More examples and the full documentation are available at
**[aviato-soft.github.io/aviflow/docs](https://aviato-soft.github.io/aviflow/docs)**.



## Contributing

Issues and pull requests are welcome. Please keep changes focused and include an example flow that demonstrates the behavior you are adding or fixing.


## Status

[![jsdeliver](https://data.jsdelivr.com/v1/package/npm/aviflow/badge)](https://www.jsdelivr.com/package/npm/aviflow) [![npm version](https://img.shields.io/npm/v/aviflow?logo=npm&logoColor=fff)](https://www.npmjs.com/package/aviflow) ![Codecov](https://img.shields.io/codecov/c/github/aviato-soft/aviflow)



## 📝 License

This project is open-sourced software licensed under the **Apache 2.0 License**.