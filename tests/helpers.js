import { readFile } from 'node:fs/promises';
import { loadPack } from '../js/content/loader.js';

export const readJSON = async (p) => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));

const cache = {};
export async function getPack(lang) {
  cache[lang] ||= loadPack(lang, readJSON);
  return cache[lang];
}

// Tüm telaffuz doğrulamaları "doğru" sayılan test ortamı.
export const allOk = () => 'ok';
