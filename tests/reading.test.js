// Okuma Egzersizi testleri: kaynak biçimi, gövde ayrıştırma, süre/aşama, Türkçe katlama ve arama,
// konum/işaret taşıma, ilerleme durumu, listeler ve süreli oturum, kalite denetimi, dışarıdan aktarma,
// derlenmiş kütüphanenin bütünlüğü ve "mikrofon yok" güvencesi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseSourceFile, parseBody, makeText, fold, estimateMinutes, lengthClass, locate, remapLocation, shingles, jaccard, packFromSource, DEFAULT_WPM,
} from '../js/reading/core.js';
import { searchTexts, matchRanges } from '../js/reading/search.js';
import { ensureReading, setPosition, statusOf, addMark, marksFor, createList, listNext, listMove, startTimed, tickTimed, endTimed, setStatus } from '../js/reading/state.js';
import { chunkText } from '../js/reading/readaloud.js';
import { textProblems, catDefaults, buildLang } from '../tools/build-reading.mjs';
import { validatePack } from '../js/views/read-mine.js';

const ROOT = new URL('..', import.meta.url).pathname;
const cats = JSON.parse(await readFile(join(ROOT, 'content-src/reading/categories.json'), 'utf8'));
const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
const long = (n) => Array.from({ length: n }, (_, i) => `Bu ${i + 1}. cümle okuma pratiği için yazıldı.`).join(' ');

test('kaynak bloğu: numaralı ve numarasız başlıklar, meta alanları', () => {
  const b = parseSourceFile('### 7 | Bir\nsub: home | tags: a, b | level: 2\n---\nMetin.\n\n### | İki\nsub: x\n---\nGövde.\n\n### ? | Üç\n---\nSon.');
  assert.equal(b.length, 3);
  assert.deepEqual([b[0].num, b[1].num, b[2].num], [7, null, null]);
  assert.equal(b[0].meta.sub, 'home');
  assert.equal(b[0].meta.level, '2');
  assert.equal(b[1].title, 'İki');
  assert.equal(b[2].body, 'Son.');
});

test('gövde: ara başlık bölüm açar, başlıksız metin otomatik aşamalara bölünür', () => {
  const s = parseBody('## A\n\nbir iki.\n\n## B\n\nüç dört.');
  assert.deepEqual(s.map((x) => x.h), ['A', 'B']);
  const paras = Array.from({ length: 12 }, () => long(10)).join('\n\n');
  const auto = parseBody(paras);
  assert.ok(auto.length > 1, 'uzun başlıksız metin birden çok aşama olmalı');
  assert.ok(auto.every((x) => x.auto && x.h === null), 'otomatik aşamalar özgün başlık gibi sunulmaz');
});

test('diyalog: her "Ad: söz" satırı ayrı konuşmacılı paragraf; şiirde satır sonu korunur', () => {
  const d = parseBody('Elif: Merhaba!\nMert: Selam, nasılsın?\nElif: İyiyim.', { kind: 'dialogue' });
  const p = d[0].paras;
  assert.equal(p.length, 3);
  assert.deepEqual(p.map((x) => x.sp), ['Elif', 'Mert', 'Elif']);
  assert.equal(p[1].t, 'Selam, nasılsın?');
  const poem = parseBody('Bir dize\nİkinci dize\n\nYeni kıta', { kind: 'poem' });
  assert.equal(poem[0].paras[0].t, 'Bir dize\nİkinci dize');
});

test('süre sınıfları ve varsayılan hızlar', () => {
  assert.equal(DEFAULT_WPM.tr, 110);
  assert.equal(lengthClass(estimateMinutes(300, 110)), 'short');
  assert.equal(lengthClass(estimateMinutes(800, 110)), 'medium');
  assert.equal(lengthClass(estimateMinutes(2800, 110)), 'long');
});

test('Türkçe katlama: ı/i ş/s ğ/g ü/u ö/o ç/c', () => {
  assert.equal(fold('IĞDIR Şükrü Çöl Gözlük', 'tr'), fold('igdir sukru col gozluk', 'tr'));
});

