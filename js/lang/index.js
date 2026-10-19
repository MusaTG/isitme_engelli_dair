import * as tr from './tr.js';
import * as en from './en.js';

export const LANGS = { tr, en };
export const langOf = (code) => LANGS[code] || LANGS.tr;
