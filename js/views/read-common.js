// Okuma modülü ekranlarının ortak yardımcıları.
import { t, getLocale, formatDate } from '../i18n.js';
import { esc, icon } from '../ui.js';
import { ensureReading } from '../reading/state.js';
import { estimateMinutes, lengthClass } from '../reading/core.js';
import { highlight } from '../reading/search.js';

export async function rctx(ctx) {
  const profile = ctx.store.activeProfile();
  const R = ensureReading(profile);
  const cats = await ctx.library.categories();
  const ui = getLocale();
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  const other = ui === 'tr' ? 'en' : 'tr';
  return {
    profile, R, cats, ui, lib: ctx.library, catById,
    lang: R.lang,
    catName: (id) => catById[id]?.name[ui] || id,
    subName: (cat, sub) => catById[cat]?.subs[sub]?.[ui] || sub || '',
    catAlt: (cat, sub) => `${catById[cat]?.name[other] || ''} ${catById[cat]?.subs[sub]?.[other] || ''}`,
    kindLabel: (k) => cats.kinds[k]?.[ui] || k,
    levelName: (n) => cats.levels[n]?.[ui] || String(n),
    lenName: (cls) => t(`rd.len.${cls}`),
    minutes: (meta) => estimateMinutes(meta.words, R.wpm[meta.lang || R.lang] || 120),
    cls: (meta) => lengthClass(estimateMinutes(meta.words, R.wpm[meta.lang || R.lang] || 120)),
  };
}

export function fmtMin(m) {
  if (m < 1) return t('rd.lessThanMin');
  if (m < 60) return t('rd.minApprox', { n: Math.round(m) });
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return t('rd.hourApprox', { h, m: mm });
}

export function fmtSec(sec) {
  const m = Math.floor(sec / 60);
  if (m < 1) return t('rd.lessThanMin');
  if (m < 60) return t('rd.minShort', { n: m });
  return t('rd.hourShort', { h: Math.floor(m / 60), m: m % 60 });
}

export function fmtNum(n) {
  return Number(n || 0).toLocaleString(getLocale() === 'tr' ? 'tr-TR' : 'en-GB');
}

export function pctText(x) {
  const v = Math.round((x || 0) * 100);
  return getLocale() === 'tr' ? `%${v}` : `${v}%`;
}

export function locLabel(p) {
  if (!p || !p.pid) return '';
  return t('rd.locLabel', { stage: p.stage || 1, para: p.paraNo || 1 });
}

export function dateLabel(iso) {
  return iso ? formatDate(iso) : '';
}

export const READ_TABS = [
  ['#/read', 'rd.tab.home'],
  ['#/read/library', 'rd.tab.library'],
  ['#/read/history', 'rd.tab.history'],
  ['#/read/favorites', 'rd.tab.favorites'],
  ['#/read/marks', 'rd.tab.marks'],
  ['#/read/lists', 'rd.tab.lists'],
  ['#/read/mine', 'rd.tab.mine'],
  ['#/read/ai', 'rd.tab.ai'],
];

export function readNav(active) {
  return `<nav class="read-nav" aria-label="${esc(t('rd.navLabel'))}"><ul>${READ_TABS.map(([h, k]) => `<li><a href="${h}"${h === active ? ' aria-current="page"' : ''}>${esc(t(k))}</a></li>`).join('')}</ul></nav>`;
}

export function statusBadge(st) {
  return `<span class="rbadge st-${st}">${esc(t(`rd.status.${st}`))}</span>`;
}

export function progressBar(pct, label) {
  const v = Math.round((pct || 0) * 100);
  return `<span class="rbar" role="img" aria-label="${esc(label || pctText(pct))}"><span style="width:${v}%"></span></span>`;
}

