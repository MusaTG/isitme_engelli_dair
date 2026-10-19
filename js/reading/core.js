// Okuma modülünün saf (DOM'suz) çekirdeği. Hem tarayıcıda hem Node'daki derleme aracında kullanılır.
// Metin ayrıştırma, kelime sayımı, süre tahmini, aşama bölme, arama normalleştirmesi, benzerlik.

export const DEFAULT_WPM = { tr: 110, en: 140 }; // sesli okuma için varsayılan tahmini hız (kelime/dk)
export const PART_WORDS = 200; // başlıksız metinlerde otomatik okuma parçası hedef uzunluğu

const FOLD = { ç: 'c', ğ: 'g', ı: 'i', i̇: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', é: 'e', è: 'e', ê: 'e', á: 'a', à: 'a', ó: 'o', ú: 'u', ñ: 'n', ä: 'a', ë: 'e', ï: 'i' };

export function lower(str, lang = 'tr') {
  return String(str || '').toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-GB').normalize('NFC');
}

// Türkçe harfleri ve aksanları katlar: "Işık Şehri" → "isik sehri". Arama toleransı içindir.
export function fold(str, lang = 'tr') {
  return lower(str, lang).replace(/i̇/g, 'i').replace(/[çğıöşüâîûéèêáàóúñäëï]/g, (c) => FOLD[c] || c);
}

const WORD_RE = /[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu;

export function words(str) {
  return String(str || '').match(WORD_RE) || [];
}

export function wordCount(str) {
  return words(str).length;
}

// Arama dizini için bir metnin benzersiz (küçük harfli, katlanmamış) kelimeleri.
export function tokenSet(str, lang = 'tr') {
  const out = new Set();
  for (const w of words(str)) {
    const x = lower(w, lang).replace(/['’].*$/, '');
    if (x.length >= 2) out.add(x);
  }
  return out;
}

export function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function estimateMinutes(wordsN, wpm) {
  return wordsN / Math.max(40, wpm || 120);
}

// Uzunluk sınıfı tahmini süreye göre: kısa < 7 dk ≤ orta < 25 dk ≤ uzun.
export function lengthClass(minutes) {
  if (minutes < 7) return 'short';
  if (minutes < 25) return 'medium';
  return 'long';
}

const SPEAKER_RE = /^([\p{Lu}][\p{L} .'’-]{0,24}):\s+(.+)$/su;

// Kaynak metin gövdesini bölümlere ve paragraflara ayırır.
// "## Başlık" satırı yeni bölüm açar. Boş satır paragrafı bitirir.
// Şiirde satır sonları korunur; diyalogda "Ad: söz" biçimi konuşmacı olarak işaretlenir.
export function parseBody(body, { kind = 'fiction', partWords = PART_WORDS } = {}) {
  const poem = kind === 'poem';
  const sections = [];
  let cur = null;
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    if (!cur) { cur = { h: null, paras: [] }; sections.push(cur); }
    const t = poem ? buf.map((l) => l.trim()).join('\n') : buf.map((l) => l.trim()).join(' ').replace(/\s+/g, ' ');
    const para = { t };
    if (kind === 'dialogue') {
      const m = t.match(SPEAKER_RE);
      if (m) { para.sp = m[1].trim(); para.t = m[2].trim(); }
    }
    cur.paras.push(para);
    buf = [];
  };
  for (const raw of String(body || '').replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const head = line.match(/^##\s+(.+)$/);
    if (head) { flush(); cur = { h: head[1].trim(), paras: [] }; sections.push(cur); continue; }
    if (!line.trim()) { flush(); continue; }
    // Diyalogda her "Ad: söz" satırı kendi paragrafıdır (boş satır gerekmez).
    if (kind === 'dialogue' && SPEAKER_RE.test(line.trim())) { flush(); buf.push(line); flush(); continue; }
    buf.push(line);
  }
  flush();
  const real = sections.filter((s) => s.paras.length);
  let out;
  if (real.some((s) => s.h)) out = real;
  else {
    // Başlık yok: paragraf sınırlarında yaklaşık eşit okuma parçalarına böl (otomatik, başlıksız).
    const paras = real.flatMap((s) => s.paras);
    const total = paras.reduce((n, p) => n + wordCount(p.t), 0);
    const parts = Math.max(1, Math.min(paras.length, Math.round(total / partWords)));
    const target = total / parts;
    out = [];
    let acc = 0;
    let cur2 = null;
    for (const p of paras) {
      if (!cur2 || (acc >= target * out.length && out.length < parts)) { cur2 = { h: null, auto: true, paras: [] }; out.push(cur2); }
      cur2.paras.push(p);
      acc += wordCount(p.t);
    }
  }
  return out.map((s, i) => ({
    id: `s${i + 1}`, h: s.h || null, ...(s.auto ? { auto: true } : {}),
    paras: s.paras.map((p, j) => ({ id: `s${i + 1}p${j + 1}`, ...p })),
    words: s.paras.reduce((n, p) => n + wordCount(p.t) + (p.sp ? 0 : 0), 0),
  }));
}

export function sentences(str) {
  return String(str || '').replace(/\n/g, ' ').match(/[^.!?…]+[.!?…]+["'”’»)]*|[^.!?…]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
}

// Basit okunabilirlik tabanlı seviye (1 Kolay, 2 Orta, 3 İleri): ortalama cümle uzunluğu ve uzun kelime oranı.
export function autoLevel(text, lang = 'tr') {
  const ws = words(text);
  if (!ws.length) return 1;
  const sents = Math.max(1, sentences(text).length);
  const avgSent = ws.length / sents;
  const longCut = lang === 'tr' ? 9 : 8;
  const longRatio = ws.filter((w) => w.length >= longCut).length / ws.length;
  const score = avgSent / 12 + longRatio * 6;
  if (score < 1.35) return 1;
  if (score < 1.95) return 2;
  return 3;
}

export function sectionsText(sections) {
  return sections.map((s) => [s.h, ...s.paras.map((p) => (p.sp ? `${p.sp}: ${p.t}` : p.t))].filter(Boolean).join('\n')).join('\n');
}

// Kaynak dosya biçimi (bkz. docs/reading-format.md):
// ### 001 | Başlık
// sub: morning | tags: a, b | kind: fiction | aud: all | level: 2 | series: x | part: 1 | version: 1
// ---
// gövde
export function parseSourceFile(src) {
  const blocks = [];
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  let cur = null;
  let inBody = false;
  for (const line of lines) {
    // "### 12 | Başlık" — numara isteğe bağlıdır ("### | Başlık" ya da "### ? | Başlık"); numarasız bloklara
    // tools/import-reading.mjs sıradaki boş numarayı verir.
    const m = line.match(/^###\s*(\d{1,4}|\?|-)?\s*\|\s*(.+?)\s*$/);
    if (m) {
      cur = { num: m[1] && /^\d+$/.test(m[1]) ? Number(m[1]) : null, title: m[2], meta: {}, body: [] };
      blocks.push(cur);
      inBody = false;
      continue;
    }
    if (!cur) continue;
    if (!inBody) {
      if (/^---\s*$/.test(line)) { inBody = true; continue; }
      if (!line.trim()) continue;
      for (const part of line.split(/\s+\|\s+/)) {
        const kv = part.match(/^\s*([a-z]+)\s*:\s*(.*?)\s*$/);
        if (kv) cur.meta[kv[1]] = kv[2];
      }
      continue;
    }
    cur.body.push(line);
  }
  return blocks.map((b) => ({ ...b, body: b.body.join('\n').trim() }));
}

export function makeText({ lang, cat, num, title, meta = {}, body, defaults = {} }) {
  const kind = meta.kind || defaults.kind || 'fiction';
  const sections = parseBody(body, { kind });
  const plain = sectionsText(sections);
  const wordsN = wordCount(plain);
  const first = sections[0]?.paras[0]?.t || '';
  const id = `${lang}-${cat}-${String(num).padStart(3, '0')}`;
  return {
    id, n: num, lang, cat,
    sub: meta.sub || defaults.sub || null,
    title: title.trim(),
    kind,
    aud: meta.aud || defaults.aud || 'all',
    level: Number(meta.level) || autoLevel(plain, lang),
    tags: (meta.tags || '').split(',').map((x) => x.trim()).filter(Boolean),
    series: meta.series || null,
    part: meta.part ? Number(meta.part) : null,
    version: Number(meta.version) || 1,
    hash: fnv(`${title}\n${plain}`),
    words: wordsN,
    summary: meta.summary || '',
    preview: first.length > 220 ? `${first.slice(0, 217).replace(/\s+\S*$/, '')}…` : first,
    sections,
  };
}

// Benzerlik: 5 kelimelik parçaların (shingle) Jaccard oranı. 0..1
export function shingles(text, lang = 'tr', k = 5) {
  const ws = words(text).map((w) => fold(w, lang));
  const out = new Set();
  for (let i = 0; i + k <= ws.length; i++) out.add(ws.slice(i, i + k).join(' '));
  if (!out.size && ws.length) out.add(ws.join(' '));
  return out;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

// Paragraf içi konumdan okunur yer bilgisi: aşama, paragraf sırası (metin genelinde).
export function locate(text, pid) {
  let globalIdx = 0;
  let wordsBefore = 0;
  for (let si = 0; si < text.sections.length; si++) {
    const s = text.sections[si];
    for (let pi = 0; pi < s.paras.length; pi++) {
      globalIdx += 1;
      const p = s.paras[pi];
      if (p.id === pid) return { stage: si + 1, sid: s.id, paraInStage: pi + 1, paraNo: globalIdx, wordsBefore, wordsThrough: wordsBefore + wordCount(p.t) };
      wordsBefore += wordCount(p.t);
    }
  }
  return null;
}

export function allParas(text) {
  return text.sections.flatMap((s) => s.paras.map((p) => ({ ...p, sid: s.id })));
}

// Sürüm değiştiğinde ayraç/not konumunu yeni metne taşır: önce alıntı, sonra paragraf başı aranır.
export function remapLocation(text, item) {
  if (!item) return null;
  if (item.v === text.hash) return { ...item, orphan: false };
  const paras = allParas(text);
  const quote = (item.quote || '').trim();
  const pfx = (item.pfx || '').trim();
  let hit = null;
  if (quote && quote.length >= 6) hit = paras.find((p) => p.t.includes(quote));
  if (!hit && pfx) hit = paras.find((p) => p.t.startsWith(pfx));
  if (!hit && pfx.length > 20) hit = paras.find((p) => p.t.includes(pfx.slice(0, 20)));
  if (hit) return { ...item, pid: hit.id, v: text.hash, orphan: false };
  return { ...item, orphan: true };
}

// Dışarıda üretilmiş "### | Başlık" blok biçimindeki .txt/.md dosyasını okuma paketine çevirir
// (biçim: docs/reading-format.md). Kategori/dil blokta "cat:" / "lang:" ile verilir; yoksa varsayılan kullanılır.
export function packFromSource(src, { lang = 'tr', cat = 'daily', license = '' } = {}) {
  const byLang = {};
  for (const b of parseSourceFile(src)) {
    const l = ['tr', 'en'].includes(b.meta.lang) ? b.meta.lang : lang;
    (byLang[l] ||= []).push({ title: b.title, cat: b.meta.cat || cat, sub: b.meta.sub, aud: b.meta.aud, tags: (b.meta.tags || '').split(',').map((x) => x.trim()).filter(Boolean), license: b.meta.license || license, source: b.meta.source || '', author: b.meta.author || '', body: b.body });
  }
  return Object.entries(byLang).map(([l, texts]) => ({ app: 'duyum-reading', lang: l, texts }));
}
