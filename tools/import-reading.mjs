// Dışarıda (ör. başka bir yapay zekâ sohbetinde) üretilmiş okuma metinlerini kütüphaneye aktarır.
//
// 1) Üretilen metni bir dosyaya kaydedin ve şu klasöre koyun:
//      content-src/reading/inbox/<dil>/<kategori>/herhangi-bir-ad.txt     (ör. inbox/tr/dialogue/parti-1.txt)
//    Dil ve kategori klasör adından alınır. İsterseniz her blokta "lang: tr | cat: dialogue" da yazabilirsiniz;
//    o zaman dosyayı doğrudan inbox/ içine koymanız yeterli.
// 2) Çalıştırın:  npm run reading:import        (yalnızca denetlemek için: npm run reading:import -- --dry)
//    GitHub'a yüklediyseniz yayın iş akışı bu adımı kendisi çalıştırır.
//
// Ne yapar: blokları okur, sıradaki boş numaraları verir (bloktaki numara yok sayılır), kalite denetimi yapar
// (alt kategori, uzunluk, yarıda kesilme, aynı başlık, mevcut metinlerle/yan yana yakın kopya, seri bölümleri),
// kabul edilenleri content-src/reading/<dil>/<kategori>-import-NN.txt dosyasına ekler, işlenen dosyayı
// inbox/_islendi/ altına taşır, reddedilen blokları gerekçeleriyle inbox/_reddedildi/ altına yazar ve
// kütüphaneyi yeniden derler. Rapor: content-src/reading/inbox/RAPOR.md
//
// Desteklenen biçimler: .txt / .md (### blok biçimi — docs/reading-format.md) ve .json
// (dizi ya da { "texts": [...] }; alanlar: lang, cat, title, sub, tags, kind, aud, level, series, part, summary, body).
import { readdir, readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseSourceFile, makeText, sectionsText, shingles, fold } from '../js/reading/core.js';
import { buildLang, textProblems, catDefaults, NEAR_DUP } from './build-reading.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'content-src/reading');
const INBOX = join(SRC, 'inbox');
const DONE = join(INBOX, '_islendi');
const REJ = join(INBOX, '_reddedildi');
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const NO_BUILD = args.has('--no-build');
const META_ORDER = ['sub', 'kind', 'aud', 'level', 'series', 'part', 'version', 'tags', 'summary'];

async function walk(dir) {
  let out = [];
  let ents = [];
  try { ents = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    else if (/\.(txt|md|json)$/i.test(e.name) && !/^(README|RAPOR)\.md$/i.test(e.name)) out.push(p);
  }
  return out.sort();
}

function blocksFromJson(src) {
  const j = JSON.parse(src);
  const list = Array.isArray(j) ? j : j.texts || [];
  return list.map((x) => ({
    num: null,
    title: String(x.title || '').trim(),
    meta: Object.fromEntries(Object.entries({ lang: x.lang || j.lang, cat: x.cat, sub: x.sub, kind: x.kind, aud: x.aud, level: x.level, series: x.series, part: x.part, summary: x.summary, tags: Array.isArray(x.tags) ? x.tags.join(', ') : x.tags })
      .filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])),
    body: String(x.body || '').replace(/\r\n?/g, '\n').trim(),
  }));
}

function serialize(num, b) {
  const meta = META_ORDER.filter((k) => b.meta[k]).map((k) => `${k}: ${String(b.meta[k]).replace(/\s*\|\s*/g, ' / ')}`).join(' | ');
  return `### ${num} | ${b.title}\n${meta}\n---\n${b.body.trim()}\n`;
}

async function nextFileName(lang, cat) {
  const files = await readdir(join(SRC, lang)).catch(() => []);
  let n = 1;
  while (files.includes(`${cat}-import-${String(n).padStart(2, '0')}.txt`)) n += 1;
  return `${cat}-import-${String(n).padStart(2, '0')}.txt`;
}

