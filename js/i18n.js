import tr from '../locales/tr.js';
import en from '../locales/en.js';

export const LOCALES = { tr, en };
export const SUPPORTED = ['tr', 'en'];
let current = 'tr';

export function setLocale(lang) {
  current = SUPPORTED.includes(lang) ? lang : 'tr';
  if (globalThis.document) document.documentElement.lang = current;
}

export function getLocale() {
  return current;
}

export function t(key, vars = {}, lang = current) {
  const raw = LOCALES[lang]?.[key] ?? LOCALES.tr[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export function formatDuration(sec, lang = current) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (lang === 'tr') return m ? `${m} dk ${s} sn` : `${s} sn`;
  return m ? `${m} min ${s} s` : `${s} s`;
}

export function formatDate(iso, lang = current) {
  return new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function pct(x) {
  return x === null || x === undefined ? '–' : `%${Math.round(x * 100)}`.replace(/^%(\d+)$/, current === 'tr' ? '%$1' : '$1%');
}