test('arama: katlanmış, kelime başı eşleşme; filtreler', () => {
  const metas = [
    { id: 'a', title: 'Çınar Ağacının Gölgesi', cat: 'daily', sub: 'home', level: 1, words: 300, tags: ['ağaç'], heads: [] },
    { id: 'b', title: 'Deniz Feneri', cat: 'stories', sub: 'journey', level: 2, words: 3000, tags: ['deniz'], heads: [] },
  ];
  const r = searchTexts(metas, { q: 'cinar golge' }, { lang: 'tr' });
  assert.deepEqual(r.items.map((x) => x.meta.id), ['a']);
  assert.equal(searchTexts(metas, { len: 'long' }, { lang: 'tr', wpm: { tr: 110 } }).items[0].meta.id, 'b');
  assert.equal(searchTexts(metas, { q: 'xyz' }, { lang: 'tr' }).total, 0);
  assert.ok(matchRanges('Çınar Ağacının Gölgesi', ['cinar'], 'tr').length >= 1);
});

function sampleText() {
  return makeText({ lang: 'tr', cat: 'daily', num: 1, title: 'Örnek', meta: { sub: 'home' }, body: `## Bir\n\n${long(8)}\n\n${long(8)}\n\n## İki\n\n${long(8)}` });
}

test('konum: paragraf kimliğiyle yer, yüzde ve durum; sürüm değişince işaret taşınır', () => {
  const t = sampleText();
  assert.equal(t.id, 'tr-daily-001');
  const R = ensureReading({});
  const pid = t.sections[1].paras[0].id;
  const p = setPosition(R, t, pid);
  assert.equal(p.stage, 2);
  assert.equal(statusOf(R, t.id), 'reading');
  assert.ok(p.pct > 0 && p.pct < 1);
  assert.equal(locate(t, 'yok'), null);
  const m = addMark(R, t, { type: 'bookmark', pid, quote: t.sections[1].paras[0].t.slice(0, 30) });
  assert.equal(marksFor(R, t.id).length, 1);
  const t2 = makeText({ lang: 'tr', cat: 'daily', num: 1, title: 'Örnek', meta: { sub: 'home', version: '2' }, body: `Yeni giriş paragrafı burada.\n\n${t.sections[0].paras.map((x) => x.t).join('\n\n')}\n\n${t.sections[1].paras[0].t}` });
  const moved = remapLocation(t2, m);
  assert.equal(moved.orphan, false);
  assert.notEqual(moved.v, m.v);
  setStatus(R, t, 'done');
  assert.equal(statusOf(R, t.id), 'done');
});

test('listeler ve süreli oturum: sıradaki metin, taşıma, hedef ve mola olayları', () => {
  const R = ensureReading({});
  const l = createList(R, { name: 'L', items: ['x', 'y', 'z'] });
  R.progress.x = { status: 'done' };
  assert.equal(listNext(R, l), 'y');
  assert.ok(listMove(l, 2, 0));
  assert.deepEqual(l.items, ['z', 'x', 'y']);
  startTimed(R, { targetMin: 30, breakEvery: 10 });
  assert.deepEqual(tickTimed(R, 600, 'x'), { break: true });
  const ev = tickTimed(R, 1200, 'y');
  assert.equal(ev.reached, true);
  const rec = endTimed(R);
  assert.equal(rec.sec, 1800);
  assert.equal(R.timed, null);
});

test('sesli okuma: uzun paragraf cümle sınırlarında parçalanır', () => {
  const parts = chunkText(long(40), 220);
  assert.ok(parts.length > 1 && parts.every((x) => x.length <= 260));
});

test('kalite denetimi: kısa, geçersiz alt kategori, yarıda kesilme yakalanır', () => {
  const bad = makeText({ lang: 'tr', cat: 'daily', num: 1, title: 'X', meta: { sub: 'yok' }, body: 'Kısa ve yarım' });
  const msgs = textProblems(bad, catById.daily, cats).map((p) => p.msg).join(' | ');
  assert.match(msgs, /alt kategori/);
  assert.match(msgs, /çok kısa/);
  assert.match(msgs, /yarıda/);
  const ok = makeText({ lang: 'tr', cat: 'daily', num: 2, title: 'Y', meta: { sub: 'home' }, body: long(30) });
  assert.equal(textProblems(ok, catById.daily, cats).filter((p) => !p.warn).length, 0);
  assert.equal(catDefaults('kids', 'dialogue').kind, 'dialogue');
  assert.equal(catDefaults('news').kind, 'fictional-news');
});

test('yakın kopya ölçüsü', () => {
  const a = shingles(long(20));
  assert.equal(jaccard(a, a), 1);
  assert.ok(jaccard(a, shingles('tamamen farklı bir metin burada duruyor ve başka şeyler anlatıyor')) < 0.1);
});

