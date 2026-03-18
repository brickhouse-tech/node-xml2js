# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.1.5](https://github.com/brickhouse-tech/node-xml2js/compare/v1.1.4...v1.1.5) (2026-03-18)

## [1.1.4](https://github.com/brickhouse-tech/node-xml2js/compare/v1.1.3...v1.1.4) (2026-03-11)

## [1.1.3](https://github.com/brickhouse-tech/node-xml2js/compare/v1.1.2...v1.1.3) (2026-03-02)

## [1.1.2](https://github.com/brickhouse-tech/node-xml2js/compare/v1.1.1...v1.1.2) (2026-03-02)

## [1.1.1](https://github.com/brickhouse-tech/node-xml2js/compare/v1.1.0...v1.1.1) (2026-03-02)


### Bug Fixes

* resolve CVE warnings and clean up publish workflow ([4bcf5e8](https://github.com/brickhouse-tech/node-xml2js/commit/4bcf5e8bfd817b0971d3e622d8f5faf50e1e0e35))

## [1.1.0](https://github.com/brickhouse-tech/node-xml2js/compare/v1.0.0...v1.1.0) (2026-03-02)


### Features

* convert to ESM JavaScript ([8043570](https://github.com/brickhouse-tech/node-xml2js/commit/8043570e67b2149e5e54579e017205dd42d4040d))

## [1.0.0](https://github.com/brickhouse-tech/node-xml2js/compare/v0.6.3...v1.0.0) (2026-02-28)

## 0.6.3 (2026-02-28)


### Features

* LTS security fork with CVE-2023-0842 regression tests ([ebc2881](https://github.com/brickhouse-tech/node-xml2js/commit/ebc2881ebe68b454d544945f71d9f4b90098997a))
* modernize xml2js fork ([1fdecc4](https://github.com/brickhouse-tech/node-xml2js/commit/1fdecc48ac66f963836717b4e9e9ad73db71ffd7))


### Bug Fixes

* explicitly ignore vulnerable properties ([d486007](https://github.com/brickhouse-tech/node-xml2js/commit/d486007a688bf10fa5a2ae72eed1e29b4b01a76a))
* include missed key check ([7292aa9](https://github.com/brickhouse-tech/node-xml2js/commit/7292aa92d901fc18468cb04100f8e2b1c49c412e))
* revert incorrectly adapted code ([4c8ec89](https://github.com/brickhouse-tech/node-xml2js/commit/4c8ec89859ac14a6c5d31adccfb4747ba074112b))

## [0.6.3-lts.0] - 2026-02-28

### Added
- **Security**: Regression tests for CVE-2023-0842 (prototype pollution via `__proto__` and `constructor.prototype`)
- ESLint 9 flat configuration for modern code linting
- GitHub Actions CI workflow (tests on Node 18, 20, 22)
- GitHub Actions release workflow for automated publishing
- Devcontainer configuration for consistent development environment

### Changed
- Updated all dependencies to latest safe versions:
  - `sax`: ^1.4.4 (from >=0.6.0)
  - `xmlbuilder`: ^15.1.1 (from ~11.0.0)
  - `eslint`: ^10.0.2 (ESLint 9 flat config)
  - `diff`: ^7.0.0 (from >=1.0.8)
  - `docco`: ^0.9.2 (from >=0.6.2)
  - `nyc`: latest (from >=2.2.1)
- Repository URL updated to `https://github.com/brickhouse-tech/node-xml2js`
- Node.js engine requirement: `>=18.0.0` (from `>=4.0.0`)
- Removed deprecated `coveralls` package (coverage handled in CI)

### Fixed
- **Security**: Resolved 17+ npm audit vulnerabilities in dev dependencies
- Prototype pollution vulnerability (CVE-2023-0842) using `Object.create(null)` for all parsed objects

### Security
This is a Long-Term Support (LTS) security fork of xml2js, maintained by brickhouse-tech.
The upstream xml2js package (29M+ weekly downloads) has known prototype pollution vulnerabilities.
This fork addresses CVE-2023-0842 by ensuring all parsed XML objects are created with `Object.create(null)`,
preventing prototype pollution attacks via `__proto__`, `constructor`, and `prototype` property names.

## [0.6.2] - 2023-01-11 (upstream)
Last official release from upstream before this LTS fork.
