import { defaults } from './defaults.js';
import { Builder } from './builder.js';
import { Parser, parseString, parseStringPromise } from './parser.js';
import * as processors from './processors.js';

export { defaults };
export { processors };

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = 'ValidationError';
  }
}

export { Builder };
export { Parser };
export { parseString };
export { parseStringPromise };
