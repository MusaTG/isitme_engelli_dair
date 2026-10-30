// Toplu içe aktarma çekirdeği (DOM ve dosya sistemi yok): dosya ayrıştırma (.txt/.md blok biçimi, .json, .csv),
// doğrulama, tekilleştirme ve "eklenecek / güncellenecek / atlanacak / hatalı" planı.
// Hem uygulama içi "Dosyadan içe aktar" hem de tools/import-reading.mjs aynı kuralları kullanır.
import { parseSourceFile, makeText, sectionsText, shingles, fold } from './core.js';
import { textProblems, catDefaults, NEAR_DUP } from './rules.js';

export const META_FIELDS = ['id', 'lang', 'cat', 'sub', 'kind', 'aud', 'level', 'series', 'part', 'version', 'tags', 'summary', 'source', 'license', 'author', 'origin', 'reviewed', 'similar'];
export const CSV_COLUMNS = ['id', 'lang', 'cat', 'sub', 'title', 'level', 'tags', 'kind', 'aud', 'series', 'part', 'summary', 'source', 'license', 'author', 'origin', 'body'];
export const SUPPORTED = /\.(txt|md|json|csv)$/i;

// ---------- CSV (RFC 4180: tırnak içinde virgül, satır sonu ve "" kaçışı) ----------
// Ayırıcı: virgül; başlık satırında noktalı virgül daha çoksa (Türkçe Excel) noktalı virgül.
export function parseCSV(text, delim = null) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  const s = String(text).replace(/^\uFEFF/, '');
  const firstLine = s.split(/\r?\n/, 1)[0];
  const d = delim || ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c;
    } else if (c === '"' && f === '') q = true;
    else if (c === d) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some((x) => x !== '')) rows.push(row); row = []; }
    else f += c;
  }
  if (q) throw new Error('csv-quote');
  row.push(f);
  if (row.some((x) => x !== '')) rows.push(row);
  return rows;
}

function blocksFromCSV(src) {
  const rows = parseCSV(src);
  if (!rows.length) return { blocks: [], errors: ['CSV boş'] };
  const head = rows[0].map((h) => fold(h.trim(), 'tr'));
  const alias = { baslik: 'title', metin: 'body', govde: 'body', icerik: 'body', dil: 'lang', kategori: 'cat', 'alt kategori': 'sub', altkategori: 'sub', seviye: 'level', etiketler: 'tags', kaynak: 'source', lisans: 'license', yazar: 'author', ozet: 'summary', kimlik: 'id' };
  const cols = head.map((h) => alias[h] || h);
  const errors = [];
  if (!cols.includes('title') || !cols.includes('body')) return { blocks: [], errors: ['CSV başlık satırında en az "title" (başlık) ve "body" (metin) sütunları olmalı'] };
  const blocks = rows.slice(1).map((r, i) => {
    const o = Object.fromEntries(cols.map((c, j) => [c, (r[j] ?? '').trim()]));
    if (r.length > cols.length) errors.push(`satır ${i + 2}: sütun sayısı başlıktan fazla (tırnak eksik olabilir)`);
    const meta = Object.fromEntries(META_FIELDS.filter((k) => o[k]).map((k) => [k, o[k]]));
    return { num: null, title: o.title || '', meta, body: (o.body || '').replace(/\\n/g, '\n'), row: i + 2 };
  });
  return { blocks, errors };
}

