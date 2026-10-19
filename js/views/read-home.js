// Okuma Egzersizi ana sayfası: arama, okumaya devam et, devam eden okumalar, kategoriler, kısayollar.
import { t } from '../i18n.js';
import { esc, icon, helpLink, toast } from '../ui.js';
import { metaResolver, allMeta } from '../reading/data.js';
import { timedRatio } from '../reading/state.js';
import { rctx, readNav, fmtMin, fmtSec, pctText, locLabel, dateLabel, progressBar, langSwitch, bindLangSwitch } from './read-common.js';

export async function readHomeView(root, ctx) {
  const rc = await rctx(ctx);
  const { R } = rc;
  let catalog = null;
  let loadError = null;
  try { catalog = await rc.lib.catalog(rc.lang); } catch (e) { loadError = e; }
  const metaOf = await metaResolver(rc.lib, R);
  const inProgress = Object.entries(R.progress)
    .filter(([id, p]) => p.status === 'reading' && metaOf(id))
    .sort((a, b) => String(b[1].lastAt).localeCompare(String(a[1].lastAt)));
  const [lastId, last] = inProgress[0] || [];
  const lastMeta = lastId ? metaOf(lastId) : null;
  const timed = R.timed;
  const own = R.userTexts.filter((u) => !u.archived && (u.lang || 'tr') === rc.lang).length;

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.title')}</h1><p class="muted">${t('rd.intro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
  ${readNav('#/read')}
  <form class="read-search" role="search" action="#/read/library">
    <label for="rq" class="sr-only">${t('rd.searchLabel')}</label>
    <div class="search-row"><span class="search-ico">${icon('search')}</span><input id="rq" type="search" name="q" placeholder="${esc(t('rd.searchPh'))}" autocomplete="off" enterkeyhint="search"><button class="btn primary" type="submit">${t('rd.searchBtn')}</button></div>
    <p class="hint">${t('rd.searchHint')}</p>
  </form>
  <a class="ai-cta" href="#/read/ai">${icon('spark')}<span><strong>${t('rd.ai.ctaTitle')}</strong><span class="small muted block">${t('rd.ai.ctaText')}</span></span>${icon('next')}</a>
  ${langSwitch(rc)}
  ${loadError ? `<div class="alert warn" role="alert">${icon('info')}<p>${esc(t('rd.loadFail'))}</p></div>` : ''}

  ${timed ? `<section class="panel timed-card" aria-labelledby="h-timed"><h2 id="h-timed" class="h3">${icon('clock')}${t('rd.timedActive')}</h2>
    <p>${esc(t('rd.timedState', { done: fmtSec(timed.elapsedSec), target: t('rd.minShort', { n: timed.targetMin }), pct: pctText(timedRatio(timed)) }))} ${timed.running ? '' : `<span class="rbadge">${esc(t('rd.paused'))}</span>`}</p>
    ${progressBar(timedRatio(timed))}
    <div class="actions"><a class="btn primary" href="#/read/session/continue">${t('rd.timedContinue')}</a><button class="btn ghost" data-act="endTimed">${t('rd.timedEnd')}</button></div></section>` : ''}

  <section class="panel continue-card" aria-labelledby="h-cont"><h2 id="h-cont" class="h3">${icon('bookmark')}${t('rd.continueTitle')}</h2>
    ${lastMeta ? `<p class="small muted">${esc(rc.catName(lastMeta.cat))}</p>
      <p class="continue-title"><strong>${esc(lastMeta.title)}</strong></p>
      <dl class="kv small">
        <dt>${t('rd.lastPos')}</dt><dd>${esc(locLabel(last))}${lastMeta.heads?.[last.stage - 1] ? ` — ${esc(lastMeta.heads[last.stage - 1])}` : ''}</dd>
        <dt>${t('rd.progress')}</dt><dd>${esc(pctText(last.pct))}</dd>
        <dt>${t('rd.lastRead')}</dt><dd>${esc(dateLabel(last.lastAt))}</dd>
      </dl>
      ${progressBar(last.pct)}
      <div class="actions"><a class="btn primary large" href="#/read/text/${esc(lastId)}">${icon('book')}${t('rd.continue')}</a></div>`
    : `<p class="muted">${t('rd.noContinue')}</p>`}
    ${inProgress.length > 1 ? `<h3 class="h4">${t('rd.inProgressTitle')}</h3><ul class="mini-list">${inProgress.slice(1, 6).map(([id, p]) => { const m = metaOf(id); return `<li><a href="#/read/text/${esc(id)}"><span>${esc(m.title)}</span><span class="small muted">${esc(pctText(p.pct))} · ${esc(dateLabel(p.lastAt))}</span></a></li>`; }).join('')}</ul>
      ${inProgress.length > 6 ? `<a class="link small" href="#/read/history?status=reading">${t('rd.seeAll', { n: inProgress.length })}</a>` : ''}` : ''}
  </section>

  <section aria-labelledby="h-quick"><h2 id="h-quick" class="h3">${t('rd.shortcuts')}</h2>
    <ul class="read-tiles">
      <li><a href="#/read/library">${icon('grid')}<strong>${t('rd.tile.library')}</strong><span class="small muted">${esc(t('rd.tile.libraryD', { n: catalog?.texts.length || 0 }))}</span></a></li>
      <li><a href="#/read/session">${icon('clock')}<strong>${t('rd.tile.session')}</strong><span class="small muted">${t('rd.tile.sessionD')}</span></a></li>
      <li><a href="#/read/history">${icon('chart')}<strong>${t('rd.tile.history')}</strong><span class="small muted">${t('rd.tile.historyD')}</span></a></li>
      <li><a href="#/read/favorites">${icon('star')}<strong>${t('rd.tile.favorites')}</strong><span class="small muted">${esc(t('rd.tile.favoritesD', { n: R.favorites.length }))}</span></a></li>
      <li><a href="#/read/marks">${icon('bookmark')}<strong>${t('rd.tile.marks')}</strong><span class="small muted">${esc(t('rd.tile.marksD', { n: R.marks.length }))}</span></a></li>
      <li><a href="#/read/lists">${icon('toc')}<strong>${t('rd.tile.lists')}</strong><span class="small muted">${esc(t('rd.tile.listsD', { n: R.lists.length }))}</span></a></li>
      <li><a href="#/read/mine">${icon('pencil')}<strong>${t('rd.tile.mine')}</strong><span class="small muted">${esc(t('rd.tile.mineD', { n: own }))}</span></a></li>
    </ul>
  </section>

  ${catalog ? `<section aria-labelledby="h-cats"><h2 id="h-cats" class="h3">${t('rd.categories')}</h2>
    <ul class="cat-grid">${rc.cats.categories.map((c) => { const n = catalog.categories.find((x) => x.id === c.id)?.count || 0; return `<li><a href="#/read/library?cat=${c.id}"><strong>${esc(c.name[rc.ui])}</strong><span class="small muted">${esc(c.desc[rc.ui])}</span><span class="cat-count">${esc(t('rd.textsN', { n }))}</span></a></li>`; }).join('')}</ul>
  </section>` : ''}

  <section class="panel" aria-labelledby="h-off"><h2 id="h-off" class="h3">${t('rd.offlineTitle')}</h2>
    <p class="small">${t('rd.offlineBody')}</p>
    <div class="actions"><button class="btn secondary" data-act="offline">${icon('download')}${esc(t('rd.offlineBtn', { lang: t(`lang.${rc.lang}`) }))}</button></div>
    <p class="small muted" id="off-status" aria-live="polite"></p>
  </section>
  <p class="small muted">${t('rd.noMic')}</p>`;

  bindLangSwitch(root, ctx, rc);
  root.querySelector('.read-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = root.querySelector('#rq').value.trim();
    ctx.go(`#/read/library${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  });
  root.querySelector('[data-act=endTimed]')?.addEventListener('click', async () => {
    const { endTimed } = await import('../reading/state.js');
    endTimed(R);
    ctx.store.save();
    toast(t('rd.timedEnded'));
    ctx.rerender();
  });
  root.querySelector('[data-act=offline]').addEventListener('click', async () => {
    const out = root.querySelector('#off-status');
    const files = ['categories.json', 'manifest.json', `${rc.lang}/catalog.json`, `${rc.lang}/search.json`, ...rc.cats.categories.map((c) => `${rc.lang}/${c.id}.json`)];
    let ok = 0;
    for (const f of files) {
      out.textContent = t('rd.offlineProgress', { n: ok, total: files.length });
      try { const res = await fetch(`content/reading/${f}`); if (res.ok) { await res.arrayBuffer(); ok += 1; } } catch { /* çevrimdışı */ }
    }
    const sw = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
    out.textContent = ok === files.length ? t(sw ? 'rd.offlineDone' : 'rd.offlineNoSW') : t('rd.offlineFail', { n: ok, total: files.length });
  });
  // Sık kullanılan kategorilerden metin sayısı için katalog dışındaki kendi metinleri de yüklenir (önbellek ısıtma).
  allMeta(rc.lib, R, rc.lang).catch(() => {});
}
