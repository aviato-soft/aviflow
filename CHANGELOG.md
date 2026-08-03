# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Add bind to separate binding from init
- Add support for custom actions not only fetch
+ Add support for all events not only click using data-event attribute
+ Use shortcut for data-event on data-action using "|" separator (data-action="action[|event]")
+ Add shortcut for data-flow="true" = { data-action="fetch" data-event="click" }


## [1.1.0] - 2026-08-03
### Changed
- Refactoring hanldeFetch - move it to: fn.fetch


## [1.0.1] - 2026-07-31

### Added
- This CHANGELOG file to hopefully serve as an evolving example of a standardized open source project CHANGELOG.
- data-parent property for element
- tools.toPascalCase
- fn property - will be use on next releases

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