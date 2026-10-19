// Okuma ekranı: içindekiler, aşama/ilerleme göstergesi, görünüm ayarları, ayraç/vurgu/not,
// kaldığın yerden devam, süreli oturum ve isteğe bağlı sesli dinleme (TTS) düğmesi.
// Mikrofon, ses kaydı veya konuşma tanıma YOKTUR; ilerleme kaydırma ve işaretlemeyle belirlenir.
import { t } from '../i18n.js';
import { esc, icon, toast, toastAction, announce } from '../ui.js';
import { getText, counterpartId, metaById, metaResolver } from '../reading/data.js';
import { locate, allParas, wordCount, estimateMinutes } from '../reading/core.js';
import { setPosition, setStatus, restart, addTime, toggleFavorite, addMark, updateMark, removeMark, marksFor, migrateForText, recordSession, tickTimed, timedRatio, endTimed, listNext, listAdd, createList, defaultView, IDLE_SEC } from '../reading/state.js';
import { createReadAloud } from '../reading/readaloud.js';
import { ttsErrorMessage } from './shared.js';
import { rctx, fmtMin, fmtSec, fmtNum, pctText, locLabel, dateLabel } from './read-common.js';

const COLORS = ['yellow', 'green', 'blue', 'pink'];
const WIDTHS = { s: '52ch', m: '64ch', l: '76ch', full: '100%' };

