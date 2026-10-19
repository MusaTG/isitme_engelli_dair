// Okuma kütüphanesi yükleyicisi. Kategori gövdeleri yalnızca gerektiğinde indirilir;
// tam metin arama dizini ilk tam metin aramasında yüklenir. Kendi metinleri profildedir.
import { makeText, tokenSet, sectionsText, fold, lower } from './core.js';

export function createLibrary(readJSON) {
  const cache = new Map();
  const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn().catch((e) => { cache.delete(key); throw e; })); return cache.get(key); };

  const lib = {
    categories: () => once('cats', () => readJSON('content/reading/categories.json')),
    manifest: () => once('manifest', () => readJSON('content/reading/manifest.json')),
    catalog: (lang) => once(`cat:${lang}`, async () => {
      const c = await readJSON(`content/reading/${lang}/catalog.json`);
      c.texts.forEach((t, i) => { t.lang = lang; t.order = i; });
      c.byId = new Map(c.texts.map((t) => [t.id, t]));
      return c;
    }),
    bodies: (lang, cat) => once(`body:${lang}:${cat}`, () => readJSON(`content/reading/${lang}/${cat}.json`)),
    searchIndex: (lang) => once(`search:${lang}`, async () => {
      const raw = await readJSON(`content/reading/${lang}/search.json`);
      const out = new Map();
      for (const [id, toks] of Object.entries(raw)) out.set(id, { strict: ` ${toks} `, folded: ` ${fold(toks, lang)} ` });
      return out;
    }),
    isCached: (key) => cache.has(key),
    clear: () => cache.clear(),
  };
  return lib;
}

export function langOfId(id) {
  if (id.startsWith('u-')) return null;
  return id.slice(0, 2);
}

// Kendi metnini çalışma zamanı metin modeline çevirir (son sürüm).
export function userTextModel(ut) {
  const v = ut.versions[ut.versions.length - 1];
  const t = makeText({ lang: ut.lang || 'tr', cat: ut.cat || 'daily', num: 0, title: ut.title || '—', meta: { sub: ut.sub, kind: ut.kind || 'user', aud: ut.aud || 'all', tags: (ut.tags || []).join(', ') }, body: v?.body || '' });
  return { ...t, id: ut.id, user: true, version: v?.version || 1, author: ut.author || '', source: ut.source || '', license: ut.license || '', archived: Boolean(ut.archived), addedAt: ut.createdAt, updatedAt: ut.updatedAt };
}

export function userMeta(ut) {
  const m = userTextModel(ut);
  return {
    id: m.id, cat: m.cat, sub: m.sub, title: m.title, kind: m.kind, aud: m.aud, level: m.level, tags: m.tags, version: m.version, hash: m.hash,
    words: m.words, stages: m.sections.length, heads: m.sections.filter((s) => s.h).map((s) => s.h), preview: m.preview, lang: m.lang, user: true,
    archived: m.archived, author: m.author, source: m.source, license: m.license, addedAt: ut.createdAt, tokens: tokenSet(sectionsText(m.sections), m.lang),
  };
}

// Tek metni tam olarak getirir (katalog bilgisi + gövde).
export async function getText(lib, R, id) {
  if (id.startsWith('u-')) {
    const ut = R.userTexts.find((x) => x.id === id);
    return ut ? userTextModel(ut) : null;
  }
  const lang = langOfId(id);
  const cat = await lib.catalog(lang);
  const meta = cat.byId.get(id);
  if (!meta) return null;
  const bodies = await lib.bodies(lang, meta.cat);
  const b = bodies[id];
  if (!b) return null;
  return { ...meta, lang, sections: b.sections, hash: b.hash, version: b.version };
}

// Katalog + (aynı dildeki) kendi metinleri; arşivlenmiş kendi metinleri hariç.
export async function allMeta(lib, R, lang, { includeArchived = false } = {}) {
  const cat = await lib.catalog(lang);
  const own = R.userTexts.filter((u) => (u.lang || 'tr') === lang && (includeArchived || !u.archived)).map(userMeta);
  return [...own, ...cat.texts];
}

export async function metaById(lib, R, id) {
  if (id.startsWith('u-')) {
    const ut = R.userTexts.find((x) => x.id === id);
    return ut ? userMeta(ut) : null;
  }
  const lang = langOfId(id);
  try { return (await lib.catalog(lang)).byId.get(id) || null; } catch { return null; }
}

// Senkron erişim için önceden yüklenmiş iki dilin kataloglarından bir bakıcı üretir.
export async function metaResolver(lib, R) {
  const [tr, en] = await Promise.all([lib.catalog('tr').catch(() => null), lib.catalog('en').catch(() => null)]);
  const own = new Map(R.userTexts.map((u) => [u.id, userMeta(u)]));
  return (id) => own.get(id) || (id.startsWith('tr-') ? tr?.byId.get(id) : id.startsWith('en-') ? en?.byId.get(id) : null) || null;
}

export function counterpartId(id) {
  if (id.startsWith('tr-')) return `en-${id.slice(3)}`;
  if (id.startsWith('en-')) return `tr-${id.slice(3)}`;
  return null;
}

export { lower };
