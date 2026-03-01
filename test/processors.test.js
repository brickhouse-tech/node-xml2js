import * as processors from '../lib/processors.js';
import * as xml2js from '../lib/xml2js.js';
import assert from 'assert';
const equ = assert.equal;

function parseNumbersExceptAccount(value, key) {
  if (key === 'accountNumber') {
    return value;
  }
  return processors.parseNumbers(value);
}

describe('Processors tests', function() {
  it('test normalize', function() {
    const demo = 'This shOUld BE loWErcase';
    const result = processors.normalize(demo);
    equ(result, 'this should be lowercase');
  });

  it('test firstCharLowerCase', function() {
    const demo = 'ThiS SHould OnlY LOwercase the fIRST cHar';
    const result = processors.firstCharLowerCase(demo);
    equ(result, 'thiS SHould OnlY LOwercase the fIRST cHar');
  });

  it('test stripPrefix', function() {
    const demo = 'stripMe:DoNotTouch';
    const result = processors.stripPrefix(demo);
    equ(result, 'DoNotTouch');
  });

  it('test stripPrefix, ignore xmlns', function() {
    const demo = 'xmlns:shouldHavePrefix';
    const result = processors.stripPrefix(demo);
    equ(result, 'xmlns:shouldHavePrefix');
  });

  it('test parseNumbers', function() {
    equ(processors.parseNumbers('0'), 0);
    equ(processors.parseNumbers('123'), 123);
    equ(processors.parseNumbers('15.56'), 15.56);
    equ(processors.parseNumbers('10.00'), 10);
  });

  it('test parseBooleans', function() {
    equ(processors.parseBooleans('true'), true);
    equ(processors.parseBooleans('True'), true);
    equ(processors.parseBooleans('TRUE'), true);
    equ(processors.parseBooleans('false'), false);
    equ(processors.parseBooleans('False'), false);
    equ(processors.parseBooleans('FALSE'), false);
    equ(processors.parseBooleans('truex'), 'truex');
    equ(processors.parseBooleans('xtrue'), 'xtrue');
    equ(processors.parseBooleans('x'), 'x');
    equ(processors.parseBooleans(''), '');
  });

  it('test a processor that filters by node name', function(done) {
    const xml = '<account><accountNumber>0012345</accountNumber><balance>123.45</balance></account>';
    const options = { valueProcessors: [parseNumbersExceptAccount] };
    xml2js.parseString(xml, options, (err, parsed) => {
      equ(parsed.account.accountNumber, '0012345');
      equ(parsed.account.balance, 123.45);
      done();
    });
  });

  it('test a processor that filters by attr name', function(done) {
    const xml = '<account accountNumber="0012345" balance="123.45" />';
    const options = { attrValueProcessors: [parseNumbersExceptAccount] };
    xml2js.parseString(xml, options, (err, parsed) => {
      equ(parsed.account.$.accountNumber, '0012345');
      equ(parsed.account.$.balance, 123.45);
      done();
    });
  });
});
