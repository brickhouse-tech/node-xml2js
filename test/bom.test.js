import * as xml2js from '../lib/xml2js.js';
import assert from 'assert';
const equ = assert.equal;

describe('BOM tests', function() {
  it('test decoded BOM', function(done) {
    const demo = '\uFEFF<xml><foo>bar</foo></xml>';
    xml2js.parseString(demo, (err, res) => {
      equ(err, undefined);
      equ(res.xml.foo[0], 'bar');
      done();
    });
  });
});
