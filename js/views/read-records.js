// Okuma geçmişi, favoriler, ayraçlar/vurgular/notlar.
import { t } from '../i18n.js';
import { esc, icon, helpLink, toastAction, announce } from '../ui.js';
import { metaResolver } from '../reading/data.js';
import { removeMark, updateMark } from '../reading/state.js';
import { estimateMinutes, lengthClass } from '../reading/core.js';
import { rctx, readNav, textCard, bindFavs, fmtSec, fmtNum, pctText, locLabel, dateLabel } from './read-common.js';

export async function readHistoryView(root, ctx, params) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const metaOf = await metaResolver(rc.lib, R);
  const st = { from: params.get('from') || '', to: params.get('to') || '', cat: params.get('cat') || '', status: params.get('status') || '', len: params.get('len') || '', fav: params.get('fav') || '', tab: params.get('tab') || 'texts' };
  const opt = (v, l, cur) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`;

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.historyTitle')}</h1><p class="muted">${t('rd.historyIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
  ${readNav('#/read/history')}
  <div class="tabbar" role="tablist">
    <button class="tab${st.tab === 'texts' ? ' on' : ''}" role="tab" aria-selected="${st.tab === 'texts'}" data-tab="texts">${t('rd.hist.texts')}</button>
    <button class="tab${st.tab === 'sessions' ? ' on' : ''}" role="tab" aria-selected="${st.tab === 'sessions'}" data-tab="sessions">${t('rd.hist.sessions')}</button>
  </div>
  <div class="filters read-filters">
    <div class="field"><label for="h-from">${t('rd.f.from')}</label><input type="date" id="h-from" value="${esc(st.from)}"></div>
    <div class="field"><label for="h-to">${t('rd.f.to')}</label><input type="date" id="h-to" value="${esc(st.to)}"></div>
    <div class="field"><label for="h-cat">${t('rd.f.cat')}</label><select id="h-cat">${opt('', t('rd.f.allCats'), st.cat)}${rc.cats.categories.map((c) => opt(c.id, c.name[rc.ui], st.cat)).join('')}</select></div>
    <div class="field"><label for="h-status">${t('rd.f.status')}</label><select id="h-status">${opt('', t('rd.f.any'), st.status)}${['reading', 'done', 'new'].map((s) => opt(s, t(s === 'reading' ? 'rd.f.toContinue' : `rd.status.${s}`), st.status)).join('')}</select></div>
    <div class="field"><label for="h-len">${t('rd.f.len')}</label><select id="h-len">${opt('', t('rd.f.any'), st.len)}${['short', 'medium', 'long'].map((c) => opt(c, rc.lenName(c), st.len)).join('')}</select></div>
    <div class="field checks"><label class="check small"><input type="checkbox" id="h-fav"${st.fav ? ' checked' : ''}> ${t('rd.f.fav')}</label></div>
  </div>
  <div id="h-sum" class="stat-row"></div>
  <p id="h-count" class="small muted" aria-live="polite"></p>
  <div id="h-list" class="results-list"></div>`;

  const $ = (s) => root.querySelector(s);
  const inRange = (iso) => {
    if (!iso) return !st.from && !st.to;
    const d = iso.slice(0, 10);
    return (!st.from || d >= st.from) && (!st.to || d <= st.to);
  };
  const sync = () => {
    const q = new URLSearchParams(Object.entries(st).filter(([k, v]) => v && !(k === 'tab' && v === 'texts')));
    history.replaceState(null, '', `#/read/history${q.toString() ? `?${q}` : ''}`);
  };

  function draw() {
    if (st.tab === 'sessions') return drawSessions();
    const rows = Object.entries(R.progress).map(([id, p]) => ({ id, p, m: metaOf(id) })).filter(({ m, p }) => {
      if (!m) return false;
      if (st.cat && m.cat !== st.cat) return false;
      if (st.status && p.status !== st.status) return false;
      if (st.fav && !R.favorites.includes(m.id)) return false;
      if (st.len && lengthClass(estimateMinutes(m.words, R.wpm[m.lang || rc.lang])) !== st.len) return false;
      if ((st.from || st.to) && !inRange(p.lastAt)) return false;
      return p.status !== 'new' || p.timeSec > 0 || p.pid;
    }).sort((a, b) => String(b.p.lastAt).localeCompare(String(a.p.lastAt)));
    const totalSec = rows.reduce((n, r) => n + (r.p.timeSec || 0), 0);
    const words = rows.reduce((n, r) => n + Math.round((r.p.maxPct || 0) * r.m.words), 0);
    $('#h-sum').innerHTML = `<div class="stat"><strong>${rows.length}</strong><span>${t('rd.hist.read')}</span></div>
      <div class="stat"><strong>${rows.filter((r) => r.p.status === 'done').length}</strong><span>${t('rd.hist.done')}</span></div>
      <div class="stat"><strong>${rows.filter((r) => r.p.status === 'reading').length}</strong><span>${t('rd.hist.inprog')}</span></div>
      <div class="stat"><strong>${esc(fmtSec(totalSec))}</strong><span>${t('rd.hist.time')}</span></div>
      <div class="stat"><strong>${esc(fmtNum(words))}</strong><span>${t('rd.hist.words')}</span></div>`;
    $('#h-count').textContent = t('rd.found', { n: rows.length });
    if (!rows.length) { $('#h-list').innerHTML = `<div class="empty"><p>${t(Object.keys(R.progress).length ? 'rd.hist.noMatch' : 'rd.hist.empty')}</p><a class="btn primary" href="#/read/library">${t('rd.tab.library')}</a></div>`; return; }
    $('#h-list').innerHTML = rows.map(({ m, p }) => {
      const mk = R.marks.filter((x) => x.textId === m.id);
      const extra = `<dl class="kv small hist-kv">
        <dt>${t('rd.lastRead')}</dt><dd>${esc(dateLabel(p.lastAt))}</dd>
        <dt>${t('rd.hist.sessionTime')}</dt><dd>${esc(fmtSec(p.timeSec || 0))}</dd>
        <dt>${t('rd.wordsPos')}</dt><dd>${esc(`${fmtNum(p.wordsAt ?? Math.round((p.pct || 0) * m.words))} / ${fmtNum(m.words)}`)}</dd>
        ${p.pid ? `<dt>${t('rd.lastPos')}</dt><dd>${esc(locLabel(p))}</dd>` : ''}
        <dt>${t('rd.hist.marks')}</dt><dd>${esc(t('rd.hist.marksN', { b: mk.filter((x) => x.type === 'bookmark' || x.type === 'here').length, n: mk.filter((x) => x.note).length, h: mk.filter((x) => x.type === 'highlight').length }))}</dd>
        ${p.completions?.length ? `<dt>${t('rd.hist.completions')}</dt><dd>${p.completions.length}</dd>` : ''}
      </dl>`;
      return textCard(rc, m, { extra, headingTag: 'h2' });
    }).join('');
    bindFavs($('#h-list'), ctx, rc, () => { if (st.fav) draw(); });
  }

  function drawSessions() {
    const rows = R.sessions.filter((s) => inRange(s.startedAt) || (!st.from && !st.to)).filter((s) => {
      const m = s.textId ? metaOf(s.textId) : null;
      if (st.cat && (!m || m.cat !== st.cat)) return false;
      return true;
    }).slice().reverse();
    const total = rows.reduce((n, s) => n + s.sec, 0);
    $('#h-sum').innerHTML = `<div class="stat"><strong>${rows.length}</strong><span>${t('rd.hist.sessionsN')}</span></div><div class="stat"><strong>${esc(fmtSec(total))}</strong><span>${t('rd.hist.time')}</span></div>`;
    $('#h-count').textContent = t('rd.found', { n: rows.length });
    $('#h-list').innerHTML = rows.length ? `<p class="small muted">${t('rd.hist.sessionNote')}</p><ul class="sess-list">${rows.slice(0, 300).map((s) => {
      const m = s.textId ? metaOf(s.textId) : null;
      const l = s.listId ? R.lists.find((x) => x.id === s.listId) : null;
      return `<li><span class="small muted">${esc(dateLabel(s.startedAt))} ${esc(new Date(s.startedAt).toLocaleTimeString(rc.ui === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' }))}</span>
        <span>${s.kind === 'timed' ? `${icon('clock')}<strong>${esc(t('rd.hist.timed', { target: s.targetMin }))}</strong>${s.reached ? ` · ${esc(t('rd.hist.reached'))}` : ''}${l ? ` · ${esc(l.name || t('rd.untitledList'))}` : ''} · ${esc(t('rd.textsN', { n: s.texts?.length || 0 }))}` : `${m ? `<a href="#/read/text/${esc(m.id)}">${esc(m.title)}</a>` : esc(t('rd.removedText'))} · ${esc(pctText(s.fromPct))} → ${esc(pctText(s.toPct))}`}</span>
        <span>${esc(fmtSec(s.sec))}</span></li>`;
    }).join('')}</ul>` : `<div class="empty"><p>${t('rd.hist.noSessions')}</p></div>`;
  }

  const bindF = (sel, key, prop = 'value', val = (x) => x) => $(sel).addEventListener('change', (e) => { st[key] = val(e.target[prop]); sync(); draw(); });
  bindF('#h-from', 'from');
  bindF('#h-to', 'to');
  bindF('#h-cat', 'cat');
  bindF('#h-status', 'status');
  bindF('#h-len', 'len');
  bindF('#h-fav', 'fav', 'checked', (c) => (c ? '1' : ''));
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    st.tab = b.dataset.tab;
    root.querySelectorAll('[data-tab]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    sync(); draw();
  }));
  draw();
}

