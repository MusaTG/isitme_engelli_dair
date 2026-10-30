// Klinik iddia ve lisans denetimi (araştırma kararı 2026-10-24, REQ-06/REQ-07).
// Arayüz, rehber ve istem metinlerinde OLUMLU klinik iddia bulunmamalı; feragat cümleleri ("tedavi değildir") serbesttir.
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readability } from '../js/reading/core.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLAIMS = [
  /işitme(yi|nizi|ni|nizi)?\s+(geliştirir|iyileştirir|düzeltir|güçlendirir|tedavi eder)/i,
  /\btedavi\s+eder\b/i,
  /klinik olarak (kanıtlanmış|onaylı|doğrulanmış)/i,
  /\bimproves?\s+(your\s+)?hearing\b/i,
  /\b(cures?|treats?|restores?)\s+(your\s+)?(hearing|deafness|hearing loss)\b/i,
  /\bclinically\s+(proven|validated|approved)\b/i,
];

async function files(dir, re) {
  const out = [];
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await files(p, re)); else if (re.test(e.name)) out.push(p);
  }
  return out;
}

test('arayüz, rehber ve istemlerde olumlu klinik iddia yok', async () => {
  const list = [...await files('locales', /\.js$/), ...await files('js', /\.js$/), ...await files('docs/reading/istemler', /\.md$/), ...await files('docs/research/notebooklm/uretim', /\.(md|txt)$/), 'index.html', 'README.md'];
  const hits = [];
  for (const f of list) {
    const lines = (await readFile(join(ROOT, f), 'utf8')).split('\n');
    lines.forEach((l, i) => { for (const re of CLAIMS) if (re.test(l)) hits.push(`${f}:${i + 1}: ${l.trim().slice(0, 120)}`); });
  }
  assert.deepEqual(hits, []);
});

test('kütüphane lisansı: genel lisans notu var, kaynak belirtilen her metinde lisans var', async () => {
  const cats = JSON.parse(await readFile(join(ROOT, 'content-src/reading/categories.json'), 'utf8'));
  assert.ok(cats.license?.tr && cats.license?.en);
  for (const lang of ['tr', 'en']) {
    let cat;
    try { cat = JSON.parse(await readFile(join(ROOT, `content/reading/${lang}/catalog.json`), 'utf8')); } catch { continue; }
    const bad = (cat.texts || []).filter((m) => m.source && !m.license).map((m) => m.id);
    assert.deepEqual(bad, [], `${lang}: kaynaklı ama lisanssız`);
  }
});

test('okunabilirlik: Ateşman / Flesch formülü ve sınırlar', () => {
  // 30 kelime, her biri 2 hece ("kedi"), cümle başına 10 kelime → 198,825 − 40,175×2 − 2,61×10 = 92,375
  const tr = Array.from({ length: 3 }, () => `${Array(10).fill('kedi').join(' ')}.`).join(' ');
  assert.deepEqual(readability(tr, 'tr'), { score: 92, band: 'easy', formula: 'Ateşman' });
  const hard = Array.from({ length: 2 }, () => `${Array(20).fill('değerlendirilmesinde').join(' ')}.`).join(' ');
  assert.equal(readability(hard, 'tr').band, 'hard');
  assert.equal(readability(hard, 'tr').score, 0); // alt sınıra kırpılır
  assert.equal(readability('kısa metin.', 'tr'), null); // 30 kelimeden kısa: puan yok
  const en = Array.from({ length: 3 }, () => `${Array(10).fill('cat').join(' ')}.`).join(' ');
  assert.equal(readability(en, 'en').score, 100);
});
