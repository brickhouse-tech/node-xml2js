import sax from 'sax';
import { EventEmitter } from 'events';
import { stripBOM } from './bom.js';
import * as processors from './processors.js';
import { setImmediate } from 'timers';
import { defaults } from './defaults.js';

// Underscore has a nice function for this, but we try to go without dependencies
function isEmpty(thing) {
  return typeof thing === "object" && thing != null && Object.keys(thing).length === 0;
}

function processItem(processors, item, key) {
  for (const process of processors) {
    item = process(item, key);
  }
  return item;
}

function defineProperty(obj, key, value) {
  // make sure the descriptor hasn't been prototype polluted
  const descriptor = Object.create(null);
  descriptor.value = value;
  descriptor.writable = true;
  descriptor.enumerable = true;
  descriptor.configurable = true;
  Object.defineProperty(obj, key, descriptor);
}

export class Parser extends EventEmitter {
  constructor(opts) {
    super();
    // if this was called without 'new', create an instance with new and return
    if (!(this instanceof Parser)) {
      return new Parser(opts);
    }
    // copy this versions default options
    this.options = {};
    for (const key in defaults["0.2"]) {
      if (Object.prototype.hasOwnProperty.call(defaults["0.2"], key)) {
        this.options[key] = defaults["0.2"][key];
      }
    }
    // overwrite them with the specified options, if any
    if (opts) {
      for (const key in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, key)) {
          this.options[key] = opts[key];
        }
      }
    }
    // define the key used for namespaces
    if (this.options.xmlns) {
      this.options.xmlnskey = this.options.attrkey + "ns";
    }
    if (this.options.normalizeTags) {
      if (!this.options.tagNameProcessors) {
        this.options.tagNameProcessors = [];
      }
      this.options.tagNameProcessors.unshift(processors.normalize);
    }

    this.reset();
  }

  processAsync = () => {
    try {
      if (this.remaining.length <= this.options.chunkSize) {
        const chunk = this.remaining;
        this.remaining = '';
        this.saxParser = this.saxParser.write(chunk);
        this.saxParser.close();
      } else {
        const chunk = this.remaining.substr(0, this.options.chunkSize);
        this.remaining = this.remaining.substr(this.options.chunkSize, this.remaining.length);
        this.saxParser = this.saxParser.write(chunk);
        setImmediate(this.processAsync);
      }
    } catch (err) {
      if (!this.saxParser.errThrown) {
        this.saxParser.errThrown = true;
        this.emit('error', err);
      }
    }
  };

  assignOrPush = (obj, key, newValue) => {
    if (!(key in obj)) {
      if (!this.options.explicitArray) {
        defineProperty(obj, key, newValue);
      } else {
        defineProperty(obj, key, [newValue]);
      }
    } else {
      if (!(obj[key] instanceof Array)) {
        defineProperty(obj, key, [obj[key]]);
      }
      obj[key].push(newValue);
    }
  };

  reset = () => {
    // remove all previous listeners for events, to prevent event listener
    // accumulation
    this.removeAllListeners();
    // make the SAX parser. tried trim and normalize, but they are not
    // very helpful
    this.saxParser = sax.parser(this.options.strict, {
      trim: false,
      normalize: false,
      xmlns: this.options.xmlns
    });

    // emit one error event if the sax parser fails. this is mostly a hack, but
    // the sax parser isn't state of the art either.
    this.saxParser.errThrown = false;
    this.saxParser.onerror = (error) => {
      this.saxParser.resume();
      if (!this.saxParser.errThrown) {
        this.saxParser.errThrown = true;
        this.emit("error", error);
      }
    };

    this.saxParser.onend = () => {
      if (!this.saxParser.ended) {
        this.saxParser.ended = true;
        this.emit("end", this.resultObject);
      }
    };

    // another hack to avoid throwing exceptions when the parsing has ended
    // but the user-supplied callback throws an error
    this.saxParser.ended = false;

    // always use the '#' key, even if there are no subkeys
    // setting this property by and is deprecated, yet still supported.
    // better pass it as explicitCharkey option to the constructor
    this.EXPLICIT_CHARKEY = this.options.explicitCharkey;
    this.resultObject = null;
    const stack = [];
    // aliases, so we don't have to type so much
    const attrkey = this.options.attrkey;
    const charkey = this.options.charkey;

    this.saxParser.onopentag = (node) => {
      const obj = {};
      obj[charkey] = "";
      if (!this.options.ignoreAttrs) {
        for (const key in node.attributes) {
          if (Object.prototype.hasOwnProperty.call(node.attributes, key)) {
            if (!(attrkey in obj) && !this.options.mergeAttrs) {
              obj[attrkey] = {};
            }
            const newValue = this.options.attrValueProcessors 
              ? processItem(this.options.attrValueProcessors, node.attributes[key], key) 
              : node.attributes[key];
            const processedKey = this.options.attrNameProcessors 
              ? processItem(this.options.attrNameProcessors, key) 
              : key;
            if (this.options.mergeAttrs) {
              this.assignOrPush(obj, processedKey, newValue);
            } else {
              defineProperty(obj[attrkey], processedKey, newValue);
            }
          }
        }
      }

      // need a place to store the node name
      obj["#name"] = this.options.tagNameProcessors 
        ? processItem(this.options.tagNameProcessors, node.name) 
        : node.name;
      if (this.options.xmlns) {
        obj[this.options.xmlnskey] = { uri: node.uri, local: node.local };
      }
      stack.push(obj);
    };

    this.saxParser.onclosetag = () => {
      let obj = stack.pop();
      const nodeName = obj["#name"];
      if (!this.options.explicitChildren || !this.options.preserveChildrenOrder) {
        delete obj["#name"];
      }

      let cdata;
      if (obj.cdata === true) {
        cdata = obj.cdata;
        delete obj.cdata;
      }

      const s = stack[stack.length - 1];
      let emptyStr;
      // remove the '#' key altogether if it's blank
      if (obj[charkey].match(/^\s*$/) && !cdata) {
        emptyStr = obj[charkey];
        delete obj[charkey];
      } else {
        if (this.options.trim) {
          obj[charkey] = obj[charkey].trim();
        }
        if (this.options.normalize) {
          obj[charkey] = obj[charkey].replace(/\s{2,}/g, " ").trim();
        }
        obj[charkey] = this.options.valueProcessors 
          ? processItem(this.options.valueProcessors, obj[charkey], nodeName) 
          : obj[charkey];
        // also do away with '#' key altogether, if there's no subkeys
        // unless EXPLICIT_CHARKEY is set
        if (Object.keys(obj).length === 1 && charkey in obj && !this.EXPLICIT_CHARKEY) {
          obj = obj[charkey];
        }
      }

      if (isEmpty(obj)) {
        if (typeof this.options.emptyTag === 'function') {
          obj = this.options.emptyTag();
        } else {
          obj = this.options.emptyTag !== '' ? this.options.emptyTag : emptyStr;
        }
      }

      if (this.options.validator != null) {
        const xpath = "/" + stack.map(node => node["#name"]).concat(nodeName).join("/");
        // Wrap try/catch with an inner function to allow V8 to optimise the containing function
        // See https://github.com/Leonidas-from-XIV/node-xml2js/pull/369
        (() => {
          try {
            obj = this.options.validator(xpath, s && s[nodeName], obj);
          } catch (err) {
            this.emit("error", err);
          }
        })();
      }

      // put children into <childkey> property and unfold chars if necessary
      if (this.options.explicitChildren && !this.options.mergeAttrs && typeof obj === 'object') {
        if (!this.options.preserveChildrenOrder) {
          let node = {};
          // separate attributes
          if (this.options.attrkey in obj) {
            node[this.options.attrkey] = obj[this.options.attrkey];
            delete obj[this.options.attrkey];
          }
          // separate char data
          if (!this.options.charsAsChildren && this.options.charkey in obj) {
            node[this.options.charkey] = obj[this.options.charkey];
            delete obj[this.options.charkey];
          }

          if (Object.getOwnPropertyNames(obj).length > 0) {
            node[this.options.childkey] = obj;
          }

          obj = node;
        } else if (s) {
          // append current node onto parent's <childKey> array
          s[this.options.childkey] = s[this.options.childkey] || [];
          // push a clone so that the node in the children array can receive the #name property while the original obj can do without it
          const objClone = {};
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              defineProperty(objClone, key, obj[key]);
            }
          }
          s[this.options.childkey].push(objClone);
          delete obj["#name"];
          // re-check whether we can collapse the node now to just the charkey value
          if (Object.keys(obj).length === 1 && charkey in obj && !this.EXPLICIT_CHARKEY) {
            obj = obj[charkey];
          }
        }
      }

      // check whether we closed all the open tags
      if (stack.length > 0) {
        this.assignOrPush(s, nodeName, obj);
      } else {
        // if explicitRoot was specified, wrap stuff in the root tag name
        if (this.options.explicitRoot) {
          // avoid circular references
          const old = obj;
          obj = {};
          defineProperty(obj, nodeName, old);
        }

        this.resultObject = obj;
        // parsing has ended, mark that so we won't throw exceptions from
        // here anymore
        this.saxParser.ended = true;
        this.emit("end", this.resultObject);
      }
    };

    const ontext = (text) => {
      const s = stack[stack.length - 1];
      if (s) {
        s[charkey] += text;

        if (this.options.explicitChildren && this.options.preserveChildrenOrder && 
            this.options.charsAsChildren && 
            (this.options.includeWhiteChars || text.replace(/\\n/g, '').trim() !== '')) {
          s[this.options.childkey] = s[this.options.childkey] || [];
          const charChild = {
            '#name': '__text__'
          };
          charChild[charkey] = text;
          if (this.options.normalize) {
            charChild[charkey] = charChild[charkey].replace(/\s{2,}/g, " ").trim();
          }
          s[this.options.childkey].push(charChild);
        }

        return s;
      }
    };

    this.saxParser.ontext = ontext;
    this.saxParser.oncdata = (text) => {
      const s = ontext(text);
      if (s) {
        s.cdata = true;
      }
    };
  };

  parseString = (str, cb) => {
    if (cb != null && typeof cb === "function") {
      this.on("end", (result) => {
        this.reset();
        cb(null, result);
      });
      this.on("error", (err) => {
        this.reset();
        cb(err);
      });
    }

    try {
      str = str.toString();
      if (str.trim() === '') {
        this.emit("end", null);
        return true;
      }

      str = stripBOM(str);
      if (this.options.async) {
        this.remaining = str;
        setImmediate(this.processAsync);
        return this.saxParser;
      }
      this.saxParser.write(str).close();
    } catch (err) {
      if (!this.saxParser.errThrown && !this.saxParser.ended) {
        this.emit('error', err);
        this.saxParser.errThrown = true;
      } else if (this.saxParser.ended) {
        throw err;
      }
    }
  };

  parseStringPromise = (str) => {
    return new Promise((resolve, reject) => {
      this.parseString(str, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  };
}

export function parseString(str, a, b) {
  let cb, options;
  // let's determine what we got as arguments
  if (b != null) {
    if (typeof b === 'function') {
      cb = b;
    }
    if (typeof a === 'object') {
      options = a;
    }
  } else {
    // well, b is not set, so a has to be a callback
    if (typeof a === 'function') {
      cb = a;
    }
    // and options should be empty - default
    options = {};
  }

  // the rest is super-easy
  const parser = new Parser(options);
  return parser.parseString(str, cb);
}

export function parseStringPromise(str, a) {
  let options = {};
  if (typeof a === 'object') {
    options = a;
  }

  const parser = new Parser(options);
  return parser.parseStringPromise(str);
}