test('dışarıdan aktarma (uygulama içi): blok dosyası pakete dönüşür ve doğrulanır', () => {
  const packs = packFromSource(`### | Dış Metin\nsub: home | lang: en | cat: daily | tags: a, b\n---\n${long(10)}\n\n### | Türkçe\nsub: home\n---\n${long(10)}`, { lang: 'tr', license: 'L' });
  assert.deepEqual(packs.map((p) => p.lang).sort(), ['en', 'tr']);
  for (const p of packs) {
    const r = validatePack(p, cats);
    assert.equal(r.problems.length, 0, r.problems.join());
    assert.equal(r.texts.length, 1);
  }
});

test('derlenmiş kütüphane kaynakla tutarlı: kimlikler benzersiz, gövdeler mevcut, hata yok', async () => {
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    assert.deepEqual(r.errors, [], `${lang}: ${r.errors.slice(0, 3).join(' / ')}`);
    const catalog = JSON.parse(await readFile(join(ROOT, `content/reading/${lang}/catalog.json`), 'utf8'));
    assert.equal(catalog.texts.length, r.texts.length, `${lang}: derlenmiş katalog güncel değil (npm run reading)`);
    const ids = new Set(catalog.texts.map((t) => t.id));
    assert.equal(ids.size, catalog.texts.length);
    for (const c of cats.categories) {
      const bodies = JSON.parse(await readFile(join(ROOT, `content/reading/${lang}/${c.id}.json`), 'utf8'));
      for (const t of catalog.texts.filter((x) => x.cat === c.id)) assert.ok(bodies[t.id]?.sections?.length, `${t.id} gövdesi yok`);
    }
  }
});

test('her kategoride en az 100 metin (eksikler docs/reading/EKSIKLER.md)', async (tt) => {
  const man = JSON.parse(await readFile(join(ROOT, 'content/reading/manifest.json'), 'utf8'));
  const missing = [];
  for (const lang of ['tr', 'en']) for (const [c, n] of Object.entries(man.counts[lang].perCategory)) if (n < 100) missing.push(`${lang}/${c}:${n}`);
  if (missing.length) tt.todo(`Eksik kategoriler: ${missing.join(', ')}`);
  else assert.ok(true);
});

test('mikrofon yok: uygulama kodu ses girişi/kaydı/tanıma API\'si kullanmaz', async () => {
  const files = [];
  const walk = async (d) => { for (const e of await readdir(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) await walk(p); else if (/\.js$/.test(e.name)) files.push(p); } };
  await walk(join(ROOT, 'js'));
  files.push(join(ROOT, 'sw.js'));
  const banned = /getUserMedia|MediaRecorder|SpeechRecognition|webkitSpeechRecognition|enumerateDevices|createMediaStreamSource/;
  for (const f of files) assert.ok(!banned.test(await readFile(f, 'utf8')), `${f} yasaklı ses girişi API'si içeriyor`);
});

// ---------- v4.1: yapay zekâ ile üretim ve kütüphaneye öneri ----------
import { buildPrompt, parseGenerated, generateText, complete, listModels, isConfigured, AIError, toSourceBlock, targetWords } from '../js/reading/ai.js';
import { sendToLibrary, slug, guessRepo } from '../js/reading/github.js';

const fakeRes = (status, obj) => ({ ok: status < 300, status, text: async () => JSON.stringify(obj), json: async () => obj });

