# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [WIP]
### Added
### Changed
### Fixed
### Removed


## [Unreleased]
### Added
- **`AviElement.getParentChain(element)`**: public static method that returns the `data-parent` chain of an element as an array, root ancestor first, element last.
  - Resolves each `data-parent` selector against the closest ancestor first, then falls back to `document.querySelector`.
  - Protects against cycles; a selector that matches nothing ends the chain; an invalid selector logs a warning and ends the chain.
  - Returns `[]` for `null`, `undefined` or non-element input.
  - Exposed as `AviFlow.tools.element.getParentChain`.
- **: called for every successful HTTP response (2xx) with a parsed body, JSON object or HTML string.
  - Called as `hook(data, element, event, targetSelector, flow)`, like `onSuccess` / `onFail`.
  - Runs before `onSuccess` / `onFail`.
  - Not called for HTTP errors, which are still thrown to `data-on-error`.
- Jest tests: `AviElement.getParentChain.test.js`, plus new `onResponse` cases in `AviFlowActions.fetchData.test.js`.
- Documentation page: `api-tools-element-getParentChain.html`.

### Fixed
- **`fetch` ignored the parent form's native `method` and `action`.** For an element with `data-parent="form"` (for example a `<select>` inside a form), the native `method` / `action` attributes were only used when the element itself was the `<form>`, so the request silently fell back to `POST` and `/`. The nearest `<form>` in the element's `data-parent` chain (the element itself included) is now used.
  - Priority is unchanged in spirit: `data-method` / `data-url` (own or inherited) → native `method` / `action` of the nearest parent form → defaults (`POST`, `/`).
- **A hook name could not be resolved on the test page**: `test.html` passed `...app.actions` while `app.actions` was undefined, so the `success` action was never registered. The updated `test_1.html` registers it.

### Changed
- `fetchData` documentation (docblock) lists the `onResponse` hook and corrects the `onSucces` typo to `onSuccess`.


## [2.0.3] - 2026-11-10T10:53:18Z
### Changed
- documentation related to installation
- expose class directly (without .default)

## [2.0.2] - 2026-11-10T08:36:07Z

### Changed
- publish extension change .yaml -> .yml
### Fixed
- fix npm vulnerabilities

## [2.0.1] - 2026-11-09T19:50:28Z
### Added
- create docs as github pages
- AviFlow.js - the main file
- AviFlowActions.js - the integrated action
- AviFlowCoreEngine.js - the core engine logic
- tools/AviElement.js - tools to handle html elements
- tools/AviText.js - tools to handle text format
- media assets

### Changed
- new file structure
- force node v.24 for github workflows
- update github workflow actions from v4 to v7
- use ubuntu 26.04 for  github workflow actions
- Change examples UI
- update jest version to 30.5.2

### Removed
- index.js


## [1.1.5] - 2026-10-13T16:43:21Z
### Changed
- target logic is applied to all fn.functions not only to fetch
- parent configuration for fetch: data-url, data-method
- add dependencies security audit sheduler

## [1.1.4] - 2026-10-11T09:09:40Z
### Added
- AviFlow.tools.setElementContent
- socket.yml


## [1.1.3] - 2026-10-09T10:03:34Z
### Added
- if data-parent is a form, all elements values are send to fetch action automatically
- Status section on README.md
- Badge on status section: jsdelivr
- Badge on status section: npm version
- Badge on status section: codecov coverage

### Changed
- Use sha512 for integrity check


## [1.1.2] - 2026-10-07T10:35:43Z
### Added
- jsDelivr link to readme
- automatic version deployments
- standard callbacks (success, error) can be defined as .fn.function

### Fixed
 - Prevent event trigger for .fn.functions is act to unexpected elements behavior - it is removed - not needed


## [1.1.1] - 2026-08-04
### Added
- Add bind to separate binding from init
- Add support for custom actions (not only fetch)
- Add support for all events (not only click) using the data-event attribute
- Use shortcut for data-event on data-action using "|" separator (data-action="action[|event]")

### Changed
- AviFlow.options.selector has been deprecated and removed. Use datasetSelectorName instead.
- AviFlow.options.datasetSelectorName represents the dataset selector, not a CSS selector.

### Fixed
- Fixed an issue where multiple events were set for each bind; now there is only one call per event.


## [1.1.0] - 2026-08-03
### Changed
- Refactoring handleFetch - moved it to: fn.fetch


## [1.0.1] - 2026-07-31

### Added
- Added this CHANGELOG file to serve as an evolving example of a standardized open-source project CHANGELOG.
- data-parent property for element
- tools.toPascalCase
- fn property - will be used in next releases

### Fixed
- remove words lower case format for tools.toCamelCase
- description for tools.toCapitalize


## [1.0.0] - 2026-07-30
- 1st release

[^guidenote]: 
### Guiding Principles
- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each version is displayed.
- Mention whether you follow Semantic Versioning.

### Types of changes
- Added       for new features.
- Changed     for changes in existing functionality.
- Deprecated  for soon-to-be removed features.
- Removed     for now removed features.
- Fixed       for any bug fixes.
- Security    in case of vulnerabilities.