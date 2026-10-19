// Okuma kütüphanesi arama motoru (saf). Başlık, tam metin, kategori/alt kategori, etiket,
// bölüm başlığı, yazar/kaynak, zorluk ve süre etiketlerinde kelime başı eşleşmesi yapar.
// Türkçe harf toleransı: "isik" → "ışık" (varsayılan); "tam eşleşme" seçilirse harfler ayırt edilir.
import { fold, lower, estimateMinutes, lengthClass } from './core.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function normFor(strict, lang) {
  return strict ? (s) => lower(s, lang) : (s) => fold(s, lang);
}

export function queryWords(q, lang, strict) {
  const n = normFor(strict, lang);
  return [...new Set(String(q || '').split(/[\s,.;:!?()"“”'’]+/).map((w) => n(w)).filter((w) => w.length >= 2))];
}

const spaced = (s) => ` ${String(s || '').replace(/[^\p{L}\p{N}]+/gu, ' ')} `;

const W = { title: 10, heads: 5, tags: 6, cat: 3, labels: 2, author: 3, body: 1 };

// ctx: { lang, strict, progress, favorites, index (Map id→{strict,folded}) | null, catName(id), subName(cat,sub), levelName(n), lenName(cls), wpm }
export function searchTexts(metas, opts = {}, ctx = {}) {
  const lang = ctx.lang || 'tr';
  const strict = Boolean(opts.strict);
  const n = normFor(strict, lang);
  const qw = queryWords(opts.q, lang, strict);
  const wpm = ctx.wpm?.[lang] || 120;
  const prog = ctx.progress || {};
  const favs = new Set(ctx.favorites || []);
  const out = [];
  for (const m of metas) {
    if (opts.cat && m.cat !== opts.cat) continue;
    if (opts.sub && m.sub !== opts.sub) continue;
    if (opts.level && Number(opts.level) !== m.level) continue;
    const mins = estimateMinutes(m.words, wpm);
    const cls = lengthClass(mins);
    if (opts.len && opts.len !== cls) continue;
    const st = prog[m.id]?.status || 'new';
    if (opts.status && opts.status !== st) continue;
    if (opts.fav && !favs.has(m.id)) continue;
    if (opts.aud === 'child' && !['child', 'all'].includes(m.aud)) continue;
    if (opts.own && !m.user) continue;
    if (opts.kind && m.kind !== opts.kind) continue;
    let score = 0;
    const hits = new Set();
    if (qw.length) {
      const fields = {
        title: spaced(n(m.title)),
        heads: spaced(n((m.heads || []).join(' '))),
        tags: spaced(n((m.tags || []).join(' '))),
        cat: spaced(n(`${ctx.catName?.(m.cat) || ''} ${ctx.subName?.(m.cat, m.sub) || ''} ${ctx.catAlt?.(m.cat, m.sub) || ''}`)),
        labels: spaced(n(`${ctx.levelName?.(m.level) || ''} ${ctx.lenName?.(cls) || ''}`)),
        author: spaced(n(`${m.author || ''} ${m.source || ''}`)),
      };
      let body = null;
      if (m.tokens) body = ` ${[...m.tokens].map(n).join(' ')} `;
      else if (ctx.index?.get(m.id)) body = ctx.index.get(m.id)[strict ? 'strict' : 'folded'];
      let all = true;
      for (const w of qw) {
        let wordScore = 0;
        for (const [f, hay] of Object.entries(fields)) {
          if (hay.includes(` ${w}`)) { wordScore += W[f] + (hay.includes(` ${w} `) ? 1 : 0); hits.add(f); }
        }
        if (body && body.includes(` ${w}`)) { wordScore += W.body; hits.add('body'); }
        if (!wordScore) { all = false; break; }
        score += wordScore;
      }
      if (!all) continue;
      if (fields.title.startsWith(` ${qw[0]}`)) score += 4;
    }
    out.push({ meta: m, score, hits: [...hits], minutes: mins, cls, status: st, pct: prog[m.id]?.pct || 0, fav: favs.has(m.id) });
  }
  const sort = opts.sort || (qw.length ? 'relevance' : 'default');
  const loc = lang === 'tr' ? 'tr' : 'en';
  const byTitle = (a, b) => a.meta.title.localeCompare(b.meta.title, loc);
  const cmp = {
    relevance: (a, b) => b.score - a.score || byTitle(a, b),
    default: (a, b) => (a.meta.order ?? -1) - (b.meta.order ?? -1),
    title: byTitle,
    short: (a, b) => a.meta.words - b.meta.words,
    long: (a, b) => b.meta.words - a.meta.words,
    recent: (a, b) => String(prog[b.meta.id]?.lastAt || '').localeCompare(String(prog[a.meta.id]?.lastAt || '')) || byTitle(a, b),
    new: (a, b) => String(b.meta.addedAt || '').localeCompare(String(a.meta.addedAt || '')) || (b.meta.order ?? 1e9) - (a.meta.order ?? 1e9),
  }[sort] || ((a, b) => 0);
  out.sort(cmp);
  return { words: qw, total: out.length, items: out };
}

// Normalleştirilmiş eşleşme aralıkları (kelime başında başlayan). Harf harf eşleme; uzunluk korunur.
export function matchRanges(text, qwords, lang = 'tr', strict = false) {
  if (!qwords?.length) return [];
  const n = normFor(strict, lang);
  const src = String(text || '');
  let norm = '';
  for (const ch of src) { const x = n(ch); norm += x.length === ch.length ? x : (x[0] || ch).padEnd(ch.length, ' '); }
  const ranges = [];
  for (const w of qwords) {
    let i = norm.indexOf(w);
    while (i >= 0) {
      const prev = i === 0 ? ' ' : norm[i - 1];
      if (!/[\p{L}\p{N}]/u.test(prev)) {
        let end = i + w.length;
        while (end < norm.length && /[\p{L}\p{N}]/u.test(norm[end])) end += 1;
        ranges.push([i, end]);
      }
      i = norm.indexOf(w, i + 1);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push([...r]);
  }
  return merged;
}

export function highlight(text, qwords, lang, strict) {
  const src = String(text || '');
  const ranges = matchRanges(src, qwords, lang, strict);
  if (!ranges.length) return esc(src);
  let html = '';
  let pos = 0;
  for (const [a, b] of ranges) { html += esc(src.slice(pos, a)) + `<mark class="hit">${esc(src.slice(a, b))}</mark>`; pos = b; }
  return html + esc(src.slice(pos));
}

// Gövdeden eşleşmenin çevresinden kısa bir alıntı (vurgulu HTML). Eşleşme yoksa null.
export function snippet(sections, qwords, lang, strict, span = 90) {
  for (const s of sections || []) {
    for (const p of [{ t: s.h || '' }, ...s.paras]) {
      const r = matchRanges(p.t, qwords, lang, strict);
      if (!r.length) continue;
      const t = p.t.replace(/\n/g, ' ');
      let a = Math.max(0, r[0][0] - span);
      let b = Math.min(t.length, r[0][1] + span);
      if (a > 0) a = t.indexOf(' ', a) + 1 || a;
      if (b < t.length) b = t.lastIndexOf(' ', b) > r[0][1] ? t.lastIndexOf(' ', b) : b;
      return `${a > 0 ? '…' : ''}${highlight(t.slice(a, b), qwords, lang, strict)}${b < t.length ? '…' : ''}`;
    }
  }
  return null;
}
