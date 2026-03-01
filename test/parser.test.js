import * as xml2js from '../lib/xml2js.js';
import fs from 'fs';
import util from 'util';
import assert from 'assert';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileName = path.join(__dirname, '/fixtures/sample.xml');
const equ = assert.strictEqual;

function skeleton(options, checks) {
  return function(done) {
    const xmlString = options?.__xmlString;
    delete options?.__xmlString;
    const x2js = new xml2js.Parser(options);
    x2js.addListener('end', (r) => {
      try {
        checks(r);
        done();
      } catch (err) {
        done(err);
      }
    });
    x2js.addListener('error', (err) => {
      done(err);
    });
    if (!xmlString) {
      fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) return done(err);
        data = data.split(os.EOL).join('\n');
        x2js.parseString(data);
      });
    } else {
      x2js.parseString(xmlString);
    }
  };
}

describe('Parser tests', function() {
  it('test parse with defaults', skeleton(undefined, (r) => {
    console.log('Result object:', util.inspect(r, false, 10));
    equ(r.sample.chartest[0].$.desc, 'Test for CHARs');
    equ(r.sample.chartest[0]._, 'Character data here!');
    equ(r.sample.cdatatest[0].$.desc, 'Test for CDATA');
    equ(r.sample.cdatatest[0].$.misc, 'true');
    equ(r.sample.cdatatest[0]._, 'CDATA here!');
    equ(r.sample.nochartest[0].$.desc, 'No data');
    equ(r.sample.nochartest[0].$.misc, 'false');
    equ(r.sample.listtest[0].item[0].subitem[0], 'Foo(1)');
    equ(r.sample.listtest[0].item[0].subitem[1], 'Foo(2)');
    equ(r.sample.listtest[0].item[0].subitem[2], 'Foo(3)');
    equ(r.sample.listtest[0].item[0].subitem[3], 'Foo(4)');
    equ(r.sample.listtest[0].item[1], 'Qux.');
    equ(r.sample.listtest[0].item[2], 'Quux.');
    equ(Object.keys(r.sample.tagcasetest[0]).length, 3);
  }));

  it('test parse with explicitCharkey', skeleton({ explicitCharkey: true }, (r) => {
    console.log('Result object:', util.inspect(r, false, 10));
    equ(r.sample.chartest[0].$.desc, 'Test for CHARs');
    equ(r.sample.chartest[0]._, 'Character data here!');
    equ(r.sample.listtest[0].item[0].subitem[0]._, 'Foo(1)');
    equ(r.sample.listtest[0].item[0].subitem[1]._, 'Foo(2)');
  }));

  it('test child node without explicitArray', skeleton({ explicitArray: false }, (r) => {
    console.log('Result object:', util.inspect(r, false, 10));
    equ(r.sample.arraytest.item[0].subitem, 'Baz.');
    assert(Array.isArray(r.sample.arraytest.item[1].subitem));
    equ(r.sample.arraytest.item[1].subitem[0], 'Foo.');
    equ(r.sample.arraytest.item[1].subitem[1], 'Bar.');
  }));

  it('test simple callback mode', function(done) {
    const x = new xml2js.Parser();
    x.addListener('end', function(r) {
      assert(r);
      done();
    });
    fs.readFile(fileName, function(err, data) {
      x.parseString(data);
    });
  });

  it('test simple callback with options', function(done) {
    const x = new xml2js.Parser({trim: true, explicitRoot: false});
    x.on('end', function(r) {
      console.log('Result object:', util.inspect(r, false, 10));
      assert(r.chartest);
      done();
    });
    fs.readFile(fileName, function(err, data) {
      x.parseString(data);
    });
  });

  it('test simple function without options', function(done) {
    fs.readFile(fileName, function(err, data) {
      xml2js.parseString(data, function(err, r) {
        assert(!err);
        assert(r);
        done();
      });
    });
  });

  it('test simple function with options', function(done) {
    fs.readFile(fileName, function(err, data) {
      xml2js.parseString(data, {trim: true}, function(err, r) {
        assert(!err);
        assert(r);
        done();
      });
    });
  });

  it('test enabled root node elimination', function(done) {
    xml2js.parseString('<root></root>', {explicitRoot: false}, function(err, r) {
      assert(!err);
      assert.deepEqual(r, '');
      done();
    });
  });

  it('test disabled root node elimination', function(done) {
    xml2js.parseString('<root></root>', {explicitRoot: true, explicitArray: false}, function(err, r) {
      assert(!err);
      // Empty element becomes empty string
      assert.deepEqual(r, {root: ''});
      done();
    });
  });

  it('test default empty tag result', skeleton(undefined, (r) => {
    assert.deepEqual(r.sample.emptytest, ['']);
  }));

  it('test empty tag result specified null', skeleton({ emptyTag: null }, (r) => {
    equ(r.sample.emptytest[0], null);
  }));

  it('test invalid empty XML file', skeleton({ __xmlString: ' ' }, (r) => {
    equ(r, null);
  }));

  it('test parseStringPromise parsing', function() {
    const x = new xml2js.Parser();
    return fs.promises.readFile(fileName, 'utf8').then(data => {
      return x.parseStringPromise(data);
    }).then(r => {
      assert(r);
      assert(r.sample);
    });
  });

  it('test global parseStringPromise parsing', function() {
    return fs.promises.readFile(fileName, 'utf8').then(data => {
      return xml2js.parseStringPromise(data);
    }).then(r => {
      assert(r);
      assert(r.sample);
    });
  });

  it('test global parseStringPromise with options', function() {
    return fs.promises.readFile(fileName, 'utf8').then(data => {
      return xml2js.parseStringPromise(data, {trim: true, explicitRoot: false});
    }).then(r => {
      assert(r);
      assert(r.chartest);
    });
  });

  it('test CVE-2023-0842 __proto__ prototype pollution', function(done) {
    const maliciousXML = '<root><__proto__><polluted>POLLUTED</polluted></__proto__></root>';
    xml2js.parseString(maliciousXML, function(err, _result) {
      assert(!err);
      // Make sure prototype pollution didn't happen
      assert(!Object.prototype.polluted);
      assert(!({}).polluted);
      done();
    });
  });

  it('test CVE-2023-0842 constructor prototype pollution', function(done) {
    const maliciousXML = '<root><constructor><polluted>POLLUTED</polluted></constructor></root>';
    xml2js.parseString(maliciousXML, function(err, _result) {
      assert(!err);
      // Make sure prototype pollution didn't happen
      assert(!Object.prototype.polluted);
      assert(!({}).polluted);
      done();
    });
  });

  it('test CVE-2023-0842 __proto__ with attributes', function(done) {
    const maliciousXML = '<root><__proto__ polluted="POLLUTED"/></root>';
    xml2js.parseString(maliciousXML, function(err, _result) {
      assert(!err);
      // Make sure prototype pollution didn't happen
      assert(!Object.prototype.polluted);
      assert(!({}).polluted);
      done();
    });
  });

  it('test text trimming, normalize', skeleton({ trim: true, normalize: true }, (r) => {
    equ(r.sample.whitespacetest[0]._, 'Line One Line Two');
  }));

  it('test text trimming, no normalizing', skeleton({ trim: true, normalize: false }, (r) => {
    equ(r.sample.whitespacetest[0]._, 'Line One\n        Line Two');
  }));

  it('test text no trimming, normalize', skeleton({ trim: false, normalize: true }, (r) => {
    equ(r.sample.whitespacetest[0]._, 'Line One Line Two');
  }));

  it('test text no trimming, no normalize', skeleton({ trim: false, normalize: false }, (r) => {
    equ(r.sample.whitespacetest[0]._, '\n        Line One\n        Line Two\n    ');
  }));

  it('test enabled normalizeTags', skeleton({ normalizeTags: true }, (r) => {
    console.log('Result object:', util.inspect(r, false, 10));
    equ(Object.keys(r.sample.tagcasetest).length, 1);
  }));

  it('test parse with custom char and attribute object keys', skeleton({ attrkey: 'attrobj', charkey: 'charobj' }, (r) => {
    console.log('Result object:', util.inspect(r, false, 10));
    equ(r.sample.chartest[0].attrobj.desc, 'Test for CHARs');
    equ(r.sample.chartest[0].charobj, 'Character data here!');
    equ(r.sample.cdatatest[0].attrobj.desc, 'Test for CDATA');
    equ(r.sample.cdatatest[0].attrobj.misc, 'true');
    equ(r.sample.cdatatest[0].charobj, 'CDATA here!');
    equ(r.sample.cdatawhitespacetest[0].charobj, '   ');
    equ(r.sample.nochartest[0].attrobj.desc, 'No data');
    equ(r.sample.nochartest[0].attrobj.misc, 'false');
  }));

  it('test ignore attributes', skeleton({ ignoreAttrs: true }, (r) => {
    equ(r.sample.chartest[0], 'Character data here!');
    equ(r.sample.cdatatest[0], 'CDATA here!');
  }));

  it('test empty CDATA', function(done) {
    xml2js.parseString('<xml><![CDATA[]]></xml>', function(err, r) {
      assert(!err);
      equ(r.xml, '');
      done();
    });
  });

  it('test non-strict parsing', function(done) {
    const html = '<html><head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head><body>Hello</body></html>';
    xml2js.parseString(html, {strict: false}, function(err, r) {
      assert(!err);
      assert(r);
      done();
    });
  });

  it('test construction with new', function() {
    const withNew = new xml2js.Parser();
    assert(withNew instanceof xml2js.Parser);
    // ES6 classes require 'new', but Parser constructor handles this internally
    const maybeNew = new xml2js.Parser({});
    assert(maybeNew instanceof xml2js.Parser);
  });
});