function blocksFromJSON(src) {
  const j = JSON.parse(src);
  const list = Array.isArray(j) ? j : Array.isArray(j?.texts) ? j.texts : null;
  if (!list) return { blocks: [], errors: ['JSON bir dizi ya da { "texts": [...] } olmalı'] };
  const blocks = list.map((x, i) => {
    const meta = {};
    for (const k of META_FIELDS) {
      const v = k === 'lang' ? (x?.lang ?? j.lang) : x?.[k];
      if (v === undefined || v === null || v === '') continue;
      meta[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
    return { num: null, title: String(x?.title || '').trim(), meta, body: String(x?.body || '').replace(/\r\n?/g, '\n').trim(), row: i + 1 };
  });
  return { blocks, errors: [] };
}


// NotebookLM / sohbet çıktısını blok biçimine yaklaştırır (yalnızca .txt/.md için, güvenli dönüşümler):
// kaynak işaretleri [1], [2, 3] · **kalın** / __alt çizgi__ · markdown kaçışları (\- \# \*) · kod çitleri ·
// "### Başlık" (çizgisiz) + meta satırı · "**Sub:** x" gibi büyük harfli/kalın anahtarlar · "---" satırı kopyalamada
// kaybolduysa meta satırından sonra eklenir · "***", "___", "—" ayırıcıları "---" olur.
const META_KEY = new RegExp(`^(?:${META_FIELDS.join('|')})$`);
const isMetaLine = (l) => {
  const parts = l.split(/\s+\|\s+/);
  return parts.length > 0 && parts.every((p) => { const m = p.match(/^\s*([A-Za-zçğıöşüÇĞİÖŞÜ]+)\s*:/); return m && META_KEY.test(m[1].toLowerCase()); });
};
export function normalizeChatText(text) {
  let lines = String(text).replace(/\r\n?/g, '\n').replace(/ /g, ' ').split('\n');
  lines = lines.filter((l) => !/^\s*```/.test(l)).map((l) => l
    .replace(/\s?\[\d+(?:\s*[-–,]\s*\d+)*\]/g, '')
    .replace(/\\([-#*_|>.!()[\]`])/g, '$1')
    .replace(/^(\s*#{1,4}\s*)\*\*(.+?)\*\*\s*$/, '$1$2')
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
    .replace(/[ \t]+$/, ''));
  // Sohbetin eklediği kapanış özetleri ("Kontrol Özeti:", "İstenen sayı: …") metne karışmasın: bir sonraki bloğa ya da
  // dosya sonuna kadar atılır.
  const SUMMARY = /^\s*#{0,4}\s*(kontrol\s+özeti|özet\s+kontrol|üretim\s+özeti|control\s+summary|check\s+summary|summary\s+check)\s*(?::.*)?$/i;
  for (let i = 0; i < lines.length; i += 1) {
    if (!SUMMARY.test(lines[i])) continue;
    let j = i;
    while (j < lines.length && !/^###\s/.test(lines[j])) j += 1;
    lines.splice(i, j - i);
  }
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    let l = lines[i];
    // Başlıktan hemen sonraki meta satırı başlık ya da madde imiyle gelmiş olabilir ("## sub: …", "- sub: …")
    {
      const prev = [...out].reverse().find((x) => x.trim()) || '';
      const bare = l.replace(/^\s*(#{1,6}|[-*•])\s+/, '');
      if (bare !== l && /^###\s*(\d{1,4}|\?|-)?\s*\|/.test(prev) && isMetaLine(bare)) l = bare;
    }
    // Tek paragrafa yığılmış diyalog ("Ali: … Ayşe: …") → her konuşma ayrı satır
    {
      const SPK = /(?<=[.!?…"”])\s+(?=[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?:\s)/g;
      if (/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)?:\s/.test(l) && (l.match(SPK) || []).length >= 2) {
        out.push(...l.split(SPK));
        continue;
      }
    }
    const nextIdx = () => { let j = i + 1; while (j < lines.length && !lines[j].trim()) j += 1; return j; };
    // "### Başlık" ya da "### 3. Başlık" ardından meta satırı → "### | Başlık"
    const h = l.match(/^#{3}\s+(?!\s*(?:\d{1,4}|\?|-)?\s*\|)(?:\d{1,4}[.)]\s*)?(.+)$/);
    if (h && lines[nextIdx()] !== undefined && isMetaLine(lines[nextIdx()])) l = `### | ${h[1].trim()}`;
    if (/^\s*(\*\*\*+|___+|—+|–{3,}|-{4,})\s*$/.test(l)) l = '---';
    if (isMetaLine(l) && out.length && /^###\s*(\d{1,4}|\?|-)?\s*\|/.test([...out].reverse().find((x) => x.trim()) || '')) {
      l = l.split(/\s+\|\s+/).map((p) => p.replace(/^\s*([A-Za-zçğıöşüÇĞİÖŞÜ]+)\s*:/, (_, k) => `${k.toLowerCase()}:`)).join(' | ');
      out.push(l);
      const j = nextIdx();
      if (j < lines.length && !/^\s*(---|\*\*\*+|___+|—+)\s*$/.test(lines[j]) && !isMetaLine(lines[j])) out.push('---');
      continue;
    }
    out.push(l);
  }
  return out.join('\n');
}

// Bir dosyayı bloklara çevirir. Bilinmeyen uzantı sessizce atlanmaz: hata döner.
export function parseImportFile(name, text) {
  const n = String(name || '');
  try {
    if (/\.json$/i.test(n) || (!/\.(txt|md|csv)$/i.test(n) && /^\s*[[{]/.test(text))) return blocksFromJSON(text);
    if (/\.csv$/i.test(n)) return blocksFromCSV(text);
    if (/\.(txt|md)$/i.test(n) || !n) {
      const blocks = parseSourceFile(normalizeChatText(text));
      return { blocks, errors: blocks.length ? [] : ['Hiç "### | Başlık" bloğu bulunamadı (biçim: docs/reading-format.md)'] };
    }
    return { blocks: [], errors: [`Desteklenmeyen dosya türü: ${n} (desteklenen: .txt, .md, .json, .csv)`] };
  } catch (e) {
    return { blocks: [], errors: [e.message === 'csv-quote' ? 'CSV: kapanmamış tırnak' : `Dosya okunamadı: ${e.message}`] };
  }
}

/**
 * İçe aktarma planı.
 * @param items [{ block, file, lang?, cat? }] — lang/cat klasörden ya da dosyadan gelen varsayılanlar
 * @param ctx { cats, existing: [{ id, lang, cat, title, contentHash, set? , n }], mode: 'library'|'user', requireLevel, allowSimilar }
 * @returns { rows: [{ status, reasons, warnings, lang, cat, id, num, title, words, block, file, updateOf }], summary }
 */
export function planImport(items, { cats, existing = [], mode = 'library', requireLevel = mode === 'library', defaults = {}, allowSimilar = false }) {
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  const byHash = new Map(existing.map((e) => [`${e.lang}:${e.contentHash}`, e]));
  const byId = new Map(existing.map((e) => [e.id, e]));
  const sh = existing.map((e) => ({ id: e.id, lang: e.lang, set: e.set || null }));
  const maxNum = {};
  for (const e of existing) { const k = `${e.lang}/${e.cat}`; maxNum[k] = Math.max(maxNum[k] || 0, e.n || 0); }
  const titles = new Map(existing.map((e) => [`${e.lang}:${fold(e.title, e.lang)}`, e.id]));
  const rows = [];
  for (const it of items) {
    const b = it.block;
    const reasons = [];
    const warnings = [];
    const meta = { ...b.meta };
    const lang = String(meta.lang || it.lang || defaults.lang || '').toLowerCase();
    const catId = String(meta.cat || it.cat || defaults.cat || '').toLowerCase();
    delete meta.lang; delete meta.cat;
    const row = { status: 'error', reasons, warnings, lang, cat: catId, title: b.title || '', file: it.file || '', where: b.row ? `${it.file || ''} #${b.row}` : it.file || '', block: { ...b, meta } };
    rows.push(row);
    if (!b.title?.trim()) reasons.push('başlık yok');
    if (!b.body?.trim()) reasons.push('metin boş');
    if (!['tr', 'en'].includes(lang)) reasons.push(lang ? `dil geçersiz (${lang}; tr ya da en)` : 'dil belirtilmemiş');
    const cat = catById[catId];
    if (!cat) reasons.push(catId ? `kategori geçersiz (${catId})` : 'kategori belirtilmemiş');
    if (cat && meta.sub && !cat.subs[meta.sub]) {
      if (mode === 'user') { warnings.push(`alt kategori "${meta.sub}" bilinmiyor; ilki kullanıldı`); meta.sub = Object.keys(cat.subs)[0]; } else reasons.push(`alt kategori geçersiz (${meta.sub}; geçerli: ${Object.keys(cat.subs).join(', ')})`);
    }
    if (cat && !meta.sub) { if (mode === 'user') meta.sub = Object.keys(cat.subs)[0]; else reasons.push('alt kategori (sub) yok'); }
    if (requireLevel && !meta.level) reasons.push('seviye (level: 1, 2 ya da 3) yok');
    if (meta.level && ![1, 2, 3].includes(Number(meta.level))) reasons.push(`seviye geçersiz (${meta.level})`);
    if (meta.source && !meta.license && !/^(original|ozgun|özgün|ai-draft)$/i.test(meta.origin || '')) reasons.push('kaynak var ama lisans (license) yok');
    if (reasons.length) continue;
    const key = `${lang}/${cat.id}`;
    const upd = meta.id ? byId.get(meta.id) : null;
    if (meta.id && !upd) { reasons.push(`güncellenecek kimlik bulunamadı (${meta.id})`); continue; }
    if (upd?.readonly) { reasons.push(`${meta.id} bir kütüphane metni; burada güncellenemez`); continue; }
    if (upd && (upd.lang !== lang || upd.cat !== cat.id)) { reasons.push(`kimlik ${meta.id} başka dil/kategoride`); continue; }
    const num = upd ? upd.n : (maxNum[key] || 0) + 1;
    const t = makeText({ lang, cat: cat.id, num, title: b.title, meta, body: b.body, defaults: catDefaults(cat.id, meta.sub) });
    row.id = upd ? upd.id : t.id;
    row.num = num;
    row.words = t.words;
    row.contentHash = t.contentHash;
    for (const p of textProblems(t, cat, cats)) (p.warn ? warnings : reasons).push(p.msg);
    if (reasons.length) continue;
    const same = byHash.get(`${lang}:${t.contentHash}`);
    if (same && (!upd || same.id === upd.id)) { row.status = 'skip'; row.id = same.id; reasons.push(`aynı içerik zaten var (${same.id}${same.readonly ? ', kütüphanede' : ''})`); continue; }
    const tk = `${lang}:${fold(t.title, lang)}`;
    if (!upd && titles.has(tk)) warnings.push(`aynı başlıkta başka bir metin var (${titles.get(tk)}); içerik farklı olduğu için ayrı kayıt`);
    const set = shingles(sectionsText(t.sections), lang);
    let near = null;
    for (const o of sh) {
      if (o.lang !== lang || !o.set || (upd && o.id === upd.id)) continue;
      let inter = 0;
      const [small, big] = set.size < o.set.size ? [set, o.set] : [o.set, set];
      for (const x of small) if (big.has(x)) inter += 1;
      if (!inter) continue;
      const j = inter / (set.size + o.set.size - inter);
      const contain = inter / Math.min(set.size, o.set.size);
      if (j >= NEAR_DUP || contain >= 0.5) { near = `${o.id} ile çok benzer (benzerlik %${Math.round(Math.max(j, contain) * 100)})`; break; }
    }
    // Bilinçli olarak eklenen benzer metin: "similar: ok" ya da allowSimilar ile hata yerine uyarı; işaret dosyaya yazılır
    // ki derleyici de bu çifti hata saymasın. Birebir aynı içerik yukarıda zaten atlanır.
    if (near && (allowSimilar || t.similar)) { warnings.push(`${near}; benzerliğe izin verildi (similar: ok)`); meta.similar = 'ok'; near = null; }
    if (near) { reasons.push(near); continue; }
    if (t.series && meta.part && mode === 'library') {
      // dizi bölüm sırası derleyicide ayrıca denetlenir; burada yalnızca uyarı
      if (Number(meta.part) > 1 && !existing.some((e) => e.series === t.series && e.part === Number(meta.part) - 1) && !rows.some((r) => r.status === 'add' && r.block.meta.series === t.series && Number(r.block.meta.part) === Number(meta.part) - 1)) warnings.push(`dizi "${t.series}": önceki bölüm (${Number(meta.part) - 1}) bulunamadı`);
    }
    row.status = upd ? 'update' : 'add';
    if (upd) row.updateOf = upd.id;
    if (!upd) maxNum[key] = num;
    byHash.set(`${lang}:${t.contentHash}`, { id: row.id, lang, cat: cat.id, contentHash: t.contentHash });
    titles.set(tk, row.id);
    sh.push({ id: row.id, lang, set });
  }
  return { rows, summary: summarize(rows) };
}

export function summarize(rows) {
  const s = { add: 0, update: 0, skip: 0, error: 0, total: rows.length, dist: {} };
  for (const r of rows) {
    s[r.status] += 1;
    if (r.status === 'add' || r.status === 'update') { const d = (s.dist[r.lang || '?'] ||= {}); d[r.cat || '?'] = (d[r.cat || '?'] || 0) + 1; }
  }
  return s;
}

const ORDER = ['lang', 'cat', 'id', 'sub', 'kind', 'aud', 'level', 'series', 'part', 'version', 'tags', 'summary', 'source', 'license', 'author', 'origin', 'reviewed', 'similar'];
export function serializeBlock(num, b, { keepId = false } = {}) {
  const meta = ORDER.filter((k) => b.meta[k] && (keepId || k !== 'id')).map((k) => `${k}: ${String(b.meta[k]).replace(/\s*\|\s*/g, ' / ').replace(/\n/g, ' ')}`).join(' | ');
  return `### ${num} | ${b.title.trim()}\n${meta}\n---\n${String(b.body).trim()}\n`;
}
