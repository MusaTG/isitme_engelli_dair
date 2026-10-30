// Dışarıda (ör. başka bir yapay zekâ sohbetinde ya da NotebookLM destekli çalışmada) hazırlanan okuma metinlerini
// kütüphaneye TOPLU olarak aktarır.
//
// 1) Dosyaları content-src/reading/inbox/ altına koyun. Önerilen: inbox/<dil>/<kategori>/herhangi-ad.txt
//    Tek dosyada birden çok metin olabilir; farklı dil/kategoriler için bloklarda "lang:" / "cat:" alanları kullanın.
//    Biçimler: .txt / .md (### blok biçimi), .json, .csv (docs/reading-format.md).
// 2) npm run reading:import            → ÖN İZLEME (hiçbir dosya değişmez) + terminaldeyse onay sorar
//    npm run reading:import -- --yes   → onaysız uygula (CI bunu kullanır)
//    npm run reading:import -- --dry   → yalnızca ön izleme
//    npm run reading:import -- --yes --allow-similar → çok benzer metinleri de ekle ("similar: ok" yazılır; birebir aynılar yine atlanır)
//
// Ne yapar: blokları doğrular (başlık, metin, dil, kategori, alt kategori, seviye, kaynak/lisans, kalite), içerik
// özetiyle tekrarları ATLAR, "id:" alanı olan blokla var olan metni kontrollü GÜNCELLER (sürüm artar), yenilere
// sıradaki boş numarayı verir; tüm yazmaları önce geçici dosyaya yapıp atomik olarak taşır; ancak sonra kaynak
// dosyaları inbox/_islendi/ altına alır. Hatalı bloklar gerekçesiyle inbox/_reddedildi/ ve RAPOR.md / RAPOR.json'a yazılır.
import { fileURLToPath } from 'node:url';
import { readdir, readFile, writeFile, mkdir, rename, access, unlink } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { sectionsText, shingles, parseSourceFile } from '../js/reading/core.js';
import { parseImportFile, planImport, serializeBlock, SUPPORTED } from '../js/reading/importer.js';
import { buildLang } from './build-reading.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'content-src/reading');
const INBOX = join(SRC, 'inbox');
const DONE = join(INBOX, '_islendi');
const REJ = join(INBOX, '_reddedildi');
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const YES = args.has('--yes') || args.has('--apply');
const NO_BUILD = args.has('--no-build');
const ALLOW_SIMILAR = args.has('--allow-similar');

async function walk(dir) {
  let out = [];
  let ents = [];
  try { ents = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    else if (!/^(README|RAPOR)\.(md|json)$/i.test(e.name)) out.push(p);
  }
  return out.sort();
}

// Kütüphane dosyasında dil/kategori klasör ve dosya adından gelir; bloktaki lang/cat alanları yazılmaz.
const noLoc = (b) => { const { lang, cat, ...meta } = b.meta; return { ...b, meta }; };

async function nextFileName(lang, cat, reserved = []) {
  const files = [...await readdir(join(SRC, lang)).catch(() => []), ...reserved];
  let n = 1;
  while (files.includes(`${cat}-import-${String(n).padStart(2, '0')}.txt`)) n += 1;
  return `${cat}-import-${String(n).padStart(2, '0')}.txt`;
}

const STATUS_TR = { add: 'eklenecek', update: 'güncellenecek', skip: 'atlanacak (tekrar)', error: 'hatalı' };

function renderReport(plan, fileErrors, applied) {
  const s = plan.summary;
  const L = ['# İçe aktarma raporu', '', `${new Date().toISOString()} — ${applied ? 'UYGULANDI' : 'ÖN İZLEME (hiçbir dosya değişmedi)'}`, '',
    '| Eklenecek | Güncellenecek | Atlanacak (tekrar) | Hatalı | Toplam blok |', '|---:|---:|---:|---:|---:|',
    `| ${s.add} | ${s.update} | ${s.skip} | ${s.error} | ${s.total} |`, ''];
  const dist = Object.entries(s.dist);
  if (dist.length) {
    L.push('Dil ve kategori dağılımı (eklenecek + güncellenecek):', '');
    for (const [lang, cats] of dist) L.push(`- **${lang}**: ${Object.entries(cats).map(([c, n]) => `${c} ${n}`).join(', ')}`);
    L.push('');
  }
  if (fileErrors.length) L.push('## Dosya hataları', '', ...fileErrors.map((e) => `- ${e}`), '');
  L.push('## Kayıtlar', '');
  for (const r of plan.rows) {
    const mark = { add: '✓', update: '↻', skip: '=', error: '✗' }[r.status];
    L.push(`- ${mark} ${STATUS_TR[r.status]} · ${r.id || '—'} «${r.title || '(başlıksız)'}» · ${r.lang || '?'}/${r.cat || '?'}${r.words ? ` · ${r.words} kelime` : ''} · ${r.where}`);
    for (const x of r.reasons) L.push(`  - ${r.status === 'error' ? 'HATA' : 'not'}: ${x}`);
    for (const x of r.warnings) L.push(`  - uyarı: ${x}`);
  }
  L.push('', 'Hatalı kayıtlar inbox/_reddedildi/ altında; düzeltip yeniden inbox/ içine koyabilirsiniz. Ayrıntılı biçim: docs/reading-format.md');
  return `${L.join('\n')}\n`;
}