// Metin kartı: arama sonucu, liste, geçmiş, favori.
export function textCard(rc, meta, { words = [], strict = false, snippetHtml = null, extra = '', actions = '', status, pct, fav, headingTag = 'h3' } = {}) {
  const st = status ?? rc.R.progress[meta.id]?.status ?? 'new';
  const p = pct ?? rc.R.progress[meta.id]?.pct ?? 0;
  const isFav = fav ?? rc.R.favorites.includes(meta.id);
  const lang = meta.lang || rc.lang;
  const prog = rc.R.progress[meta.id];
  const title = highlight(meta.title, words, lang, strict);
  const kindNote = ['fictional-news', 'fictional-journal'].includes(meta.kind) ? `<span class="rbadge kind-note">${esc(rc.kindLabel(meta.kind))}</span>` : '';
  return `<article class="tcard" data-id="${esc(meta.id)}">
    <div class="tcard-main">
      <p class="tcard-cat small muted">${esc(rc.catName(meta.cat))}${meta.sub ? ` · ${esc(rc.subName(meta.cat, meta.sub))}` : ''}${meta.series ? ` · ${esc(t('rd.part', { n: meta.part }))}` : ''}${meta.user ? ` · ${esc(t('rd.ownText'))}` : ''}</p>
      <${headingTag} class="tcard-title"><a href="#/read/text/${esc(meta.id)}">${title}</a></${headingTag}>
      <p class="tcard-preview small">${snippetHtml || highlight(meta.summary || meta.preview, words, lang, strict)}</p>
      <p class="tcard-meta small"><span>${esc(rc.levelName(meta.level))}</span><span>${esc(fmtMin(rc.minutes(meta)))}</span><span>${esc(t('rd.words', { n: fmtNum(meta.words) }))}</span><span>${esc(rc.lenName(rc.cls(meta)))}</span>${statusBadge(st)}${kindNote}</p>
      ${st !== 'new' ? `<p class="tcard-prog small">${progressBar(p, t('rd.pctDone', { pct: pctText(p) }))}<span>${esc(pctText(p))}${prog?.pid && st === 'reading' ? ` · ${esc(locLabel(prog))}` : ''}</span></p>` : ''}
      ${extra}
    </div>
    <div class="tcard-actions">
      <button type="button" class="btn ghost small fav-btn" data-fav="${esc(meta.id)}" aria-pressed="${isFav}" aria-label="${esc(t(isFav ? 'rd.favRemove' : 'rd.favAdd'))}: ${esc(meta.title)}">${icon('star', isFav ? 'filled' : '')}</button>
      ${st === 'reading' && prog?.pid ? `<a class="btn primary small" href="#/read/text/${esc(meta.id)}">${esc(t('rd.continue'))}</a>` : `<a class="btn secondary small" href="#/read/text/${esc(meta.id)}">${esc(t('rd.open'))}</a>`}
      ${actions}
    </div>
  </article>`;
}

export function bindFavs(root, ctx, rc, onChange) {
  root.querySelectorAll('[data-fav]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.fav;
    const i = rc.R.favorites.indexOf(id);
    if (i >= 0) rc.R.favorites.splice(i, 1); else rc.R.favorites.push(id);
    ctx.store.save();
    const on = i < 0;
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('.icon')?.classList.toggle('filled', on);
    const title = b.closest('.tcard')?.querySelector('.tcard-title')?.textContent || '';
    b.setAttribute('aria-label', `${t(on ? 'rd.favRemove' : 'rd.favAdd')}: ${title}`);
    onChange?.(id, on);
  }));
}

export function langSwitch(rc) {
  return `<div class="field inline read-lang"><label for="rlang">${esc(t('rd.libLang'))}</label><select id="rlang"><option value="tr"${rc.lang === 'tr' ? ' selected' : ''}>${esc(t('lang.tr'))}</option><option value="en"${rc.lang === 'en' ? ' selected' : ''}>${esc(t('lang.en'))}</option></select></div>`;
}

export function bindLangSwitch(root, ctx, rc) {
  root.querySelector('#rlang')?.addEventListener('change', (e) => { rc.R.lang = e.target.value; ctx.store.save(); ctx.rerender(); });
}
