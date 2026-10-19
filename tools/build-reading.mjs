// Okuma kütüphanesini derler ve doğrular.
// Kaynak: content-src/reading/<dil>/<kategori>*.txt  →  Çıktı: content/reading/<dil>/{catalog,search,<kategori>}.json
// Kullanım:
//   node tools/build-reading.mjs            derle + rapor
//   node tools/build-reading.mjs --check    derlenmiş dosyalar kaynakla aynı mı? (CI)
//   node tools/build-reading.mjs --strict   her kategoride en az 100 metin yoksa hata
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseSourceFile, makeText, sectionsText, shingles, tokenSet, sentences, fold, DEFAULT_WPM, estimateMinutes, lengthClass } from '../js/reading/core.js';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'content-src/reading');
const OUT = join(ROOT, 'content/reading');
const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const STRICT = args.has('--strict');
const QUIET = args.has('--quiet');

export { MIN_WORDS, KIDS_MIN, NEAR_DUP, CAT_KIND, catDefaults, textProblems } from '../js/reading/rules.js';
import { NEAR_DUP, catDefaults, textProblems } from '../js/reading/rules.js';

export async function buildLang(lang, cats) {
  const errors = [];
  const warnings = [];
  const texts = [];
  let files = [];
  try { files = (await readdir(join(SRC, lang))).filter((f) => f.endsWith('.txt')).sort(); } catch { /* dil klasörü yok */ }
  for (const cat of cats.categories) {
    const own = files.filter((f) => f === `${cat.id}.txt` || f.startsWith(`${cat.id}-`));
    const seen = new Set();
    for (const f of own) {
      const blocks = parseSourceFile(await readFile(join(SRC, lang, f), 'utf8'));
      for (const b of blocks) {
        const where = `${lang}/${f}#${b.num}`;
        if (b.num == null) { errors.push(`${lang}/${f}: "${b.title}" numarasız — önce "npm run reading:import" çalıştırın ya da numara verin`); continue; }
        if (seen.has(b.num)) { errors.push(`${where}: aynı numara iki kez kullanılmış`); continue; }
        seen.add(b.num);
        const t = makeText({ lang, cat: cat.id, num: b.num, title: b.title, meta: b.meta, body: b.body, defaults: catDefaults(cat.id, b.meta.sub) });
        t.file = f;
        for (const p of textProblems(t, cat, cats)) (p.warn ? warnings : errors).push(`${where}: ${p.msg}`);
        texts.push(t);
      }
    }
  }
  // Başlık ve içerik yinelemeleri
  const byTitle = new Map();
  const byHash = new Map();
  for (const t of texts) {
    const k = fold(t.title, lang);
    if (byTitle.has(k)) errors.push(`${t.id}: başlık ${byTitle.get(k)} ile aynı`); else byTitle.set(k, t.id);
    const h = fold(sectionsText(t.sections), lang);
    if (byHash.has(h)) errors.push(`${t.id}: içerik ${byHash.get(h)} ile birebir aynı`); else byHash.set(h, t.id);
  }
  // Yakın kopya: ortak 5 kelimelik parçalar (ters dizinle, yalnızca ortak parçası olan çiftler sayılır)
  const sh = texts.map((t) => shingles(sectionsText(t.sections), lang));
  const inv = new Map();
  sh.forEach((set, i) => { for (const s of set) { const l = inv.get(s); if (l) l.push(i); else inv.set(s, [i]); } });
  const shared = new Map();
  for (const list of inv.values()) {
    if (list.length < 2 || list.length > 40) continue;
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const key = `${list[a]}|${list[b]}`;
      shared.set(key, (shared.get(key) || 0) + 1);
    }
  }
  const similar = [];
  for (const [key, n] of shared) {
    const [a, b] = key.split('|').map(Number);
    const j = n / (sh[a].size + sh[b].size - n);
    const contain = n / Math.min(sh[a].size, sh[b].size);
    if (j >= NEAR_DUP || contain >= 0.5) { errors.push(`${texts[a].id} ~ ${texts[b].id}: çok benzer (Jaccard ${j.toFixed(2)}, kapsama ${contain.toFixed(2)})`); similar.push([texts[a].id, texts[b].id, j]); }
  }
  // Seri bütünlüğü
  const series = new Map();
  for (const t of texts.filter((x) => x.series)) { const l = series.get(t.series) || []; l.push(t); series.set(t.series, l); }
  for (const [sid, list] of series) {
    const parts = list.map((x) => x.part).sort((a, b) => a - b);
    parts.forEach((p, i) => { if (p !== i + 1) errors.push(`seri ${lang}/${sid}: bölüm numaraları ardışık değil (${parts.join(',')})`); });
  }
  const perCat = Object.fromEntries(cats.categories.map((c) => [c.id, texts.filter((t) => t.cat === c.id).length]));
  for (const c of cats.categories) if (perCat[c.id] < cats.minPerCategory) (STRICT ? errors : warnings).push(`${lang}/${c.id}: ${perCat[c.id]} metin (hedef en az ${cats.minPerCategory})`);
  return { texts, errors: [...new Set(errors)], warnings, perCat, series };
}

function catalogEntry(t) {
  return {
    id: t.id, n: t.n, cat: t.cat, sub: t.sub, title: t.title, kind: t.kind, aud: t.aud, level: t.level, tags: t.tags,
    ...(t.series ? { series: t.series, part: t.part } : {}), version: t.version, hash: t.hash, words: t.words,
    stages: t.sections.length, heads: t.sections.filter((s) => s.h).map((s) => s.h), preview: t.preview, ...(t.summary ? { summary: t.summary } : {}),
  };
}

