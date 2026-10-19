import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import tr from '../locales/tr.js';
import en from '../locales/en.js';
import { t, setLocale } from '../js/i18n.js';
import { createStore, normalize, STORAGE_KEY } from '../js/store.js';
import { TASKS, GROUPS, PATHS, SCENARIO_GROUPS } from '../js/engine/registry.js';
import { listAssets } from '../tools/sw-assets.mjs';
import { getPack } from './helpers.js';

test('Türkçe ve İngilizce çeviri anahtarları aynıdır', () => {
  const a = Object.keys(tr).sort();
  const b = Object.keys(en).sort();
  assert.deepEqual(a.filter((k) => !b.includes(k)), [], 'İngilizce eksik');
  assert.deepEqual(b.filter((k) => !a.includes(k)), [], 'Türkçe eksik');
  for (const k of a) assert.ok(tr[k].trim() && en[k].trim(), `boş metin: ${k}`);
});

test('koddaki tüm t() anahtarları sözlükte var', async () => {
  const files = ['js/app.js', ...(await readdir('js/views')).map((f) => `js/views/${f}`)];
  const missing = [];
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)) if (!(m[1] in tr)) missing.push(`${f}: ${m[1]}`);
  }
  assert.deepEqual(missing, []);
});

test('motorun ve içeriğin kullandığı anahtarlar her iki dilde var', async () => {
  const files = (await readdir('js/engine/tasks')).map((f) => `js/engine/tasks/${f}`).concat(['js/content/questions.js']);
  const keys = new Set();
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/'((?:q|opt|sub|note|ex)\.[a-zA-Z.]+)'/g)) keys.add(m[1]);
  }
  assert.ok(keys.size > 30, `beklenenden az anahtar: ${keys.size}`);
  for (const t of TASKS) { keys.add(`task.${t.id}.title`); keys.add(`task.${t.id}.desc`); }
  for (const g of GROUPS) { keys.add(`group.${g.id}.title`); keys.add(`group.${g.id}.desc`); }
  for (const p of PATHS) { keys.add(`path.${p.id}.title`); keys.add(`path.${p.id}.desc`); }
  for (const g of SCENARIO_GROUPS) { keys.add(`scgroup.${g}`); keys.add(`scgroup.${g}.desc`); }
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    const json = JSON.stringify([pack.scenarios, pack.paragraphs, pack.templates]);
    for (const m of json.matchAll(/"sfx":"(\w+)"/g)) keys.add(`sfx.${m[1]}`);
    for (const m of json.matchAll(/"disclaimer":"(\w+)"/g)) keys.add(`note.${m[1]}`);
    for (const m of json.matchAll(/"type":"(\w+)"/g)) keys.add(`qtype.${m[1]}`);
    for (const m of json.matchAll(/"struct":"(\w+)"/g)) keys.add(`struct.${m[1]}`);
  }
  const missing = [...keys].filter((k) => !(k in tr) || !(k in en) || /\.$/.test(k));
  assert.deepEqual(missing.filter((k) => !k.endsWith('.')), []);
});

test('değişken yerleştirme ve dil geçişi', () => {
  setLocale('tr');
  assert.equal(t('ex.progress', { n: 2, total: 8 }), 'Soru 2 / 8');
  setLocale('en');
  assert.equal(t('ex.progress', { n: 2, total: 8 }), 'Question 2 of 8');
  setLocale('xx');
  assert.equal(t('nav.home'), 'Ana sayfa', 'desteklenmeyen dilde Türkçeye döner');
});

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

test('profil oluşturma, kaydetme ve yeniden yükleme', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  assert.equal(store.state.settings.uiLang, 'tr', 'varsayılan arayüz dili Türkçe');
  const p = store.addProfile({ type: 'child', name: 'Ece', exerciseLang: 'en' });
  store.recordSession(p, { id: 's1', date: new Date().toISOString(), category: 'words', total: 6, correct: 5, durationSec: 90, items: [] });
  const again = createStore(storage);
  const q = again.activeProfile();
  assert.equal(q.name, 'Ece');
  assert.equal(q.type, 'child');
  assert.equal(q.exerciseLang, 'en');
  assert.equal(q.sessions.length, 1);
  assert.equal(q.dailyGoalMin, 5, 'çocuk için kısa varsayılan hedef');
});

test('arayüz dili ve egzersiz dili bağımsızdır', () => {
  const store = createStore(memoryStorage());
  store.state.settings.uiLang = 'en';
  const p = store.addProfile({ exerciseLang: 'tr' });
  assert.equal(store.state.settings.uiLang, 'en');
  assert.equal(p.exerciseLang, 'tr');
});

test('dışa aktarma, içe aktarma ve silme', () => {
  const s1 = createStore(memoryStorage());
  s1.addProfile({ name: 'A' });
  const json = s1.exportJSON();
  const storage2 = memoryStorage();
  const s2 = createStore(storage2);
  s2.importJSON(json);
  assert.equal(s2.activeProfile().name, 'A');
  assert.throws(() => s2.importJSON('{"foo":1}'));
  s2.wipe();
  assert.equal(s2.state.profiles.length, 0);
  assert.equal(storage2.getItem(STORAGE_KEY), null);
});

test('bozuk veri güvenli biçimde normalleştirilir', () => {
  const st = normalize({ profiles: [{ name: 'x', voice: { tr: { rate: 1.1 } } }], activeProfileId: 'yok' });
  assert.equal(st.activeProfileId, st.profiles[0].id);
  assert.equal(st.profiles[0].voice.tr.rate, 1.1);
  assert.equal(st.profiles[0].voice.en.accent, 'en-US');
  const broken = createStore({ getItem: () => '{bozuk', setItem() { throw new Error('kota'); }, removeItem() {} });
  assert.equal(broken.persistent, false);
  assert.equal(broken.save(), false);
});

test('service worker önbellek listesi tüm uygulama dosyalarını içerir', async () => {
  const sw = await readFile('sw.js', 'utf8');
  const assets = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter(Boolean);
  for (const a of assets) await readFile(a);
  const expected = (await listAssets()).map((x) => x.replace(/^\.\//, '')).filter(Boolean);
  const missing = expected.filter((f) => !assets.includes(f));
  assert.deepEqual(missing, [], 'node tools/sw-assets.mjs çalıştırın');
});
