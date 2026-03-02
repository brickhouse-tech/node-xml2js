import builder from 'xmlbuilder';
import { defaults } from './defaults.js';

function requiresCDATA(entry) {
  return typeof entry === "string" && (entry.indexOf('&') >= 0 || entry.indexOf('>') >= 0 || entry.indexOf('<') >= 0);
}

// Note that we do this manually instead of using xmlbuilder's `.dat` method
// since it does not support escaping the CDATA close entity (throws an error if
// it exists, and if it's pre-escaped).
function wrapCDATA(entry) {
  return `<![CDATA[${escapeCDATA(entry)}]]>`;
}

function escapeCDATA(entry) {
  // Split the CDATA section in two;
  // The first contains the ']]'
  // The second contains the '>'
  // When later parsed, it will be put back together as ']]>'
  return entry.replace(']]>', ']]]]><![CDATA[>');
}

export class Builder {
  constructor(opts) {
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
  }

  buildObject(rootObj) {
    const attrkey = this.options.attrkey;
    const charkey = this.options.charkey;

    let rootName;
    // If there is a sane-looking first element to use as the root,
    // and the user hasn't specified a non-default rootName,
    if (Object.keys(rootObj).length === 1 && this.options.rootName === defaults['0.2'].rootName) {
      // we'll take the first element as the root element
      rootName = Object.keys(rootObj)[0];
      rootObj = rootObj[rootName];
    } else {
      // otherwise we'll use whatever they've set, or the default
      rootName = this.options.rootName;
    }

    const render = (element, obj) => {
      if (typeof obj !== 'object') {
        // single element, just append it as text
        if (this.options.cdata && requiresCDATA(obj)) {
          element.raw(wrapCDATA(obj));
        } else {
          element.txt(obj);
        }
      } else if (Array.isArray(obj)) {
        // fix issue #119
        for (const index in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, index)) {
            const child = obj[index];
            for (const key in child) {
              if (Object.prototype.hasOwnProperty.call(child, key)) {
                element = render(element.ele(key), child[key]).up();
              }
            }
          }
        }
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const child = obj[key];
            // Case #1 Attribute
            if (key === attrkey) {
              if (typeof child === "object") {
                // Inserts tag attributes
                for (const attr in child) {
                  if (Object.prototype.hasOwnProperty.call(child, attr)) {
                    element = element.att(attr, child[attr]);
                  }
                }
              }
            }
            // Case #2 Char data (CDATA, etc.)
            else if (key === charkey) {
              if (this.options.cdata && requiresCDATA(child)) {
                element = element.raw(wrapCDATA(child));
              } else {
                element = element.txt(child);
              }
            }
            // Case #3 Array data
            else if (Array.isArray(child)) {
              for (const index in child) {
                if (Object.prototype.hasOwnProperty.call(child, index)) {
                  const entry = child[index];
                  if (typeof entry === 'string') {
                    if (this.options.cdata && requiresCDATA(entry)) {
                      element = element.ele(key).raw(wrapCDATA(entry)).up();
                    } else {
                      element = element.ele(key, entry).up();
                    }
                  } else {
                    element = render(element.ele(key), entry).up();
                  }
                }
              }
            }
            // Case #4 Objects
            else if (typeof child === "object") {
              element = render(element.ele(key), child).up();
            }
            // Case #5 String and remaining types
            else {
              if (typeof child === 'string' && this.options.cdata && requiresCDATA(child)) {
                element = element.ele(key).raw(wrapCDATA(child)).up();
              } else {
                let childValue = child;
                if (child == null) {
                  childValue = '';
                }
                element = element.ele(key, childValue.toString()).up();
              }
            }
          }
        }
      }

      return element;
    };

    const rootElement = builder.create(rootName, this.options.xmldec, this.options.doctype, {
      headless: this.options.headless,
      allowSurrogateChars: this.options.allowSurrogateChars
    });

    return render(rootElement, rootObj).end(this.options.renderOpts);
  }
}