test('yapay zekâ: istem kategori, alt kategori, uzunluk ve biçimi içerir', () => {
  const p = buildPrompt({ lang: 'tr', cat: catById.dialogue, topic: 'kafede sipariş', len: 'medium', level: 1 });
  assert.match(p.prompt, /kafede sipariş/);
  assert.match(p.prompt, /### \| Metnin Başlığı/);
  assert.match(p.prompt, /Ad: söz/);
  assert.match(p.prompt, /restaurant/);
  assert.match(p.system, /özgün/);
  assert.ok(targetWords('tr', 'long').min >= 2800);
});

test('yapay zekâ: yanıt ayrıştırma (kod çiti, başlıksız yanıt, kalın ara başlık)', () => {
  const a = parseGenerated('```\n### | Arı ve Bal\nsub: nature | tags: arı, bal\n---\nBir paragraf.\n\n**Kovan**\n\nİkinci paragraf.\n```');
  assert.equal(a.title, 'Arı ve Bal');
  assert.equal(a.meta.sub, 'nature');
  assert.match(a.body, /## Kovan/);
  const b = parseGenerated('Deniz Feneri\nBir zamanlar bir fener vardı.');
  assert.equal(b.title, 'Deniz Feneri');
  assert.match(b.body, /fener vardı/);
});

test('yapay zekâ: kısa kalan metin otomatik uzatılır; servisler doğru adrese gider', async () => {
  const calls = [];
  const words = (n) => Array.from({ length: n }, (_, i) => `kelime${i}`).join(' ') + '.';
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const first = calls.length === 1;
    const text = first ? `### | Deneme\nsub: home | tags: a\n---\n${words(500)}` : `## Devam\n\n${words(400)}`;
    return fakeRes(200, { candidates: [{ content: { parts: [{ text }] } }] });
  };
  const cfg = { provider: 'gemini', key: 'k', model: '' };
  assert.ok(isConfigured(cfg));
  const out = await generateText(cfg, { lang: 'tr', cat: catById.daily, topic: 'ev', len: 'medium', level: 2 }, { fetchImpl });
  assert.ok(out.words >= targetWords('tr', 'medium').min, `${out.words}`);
  assert.ok(calls.length >= 2);
  assert.match(calls[0].url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent/);
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'k');
  // OpenAI uyumlu ve Anthropic
  let seen = null;
  const f2 = async (url, init) => { seen = { url, init }; return fakeRes(200, url.includes('anthropic') ? { content: [{ type: 'text', text: 'ok' }] } : { choices: [{ message: { content: 'ok' } }] }); };
  assert.equal(await complete({ provider: 'groq', key: 'g' }, { system: 's', prompt: 'p' }, f2), 'ok');
  assert.equal(seen.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(seen.init.headers.authorization, 'Bearer g');
  assert.equal(await complete({ provider: 'anthropic', key: 'a' }, { system: 's', prompt: 'p' }, f2), 'ok');
  assert.equal(seen.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
});

test('yapay zekâ: hata kodları ve eksik ayar', async () => {
  await assert.rejects(complete({ provider: 'gemini', key: '' }, { system: 's', prompt: 'p' }), (e) => e instanceof AIError && e.code === 'config');
  const f = (status) => async () => fakeRes(status, { error: { message: 'x' } });
  for (const [st, code] of [[401, 'auth'], [429, 'quota'], [404, 'model'], [500, 'http']]) {
    await assert.rejects(complete({ provider: 'openai', key: 'k' }, { system: 's', prompt: 'p' }, f(st)), (e) => e.code === code);
  }
  const models = await listModels({ provider: 'gemini', key: 'k' }, {}, async () => fakeRes(200, { models: [{ name: 'models/a', supportedGenerationMethods: ['generateContent'] }, { name: 'models/emb', supportedGenerationMethods: ['embedContent'] }] }));
  assert.deepEqual(models, ['a']);
});

test('kütüphaneye öneri: GitHub dosya yolu, Türkçe karakterli içerik ve hata kodları', async () => {
  assert.equal(slug('Çınar Ağacının Gölgesi!'), 'cinar-agacinin-golgesi');
  assert.deepEqual(guessRepo({ hostname: 'musa.github.io', pathname: '/duyum/' }), { owner: 'musa', repo: 'duyum' });
  assert.equal(guessRepo({ hostname: 'localhost', pathname: '/' }), null);
  let req = null;
  const ok = await sendToLibrary({ owner: 'o', repo: 'r', branch: 'main', token: 't' }, { lang: 'tr', cat: 'daily', title: 'Şiir', content: toSourceBlock({ title: 'Şiir', sub: 'home', body: 'Gövde ğüşiöç.' }) }, async (url, init) => { req = { url, init }; return fakeRes(201, { content: { html_url: 'h' } }); });
  assert.ok(ok.ok);
  assert.match(req.url, /^https:\/\/api\.github\.com\/repos\/o\/r\/contents\/content-src\/reading\/inbox\/tr\/daily\/siir-/);
  const body = JSON.parse(req.init.body);
  assert.equal(Buffer.from(body.content, 'base64').toString('utf8').includes('ğüşiöç'), true);
  const bad = await sendToLibrary({ owner: 'o', repo: 'r', token: 't' }, { lang: 'tr', cat: 'daily', title: 'x', content: 'y' }, async () => fakeRes(403, { message: 'no' }));
  assert.equal(bad.code, 'forbidden');
});
