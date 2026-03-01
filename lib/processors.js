// matches all xml prefixes, except for `xmlns:`
const prefixMatch = new RegExp(/(?!xmlns)^.*:/);

export function normalize(str) {
  return str.toLowerCase();
}

export function firstCharLowerCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function stripPrefix(str) {
  return str.replace(prefixMatch, '');
}

export function parseNumbers(str) {
  if (!isNaN(str)) {
    str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
  }
  return str;
}

export function parseBooleans(str) {
  if (/^(?:true|false)$/i.test(str)) {
    str = str.toLowerCase() === 'true';
  }
  return str;
}
