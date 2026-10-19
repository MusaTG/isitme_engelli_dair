// İçerik paketlerini doğrular. Hata varsa 1 ile çıkar (CI'da kullanılır).
// Kullanım: node tools/validate-content.mjs
import { readFile } from 'node:fs/promises';
import { loadPack, packStats } from '../js/content/loader.js';

const readJSON = async (p) => JSON.parse(await readFile(new URL(`../${p}`, import.meta.url), 'utf8'));
let failed = false;
for (const lang of ['tr', 'en']) {
  const pack = await loadPack(lang, readJSON);
  const s = packStats(pack);
  console.log(`${lang}: ${s.words} kelime / ${s.categories} kategori, ${s.families} minimal çift ailesi (${s.pairs} çift), ${s.syllableSets} hece seti, ${s.templates} cümle şablonu, ${s.qa} soru–cevap, ${s.paragraphs} paragraf, ${s.scenarios} senaryo (${s.scenarioVariants} varyant), ${s.logatomSets} logatom seti, matris ${s.matrixWords} kelime`);
  for (const e of pack.report.errors) console.log(`  HATA  ${e.path}: ${e.msg}`);
  for (const w of pack.report.warnings) console.log(`  uyarı ${w.path}: ${w.msg}`);
  if (pack.report.missing.length) console.log(`  HATA  eksik dosyalar: ${pack.report.missing.join(', ')}`);
  if (pack.report.errors.length || pack.report.missing.length) failed = true;
}
process.exit(failed ? 1 : 0);
