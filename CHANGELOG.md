# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