function bodyEntry(t) {
  return { hash: t.hash, version: t.version, sections: t.sections.map((s) => ({ id: s.id, h: s.h, ...(s.auto ? { auto: true } : {}), words: s.words, paras: s.paras })) };
}

const stable = (obj) => `${JSON.stringify(obj)}\n`;

async function main() {
  const cats = JSON.parse(await readFile(join(SRC, 'categories.json'), 'utf8'));
  const outputs = new Map();
  let failed = false;
  const summary = {};
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    summary[lang] = r;
    const catalog = { lang, schema: 1, categories: cats.categories.map((c) => ({ id: c.id, count: r.perCat[c.id] })), texts: r.texts.map(catalogEntry) };
    outputs.set(`${lang}/catalog.json`, stable(catalog));
    const search = Object.fromEntries(r.texts.map((t) => [t.id, [...tokenSet(sectionsText(t.sections), lang)].sort().join(' ')]));
    outputs.set(`${lang}/search.json`, stable(search));
    for (const c of cats.categories) {
      const list = r.texts.filter((t) => t.cat === c.id);
      outputs.set(`${lang}/${c.id}.json`, stable(Object.fromEntries(list.map((t) => [t.id, bodyEntry(t)]))));
    }
    if (r.errors.length) failed = true;
  }
  outputs.set('categories.json', stable(cats));
  const manifest = { schema: 1, langs: ['tr', 'en'], counts: Object.fromEntries(Object.entries(summary).map(([l, r]) => [l, { total: r.texts.length, unique: new Set(r.texts.map((t) => t.hash)).size, perCategory: r.perCat }])) };
  outputs.set('manifest.json', stable(manifest));

  if (CHECK) {
    let stale = [];
    for (const [rel, content] of outputs) {
      let cur = null;
      try { cur = await readFile(join(OUT, rel), 'utf8'); } catch { /* yok */ }
      if (cur !== content) stale.push(rel);
    }
    if (stale.length) { console.log(`Derlenmiş okuma dosyaları güncel değil: ${stale.join(', ')}\nÇalıştırın: node tools/build-reading.mjs`); failed = true; }
  } else {
    for (const [rel, content] of outputs) {
      await mkdir(join(OUT, rel.split('/').slice(0, -1).join('/')), { recursive: true });
      await writeFile(join(OUT, rel), content);
    }
    await writeFile(join(ROOT, 'docs/reading/inventory.md'), inventory(cats, summary));
  }

  for (const lang of ['tr', 'en']) {
    const r = summary[lang];
    const uniq = new Set(r.texts.map((t) => t.hash)).size;
    console.log(`${lang}: ${r.texts.length} metin (${uniq} benzersiz), ${cats.categories.length} kategori — ${cats.categories.map((c) => `${c.id} ${r.perCat[c.id]}`).join(', ')}`);
    for (const e of r.errors) console.log(`  HATA  ${e}`);
    if (!QUIET) for (const w of r.warnings) console.log(`  uyarı ${w}`);
  }
  process.exit(failed ? 1 : 0);
}

function inventory(cats, summary) {
  const lines = ['# Okuma kütüphanesi envanteri', '', 'Bu dosya `node tools/build-reading.mjs` tarafından otomatik üretilir; elle düzenlemeyin.', '',
    `Süre sınıfları varsayılan sesli okuma hızına göre hesaplanır (TR ${DEFAULT_WPM.tr}, EN ${DEFAULT_WPM.en} kelime/dk): kısa < 7 dk, orta 7–25 dk, uzun ≥ 25 dk. Tahminidir.`, ''];
  for (const lang of ['tr', 'en']) {
    const r = summary[lang];
    lines.push(`## ${lang === 'tr' ? 'Türkçe' : 'İngilizce'}`, '', `Toplam ${r.texts.length} metin, ${new Set(r.texts.map((t) => t.hash)).size} benzersiz içerik, ${r.texts.reduce((n, t) => n + t.words, 0).toLocaleString('tr-TR')} kelime.`, '');
    lines.push('| Kategori | Metin | Kısa | Orta | Uzun | Kelime | Seviye 1/2/3 |', '|---|---:|---:|---:|---:|---:|---|');
    for (const c of cats.categories) {
      const list = r.texts.filter((t) => t.cat === c.id);
      const cls = { short: 0, medium: 0, long: 0 };
      for (const t of list) cls[lengthClass(estimateMinutes(t.words, DEFAULT_WPM[lang]))] += 1;
      const lv = [1, 2, 3].map((n) => list.filter((t) => t.level === n).length).join('/');
      lines.push(`| ${c.name.tr} | ${list.length} | ${cls.short} | ${cls.medium} | ${cls.long} | ${list.reduce((n, t) => n + t.words, 0)} | ${lv} |`);
    }
    lines.push('');
    if (r.series.size) {
      lines.push('Seriler (roman tarzı):', '');
      for (const [sid, list] of r.series) lines.push(`- ${sid}: ${list.length} bölüm, ${list.reduce((n, t) => n + t.words, 0)} kelime`);
      lines.push('');
    }
  }
  return `${lines.join('\n')}\n`;
}

if (process.argv[1] === new URL(import.meta.url).pathname) await main();
