// Okuma kütüphanesi: gelişmiş arama, süzgeçler, sıralama, eşleşme vurgusu ve sayfalama.
import { t } from '../i18n.js';
import { esc, icon, helpLink, announce } from '../ui.js';
import { allMeta } from '../reading/data.js';
import { searchTexts, snippet } from '../reading/search.js';
import { rctx, readNav, textCard, bindFavs, langSwitch, bindLangSwitch } from './read-common.js';

const PAGE = 20;
const KEYS = ['q', 'cat', 'sub', 'level', 'len', 'status', 'fav', 'sort', 'aud', 'strict', 'own'];

export async function readLibraryView(root, ctx, params) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const st = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || '']));
  if (!params.has('aud') && rc.profile.type === 'child') st.aud = 'child';
  let shown = PAGE;
  let index = null;
  let indexState = 'idle';
  const metas = await allMeta(rc.lib, R, rc.lang);
  const sctx = () => ({ lang: rc.lang, progress: R.progress, favorites: R.favorites, index, catName: rc.catName, subName: rc.subName, catAlt: rc.catAlt, levelName: rc.levelName, lenName: rc.lenName, wpm: R.wpm });

  const opt = (v, label, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`;
  const subOptions = () => (st.cat ? Object.entries(rc.catById[st.cat]?.subs || {}).map(([id, n]) => opt(id, n[rc.ui], st.sub)).join('') : '');

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.libTitle')}</h1><p class="muted">${t('rd.libIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
  ${readNav('#/read/library')}
  <form class="read-search" role="search" id="sform">
    <label for="q" class="sr-only">${t('rd.searchLabel')}</label>
    <div class="search-row"><span class="search-ico">${icon('search')}</span><input id="q" type="search" value="${esc(st.q)}" placeholder="${esc(t('rd.searchPh'))}" autocomplete="off" enterkeyhint="search"></div>
  </form>
  ${langSwitch(rc)}
  <details class="filters-wrap" ${matchMedia('(min-width: 900px)').matches || KEYS.slice(1).some((k) => st[k] && k !== 'aud') ? 'open' : ''}>
    <summary>${icon('toc')}${t('rd.filters')} <span id="fcount" class="rbadge"></span></summary>
    <div class="filters read-filters">
      <div class="field"><label for="f-cat">${t('rd.f.cat')}</label><select id="f-cat">${opt('', t('rd.f.allCats'), st.cat)}${rc.cats.categories.map((c) => opt(c.id, c.name[rc.ui], st.cat)).join('')}</select></div>
      <div class="field"><label for="f-sub">${t('rd.f.sub')}</label><select id="f-sub"${st.cat ? '' : ' disabled'}>${opt('', t('rd.f.allSubs'), st.sub)}${subOptions()}</select></div>
      <div class="field"><label for="f-level">${t('rd.f.level')}</label><select id="f-level">${opt('', t('rd.f.any'), st.level)}${[1, 2, 3].map((n) => opt(n, rc.levelName(n), st.level)).join('')}</select></div>
      <div class="field"><label for="f-len">${t('rd.f.len')}</label><select id="f-len">${opt('', t('rd.f.any'), st.len)}${['short', 'medium', 'long'].map((c) => opt(c, `${rc.lenName(c)} (${t(`rd.lenRange.${c}`)})`, st.len)).join('')}</select></div>
      <div class="field"><label for="f-status">${t('rd.f.status')}</label><select id="f-status">${opt('', t('rd.f.any'), st.status)}${['new', 'reading', 'done'].map((s) => opt(s, t(`rd.status.${s}`), st.status)).join('')}</select></div>
      <div class="field"><label for="f-sort">${t('rd.f.sort')}</label><select id="f-sort">${opt('', t('rd.sort.auto'), st.sort)}${['relevance', 'title', 'short', 'long', 'recent', 'new'].map((s) => opt(s, t(`rd.sort.${s}`), st.sort)).join('')}</select></div>
      <div class="field checks">
        <label class="check small"><input type="checkbox" id="f-fav"${st.fav ? ' checked' : ''}> ${t('rd.f.fav')}</label>
        <label class="check small"><input type="checkbox" id="f-aud"${st.aud === 'child' ? ' checked' : ''}> ${t('rd.f.child')}</label>
        <label class="check small"><input type="checkbox" id="f-own"${st.own ? ' checked' : ''}> ${t('rd.f.own')}</label>
        <label class="check small"><input type="checkbox" id="f-strict"${st.strict ? ' checked' : ''} aria-describedby="strict-h"> ${t('rd.f.strict')}</label>
        <p class="hint" id="strict-h">${t('rd.f.strictHint')}</p>
      </div>
      <div class="field"><button type="button" class="btn ghost small" data-act="clear">${t('rd.clearFilters')}</button></div>
    </div>
  </details>
  <p id="rcount" class="small muted" aria-live="polite"></p>
  <div id="results" class="results-list"></div>
  <div id="more" class="center"></div>`;

  const $ = (s) => root.querySelector(s);
  const syncURL = () => {
    const q = new URLSearchParams();
    for (const k of KEYS) if (st[k]) q.set(k, st[k]);
    const h = `#/read/library${q.toString() ? `?${q}` : ''}`;
    history.replaceState(null, '', h);
  };

  async function ensureIndex() {
    if (index || indexState === 'loading' || !st.q.trim()) return;
    indexState = 'loading';
    try { index = await rc.lib.searchIndex(rc.lang); indexState = 'ready'; } catch { indexState = 'error'; }
    draw();
  }

  async function draw(resetPage = false) {
    if (resetPage) shown = PAGE;
    const res = searchTexts(metas, st, sctx());
    const active = KEYS.slice(1).filter((k) => st[k] && k !== 'sort' && !(k === 'aud' && rc.profile.type === 'child')).length;
    $('#fcount').textContent = active ? String(active) : '';
    const note = st.q && indexState === 'loading' ? ` ${t('rd.indexLoading')}` : st.q && indexState === 'error' ? ` ${t('rd.indexFail')}` : '';
    $('#rcount').textContent = `${t('rd.found', { n: res.total })}${note}`;
    if (!res.total) {
      const libEmpty = !metas.some((m) => !m.user && (!st.cat || m.cat === st.cat));
      $('#results').innerHTML = libEmpty ? `<div class="empty"><p>${t('rd.libEmpty')}</p><p class="small muted">${t('rd.libEmptyHint')}</p><a class="btn secondary" href="#/read/mine">${t('rd.tab.mine')}</a> <button class="btn ghost" data-act="clear2">${t('rd.clearFilters')}</button></div>` : `<div class="empty"><p>${t('rd.noResults')}</p><p class="small muted">${t('rd.noResultsHint')}</p><button class="btn secondary" data-act="clear2">${t('rd.clearFilters')}</button></div>`;
      $('#more').innerHTML = '';
      $('[data-act=clear2]').addEventListener('click', clearAll);
      return;
    }
    const page = res.items.slice(0, shown);
    // Görünür sonuçların gövdesinden vurgulu alıntı (gerekirse kategori dosyası yüklenir).
    const snippets = {};
    if (res.words.length) {
      const needCats = [...new Set(page.filter((x) => x.hits.includes('body') && !x.meta.user).map((x) => x.meta.cat))];
      const bodies = {};
      await Promise.all(needCats.map(async (c) => { try { bodies[c] = await rc.lib.bodies(rc.lang, c); } catch { /* yok */ } }));
      for (const x of page) {
        if (!x.hits.includes('body')) continue;
        const b = x.meta.user ? null : bodies[x.meta.cat]?.[x.meta.id];
        if (b) snippets[x.meta.id] = snippet(b.sections, res.words, rc.lang, Boolean(st.strict));
      }
    }
    $('#results').innerHTML = page.map((x) => textCard(rc, x.meta, { words: res.words, strict: Boolean(st.strict), snippetHtml: snippets[x.meta.id] ? `<span class="snip-label">${esc(t('rd.inText'))}:</span> ${snippets[x.meta.id]}` : null, headingTag: 'h2' })).join('');
    $('#more').innerHTML = res.total > shown ? `<button class="btn secondary" data-act="more">${esc(t('rd.showMore', { n: Math.min(PAGE, res.total - shown), left: res.total - shown }))}</button>` : '';
    $('[data-act=more]')?.addEventListener('click', () => { const first = shown; shown += PAGE; draw().then(() => root.querySelectorAll('.tcard')[first]?.querySelector('a')?.focus()); });
    bindFavs($('#results'), ctx, rc, () => { if (st.fav) draw(); });
  }

  function clearAll() {
    for (const k of KEYS) st[k] = '';
    if (rc.profile.type === 'child') st.aud = 'child';
    root.querySelectorAll('.read-filters select').forEach((s) => { s.value = ''; });
    root.querySelectorAll('.read-filters input[type=checkbox]').forEach((c) => { c.checked = c.id === 'f-aud' && st.aud === 'child'; });
    $('#q').value = '';
    $('#f-sub').disabled = true;
    syncURL();
    draw(true);
    announce(t('rd.filtersCleared'));
  }

  let timer;
  $('#q').addEventListener('input', (e) => {
    st.q = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => { syncURL(); draw(true); ensureIndex(); }, 220);
  });
  $('#sform').addEventListener('submit', (e) => { e.preventDefault(); syncURL(); draw(true); ensureIndex(); });
  const sel = (id, key, after) => $(id).addEventListener('change', (e) => { st[key] = e.target.value; after?.(); syncURL(); draw(true); });
  sel('#f-cat', 'cat', () => { st.sub = ''; $('#f-sub').innerHTML = opt('', t('rd.f.allSubs'), '') + subOptions(); $('#f-sub').disabled = !st.cat; });
  sel('#f-sub', 'sub');
  sel('#f-level', 'level');
  sel('#f-len', 'len');
  sel('#f-status', 'status');
  sel('#f-sort', 'sort');
  const chk = (id, key, val = '1') => $(id).addEventListener('change', (e) => { st[key] = e.target.checked ? val : ''; syncURL(); draw(true); });
  chk('#f-fav', 'fav');
  chk('#f-aud', 'aud', 'child');
  chk('#f-own', 'own');
  chk('#f-strict', 'strict');
  $('[data-act=clear]').addEventListener('click', clearAll);
  bindLangSwitch(root, ctx, rc);
  await draw(true);
  ensureIndex();
}