async function main() {
  const cats = JSON.parse(await readFile(join(SRC, 'categories.json'), 'utf8'));
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  const files = await walk(INBOX);
  if (!files.length) { console.log('inbox boş — aktarılacak dosya yok.'); return 0; }

  // Mevcut kütüphane (numaralar, başlıklar, yakın kopya için parçalar, seri bölümleri)
  const state = {};
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    const maxNum = {};
    for (const c of cats.categories) maxNum[c.id] = Math.max(0, ...r.texts.filter((t) => t.cat === c.id).map((t) => t.n));
    const parts = new Map();
    for (const t of r.texts.filter((x) => x.series)) { const s = parts.get(t.series) || new Set(); s.add(t.part); parts.set(t.series, s); }
    state[lang] = { maxNum, titles: new Map(r.texts.map((t) => [fold(t.title, lang), t.id])), sh: r.texts.map((t) => ({ id: t.id, set: shingles(sectionsText(t.sections), lang) })), parts };
  }

  const accepted = {}; // `${lang}/${cat}` -> [{num, block}]
  const report = [];
  let okN = 0;
  let badN = 0;
  for (const file of files) {
    const rel = relative(INBOX, file);
    const segs = rel.split(/[\\/]/);
    const dirLang = ['tr', 'en'].includes(segs[0]) ? segs[0] : null;
    const dirCat = segs.find((s) => catById[s]) || null;
    let blocks;
    const src = await readFile(file, 'utf8');
    try { blocks = /\.json$/i.test(file) ? blocksFromJson(src) : parseSourceFile(src); } catch (e) { report.push(`- **${rel}**: okunamadı (${e.message})`); badN += 1; continue; }
    if (!blocks.length) { report.push(`- **${rel}**: hiç "### | Başlık" bloğu bulunamadı`); badN += 1; continue; }
    const rejected = [];
    const lines = [];
    for (const b of blocks) {
      const lang = (b.meta.lang || dirLang || 'tr').toLowerCase();
      const catId = (b.meta.cat || dirCat || '').toLowerCase();
      const problems = [];
      if (!['tr', 'en'].includes(lang)) problems.push(`dil geçersiz (${lang})`);
      const cat = catById[catId];
      if (!cat) problems.push(`kategori bilinmiyor (${catId || 'boş'}) — klasör adını ya da "cat:" alanını kullanın`);
      let t = null;
      if (!problems.length) {
        const st = state[lang];
        const num = st.maxNum[cat.id] + 1;
        const meta = { ...b.meta };
        delete meta.lang; delete meta.cat;
        b.meta = meta;
        t = makeText({ lang, cat: cat.id, num, title: b.title, meta, body: b.body, defaults: catDefaults(cat.id, meta.sub) });
        for (const p of textProblems(t, cat, cats)) if (!p.warn) problems.push(p.msg);
        const tk = fold(t.title, lang);
        if (st.titles.has(tk)) problems.push(`aynı başlık zaten var (${st.titles.get(tk)})`);
        const set = shingles(sectionsText(t.sections), lang);
        for (const o of st.sh) {
          let inter = 0;
          const [small, big] = set.size < o.set.size ? [set, o.set] : [o.set, set];
          for (const x of small) if (big.has(x)) inter += 1;
          if (!inter) continue;
          const j = inter / (set.size + o.set.size - inter);
          const contain = inter / Math.min(set.size, o.set.size);
          if (j >= NEAR_DUP || contain >= 0.5) { problems.push(`${o.id} ile çok benzer (Jaccard ${j.toFixed(2)})`); break; }
        }
        if (t.series) {
          const have = st.parts.get(t.series) || new Set();
          if (have.has(t.part)) problems.push(`seri "${t.series}" bölüm ${t.part} zaten var`);
          else if (t.part > 1 && !have.has(t.part - 1)) problems.push(`seri "${t.series}": önce bölüm ${t.part - 1} gelmeli`);
        }
        if (!problems.length) {
          st.maxNum[cat.id] = num;
          st.titles.set(tk, t.id);
          st.sh.push({ id: t.id, set });
          if (t.series) { const s = st.parts.get(t.series) || new Set(); s.add(t.part); st.parts.set(t.series, s); }
          const key = `${lang}/${cat.id}`;
          (accepted[key] ||= []).push({ num, block: b });
          lines.push(`  - ✓ ${t.id} «${t.title}» (${t.words} kelime)`);
          okN += 1;
          continue;
        }
      }
      badN += 1;
      rejected.push(b);
      lines.push(`  - ✗ «${b.title}»: ${problems.join('; ')}`);
    }
    report.push(`- **${rel}**: ${blocks.length - rejected.length}/${blocks.length} kabul`, ...lines);
    if (!DRY) {
      await mkdir(join(DONE, ...segs.slice(0, -1)), { recursive: true });
      await rename(file, join(DONE, ...segs.slice(0, -1), `${Date.now()}-${basename(file)}`));
      if (rejected.length) {
        await mkdir(join(REJ, ...segs.slice(0, -1)), { recursive: true });
        const rl = rejected.map((b) => serialize('?', { ...b, meta: { ...b.meta } })).join('\n');
        await writeFile(join(REJ, ...segs.slice(0, -1), basename(file).replace(/\.(json|md)$/i, '.txt')), rl);
      }
    }
  }

  if (!DRY) {
    for (const [key, list] of Object.entries(accepted)) {
      const [lang, cat] = key.split('/');
      await mkdir(join(SRC, lang), { recursive: true });
      const name = await nextFileName(lang, cat);
      await writeFile(join(SRC, lang, name), `${list.map((x) => serialize(x.num, x.block)).join('\n')}`);
      report.unshift(`- ${lang}/${name}: ${list.length} metin eklendi (${list[0].num}–${list[list.length - 1].num})`);
    }
  }
  const head = `# İçe aktarma raporu\n\n${new Date().toISOString()}${DRY ? ' — DENEME (hiçbir dosya değişmedi)' : ''}\n\nKabul: ${okN} · Ret: ${badN}\n\nReddedilenler düzeltilip yeniden inbox'a konabilir (inbox/_reddedildi/ altında).\n\n`;
  const out = head + report.join('\n') + '\n';
  if (!DRY) await writeFile(join(INBOX, 'RAPOR.md'), out);
  console.log(out);
  if (!DRY && okN && !NO_BUILD) {
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/build-reading.mjs'), '--quiet'], { stdio: 'inherit' });
    spawnSync(process.execPath, [join(ROOT, 'tools/reading-status.mjs')], { stdio: 'inherit' });
    return r.status || 0;
  }
  return 0;
}

process.exit(await main());