export async function readerView(root, ctx, id, params) {
  const rc = await rctx(ctx);
  const { R, profile } = rc;
  const { store } = ctx;
  const settings = store.state.settings;
  const text = await getText(rc.lib, R, id);
  if (!text) {
    root.innerHTML = `<div class="empty"><h1 tabindex="-1">${t('rd.notFound')}</h1><p>${t('rd.notFoundHint')}</p><a class="btn primary" href="#/read/library">${t('rd.tab.library')}</a></div>`;
    return null;
  }
  if (migrateForText(R, text)) store.save();
  // Okuma ekranından çıkarken otomatik duraklatılan süreli oturum, yeni metin açılınca sürer.
  if (R.timed?.autoPaused) { R.timed.running = true; R.timed.autoPaused = false; store.save(); }
  const lang = text.lang;
  const paras = allParas(text);
  const firstPid = paras[0]?.id;
  const listId = params.get('list') || (R.timed?.listId && R.lists.find((l) => l.id === R.timed.listId)?.items.includes(id) ? R.timed.listId : null);
  const list = listId ? R.lists.find((l) => l.id === listId) : null;
  const saved = R.progress[id];
  const atParam = params.get('at');
  const fromStart = params.get('from') === 'start';
  let startPid = (atParam && paras.some((p) => p.id === atParam) && atParam) || (!fromStart && saved?.pid && paras.some((p) => p.id === saved.pid) ? saved.pid : null) || firstPid;
  const resumed = !atParam && !fromStart && saved?.pid && saved.pid !== firstPid;
  const here = R.marks.find((m) => m.type === 'here' && m.textId === id && !m.orphan);
  const view = R.view;
  const series = text.series ? (await rc.lib.catalog(lang).catch(() => null))?.texts.filter((x) => x.series === text.series).sort((a, b) => a.part - b.part) : null;
  const cpId = counterpartId(id);
  const cpMeta = cpId ? await metaById(rc.lib, R, cpId) : null;
  const metaOf = list ? await metaResolver(rc.lib, R) : null;
  const wpm = R.wpm[lang] || 120;
  const total = Math.max(1, text.words);
  const stageStart = text.sections.map((s) => locate(text, s.paras[0].id).wordsBefore);
  const isDialogue = text.kind === 'dialogue' || paras.some((p) => p.sp);

  // ---------- HTML ----------
  const tocHtml = () => `<h2 class="h4">${t('rd.toc')}</h2><ol class="toc-list">${text.sections.map((s, i) => `<li><a href="#r-${s.id}" data-sid="${s.id}"><span class="toc-n">${i + 1}</span><span class="toc-t">${s.h ? esc(s.h) : `<span class="auto-part">${esc(t('rd.autoPart', { n: i + 1 }))}</span>`}</span><span class="toc-st" aria-hidden="true"></span><span class="sr-only toc-sr"></span></a></li>`).join('')}</ol>
    ${text.sections.some((s) => s.auto) ? `<p class="small muted">${t('rd.autoPartsNote')}</p>` : ''}`;

  const headHtml = `<header class="r-head">
      <p class="small muted">${esc(rc.catName(text.cat))}${text.sub ? ` · ${esc(rc.subName(text.cat, text.sub))}` : ''}${text.series ? ` · ${esc(t('rd.partOf', { n: text.part, total: series?.length || '?' }))}` : ''}</p>
      <h1 tabindex="-1" class="r-title">${esc(text.title)}</h1>
      <p class="r-metaline small"><span>${esc(rc.levelName(text.level))}</span><span>${esc(fmtMin(estimateMinutes(text.words, wpm)))} <span class="muted">(${t('rd.estimate')})</span></span><span>${esc(t('rd.words', { n: fmtNum(text.words) }))}</span><span>${esc(t('rd.stagesN', { n: text.sections.length }))}</span></p>
      <p class="small muted r-kind">${esc(rc.kindLabel(text.kind))}${text.user ? '' : ` · ${esc(rc.cats.license[rc.ui])}`}${text.user && text.license ? ` · ${esc(text.license)}` : ''}${text.author ? ` · ${esc(text.author)}` : ''}${text.source ? ` · ${esc(text.source)}` : ''}</p>
      ${['fictional-news', 'fictional-journal'].includes(text.kind) ? `<p class="alert info small">${icon('info')}<span>${esc(rc.kindLabel(text.kind))}</span></p>` : ''}
      ${resumed ? `<div class="alert info small resume-note" role="status">${icon('bookmark')}<div><p>${esc(t('rd.resumedAt', { loc: locLabel(saved) }))}</p><p><button class="btn ghost small" data-act="toStart">${t('rd.goStart')}</button></p></div></div>` : ''}
      ${saved?.lostPosition ? `<p class="alert warn small">${icon('info')}<span>${t('rd.versionLost')}</span></p>` : ''}
      ${here && here.pid !== startPid ? `<p class="small"><button class="btn ghost small" data-jump="${esc(here.pid)}">${icon('bookmark')}${esc(t('rd.hereJump', { loc: t('rd.locLabel', locate(text, here.pid) ? { stage: locate(text, here.pid).stage, para: locate(text, here.pid).paraNo } : { stage: 1, para: 1 }) }))}</button></p>` : ''}
    </header>`;

  const sectionsHtml = text.sections.map((s, i) => `<section class="r-sec" id="r-${s.id}" data-sid="${s.id}" aria-labelledby="h-${s.id}">
      ${s.h ? `<h2 class="r-h" id="h-${s.id}">${esc(s.h)}</h2>` : `<p class="r-auto" id="h-${s.id}"><span>${esc(t('rd.autoPart', { n: i + 1 }))}</span></p>`}
      ${s.paras.map((p) => `<p class="r-p${text.kind === 'poem' ? ' poem' : ''}" data-pid="${p.id}" id="r-${p.id}"></p>`).join('')}
    </section>`).join('');

  const endHtml = () => {
    const st = R.progress[id]?.status || 'new';
    const nextPart = series?.find((x) => x.part === (text.part || 0) + 1);
    const nextInList = list ? listNext(R, list, id) : null;
    return `<h2 class="h3">${t('rd.endTitle')}</h2>
      <p class="small muted">${t('rd.endHint')}</p>
      <div class="actions">
        ${st !== 'done' ? `<button class="btn primary" data-act="done">${icon('check')}${t('rd.markDone')}</button>` : `<p class="rbadge st-done">${icon('check')}${esc(t('rd.status.done'))}</p>`}
        ${nextPart ? `<a class="btn secondary" href="#/read/text/${esc(nextPart.id)}${listId ? `?list=${esc(listId)}` : ''}">${esc(t('rd.nextPart', { n: nextPart.part }))}${icon('next')}</a>` : ''}
        ${nextInList ? `<a class="btn secondary" href="#/read/text/${esc(nextInList)}?list=${esc(listId)}">${esc(t('rd.nextInList', { title: metaOf?.(nextInList)?.title || '' }))}${icon('next')}</a>` : ''}
        ${list && !nextInList ? `<p class="small">${t('rd.listFinished')}</p>` : ''}
        <a class="btn ghost" href="#/read/library">${t('rd.backLibrary')}</a>
      </div>`;
  };

  root.innerHTML = `<div class="reader" id="reader" lang="${lang}">
    <div class="r-top" role="region" aria-label="${esc(t('rd.statusRegion'))}">
      <div class="r-top-row">
        <a class="btn ghost small" href="${listId ? `#/read/list/${esc(listId)}` : '#/read'}" aria-label="${esc(t('common.back'))}">${icon('back')}<span class="hide-sm">${t('common.back')}</span></a>
        <p class="r-stage" aria-live="off"><strong id="r-stage"></strong> <span id="r-pct" class="r-pct"></span><span id="r-left" class="small muted hide-sm"></span></p>
        <div class="r-tools">
          <button class="icon-btn" data-act="prev" aria-label="${esc(t('rd.prevStage'))}" title="${esc(t('rd.prevStage'))}">${icon('back')}</button>
          <button class="icon-btn" data-act="next" aria-label="${esc(t('rd.nextStage'))}" title="${esc(t('rd.nextStage'))}">${icon('next')}</button>
          <button class="icon-btn" data-act="toc" aria-expanded="false" aria-controls="r-toc" title="${esc(t('rd.toc'))}">${icon('toc')}<span class="sr-only">${t('rd.toc')}</span></button>
          <button class="icon-btn" data-act="view" aria-expanded="false" aria-controls="r-view" title="${esc(t('rd.viewSettings'))}">${icon('font')}<span class="sr-only">${t('rd.viewSettings')}</span></button>
          <button class="icon-btn" data-act="markHere" title="${esc(t('rd.markCurrent'))}">${icon('bookmark')}<span class="sr-only">${t('rd.markCurrent')}</span></button>
          <button class="icon-btn" data-act="info" aria-expanded="false" aria-controls="r-info" title="${esc(t('rd.details'))}">${icon('more')}<span class="sr-only">${t('rd.details')}</span></button>
        </div>
      </div>
      <div class="r-bar" role="progressbar" aria-label="${esc(t('rd.textProgress'))}" aria-valuemin="0" aria-valuemax="100"><span class="r-fill" id="r-fill"></span>${stageStart.slice(1).map((w) => `<i style="left:${((w / total) * 100).toFixed(2)}%"></i>`).join('')}</div>
      <div class="r-timed" id="r-timed" hidden></div>
    </div>
    <div class="r-body">
      <nav id="r-toc" class="r-toc r-panel" aria-label="${esc(t('rd.toc'))}" tabindex="-1">${tocHtml()}<button class="btn ghost small r-close" data-close="toc">${icon('cross')}${t('rd.close')}</button></nav>
      <article class="r-text" id="r-text">${headHtml}${sectionsHtml}<footer class="r-end" id="r-end">${endHtml()}</footer></article>
      <aside id="r-info" class="r-info r-panel" aria-label="${esc(t('rd.details'))}" tabindex="-1"></aside>
    </div>
    <div id="r-view" class="r-sheet r-panel" role="dialog" aria-modal="false" aria-labelledby="rv-h" tabindex="-1" hidden></div>
    <div id="r-sel" class="r-seltools" role="toolbar" aria-label="${esc(t('rd.selTools'))}" hidden></div>
    <div class="r-backdrop" hidden></div>
    <button type="button" class="tts-fab" id="tts-fab" hidden><span class="fab-ico">${icon('speaker')}</span><span class="fab-label">${t('rd.listen')}</span></button>
    <dialog id="r-dlg" class="r-dlg"></dialog>
  </div>`;

  const $ = (s) => root.querySelector(s);
  const reader = $('#reader');
  const article = $('#r-text');
  const paraEl = (pid) => article.querySelector(`[data-pid="${pid}"]`);
  const paraById = new Map(paras.map((p) => [p.id, p]));

  // ---------- Paragraf içeriği ve işaretler ----------
  function rangesFor(p, marks) {
    const out = [];
    for (const m of marks) {
      if (m.type !== 'highlight' && m.type !== 'note') continue;
      if (!m.quote) continue;
      let at = m.off != null && p.t.substr(m.off, m.quote.length) === m.quote ? m.off : p.t.indexOf(m.quote);
      if (at < 0) continue;
      out.push({ a: at, b: at + m.quote.length, m });
    }
    out.sort((x, y) => x.a - y.a);
    const clean = [];
    for (const r of out) if (!clean.length || r.a >= clean[clean.length - 1].b) clean.push(r);
    return clean;
  }

  function renderPara(pid) {
    const el = paraEl(pid);
    const p = paraById.get(pid);
    if (!el || !p) return;
    const ms = marksFor(R, id).filter((m) => m.pid === pid && !m.orphan);
    const ranges = rangesFor(p, ms);
    let body = '';
    let pos = 0;
    for (const r of ranges) {
      body += esc(p.t.slice(pos, r.a));
      const cls = r.m.color ? `hl-${r.m.color}` : 'hl-note';
      body += `<mark class="hl ${cls}" data-mark="${r.m.id}" title="${esc(r.m.type === 'note' ? t('rd.noteMark') : t(`rd.color.${r.m.color || 'yellow'}`))}">${esc(p.t.slice(r.a, r.b))}</mark>`;
      pos = r.b;
    }
    body += esc(p.t.slice(pos));
    const whole = ms.find((m) => m.type === 'highlight' && !m.quote);
    el.className = `r-p${text.kind === 'poem' ? ' poem' : ''}${whole ? ` hlp hl-${whole.color || 'yellow'}` : ''}`;
    const bms = ms.filter((m) => m.type === 'bookmark' || m.type === 'here');
    const notes = ms.filter((m) => m.note && m.type !== 'bookmark' && m.type !== 'here');
    const sp = p.sp ? `<span class="r-sp${view.hideSpeakers ? ' sp-hidden' : ''}">${view.hideSpeakers ? '—' : `${esc(p.sp)}:`}</span> ` : '';
    el.innerHTML = `${bms.length ? `<span class="pmarks">${bms.map((m) => `<button type="button" class="pm-btn ${m.type === 'here' ? 'pm-here' : 'pm-bm'}" data-mark="${m.id}" aria-label="${esc(m.type === 'here' ? t('rd.hereMark') : `${t('rd.bookmark')}: ${m.label || t('rd.untitled')}`)}">${icon('bookmark')}</button>`).join('')}</span>` : ''}${sp}<span class="pt">${body}</span>${notes.length ? ` ${notes.map((m) => `<button type="button" class="pm-btn pm-note" data-mark="${m.id}" aria-label="${esc(t('rd.openNote'))}">${icon('pencil')}</button>`).join('')}` : ''}${whole ? `<span class="sr-only"> (${esc(t('rd.highlighted'))})</span>` : ''}`;
  }
  paras.forEach((p) => renderPara(p.id));

  // ---------- Görünüm ----------
  function applyView() {
    reader.style.setProperty('--r-size', `${view.size}px`);
    reader.style.setProperty('--r-line', view.line);
    reader.style.setProperty('--r-para', `${view.para}em`);
    reader.style.setProperty('--r-width', WIDTHS[view.width] || WIDTHS.m);
    reader.dataset.font = view.font;
    reader.dataset.align = view.align;
    reader.dataset.rtheme = view.theme;
    reader.dataset.margin = view.margin;
    document.body.classList.toggle('reading-focus', Boolean(view.focus));
    $('#tts-fab').hidden = !settings.readTTSButton;
  }
  applyView();

  // ---------- Konum takibi ----------
  let current = startPid;
  let atEnd = false;
  let dirty = false;
  let saveTimer = null;
  const topH = () => $('.r-top').getBoundingClientRect().height;
  const visible = new Set();
  const order = new Map(paras.map((p, i) => [p.id, i]));

  function scrollToPid(pid, smooth = false) {
    const el = paraEl(pid) || article;
    const y = el.getBoundingClientRect().top + window.scrollY - topH() - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth && document.documentElement.dataset.motion !== 'reduce' ? 'smooth' : 'auto' });
  }

  function computeCurrent() {
    if (!visible.size) return;
    let best = null;
    for (const pid of visible) if (best === null || order.get(pid) < order.get(best)) best = pid;
    const last = paras[paras.length - 1];
    const lastEl = paraEl(last.id);
    const end = lastEl ? lastEl.getBoundingClientRect().bottom <= window.innerHeight + 4 : false;
    if (best !== current || end !== atEnd) {
      current = best;
      atEnd = end;
      dirty = true;
      updateStatus();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(savePos, 1200);
    }
  }

  let io = null;
  function observe() {
    io?.disconnect();
    visible.clear();
    io = new IntersectionObserver((entries) => {
      for (const e of entries) { const pid = e.target.dataset.pid; if (e.isIntersecting) visible.add(pid); else visible.delete(pid); }
      computeCurrent();
    }, { rootMargin: `-${Math.round(topH())}px 0px -35% 0px`, threshold: 0 });
    article.querySelectorAll('[data-pid]').forEach((el) => io.observe(el));
  }

  function savePos() {
    if (!dirty || !current) return;
    dirty = false;
    setPosition(R, text, current, { atEnd });
    store.save();
    const st = $('#rv-saved');
    if (st) st.textContent = t('rd.savedAt', { time: new Date().toLocaleTimeString(rc.ui === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
    const ls = $('#ri-saved');
    if (ls) ls.textContent = t('rd.savedAt', { time: new Date().toLocaleTimeString(rc.ui === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
  }

  let reachedEndOnce = false;
  function updateStatus() {
    const loc = locate(text, current) || { stage: 1, wordsBefore: 0, paraNo: 1 };
    const pct = atEnd ? 1 : loc.wordsBefore / total;
    const wordsAt = atEnd ? text.words : loc.wordsBefore;
    const left = Math.max(0, text.words - wordsAt);
    $('#r-stage').textContent = t('rd.stageOf', { n: loc.stage, total: text.sections.length });
    $('#r-pct').textContent = `— ${pctText(pct)}`;
    $('#r-left').textContent = ` · ${t('rd.leftShort', { time: fmtMin(left / wpm) })}`;
    $('#r-fill').style.width = `${(pct * 100).toFixed(1)}%`;
    const bar = $('.r-bar');
    bar.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
    bar.setAttribute('aria-valuetext', `${t('rd.stageOf', { n: loc.stage, total: text.sections.length })}, ${pctText(pct)}`);
    // İçindekiler ve metin içi aktif başlık
    root.querySelectorAll('.toc-list a').forEach((a, i) => {
      const st = i + 1 < loc.stage ? 'done' : i + 1 === loc.stage ? 'current' : 'todo';
      a.dataset.state = st;
      if (st === 'current') a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      a.querySelector('.toc-st').innerHTML = st === 'done' ? icon('check') : '';
      a.querySelector('.toc-sr').textContent = ` (${t(`rd.stage.${st}`)})`;
    });
    article.querySelectorAll('.r-h, .r-auto').forEach((h) => h.classList.toggle('is-active', h.id === `h-${loc.sid}`));
    const activeToc = root.querySelector('.toc-list a[aria-current]');
    if (activeToc && $('#r-toc').scrollHeight > $('#r-toc').clientHeight) {
      const pr = $('#r-toc').getBoundingClientRect();
      const ar = activeToc.getBoundingClientRect();
      if (ar.top < pr.top || ar.bottom > pr.bottom) activeToc.scrollIntoView({ block: 'nearest' });
    }
    renderInfoStats(loc, pct, wordsAt, left);
    if (atEnd && !reachedEndOnce) { reachedEndOnce = true; if ((R.progress[id]?.status || 'new') !== 'done') announce(t('rd.reachedEnd')); }
  }

  // ---------- Bilgi paneli ----------
  function renderInfo() {
    const st = R.progress[id]?.status || 'new';
    const fav = R.favorites.includes(id);
    const ms = marksFor(R, id);
    $('#r-info').innerHTML = `<h2 class="h4">${t('rd.details')}</h2>
      <dl class="kv small" id="ri-stats"></dl>
      <p class="small muted" id="ri-saved">${R.progress[id]?.lastAt ? esc(t('rd.lastSaved', { date: dateLabel(R.progress[id].lastAt) })) : ''}</p>
      <p class="small muted">${t('rd.posNote')}</p>
      <div class="field"><label for="ri-status">${t('rd.readStatus')}</label><select id="ri-status">${['new', 'reading', 'done'].map((s) => `<option value="${s}"${s === st ? ' selected' : ''}>${esc(t(`rd.status.${s}`))}</option>`).join('')}</select></div>
      <div class="ri-actions">
        <button class="btn secondary small" data-act="fav" aria-pressed="${fav}">${icon('star', fav ? 'filled' : '')}${t(fav ? 'rd.favRemove' : 'rd.favAdd')}</button>
        <button class="btn secondary small" data-act="addList">${icon('plus')}${t('rd.addToList')}</button>
        <button class="btn ghost small" data-act="restart">${icon('replay')}${t('rd.restart')}</button>
        ${cpMeta ? `<a class="btn ghost small" href="#/read/text/${esc(cpId)}">${esc(t('rd.counterpart', { lang: t(`lang.${cpMeta.lang || cpId.slice(0, 2)}`) }))}</a>` : ''}
      </div>
      <h3 class="h4">${t('rd.marksHere')} <span class="muted">(${ms.length})</span></h3>
      ${ms.length ? `<ul class="ri-marks">${ms.slice().sort((a, b) => (order.get(a.pid) ?? 1e9) - (order.get(b.pid) ?? 1e9)).map((m) => { const loc = locate(text, m.pid); return `<li class="${m.orphan ? 'orphan' : ''}"><button type="button" class="link-btn" data-goto="${esc(m.pid)}"${m.orphan ? ' disabled' : ''}><span class="mk mk-${m.type}${m.color ? ` hl-${m.color}` : ''}">${esc(t(`rd.mk.${m.type}`))}</span> ${esc(m.label || m.quote?.slice(0, 60) || (loc ? t('rd.locLabel', { stage: loc.stage, para: loc.paraNo }) : ''))}</button>${m.note ? `<p class="small muted">${esc(m.note.slice(0, 120))}</p>` : ''}${m.orphan ? `<p class="small warn-text">${t('rd.orphan')}</p>` : ''}</li>`; }).join('')}</ul>` : `<p class="small muted">${t('rd.noMarksHere')}</p>`}
      <p class="small"><a href="#/read/marks">${t('rd.allMarks')}</a></p>
      <button class="btn ghost small r-close" data-close="info">${icon('cross')}${t('rd.close')}</button>`;
    $('#ri-status').addEventListener('change', (e) => { setStatus(R, text, e.target.value); store.save(); toast(t('common.saved')); refreshEnd(); });
    $('#r-info [data-act=fav]').addEventListener('click', () => { const on = toggleFavorite(R, id); store.save(); toast(t(on ? 'rd.favAdded' : 'rd.favRemoved')); renderInfo(); });
    $('#r-info [data-act=addList]').addEventListener('click', addToListDialog);
    $('#r-info [data-act=restart]').addEventListener('click', () => {
      if (!window.confirm(t('rd.restartConfirm'))) return;
      restart(R, text);
      store.save();
      current = firstPid;
      reachedEndOnce = false;
      scrollToPid(firstPid);
      renderInfo();
      refreshEnd();
      toast(t('rd.restarted'));
    });
    $('#r-info').querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { closePanels(); scrollToPid(b.dataset.goto, true); flash(b.dataset.goto); }));
    $('#r-info [data-close]').addEventListener('click', closePanels);
    const loc = locate(text, current) || { stage: 1, wordsBefore: 0 };
    renderInfoStats(loc, atEnd ? 1 : loc.wordsBefore / total, atEnd ? text.words : loc.wordsBefore, text.words - loc.wordsBefore);
  }

  function renderInfoStats(loc, pct, wordsAt, left) {
    const box = $('#ri-stats');
    if (!box) return;
    const sec = text.sections[loc.stage - 1];
    box.innerHTML = `<dt>${t('rd.stage')}</dt><dd>${esc(t('rd.stageOf', { n: loc.stage, total: text.sections.length }))}${sec?.h ? ` — ${esc(sec.h)}` : ''}</dd>
      <dt>${t('rd.progress')}</dt><dd>${esc(pctText(pct))}</dd>
      <dt>${t('rd.wordsPos')}</dt><dd>${esc(`${fmtNum(wordsAt)} / ${fmtNum(text.words)}`)}</dd>
      <dt>${t('rd.left')}</dt><dd>${esc(fmtMin(Math.max(0, left) / wpm))} <span class="muted">(${t('rd.estimate')})</span></dd>
      <dt>${t('rd.location')}</dt><dd>${esc(t('rd.locLabel', { stage: loc.stage, para: loc.paraNo || 1 }))}</dd>
      <dt>${t('rd.sessionTime')}</dt><dd id="ri-time">${esc(fmtSec(sessionSec))}</dd>`;
  }

  function refreshEnd() { $('#r-end').innerHTML = endHtml(); bindEnd(); }
  function bindEnd() {
    $('#r-end [data-act=done]')?.addEventListener('click', () => {
      setStatus(R, text, 'done');
      if (list && !listNext(R, list) && !list.completedAt) { list.completedAt = new Date().toISOString(); toast(t('rd.listCompleted')); } else toast(t('rd.markedDone'));
      store.save(); refreshEnd(); renderInfo();
    });
  }

  // ---------- Paneller ----------
  const panels = { toc: '#r-toc', info: '#r-info', view: '#r-view' };
  let openPanel = null;
  const docked = (name) => (name === 'toc' && matchMedia('(min-width: 1000px)').matches && !view.focus) || (name === 'info' && matchMedia('(min-width: 1280px)').matches && !view.focus);
  function closePanels() {
    if (!openPanel) return;
    const name = openPanel;
    openPanel = null;
    $(panels[name]).classList.remove('is-open');
    if (name === 'view') $('#r-view').hidden = true;
    $('.r-backdrop').hidden = true;
    root.querySelector(`[data-act=${name}]`)?.setAttribute('aria-expanded', 'false');
    root.querySelector(`[data-act=${name}]`)?.focus();
  }
  function togglePanel(name) {
    if (docked(name)) { $(panels[name]).focus(); return; }
    if (openPanel === name) { closePanels(); return; }
    closePanels();
    openPanel = name;
    if (name === 'view') { renderViewPanel(); $('#r-view').hidden = false; }
    $(panels[name]).classList.add('is-open');
    $('.r-backdrop').hidden = false;
    root.querySelector(`[data-act=${name}]`).setAttribute('aria-expanded', 'true');
    $(panels[name]).focus();
  }

  function renderViewPanel() {
    const radio = (name, val, label, cur) => `<label class="seg-opt"><input type="radio" name="${name}" value="${val}"${String(cur) === String(val) ? ' checked' : ''}><span>${esc(label)}</span></label>`;
    $('#r-view').innerHTML = `<h2 class="h4" id="rv-h">${t('rd.viewSettings')}</h2>
      <div class="field"><span class="flabel" id="fs-l">${t('rd.v.size')}</span><div class="stepper" role="group" aria-labelledby="fs-l"><button class="btn secondary small" data-size="-1" aria-label="${esc(t('rd.v.smaller'))}">A−</button><output id="fs-out">${view.size}px</output><button class="btn secondary small" data-size="1" aria-label="${esc(t('rd.v.larger'))}">A+</button></div></div>
      <div class="grid2">
        <div class="field"><label for="v-line">${t('rd.v.line')}</label><select id="v-line">${[1.4, 1.6, 1.7, 1.8, 2, 2.2].map((x) => `<option value="${x}"${x === view.line ? ' selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field"><label for="v-para">${t('rd.v.para')}</label><select id="v-para">${[0.5, 1, 1.5, 2].map((x) => `<option value="${x}"${x === view.para ? ' selected' : ''}>${t(`rd.v.para.${x}`)}</option>`).join('')}</select></div>
        <div class="field"><label for="v-font">${t('rd.v.font')}</label><select id="v-font">${['sans', 'serif', 'readable'].map((x) => `<option value="${x}"${x === view.font ? ' selected' : ''}>${t(`rd.v.font.${x}`)}</option>`).join('')}</select></div>
        <div class="field"><label for="v-theme">${t('rd.v.theme')}</label><select id="v-theme">${['app', 'light', 'sepia', 'dark', 'dim'].map((x) => `<option value="${x}"${x === view.theme ? ' selected' : ''}>${t(`rd.v.theme.${x}`)}</option>`).join('')}</select></div>
      </div>
      <fieldset class="field"><legend>${t('rd.v.align')}</legend><div class="seg">${radio('v-align', 'left', t('rd.v.align.left'), view.align)}${radio('v-align', 'center', t('rd.v.align.center'), view.align)}${radio('v-align', 'justify', t('rd.v.align.justify'), view.align)}</div>
        <p class="hint">${t('rd.v.justifyHint')}</p></fieldset>
      <fieldset class="field"><legend>${t('rd.v.width')}</legend><div class="seg">${['s', 'm', 'l', 'full'].map((w) => radio('v-width', w, t(`rd.v.width.${w}`), view.width)).join('')}</div></fieldset>
      <fieldset class="field"><legend>${t('rd.v.margin')}</legend><div class="seg">${['compact', 'normal', 'wide'].map((w) => radio('v-margin', w, t(`rd.v.margin.${w}`), view.margin)).join('')}</div></fieldset>
      <label class="switch-row"><span>${t('rd.v.focus')}</span><input type="checkbox" role="switch" id="v-focus"${view.focus ? ' checked' : ''}></label>
      ${isDialogue ? `<label class="switch-row"><span>${t('rd.v.hideSpeakers')}</span><input type="checkbox" role="switch" id="v-sp"${view.hideSpeakers ? ' checked' : ''}></label>` : ''}
      <label class="switch-row"><span>${t('rd.v.ttsButton')}</span><input type="checkbox" role="switch" id="v-tts"${settings.readTTSButton ? ' checked' : ''}></label>
      <p class="hint">${t('rd.v.ttsButtonHint')}</p>
      <p class="small muted" id="rv-saved">${t('rd.v.savedNote')}</p>
      <div class="actions"><button class="btn ghost small" data-act="vreset">${t('rd.v.reset')}</button><button class="btn primary small" data-close="view">${t('rd.close')}</button></div>`;
    const keep = (fn) => { const anchor = current; fn(); applyView(); store.save(); requestAnimationFrame(() => { scrollToPid(anchor); observe(); }); };
    $('#r-view').querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => keep(() => { view.size = Math.min(32, Math.max(14, view.size + Number(b.dataset.size))); $('#fs-out').textContent = `${view.size}px`; })));
    const sel = (sid, key, conv = (x) => x) => $(sid).addEventListener('change', (e) => keep(() => { view[key] = conv(e.target.value); }));
    sel('#v-line', 'line', Number);
    sel('#v-para', 'para', Number);
    sel('#v-font', 'font');
    sel('#v-theme', 'theme');
    $('#r-view').querySelectorAll('input[type=radio]').forEach((r) => r.addEventListener('change', () => keep(() => { view[r.name.slice(2)] = r.value; })));
    $('#v-focus').addEventListener('change', (e) => keep(() => { view.focus = e.target.checked; }));
    $('#v-sp')?.addEventListener('change', (e) => keep(() => { view.hideSpeakers = e.target.checked; paras.forEach((p) => p.sp && renderPara(p.id)); }));
    $('#v-tts').addEventListener('change', (e) => { settings.readTTSButton = e.target.checked; if (!e.target.checked) aloud.stop(); applyView(); store.save(); });
    $('[data-act=vreset]').addEventListener('click', () => keep(() => { Object.assign(view, defaultView()); renderViewPanel(); paras.forEach((p) => p.sp && renderPara(p.id)); }));
    $('#r-view [data-close]').addEventListener('click', closePanels);
  }

  // ---------- Seçim araç çubuğu: vurgu, not, ayraç, burada kaldım, buradan dinle ----------
  let selTarget = null; // { pid, quote, off }
  function selectionTarget() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const pEl = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement)?.closest?.('[data-pid]');
    if (!pEl || !article.contains(pEl)) return null;
    const pt = pEl.querySelector('.pt');
    const p = paraById.get(pEl.dataset.pid);
    let quote = sel.toString().replace(/\s+/g, ' ').trim();
    let off = null;
    if (pt && pt.contains(range.startContainer)) {
      const pre = document.createRange();
      pre.setStart(pt, 0);
      pre.setEnd(range.startContainer, range.startOffset);
      off = pre.toString().length;
    }
    if (p && !p.t.includes(quote)) {
      // Seçim paragrafı aşıyorsa ilk paragraftaki kısmı al.
      const tail = off != null ? p.t.slice(off) : '';
      quote = tail.slice(0, Math.min(tail.length, quote.length)).trim();
    }
    if (!quote) return null;
    if (off != null && p.t.substr(off, quote.length) !== quote) off = p.t.indexOf(quote);
    return { pid: pEl.dataset.pid, quote: quote.slice(0, 400), off };
  }

  function showTools(target, anchorEl) {
    selTarget = target;
    article.querySelectorAll('.r-p.is-sel').forEach((el) => el.classList.remove('is-sel'));
    if (!target.quote) paraEl(target.pid)?.classList.add('is-sel');
    const box = $('#r-sel');
    const loc = locate(text, target.pid);
    box.innerHTML = `<p class="small sel-what">${esc(target.quote ? `“${target.quote.slice(0, 50)}${target.quote.length > 50 ? '…' : ''}”` : t('rd.locLabel', { stage: loc.stage, para: loc.paraNo }))}</p>
      <div class="sel-row">
        <span class="sel-group" role="group" aria-label="${esc(t('rd.highlight'))}">${icon('marker')}${COLORS.map((c) => `<button type="button" class="swatch-btn hl-${c}" data-hl="${c}" aria-label="${esc(`${t('rd.highlight')}: ${t(`rd.color.${c}`)}`)}" title="${esc(t(`rd.color.${c}`))}"></button>`).join('')}</span>
        <button type="button" class="btn secondary small" data-sel="note">${icon('pencil')}${t('rd.addNote')}</button>
        <button type="button" class="btn secondary small" data-sel="bookmark">${icon('bookmark')}${t('rd.addBookmark')}</button>
        <button type="button" class="btn secondary small" data-sel="here">${icon('check')}${t('rd.markHere')}</button>
        <button type="button" class="btn ghost small" data-sel="listen">${icon('speaker')}${t('rd.listenFromHere')}</button>
        <button type="button" class="btn ghost small" data-sel="close" aria-label="${esc(t('rd.close'))}">${icon('cross')}</button>
      </div>`;
    box.hidden = false;
    box.querySelectorAll('[data-hl]').forEach((b) => b.addEventListener('click', () => {
      const m = addMark(R, text, { type: 'highlight', pid: target.pid, quote: target.quote, off: target.off, color: b.dataset.hl });
      store.save(); renderPara(target.pid); hideTools(); renderInfo();
      toastAction(t('rd.highlightAdded'), t('rd.undo'), () => { removeMark(R, m.id); store.save(); renderPara(target.pid); renderInfo(); });
    }));
    box.querySelector('[data-sel=note]').addEventListener('click', () => { hideTools(); noteDialog(null, target); });
    box.querySelector('[data-sel=bookmark]').addEventListener('click', () => { hideTools(); bookmarkDialog(null, target); });
    box.querySelector('[data-sel=here]').addEventListener('click', () => { hideTools(); markHere(target.pid); });
    box.querySelector('[data-sel=listen]')?.addEventListener('click', () => { hideTools(); aloud.start(target.pid); });
    box.querySelector('[data-sel=close]').addEventListener('click', hideTools);
    if (anchorEl !== false) box.querySelector('button')?.focus({ preventScroll: true });
  }
  function hideTools() {
    $('#r-sel').hidden = true;
    selTarget = null;
    article.querySelectorAll('.r-p.is-sel').forEach((el) => el.classList.remove('is-sel'));
  }

  function markHere(pid) {
    addMark(R, text, { type: 'here', pid });
    current = pid;
    atEnd = false;
    setPosition(R, text, pid, { manual: true });
    store.save();
    renderAllMarks();
    renderInfo();
    updateStatus();
    toast(t('rd.hereSaved', { loc: locLabel(R.progress[id]) }));
  }

  function renderAllMarks() { paras.forEach((p) => renderPara(p.id)); }

  function flash(pid) {
    const el = paraEl(pid);
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1600);
  }

  // ---------- Diyaloglar ----------
  const dlg = $('#r-dlg');
  function openDialog(html, bind) {
    dlg.innerHTML = html;
    bind(dlg);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('textarea, input, select, button')?.focus();
  }
  const closeDialog = () => { if (dlg.open) dlg.close?.(); dlg.removeAttribute('open'); };

  function noteDialog(markId, target) {
    const m = markId ? R.marks.find((x) => x.id === markId) : null;
    const quote = m?.quote || target?.quote || '';
    openDialog(`<form method="dialog" class="dlg-form"><h2 class="h3">${t(m ? 'rd.editNote' : 'rd.addNote')}</h2>
      ${quote ? `<blockquote class="small">${esc(quote)}</blockquote>` : `<p class="small muted">${esc(t('rd.noteForPara', { loc: (() => { const l = locate(text, m?.pid || target.pid); return t('rd.locLabel', { stage: l.stage, para: l.paraNo }); })() }))}</p>`}
      <div class="field"><label for="dn-text">${t('rd.noteText')}</label><textarea id="dn-text" rows="5" maxlength="2000">${esc(m?.note || '')}</textarea></div>
      <div class="field"><label for="dn-color">${t('rd.noteColor')}</label><select id="dn-color"><option value="">${t('rd.noColor')}</option>${COLORS.map((c) => `<option value="${c}"${m?.color === c ? ' selected' : ''}>${esc(t(`rd.color.${c}`))}</option>`).join('')}</select></div>
      <p class="dlg-err small warn-text" role="alert" hidden>${t('rd.noteEmpty')}</p>
      <div class="actions">${m ? `<button type="button" class="btn danger-ghost" data-d="del">${icon('trash')}${t('common.delete')}</button>` : ''}<button type="button" class="btn ghost" data-d="cancel">${t('rd.cancel')}</button><button type="submit" class="btn primary" data-d="save">${t('common.save')}</button></div></form>`, (d) => {
      d.querySelector('[data-d=cancel]').addEventListener('click', closeDialog);
      d.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const note = d.querySelector('#dn-text').value.trim();
        if (!note) { d.querySelector('.dlg-err').hidden = false; d.querySelector('#dn-text').focus(); return; }
        const color = d.querySelector('#dn-color').value || null;
        let pid;
        if (m) { updateMark(R, m.id, { note, color }); pid = m.pid; } else { addMark(R, text, { type: 'note', pid: target.pid, quote: target.quote, off: target.off, note, color }); pid = target.pid; }
        store.save(); closeDialog(); renderPara(pid); renderInfo(); toast(t('rd.noteSaved'));
      });
      d.querySelector('[data-d=del]')?.addEventListener('click', () => deleteMark(m));
    });
  }

  function bookmarkDialog(markId, target) {
    const m = markId ? R.marks.find((x) => x.id === markId) : null;
    const pid = m?.pid || target.pid;
    const loc = locate(text, pid);
    const isHere = m?.type === 'here';
    openDialog(`<form method="dialog" class="dlg-form"><h2 class="h3">${t(isHere ? 'rd.hereMark' : m ? 'rd.editBookmark' : 'rd.addBookmark')}</h2>
      <p class="small muted">${esc(t('rd.locLabel', { stage: loc.stage, para: loc.paraNo }))}${(m?.quote || target?.quote) ? ` — “${esc((m?.quote || target.quote).slice(0, 80))}”` : ''}</p>
      ${isHere ? '' : `<div class="field"><label for="db-label">${t('rd.bookmarkName')}</label><input id="db-label" maxlength="80" value="${esc(m?.label || '')}" placeholder="${esc(t('rd.bookmarkPh'))}"></div>`}
      <div class="field"><label for="db-note">${t('rd.bookmarkNote')} <span class="muted">(${t('common.optional')})</span></label><textarea id="db-note" rows="3" maxlength="1000">${esc(m?.note || '')}</textarea></div>
      <div class="actions">${m ? `<button type="button" class="btn danger-ghost" data-d="del">${icon('trash')}${t('common.delete')}</button>` : ''}<button type="button" class="btn ghost" data-d="cancel">${t('rd.cancel')}</button><button type="submit" class="btn primary">${t('common.save')}</button></div></form>`, (d) => {
      d.querySelector('[data-d=cancel]').addEventListener('click', closeDialog);
      d.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const label = d.querySelector('#db-label')?.value.trim() || '';
        const note = d.querySelector('#db-note').value.trim();
        if (m) updateMark(R, m.id, { label, note }); else addMark(R, text, { type: 'bookmark', pid, quote: target?.quote || '', off: target?.off ?? null, label, note });
        store.save(); closeDialog(); renderPara(pid); renderInfo(); toast(t('rd.bookmarkSaved'));
      });
      d.querySelector('[data-d=del]')?.addEventListener('click', () => deleteMark(m));
    });
  }

  function deleteMark(m) {
    if (!window.confirm(t('rd.deleteMarkConfirm'))) return;
    const removed = removeMark(R, m.id);
    store.save(); closeDialog(); renderPara(m.pid); renderInfo();
    toastAction(t('rd.markDeleted'), t('rd.undo'), () => { R.marks.push(removed); store.save(); renderPara(removed.pid); renderInfo(); });
  }

  function addToListDialog() {
    openDialog(`<form method="dialog" class="dlg-form"><h2 class="h3">${t('rd.addToList')}</h2>
      ${R.lists.length ? `<fieldset class="field"><legend>${t('rd.pickList')}</legend>${R.lists.map((l) => `<label class="check"><input type="radio" name="dl" value="${l.id}"${l.items.includes(id) ? ' disabled' : ''}> ${esc(l.name || t('rd.untitledList'))} <span class="small muted">(${t('rd.textsN', { n: l.items.length })}${l.items.includes(id) ? `, ${t('rd.alreadyIn')}` : ''})</span></label>`).join('')}</fieldset>` : ''}
      <div class="field"><label for="dl-new">${t('rd.newListName')}</label><input id="dl-new" maxlength="60" placeholder="${esc(t('rd.newListPh'))}"></div>
      <div class="actions"><button type="button" class="btn ghost" data-d="cancel">${t('rd.cancel')}</button><button type="submit" class="btn primary">${t('rd.add')}</button></div></form>`, (d) => {
      d.querySelector('[data-d=cancel]').addEventListener('click', closeDialog);
      d.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = d.querySelector('#dl-new').value.trim();
        const picked = d.querySelector('input[name=dl]:checked')?.value;
        let l;
        if (name) l = createList(R, { name, items: [id] });
        else if (picked) { l = R.lists.find((x) => x.id === picked); listAdd(l, id); }
        if (!l) { d.querySelector('#dl-new').focus(); return; }
        store.save(); closeDialog(); toast(t('rd.addedToList', { name: l.name || t('rd.untitledList') }));
      });
    });
  }

  // ---------- Sesli dinleme (TTS) ----------
  const fab = $('#tts-fab');
  const voice = profile.voice[lang] || {};
  const aloud = createReadAloud({
    tts: ctx.tts,
    getQueue: (from) => { const i = Math.max(0, paras.findIndex((p) => p.id === from)); return paras.slice(i).map((p) => ({ pid: p.id, text: p.t.replace(/\n/g, ' '), speaker: view.hideSpeakers ? null : p.sp })); },
    speakOpts: () => ({ lang, voiceURI: voice.voiceURI, rate: voice.rate || 1, accent: profile.voice.en?.accent }),
    onPara: (pid) => {
      article.querySelectorAll('.tts-now').forEach((el) => el.classList.remove('tts-now'));
      const el = paraEl(pid);
      el?.classList.add('tts-now');
      if (el && Date.now() - lastManualScroll > 4000) { const r = el.getBoundingClientRect(); if (r.top < topH() || r.bottom > window.innerHeight - 120) scrollToPid(pid, true); }
    },
    onState: (on) => {
      fab.classList.toggle('is-playing', on);
      fab.querySelector('.fab-ico').innerHTML = icon(on ? 'stop' : 'speaker');
      fab.querySelector('.fab-label').textContent = t(on ? 'rd.stopListen' : 'rd.listen');
      fab.setAttribute('aria-label', t(on ? 'rd.stopListenLong' : 'rd.listenLong'));
      if (!on) article.querySelectorAll('.tts-now').forEach((el) => el.classList.remove('tts-now'));
      announce(t(on ? 'rd.listenStarted' : 'rd.listenStopped'));
    },
    onError: (err) => toast(ttsErrorMessage(err, lang)),
  });
  fab.setAttribute('aria-label', t('rd.listenLong'));
  fab.addEventListener('click', () => { if (aloud.playing) aloud.stop(); else aloud.start(current || firstPid); });

  // Telefonda kaydırırken düğmeyi gizle; yukarı kaydırınca veya durunca geri getir.
  let lastY = window.scrollY;
  let lastManualScroll = 0;
  let fabTimer = null;
  const narrow = matchMedia('(max-width: 899px)');
  function onScroll() {
    const y = window.scrollY;
    lastManualScroll = Date.now();
    lastInteraction = Date.now();
    if (settings.readTTSAutoHide && narrow.matches && !aloud.playing) {
      if (y > lastY + 6) fab.classList.add('is-away');
      else if (y < lastY - 6) fab.classList.remove('is-away');
      clearTimeout(fabTimer);
      fabTimer = setTimeout(() => fab.classList.remove('is-away'), 1100);
    }
    lastY = y;
    if (!$('#r-sel').hidden && !selTarget?.quote && narrow.matches) { /* paragraf seçimi açık kalabilir */ }
  }

  // ---------- Süre ve süreli oturum ----------
  let sessionSec = 0;
  let pendingSec = 0;
  let lastInteraction = Date.now();
  const startedAt = new Date().toISOString();
  const fromPct = R.progress[id]?.pct || 0;
  function renderTimed() {
    const box = $('#r-timed');
    const s = R.timed;
    if (!s) { box.hidden = true; return; }
    box.hidden = false;
    const loc = locate(text, current) || { wordsBefore: 0 };
    const tpct = atEnd ? 1 : loc.wordsBefore / total;
    const idx = list ? list.items.indexOf(id) + 1 : 0;
    box.innerHTML = `<span>${icon('clock')}<strong>${esc(t('rd.timedShort', { done: fmtSec(s.elapsedSec), target: t('rd.minShort', { n: s.targetMin }), pct: pctText(timedRatio(s)) }))}</strong> · ${esc(t('rd.textPct', { pct: pctText(tpct) }))}${idx ? ` · ${esc(t('rd.listPos', { n: idx, total: list.items.length }))}` : ''}${s.running ? '' : ` · <em>${esc(t('rd.paused'))}</em>`}</span>
      <span class="r-timed-actions"><button class="btn ghost small" data-t="toggle">${t(s.running ? 'rd.pause' : 'rd.resume')}</button><button class="btn ghost small" data-t="end">${t('rd.timedEnd')}</button></span>`;
    box.querySelector('[data-t=toggle]').addEventListener('click', () => { s.running = !s.running; store.save(); renderTimed(); announce(t(s.running ? 'rd.resumed' : 'rd.pausedMsg')); });
    box.querySelector('[data-t=end]').addEventListener('click', () => { if (!window.confirm(t('rd.timedEndConfirm'))) return; endTimed(R); store.save(); renderTimed(); toast(t('rd.timedEnded')); });
  }

  const tick = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    const idle = Date.now() - lastInteraction > IDLE_SEC * 1000 && !aloud.playing;
    const timeEl = $('#ri-time');
    if (idle) { if (timeEl) timeEl.textContent = `${fmtSec(sessionSec)} (${t('rd.idle')})`; return; }
    sessionSec += 1;
    pendingSec += 1;
    if (timeEl && sessionSec % 5 === 0) timeEl.textContent = fmtSec(sessionSec);
    if (R.timed?.running) {
      const ev = tickTimed(R, 1, id);
      if (sessionSec % 5 === 0) renderTimed();
      if (ev?.reached) { renderTimed(); store.save(); breakAlert('reached'); }
      else if (ev?.break) { store.save(); breakAlert('break'); }
    }
    if (pendingSec >= 15) flushTime();
  }, 1000);

  function flushTime() {
    if (!pendingSec) return;
    addTime(R, text, pendingSec);
    pendingSec = 0;
    savePos();
    store.save();
  }

  function breakAlert(kind) {
    openDialog(`<div class="dlg-form" role="alertdialog" aria-labelledby="ba-h"><h2 class="h3" id="ba-h">${t(kind === 'reached' ? 'rd.targetReached' : 'rd.breakTime')}</h2>
      <p>${t(kind === 'reached' ? 'rd.targetReachedBody' : 'rd.breakBody')}</p>
      <div class="actions"><button class="btn secondary" data-b="pause">${t(kind === 'reached' ? 'rd.timedEnd' : 'rd.takeBreak')}</button><button class="btn primary" data-b="go">${t('rd.keepReading')}</button></div></div>`, (d) => {
      d.querySelector('[data-b=go]').addEventListener('click', closeDialog);
      d.querySelector('[data-b=pause]').addEventListener('click', () => {
        if (kind === 'reached') { endTimed(R); toast(t('rd.timedEnded')); } else if (R.timed) { R.timed.running = false; toast(t('rd.pausedMsg')); }
        store.save(); renderTimed(); closeDialog();
      });
    });
  }

  // ---------- Olaylar ----------
  const onKey = (e) => {
    lastInteraction = Date.now();
    if (e.key === 'Escape') { if (!$('#r-sel').hidden) hideTools(); else closePanels(); }
  };
  const onVis = () => { if (document.visibilityState === 'hidden') { flushTime(); dirty = true; savePos(); } };
  const onHide = () => { flushTime(); dirty = true; savePos(); };
  let selTimer;
  const onSel = () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => { const tg = selectionTarget(); if (tg) showTools(tg, false); }, 350);
  };
  const onPointer = () => { lastInteraction = Date.now(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('keydown', onKey);
  addEventListener('pointerdown', onPointer, { passive: true });
  addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onVis);
  document.addEventListener('selectionchange', onSel);

  article.addEventListener('click', (e) => {
    const mb = e.target.closest('[data-mark]');
    if (mb) {
      const m = R.marks.find((x) => x.id === mb.dataset.mark);
      if (!m) return;
      if (m.type === 'bookmark' || m.type === 'here') bookmarkDialog(m.id);
      else noteDialog(m.id);
      return;
    }
    const jump = e.target.closest('[data-jump]');
    if (jump) { scrollToPid(jump.dataset.jump, true); flash(jump.dataset.jump); return; }
    if (e.target.closest('[data-act=toStart]')) { scrollToPid(firstPid, true); return; }
    const pEl = e.target.closest('[data-pid]');
    if (pEl && window.getSelection()?.isCollapsed) showTools({ pid: pEl.dataset.pid, quote: '', off: null }, false);
  });
  $('.r-tools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const loc = locate(text, current) || { stage: 1 };
    if (act === 'prev' || act === 'next') {
      const target = Math.min(text.sections.length, Math.max(1, loc.stage + (act === 'next' ? 1 : -1)));
      const sid = text.sections[target - 1].id;
      const h = $(`#h-${sid}`);
      window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - topH() - 8, behavior: 'auto' });
      announce(t('rd.stageOf', { n: target, total: text.sections.length }));
    } else if (act === 'toc' || act === 'info' || act === 'view') togglePanel(act);
    else if (act === 'markHere') showTools({ pid: current || firstPid, quote: '', off: null });
  });
  $('#r-toc').addEventListener('click', (e) => {
    const a = e.target.closest('[data-sid]');
    if (!a) return;
    e.preventDefault();
    closePanels();
    const h = $(`#h-${a.dataset.sid}`);
    window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - topH() - 8 });
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  });
  $('#r-toc [data-close]').addEventListener('click', closePanels);
  $('.r-backdrop').addEventListener('click', closePanels);
  dlg.addEventListener('close', () => dlg.removeAttribute('open'));

  // ---------- Başlat ----------
  renderInfo();
  bindEnd();
  renderTimed();
  updateStatus();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (startPid !== firstPid) scrollToPid(startPid); else window.scrollTo(0, 0);
    observe();
    $('.r-title').focus({ preventScroll: true });
  }));

  return () => {
    clearInterval(tick);
    clearTimeout(saveTimer);
    clearTimeout(fabTimer);
    aloud.stop();
    flushTime();
    dirty = true;
    savePos();
    const toPct = R.progress[id]?.pct || 0;
    recordSession(R, { kind: 'text', textId: id, listId, startedAt, endedAt: new Date().toISOString(), sec: sessionSec, fromPct, toPct, words: Math.max(0, Math.round((toPct - fromPct) * text.words)) });
    if (R.timed?.running) { R.timed.running = false; R.timed.autoPaused = true; } // okuma ekranından çıkınca süreli oturum duraklar
    store.save();
    io?.disconnect();
    removeEventListener('scroll', onScroll);
    removeEventListener('keydown', onKey);
    removeEventListener('pointerdown', onPointer);
    removeEventListener('pagehide', onHide);
    document.removeEventListener('visibilitychange', onVis);
    document.removeEventListener('selectionchange', onSel);
    document.body.classList.remove('reading-focus');
    closeDialog();
  };
}

export function wordsIn(str) { return wordCount(str); }