const jsonReport = (plan, fileErrors, applied, written = []) => `${JSON.stringify({ at: new Date().toISOString(), applied, summary: plan.summary, fileErrors, written, rows: plan.rows.map(({ block, abs, ...r }) => r) }, null, 2)}\n`;

export async function main() {
  const cats = JSON.parse(await readFile(join(SRC, 'categories.json'), 'utf8'));
  const catIds = new Set(cats.categories.map((c) => c.id));
  const files = await walk(INBOX);
  if (!files.length) { console.log('inbox boş — aktarılacak dosya yok.'); return 0; }

  // Mevcut kütüphane
  const existing = [];
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    for (const t of r.texts) existing.push({ id: t.id, n: t.n, lang, cat: t.cat, title: t.title, contentHash: t.contentHash, series: t.series, part: t.part, version: t.version, set: shingles(sectionsText(t.sections), lang), file: t.file });
  }
  const byId = new Map(existing.map((e) => [e.id, e]));

  // Dosyaları oku (desteklenmeyen dosya sessizce atlanmaz; raporlanır ve yerinde bırakılır)
  const items = [];
  const fileErrors = [];
  const perFile = new Map();
  for (const file of files) {
    const rel = relative(INBOX, file);
    const segs = rel.split(/[\\/]/);
    if (!SUPPORTED.test(file)) { fileErrors.push(`${rel}: desteklenmeyen dosya türü (desteklenen: .txt, .md, .json, .csv) — dosyaya dokunulmadı`); continue; }
    const { blocks, errors } = parseImportFile(basename(file), await readFile(file, 'utf8'));
    for (const e of errors) fileErrors.push(`${rel}: ${e}`);
    perFile.set(file, { rel, segs, count: blocks.length });
    // Dil/kategori: klasörden (inbox/tr/dialogue/…) ya da dosya adından (tr-dialogue-01.txt, notebooklm_en_kids.txt)
    const fn = basename(file).toLowerCase().split(/[-_. ]+/);
    const lang = ['tr', 'en'].includes(segs[0]) ? segs[0] : segs.slice(0, -1).find((s) => s === 'tr' || s === 'en') || fn.find((s) => s === 'tr' || s === 'en');
    const cat = segs.slice(0, -1).find((s) => catIds.has(s)) || fn.find((s) => catIds.has(s));
    for (const b of blocks) items.push({ block: b, file: rel, abs: file, lang, cat });
  }

  const plan = planImport(items, { cats, existing, mode: 'library', allowSimilar: ALLOW_SIMILAR });
  plan.rows.forEach((r, i) => { r.abs = items[i].abs; });
  const preview = renderReport(plan, fileErrors, false);
  console.log(preview);

  let apply = YES && !DRY;
  const changes = plan.summary.add + plan.summary.update;
  if (!apply && !DRY && changes && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ans = await rl.question(`${plan.summary.add} metin eklensin, ${plan.summary.update} metin güncellensin mi? (e/H) `);
    rl.close();
    apply = /^(e|evet|y|yes)$/i.test(ans.trim());
  } else if (!apply && !DRY && changes) console.log('Uygulamak için: npm run reading:import -- --yes');
  if (!apply) {
    await writeFile(join(INBOX, 'RAPOR.md'), preview).catch(() => {});
    await writeFile(join(INBOX, 'RAPOR.json'), jsonReport(plan, fileErrors, false)).catch(() => {});
    return 0;
  }

  // ---------- Uygula: önce hepsini geçici dosyalara yaz, sonra atomik taşı ----------
  const staged = [];
  try {
    const adds = {};
    for (const r of plan.rows.filter((x) => x.status === 'add')) (adds[`${r.lang}/${r.cat}`] ||= []).push(r);
    for (const [key, list] of Object.entries(adds)) {
      const [lang, cat] = key.split('/');
      await mkdir(join(SRC, lang), { recursive: true });
      const name = await nextFileName(lang, cat, staged.map((x) => x.name));
      staged.push({ final: join(SRC, lang, name), name, isNew: true, content: list.map((r) => serializeBlock(r.num, noLoc(r.block))).join('\n'), note: `${lang}/${name}: ${list.length} metin eklendi (${list[0].num}–${list[list.length - 1].num})` });
    }
    // Güncelleme: metnin kaynak dosyasında yalnızca o blok değişir, sürüm +1
    const upd = {};
    for (const r of plan.rows.filter((x) => x.status === 'update')) { const e = byId.get(r.updateOf); (upd[join(SRC, r.lang, e.file)] ||= []).push({ r, e }); }
    for (const [final, list] of Object.entries(upd)) {
      const parts = (await readFile(final, 'utf8')).split(/(?=^###\s*\d{1,4}\s*\|)/m);
      for (const { r, e } of list) {
        const i = parts.findIndex((p) => parseSourceFile(p)[0]?.num === e.n);
        if (i < 0) throw new Error(`${r.updateOf} kaynak dosyada bulunamadı`);
        parts[i] = `${serializeBlock(e.n, noLoc({ ...r.block, meta: { ...r.block.meta, version: String((e.version || 1) + 1) } }))}\n`;
      }
      staged.push({ final, name: basename(final), isNew: false, content: parts.join(''), note: `${relative(SRC, final)}: ${list.length} metin güncellendi (${list.map((x) => x.r.updateOf).join(', ')})` });
    }
    for (const x of staged) { x.tmp = `${x.final}.tmp-${process.pid}`; await writeFile(x.tmp, x.content, { flag: 'wx' }); }
    if (process.env.DUYUM_IMPORT_FAIL_AFTER_STAGE) throw new Error('test: yazma sonrası hata taklidi');
    for (const x of staged) {
      if (x.isNew) { try { await access(x.final); throw new Error(`hedef dosya zaten var: ${x.final}`); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
      await rename(x.tmp, x.final);
      x.done = true;
    }
  } catch (e) {
    for (const x of staged) if (x.tmp && !x.done) await unlink(x.tmp).catch(() => {});
    for (const x of staged) if (x.done && x.isNew) await unlink(x.final).catch(() => {});
    console.error(`İçe aktarma durduruldu, kaynak dosyalar inbox'ta bırakıldı: ${e.message}`);
    if (staged.some((x) => x.done && !x.isNew)) console.error('Uyarı: bazı güncellemeler yazılmıştı; git ile geri alabilirsiniz.');
    return 1;
  }

  for (const [file, info] of perFile) {
    const rejected = plan.rows.filter((r) => r.abs === file && r.status === 'error');
    const dir = info.segs.slice(0, -1);
    await mkdir(join(DONE, ...dir), { recursive: true });
    await rename(file, join(DONE, ...dir, `${Date.now()}-${basename(file)}`));
    if (rejected.length) {
      await mkdir(join(REJ, ...dir), { recursive: true });
      const txt = rejected.map((r) => serializeBlock('?', { ...r.block, meta: { ...r.block.meta, ...(r.lang ? { lang: r.lang } : {}), ...(r.cat ? { cat: r.cat } : {}) } }, { keepId: true }).replace(/^### \? \|/m, '### |')).join('\n');
      await writeFile(join(REJ, ...dir, basename(file).replace(/\.(json|md|csv)$/i, '.txt')), txt);
    }
  }
  const written = staged.map((x) => x.note);
  await writeFile(join(INBOX, 'RAPOR.md'), renderReport(plan, fileErrors, true).replace('## Kayıtlar', `## Yazılan dosyalar\n\n${written.map((x) => `- ${x}`).join('\n')}\n\n## Kayıtlar`));
  await writeFile(join(INBOX, 'RAPOR.json'), jsonReport(plan, fileErrors, true, written));
  console.log(written.join('\n'));
  if (!NO_BUILD && changes) {
    const r = spawnSync(process.execPath, [join(ROOT, 'tools/build-reading.mjs'), '--quiet'], { stdio: 'inherit' });
    spawnSync(process.execPath, [join(ROOT, 'tools/reading-status.mjs')], { stdio: 'inherit' });
    spawnSync(process.execPath, [join(ROOT, 'tools/notebooklm-pack.mjs')], { stdio: 'inherit' });
    return r.status || 0;
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(await main());
