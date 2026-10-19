// İçerik paketlerini yükler, özel (kullanıcının içe aktardığı) paketlerle birleştirir, doğrular
// ve hatalı kayıtları dışlar. Kod değiştirmeden içerik eklemek için JSON paketleri kullanılır.
import { langOf } from '../lang/index.js';
import { validatePack } from './validate.js';

export const PACK_FILES = ['meta', 'words', 'pairs', 'syllables', 'sentences', 'pools', 'paragraphs', 'scenarios', 'matrix'];

export async function loadBuiltin(lang, readJSON) {
  const parts = await Promise.all(PACK_FILES.map((f) => readJSON(`content/${lang}/${f}.json`).catch(() => null)));
  const [meta, words, pairs, syllables, sentences, pools, paragraphs, scenarios, matrix] = parts;
  return {
    meta: meta || {},
    words: words?.words || [],
    families: pairs?.families || [],
    syllables: syllables || { sets: [] },
    templates: sentences?.templates || [],
    qa: sentences?.qa || [],
    pools: pools?.pools || {},
    paragraphs: paragraphs?.paragraphs || [],
    scenarios: scenarios?.scenarios || [],
    matrix: matrix?.columns ? matrix : null,
    missing: PACK_FILES.filter((_, i) => !parts[i]),
  };
}

// Özel paket biçimi: { app:'duyum-pack', lang, id, license, source, words?, families?, templates?, qa?, pools?, paragraphs?, scenarios? }
export function mergeCustom(base, custom) {
  const out = { ...base, pools: { ...base.pools }, meta: { ...base.meta } };
  for (const key of ['words', 'families', 'templates', 'qa', 'paragraphs', 'scenarios']) {
    if (Array.isArray(custom[key])) out[key] = [...(base[key] || []), ...custom[key].map((x) => ({ ...x, src: custom.id }))];
  }
  for (const [name, pool] of Object.entries(custom.pools || {})) {
    out.pools[name] = out.pools[name] ? { ...out.pools[name], items: [...out.pools[name].items, ...pool.items] } : pool;
  }
  if (custom.categories) out.meta.categories = { ...out.meta.categories, ...custom.categories };
  return out;
}

export function validateCustomPack(json) {
  const problems = [];
  if (!json || json.app !== 'duyum-pack') problems.push('Dosya bir Duyum içerik paketi değil (app: "duyum-pack" bekleniyor).');
  if (!['tr', 'en'].includes(json?.lang)) problems.push('Geçersiz dil kodu (tr veya en olmalı).');
  if (!json?.id) problems.push('Paket kimliği (id) eksik.');
  if (!json?.license) problems.push('Lisans bilgisi (license) eksik; lisansı belirsiz içerik eklenemez.');
  return problems;
}

function index(pack) {
  pack.wordsById = new Map(pack.words.map((w) => [w.id, w]));
  pack.wordsByCat = {};
  for (const w of pack.words) (pack.wordsByCat[w.cat] ||= []).push(w);
  pack.familiesById = new Map(pack.families.map((f) => [f.id, f]));
  return pack;
}

export async function loadPack(lang, readJSON, customPacks = []) {
  const L = langOf(lang);
  let pack = await loadBuiltin(lang, readJSON);
  const customReport = [];
  for (const c of customPacks.filter((c) => c.lang === lang)) {
    const problems = validateCustomPack(c);
    if (problems.length) { customReport.push({ id: c.id, problems }); continue; }
    pack = mergeCustom(pack, c);
    customReport.push({ id: c.id, problems: [] });
  }
  const report = validatePack(pack, L);
  const keep = (kind) => (x) => !report.bad.has(`${kind}:${x.id}`);
  pack.words = pack.words.filter(keep('word'));
  pack.families = pack.families.filter(keep('family'));
  pack.templates = pack.templates.filter(keep('template'));
  pack.paragraphs = pack.paragraphs.filter(keep('paragraph'));
  pack.scenarios = pack.scenarios.filter(keep('scenario'));
  pack.syllables = { ...pack.syllables, sets: (pack.syllables.sets || []).filter(keep('syllables')) };
  if (report.bad.has('matrix')) pack.matrix = null;
  pack.lang = lang;
  pack.L = L;
  pack.report = { errors: report.errors, warnings: report.warnings, custom: customReport, missing: pack.missing };
  return index(pack);
}

export function packStats(pack) {
  return {
    words: pack.words.length,
    categories: Object.keys(pack.wordsByCat).length,
    families: pack.families.length,
    pairs: pack.families.reduce((a, f) => a + (f.words.length * (f.words.length - 1)) / 2, 0),
    syllableSets: pack.syllables.sets.length,
    templates: pack.templates.length,
    qa: pack.qa.length,
    paragraphs: pack.paragraphs.length,
    scenarios: pack.scenarios.length,
    logatomSets: pack.syllables.sets.filter((x) => x.kind).length,
    matrixWords: pack.matrix ? pack.matrix.columns.reduce((a, c) => a + c.words.length, 0) : 0,
    scenarioVariants: pack.scenarios.reduce((a, s) => a + s.variants.length, 0),
    errors: pack.report.errors.length,
    warnings: pack.report.warnings.length,
  };
}
