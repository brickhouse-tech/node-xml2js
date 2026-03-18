# @brickhouse-tech/xml2js

[![npm version](https://img.shields.io/npm/v/@brickhouse-tech/xml2js.svg)](https://www.npmjs.com/package/@brickhouse-tech/xml2js)
[![npm downloads](https://img.shields.io/npm/dm/@brickhouse-tech/xml2js.svg)](https://www.npmjs.com/package/@brickhouse-tech/xml2js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Security: Patched](https://img.shields.io/badge/Security-CVE--2023--0842%20Fixed-brightgreen.svg)](https://github.com/brickhouse-tech/node-xml2js)

## Security-Patched Fork — Prototype Pollution Vulnerability Fixed

**The original `xml2js` package is abandoned.** Despite 29+ million weekly downloads, it remains unpatched for a critical prototype pollution vulnerability (CVE-2023-0842) that can compromise application security.

**`@brickhouse-tech/xml2js` is a drop-in replacement with the security fix applied, comprehensive regression tests added, and ongoing maintenance.**

---

## 🚨 The Problem

### Original Package Status
- **29.1M weekly downloads** (as of March 2025)
- **Last meaningful commit:** Years ago
- **Maintainer status:** Inactive/abandoned
- **Critical CVE:** [CVE-2023-0842](https://nvd.nist.gov/vuln/detail/CVE-2023-0842) — Prototype pollution via `__proto__` and `constructor` keys in parsed XML
- **Risk exposure:** Millions of production applications vulnerable to object injection attacks

### The Vulnerability
Malicious XML containing `__proto__` or `constructor` element names can pollute JavaScript's Object prototype chain, potentially leading to:

- Remote code execution (RCE) in certain contexts
- Authentication bypass
- Data exfiltration
- Denial of service (DoS)
- Arbitrary property injection across all objects

**Example attack vector:**
```xml
<root>
  <__proto__>
    <isAdmin>true</isAdmin>
  </__proto__>
</root>
```

When parsed by vulnerable versions, this XML can inject properties into `Object.prototype`, affecting *all* objects in the application.

---

## ✅ The Solution

`@brickhouse-tech/xml2js` is a community-maintained fork that:

1. **Fixes CVE-2023-0842** with hardened property assignment using `Object.defineProperty()`
2. **Adds comprehensive regression tests** (3 new test cases covering attack vectors)
3. **Maintains 100% API compatibility** (drop-in replacement)
4. **Provides ongoing security maintenance** and dependency updates
5. **Stays current** with Node.js LTS releases

### What We Fixed

#### Before (Vulnerable)
```javascript
// Direct property assignment - vulnerable to prototype pollution
obj[key] = value;
```

#### After (Secure)
```javascript
function defineProperty(obj, key, value) {
  // Create a clean descriptor to prevent prototype pollution
  const descriptor = Object.create(null);
  descriptor.value = value;
  descriptor.writable = true;
  descriptor.enumerable = true;
  descriptor.configurable = true;
  Object.defineProperty(obj, key, descriptor);
}
```

This approach:
- Uses `Object.create(null)` to prevent descriptor pollution
- Employs `Object.defineProperty()` for controlled property creation
- Blocks `__proto__`, `constructor`, and `prototype` injection vectors

### Test Coverage

We added three comprehensive regression tests to verify the fix:

1. **`__proto__` element pollution test**
   ```javascript
   const maliciousXML = '<root><__proto__><polluted>POLLUTED</polluted></__proto__></root>';
   // Verifies Object.prototype.polluted remains undefined
   ```

2. **`constructor` element pollution test**
   ```javascript
   const maliciousXML = '<root><constructor><polluted>POLLUTED</polluted></constructor></root>';
   // Verifies constructor pollution is blocked
   ```

3. **`__proto__` attribute pollution test**
   ```javascript
   const maliciousXML = '<root><__proto__ polluted="POLLUTED"/></root>';
   // Verifies attribute-based pollution vectors are blocked
   ```

All tests verify that `Object.prototype.polluted` and `({}).polluted` remain `undefined` after parsing malicious XML.

---

## 🔄 Migration Guide

### One-Line Installation
```bash
npm uninstall xml2js
npm install @brickhouse-tech/xml2js
```

### Code Changes Required
**None.** This is a 100% drop-in replacement with identical API surface.

```javascript
// Original
const xml2js = require('xml2js');

// Replacement (same code, secure implementation)
const xml2js = require('@brickhouse-tech/xml2js');
```

### For TypeScript Users
```typescript
// Original
import * as xml2js from 'xml2js';

// Replacement (identical import)
import * as xml2js from '@brickhouse-tech/xml2js';
```

### Verification
After installation, run your test suite. No code changes should be required. If you encounter any compatibility issues, please [open an issue](https://github.com/brickhouse-tech/node-xml2js/issues).

---

## 📊 Package Details

- **Current Version:** 1.1.4
- **License:** MIT (same as original)
- **Node.js:** >=18.0.0 (ESM support)
- **Repository:** [github.com/brickhouse-tech/node-xml2js](https://github.com/brickhouse-tech/node-xml2js)
- **NPM:** [@brickhouse-tech/xml2js](https://www.npmjs.com/package/@brickhouse-tech/xml2js)

---

## 🏢 Enterprise Support

For organizations requiring guaranteed SLA response times, dedicated security advisories, or priority patch delivery:

**Enterprise Support Tiers Available**
- 🥉 **Bronze:** 5-day response, email support
- 🥈 **Silver:** 48-hour response, security advisory access
- 🥇 **Gold:** 24-hour response, dedicated Slack channel, custom patches

📧 **Contact:** [brickhouse-tech.lemonsqueezy.com](https://brickhouse-tech.lemonsqueezy.com)

---

## 💚 Support This Work

This fork is maintained by [Brickhouse Tech](https://github.com/brickhouse-tech) as a community service. If your organization benefits from this security patch, consider sponsoring ongoing maintenance:

**[GitHub Sponsors](https://github.com/sponsors/brickhouse-tech)**

Sponsorship funds:
- Security research and proactive CVE monitoring
- Dependency updates and compatibility testing
- Long-term maintenance and Node.js LTS support
- Community issue triage and documentation

---

## 📚 Documentation

The API documentation remains unchanged from the original `xml2js` package. For complete usage examples, see:

- [Usage Examples](#usage)
- [Parser Options](#options)
- [Builder Options](#options-for-the-builder-class)
- [Processing Functions](#processing-attribute-tag-names-and-values)

---

## Usage

### Quick Start
```javascript
const xml2js = require('@brickhouse-tech/xml2js');
const xml = "<root>Hello xml2js!</root>";

xml2js.parseString(xml, function (err, result) {
    console.dir(result);
});
```

### With Parser Instance
```javascript
const xml2js = require('@brickhouse-tech/xml2js');
const parser = new xml2js.Parser();

parser.parseString(xml, function (err, result) {
    console.dir(result);
});
```

### Promise-Based
```javascript
const xml2js = require('@brickhouse-tech/xml2js');
const xml = '<foo>bar</foo>';

xml2js.parseStringPromise(xml)
  .then(result => console.dir(result))
  .catch(err => console.error(err));
```

### Building XML from Objects
```javascript
const xml2js = require('@brickhouse-tech/xml2js');
const builder = new xml2js.Builder();

const obj = {name: "Super", Surname: "Man", age: 23};
const xml = builder.buildObject(obj);
```

---

## Options

### Parser Options

Specify options via `new Parser({optionName: value})`:

- **`attrkey`** (default: `$`) — Prefix for accessing attributes
- **`charkey`** (default: `_`) — Prefix for accessing character content
- **`explicitCharkey`** (default: `false`) — Use charkey even for elements with no attributes
- **`trim`** (default: `false`) — Trim whitespace at start/end of text nodes
- **`normalizeTags`** (default: `false`) — Lowercase all tag names
- **`normalize`** (default: `false`) — Trim whitespace inside text nodes
- **`explicitRoot`** (default: `true`) — Include root node in result
- **`emptyTag`** (default: `''`) — Value for empty nodes (use factory function for objects)
- **`explicitArray`** (default: `true`) — Always use arrays for child nodes
- **`ignoreAttrs`** (default: `false`) — Ignore all attributes
- **`mergeAttrs`** (default: `false`) — Merge attributes as properties of parent
- **`validator`** (default: `null`) — Custom validation function
- **`xmlns`** (default: `false`) — Include namespace information
- **`explicitChildren`** (default: `false`) — Separate property for child elements
- **`childkey`** (default: `$$`) — Prefix for child elements
- **`preserveChildrenOrder`** (default: `false`) — Ordered children array
- **`charsAsChildren`** (default: `false`) — Treat text as children
- **`includeWhiteChars`** (default: `false`) — Include whitespace-only text nodes
- **`async`** (default: `false`) — Use async callbacks
- **`strict`** (default: `true`) — Strict XML parsing (highly recommended)
- **`attrNameProcessors`** (default: `null`) — Attribute name processing functions
- **`attrValueProcessors`** (default: `null`) — Attribute value processing functions
- **`tagNameProcessors`** (default: `null`) — Tag name processing functions
- **`valueProcessors`** (default: `null`) — Element value processing functions

### Builder Options

Specify options via `new Builder({optionName: value})`:

- **`attrkey`** (default: `$`) — Prefix for attributes
- **`charkey`** (default: `_`) — Prefix for character content
- **`rootName`** (default: `root`) — Root element name
- **`renderOpts`** — Rendering options for xmlbuilder-js
  - `pretty` (default: `true`) — Prettify output
  - `indent` (default: `'  '`) — Indentation string
  - `newline` (default: `'\n'`) — Newline character
- **`xmldec`** — XML declaration attributes
  - `version` (default: `'1.0'`)
  - `encoding` (default: `'UTF-8'`)
  - `standalone` (default: `true`)
- **`doctype`** (default: `null`) — Optional DTD
- **`headless`** (default: `false`) — Omit XML header
- **`allowSurrogateChars`** (default: `false`) — Allow Unicode surrogate blocks
- **`cdata`** (default: `false`) — Wrap text in CDATA when necessary

---

## Processing Attribute, Tag Names and Values

You can provide custom processing functions to transform names and values during parsing:

```javascript
function nameToUpperCase(name) {
    return name.toUpperCase();
}

xml2js.parseString(xml, {
  tagNameProcessors: [nameToUpperCase],
  attrNameProcessors: [nameToUpperCase],
  valueProcessors: [nameToUpperCase],
  attrValueProcessors: [nameToUpperCase]
}, function (err, result) {
  // All names and values transformed to uppercase
});
```

### Built-in Processors

Available in `lib/processors.js`:

- **`normalize`** — Transform to lowercase
- **`firstCharLowerCase`** — Lowercase first character only
- **`stripPrefix`** — Remove XML namespace prefix (preserves `xmlns`)
- **`parseNumbers`** — Parse numeric strings to numbers
- **`parseBooleans`** — Parse boolean strings to booleans

---

## Running Tests

```bash
npm test          # Run test suite
npm run coverage  # Run with coverage report
npm run lint      # Run ESLint
```

---

## Contributing

Contributions welcome! Please:

1. Write tests for new features or bug fixes
2. Follow existing code style (ESLint enforced)
3. Update documentation as needed
4. Open an issue before major changes

This project uses:
- **ESM** (ECMAScript modules)
- **Node.js >=18**
- **Mocha** for testing
- **ESLint** for code quality

---

## Security

**Reporting vulnerabilities:** Please email security issues to the maintainers rather than opening public issues. We'll coordinate disclosure and patches.

**Security policy:** We monitor CVE databases and dependency advisories. Critical patches are released within 48 hours of disclosure.

---

## License

MIT License — same as the original `xml2js` package.

Copyright (c) 2010-2024 Marek Kubica and [contributors](https://github.com/brickhouse-tech/node-xml2js/graphs/contributors)

Security patches and ongoing maintenance by [Brickhouse Tech](https://github.com/brickhouse-tech).

---

## Credits

Original package by Marek Kubica and the [xml2js contributors](https://github.com/Leonidas-from-XIV/node-xml2js/graphs/contributors).

Security fork maintained by:
- **Brickhouse Tech** — [github.com/brickhouse-tech](https://github.com/brickhouse-tech)
- **Lead Maintainer:** Nick McCready

Special thanks to the security research community for identifying and documenting CVE-2023-0842.

---

## FAQ

### Why fork instead of contributing upstream?

The original maintainer has not responded to issues or pull requests in years. With 29M+ weekly downloads at risk, the community needed an immediate, maintained solution.

### Is this a permanent fork?

We're committed to maintaining this fork as long as the original remains inactive. If upstream development resumes, we'll evaluate reunification.

### Will you add new features?

Our primary focus is security and stability. We accept bug fixes and security patches readily. New features are evaluated case-by-case to maintain compatibility.

### How do I verify the security fix?

Run the test suite (`npm test`) and inspect the three CVE-2023-0842 regression tests in `test/parser.test.js`. The fix implementation is in `lib/parser.js` (the `defineProperty` function).

### What if I find a security issue?

Email the maintainers immediately (see [Security](#security) section). Do not open public issues for vulnerabilities.

---

**Protect your supply chain. Migrate to `@brickhouse-tech/xml2js` today.**

[![npm version](https://img.shields.io/npm/v/@brickhouse-tech/xml2js.svg)](https://www.npmjs.com/package/@brickhouse-tech/xml2js)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/brickhouse-tech?label=Sponsor&logo=github)](https://github.com/sponsors/brickhouse-tech)