export async function readFavoritesView(root, ctx) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const metaOf = await metaResolver(rc.lib, R);
  const draw = () => {
    const list = R.favorites.map(metaOf).filter(Boolean);
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.favTitle')}</h1><p class="muted">${t('rd.favIntro')}</p></div></div>
      ${readNav('#/read/favorites')}
      <p class="small muted" aria-live="polite">${esc(t('rd.found', { n: list.length }))}</p>
      ${list.length ? `<div class="results-list">${list.map((m) => textCard(rc, m, { headingTag: 'h2' })).join('')}</div>` : `<div class="empty"><p>${t('rd.favEmpty')}</p><a class="btn primary" href="#/read/library">${t('rd.tab.library')}</a></div>`}`;
    bindFavs(root, ctx, rc, (id, on) => { if (!on) { draw(); toastAction(t('rd.favRemoved'), t('rd.undo'), () => { R.favorites.push(id); ctx.store.save(); draw(); }); } });
  };
  draw();
}

export async function readMarksView(root, ctx, params) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const metaOf = await metaResolver(rc.lib, R);
  const st = { tab: params.get('tab') || 'bookmark', q: '' };
  const TABS = ['bookmark', 'highlight', 'note'];
  const inTab = (m) => (st.tab === 'bookmark' ? (m.type === 'bookmark' || m.type === 'here') : st.tab === 'highlight' ? m.type === 'highlight' : Boolean(m.note));

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.marksTitle')}</h1><p class="muted">${t('rd.marksIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
    ${readNav('#/read/marks')}
    <div class="tabbar" role="tablist">${TABS.map((x) => `<button class="tab${st.tab === x ? ' on' : ''}" role="tab" aria-selected="${st.tab === x}" data-tab="${x}">${t(`rd.marks.${x}`)} <span class="count">${R.marks.filter((m) => (x === 'bookmark' ? (m.type === 'bookmark' || m.type === 'here') : x === 'highlight' ? m.type === 'highlight' : Boolean(m.note))).length}</span></button>`).join('')}</div>
    <div class="field"><label for="mq" class="sr-only">${t('rd.marksSearch')}</label><input id="mq" type="search" placeholder="${esc(t('rd.marksSearch'))}"></div>
    <div id="m-list"></div>`;
  const $ = (s) => root.querySelector(s);

  function draw() {
    const q = st.q.toLocaleLowerCase();
    const list = R.marks.filter(inTab).filter((m) => !q || [m.label, m.note, m.quote, metaOf(m.textId)?.title].join(' ').toLocaleLowerCase().includes(q))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    $('#m-list').innerHTML = list.length ? `<ul class="marks-list">${list.map((m) => {
      const meta = metaOf(m.textId);
      return `<li class="mark-item${m.orphan ? ' orphan' : ''}" data-id="${m.id}">
        <p class="small muted">${esc(meta ? rc.catName(meta.cat) : t('rd.removedText'))} · ${esc(dateLabel(m.updatedAt))}</p>
        <h2 class="h4">${meta ? esc(meta.title) : esc(t('rd.removedText'))}</h2>
        <p class="small"><span class="mk mk-${m.type}${m.color ? ` hl-${m.color}` : ''}">${esc(t(`rd.mk.${m.type}`))}</span> ${m.label ? `<strong>${esc(m.label)}</strong>` : ''}</p>
        ${m.quote ? `<blockquote class="small">${esc(m.quote)}</blockquote>` : ''}
        ${m.note ? `<p class="mark-note">${esc(m.note)}</p>` : ''}
        ${m.orphan ? `<p class="small warn-text">${icon('info')} ${t('rd.orphan')}</p>` : ''}
        <div class="actions">
          ${meta && !m.orphan ? `<a class="btn primary small" href="#/read/text/${esc(m.textId)}?at=${esc(m.pid)}">${t('rd.goTo')}</a>` : ''}
          <button class="btn secondary small" data-edit="${m.id}">${icon('pencil')}${t('rd.edit')}</button>
          <button class="btn danger-ghost small" data-del="${m.id}">${icon('trash')}${t('common.delete')}</button>
        </div>
        <form class="mark-edit" data-form="${m.id}" hidden>
          ${m.type === 'bookmark' ? `<div class="field"><label for="ml-${m.id}">${t('rd.bookmarkName')}</label><input id="ml-${m.id}" maxlength="80" value="${esc(m.label || '')}"></div>` : ''}
          <div class="field"><label for="mn-${m.id}">${t('rd.noteText')}</label><textarea id="mn-${m.id}" rows="3" maxlength="2000">${esc(m.note || '')}</textarea></div>
          <div class="actions"><button type="button" class="btn ghost small" data-cancel="${m.id}">${t('rd.cancel')}</button><button class="btn primary small">${t('common.save')}</button></div>
        </form>
      </li>`;
    }).join('')}</ul>` : `<div class="empty"><p>${t(`rd.marks.empty.${st.tab}`)}</p></div>`;
    $('#m-list').querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const f = $(`[data-form="${b.dataset.edit}"]`); f.hidden = false; f.querySelector('input, textarea').focus(); }));
    $('#m-list').querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', () => { $(`[data-form="${b.dataset.cancel}"]`).hidden = true; }));
    $('#m-list').querySelectorAll('[data-form]').forEach((f) => f.addEventListener('submit', (e) => {
      e.preventDefault();
      const mid = f.dataset.form;
      const patch = { note: f.querySelector('textarea').value.trim() };
      const lab = f.querySelector('input');
      if (lab) patch.label = lab.value.trim();
      updateMark(R, mid, patch);
      ctx.store.save();
      draw();
      announce(t('common.saved'));
      root.querySelector(`[data-id="${mid}"] [data-edit]`)?.focus();
    }));
    $('#m-list').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      if (!window.confirm(t('rd.deleteMarkConfirm'))) return;
      const removed = removeMark(R, b.dataset.del);
      ctx.store.save();
      draw();
      toastAction(t('rd.markDeleted'), t('rd.undo'), () => { R.marks.push(removed); ctx.store.save(); draw(); });
    }));
  }
  $('#mq').addEventListener('input', (e) => { st.q = e.target.value; draw(); });
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    st.tab = b.dataset.tab;
    root.querySelectorAll('[data-tab]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    history.replaceState(null, '', `#/read/marks?tab=${st.tab}`);
    draw();
  }));
  draw();
}
