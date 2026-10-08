# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [WIP]
### Added
+ Add more examples
+ Add tutorial:
    1. load
    2. create fn.action
    3. set data-event to trigger fn.action
    4. set data-target to watch the execution

### Changed
+ Change examples UI


## [Unreleased]
### Added
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