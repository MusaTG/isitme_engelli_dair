// Okuma listeleri ve 30–120 dakikalık okuma oturumları.
import { t } from '../i18n.js';
import { esc, icon, helpLink, toast, toastAction, announce } from '../ui.js';
import { metaResolver, allMeta } from '../reading/data.js';
import { searchTexts } from '../reading/search.js';
import { createList, listAdd, listRemove, listMove, listMinutes, listNext, startTimed, statusOf, endTimed } from '../reading/state.js';
import { rctx, readNav, fmtMin, statusBadge, progressBar, dateLabel } from './read-common.js';

const TARGETS = [30, 60, 90, 120];
const BREAKS = [0, 15, 20, 30, 45];

export async function readListsView(root, ctx) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const metaOf = await metaResolver(rc.lib, R);
  const draw = () => {
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.listsTitle')}</h1><p class="muted">${t('rd.listsIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
    ${readNav('#/read/lists')}
    <form class="panel add-list" id="new-list"><h2 class="h3">${t('rd.newList')}</h2>
      <div class="grid2"><div class="field"><label for="nl-name">${t('rd.listName')}</label><input id="nl-name" maxlength="60" required placeholder="${esc(t('rd.newListPh'))}"></div>
      <div class="field"><label for="nl-target">${t('rd.targetDur')}</label><select id="nl-target">${TARGETS.map((m) => `<option value="${m}"${m === 60 ? ' selected' : ''}>${esc(t('rd.minShort', { n: m }))}</option>`).join('')}</select></div></div>
      <p class="dlg-err small warn-text" role="alert" hidden>${t('rd.listNameReq')}</p>
      <button class="btn primary">${icon('plus')}${t('rd.createList')}</button></form>
    ${R.lists.length ? `<ul class="list-cards">${R.lists.map((l) => {
      const mins = listMinutes(l.items, metaOf, R.wpm);
      const done = l.items.filter((x) => statusOf(R, x) === 'done').length;
      return `<li class="panel"><h2 class="h3"><a href="#/read/list/${l.id}">${esc(l.name || t('rd.untitledList'))}</a></h2>
        <p class="small muted">${esc(t('rd.listSummary', { n: l.items.length, time: fmtMin(mins), target: t('rd.minShort', { n: l.targetMin }) }))} · ${esc(t('rd.listDone', { done, n: l.items.length }))}${l.completedAt ? ` · ${esc(t('rd.listCompletedOn', { date: dateLabel(l.completedAt) }))}` : ''}</p>
        ${progressBar(l.items.length ? done / l.items.length : 0)}
        <div class="actions"><a class="btn secondary small" href="#/read/list/${l.id}">${t('rd.openList')}</a>${l.items.length ? `<button class="btn primary small" data-start="${l.id}">${icon('play')}${t(done ? 'rd.continueList' : 'rd.startList')}</button>` : ''}<button class="btn danger-ghost small" data-del="${l.id}">${icon('trash')}${t('common.delete')}</button></div></li>`;
    }).join('')}</ul>` : `<div class="empty"><p>${t('rd.listsEmpty')}</p></div>`}`;
    root.querySelector('#new-list').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = root.querySelector('#nl-name').value.trim();
      if (!name) { root.querySelector('.dlg-err').hidden = false; root.querySelector('#nl-name').focus(); return; }
      const l = createList(R, { name, targetMin: Number(root.querySelector('#nl-target').value) });
      ctx.store.save();
      ctx.go(`#/read/list/${l.id}`);
    });
    root.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => startList(ctx, R, R.lists.find((l) => l.id === b.dataset.start))));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      if (!window.confirm(t('rd.deleteListConfirm'))) return;
      const i = R.lists.findIndex((l) => l.id === b.dataset.del);
      const [removed] = R.lists.splice(i, 1);
      ctx.store.save();
      draw();
      toastAction(t('rd.listDeleted'), t('rd.undo'), () => { R.lists.splice(i, 0, removed); ctx.store.save(); draw(); });
    }));
  };
  draw();
}

export function startList(ctx, R, l, { targetMin, breakEvery } = {}) {
  if (!l || !l.items.length) return;
  if (R.timed && !window.confirm(t('rd.replaceTimed'))) return;
  if (R.timed) endTimed(R);
  startTimed(R, { targetMin: targetMin || l.targetMin, breakEvery: breakEvery ?? l.breakEvery ?? 0, listId: l.id });
  const next = listNext(R, l) || l.items[0];
  ctx.store.save();
  ctx.go(`#/read/text/${next}?list=${l.id}`);
}

export async function readListView(root, ctx, id) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const l = R.lists.find((x) => x.id === id);
  if (!l) { root.innerHTML = `<div class="empty"><h1 tabindex="-1">${t('rd.listMissing')}</h1><a class="btn primary" href="#/read/lists">${t('rd.tab.lists')}</a></div>`; return; }
  const metaOf = await metaResolver(rc.lib, R);
  const pool = await allMeta(rc.lib, R, rc.lang);
  let pick = '';
  const save = () => { l.updatedAt = new Date().toISOString(); ctx.store.save(); };

  function draw(focusSel) {
    const mins = listMinutes(l.items, metaOf, R.wpm);
    const ratio = l.targetMin ? Math.min(1, mins / l.targetMin) : 0;
    const custom = !TARGETS.includes(l.targetMin);
    root.innerHTML = `<a href="#/read/lists" class="btn ghost small">${icon('back')}${t('rd.tab.lists')}</a>
      <div class="page-head"><div><h1 tabindex="-1">${esc(l.name || t('rd.untitledList'))}</h1><p class="muted">${esc(t('rd.listSummary', { n: l.items.length, time: fmtMin(mins), target: t('rd.minShort', { n: l.targetMin }) }))}</p></div></div>
      <section class="panel"><h2 class="h3">${t('rd.listSettings')}</h2>
        <div class="grid2">
          <div class="field"><label for="ln">${t('rd.listName')}</label><input id="ln" maxlength="60" value="${esc(l.name)}"></div>
          <div class="field"><label for="lt">${t('rd.targetDur')}</label><select id="lt">${TARGETS.map((m) => `<option value="${m}"${m === l.targetMin ? ' selected' : ''}>${esc(t('rd.minShort', { n: m }))}</option>`).join('')}<option value="custom"${custom ? ' selected' : ''}>${t('rd.customDur')}</option></select></div>
          <div class="field"${custom ? '' : ' hidden'} id="lc-wrap"><label for="lc">${t('rd.customMin')}</label><input id="lc" type="number" min="5" max="300" step="5" inputmode="numeric" value="${l.targetMin}"></div>
          <div class="field"><label for="lb">${t('rd.breakEvery')}</label><select id="lb">${BREAKS.map((b) => `<option value="${b}"${b === (l.breakEvery || 0) ? ' selected' : ''}>${esc(b ? t('rd.breakN', { n: b }) : t('rd.breakOff'))}</option>`).join('')}</select></div>
        </div>
        <p class="small">${esc(t('rd.listVsTarget', { time: fmtMin(mins), target: t('rd.minShort', { n: l.targetMin }) }))}</p>
        ${progressBar(ratio, t('rd.listFill', { pct: Math.round(ratio * 100) }))}
        <p class="hint">${t(mins < l.targetMin ? 'rd.listShort' : 'rd.listEnough')}</p>
        <div class="actions">${l.items.length ? `<button class="btn primary" data-act="start">${icon('play')}${t('rd.startTimedList')}</button>` : ''}</div>
      </section>
      <section aria-labelledby="li-h"><h2 id="li-h" class="h3">${t('rd.listItems')}</h2>
        ${l.items.length ? `<ol class="list-items">${l.items.map((tid, i) => { const m = metaOf(tid); return `<li data-i="${i}">
          <span class="li-n">${i + 1}</span>
          <span class="li-main">${m ? `<a href="#/read/text/${esc(tid)}?list=${l.id}">${esc(m.title)}</a><span class="small muted">${esc(rc.catName(m.cat))} · ${esc(fmtMin(rc.minutes(m)))}</span>` : `<span>${esc(t('rd.removedText'))}</span>`} ${statusBadge(statusOf(R, tid))}</span>
          <span class="li-actions"><button class="icon-btn" data-up="${i}" aria-label="${esc(t('rd.moveUp', { title: m?.title || '' }))}"${i === 0 ? ' disabled' : ''}>${icon('up')}</button><button class="icon-btn" data-down="${i}" aria-label="${esc(t('rd.moveDown', { title: m?.title || '' }))}"${i === l.items.length - 1 ? ' disabled' : ''}>${icon('down')}</button><button class="icon-btn" data-rm="${i}" aria-label="${esc(t('rd.removeFromList', { title: m?.title || '' }))}">${icon('cross')}</button></span>
        </li>`; }).join('')}</ol>` : `<p class="muted">${t('rd.listNoItems')}</p>`}
      </section>
      <section class="panel" aria-labelledby="la-h"><h2 id="la-h" class="h3">${t('rd.addTexts')}</h2>
        <div class="field"><label for="lq">${t('rd.searchLabel')}</label><input id="lq" type="search" value="${esc(pick)}" placeholder="${esc(t('rd.searchPh'))}" autocomplete="off"></div>
        <ul class="pick-list" id="picks"></ul>
      </section>
      <p><button class="btn danger-ghost" data-act="delete">${icon('trash')}${t('rd.deleteList')}</button></p>`;
    const $ = (s) => root.querySelector(s);
    drawPicks();
    $('#ln').addEventListener('change', (e) => { l.name = e.target.value.trim(); save(); root.querySelector('h1').textContent = l.name || t('rd.untitledList'); toast(t('common.saved')); });
    $('#lt').addEventListener('change', (e) => { if (e.target.value === 'custom') { $('#lc-wrap').hidden = false; $('#lc').focus(); return; } l.targetMin = Number(e.target.value); save(); draw('#lt'); });
    $('#lc').addEventListener('change', (e) => { l.targetMin = Math.min(300, Math.max(5, Math.round(Number(e.target.value) || 60))); save(); draw('#lc'); });
    $('#lb').addEventListener('change', (e) => { l.breakEvery = Number(e.target.value); save(); toast(t('common.saved')); });
    $('[data-act=start]')?.addEventListener('click', () => startList(ctx, R, l));
    $('[data-act=delete]').addEventListener('click', () => { if (!window.confirm(t('rd.deleteListConfirm'))) return; R.lists = R.lists.filter((x) => x !== l); ctx.store.save(); ctx.go('#/read/lists'); });
    root.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.up); listMove(l, i, i - 1); save(); draw(i - 1 === 0 ? `[data-down="0"]` : `[data-up="${i - 1}"]`); announce(t('rd.moved', { n: i })); }));
    root.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.down); listMove(l, i, i + 1); save(); draw(i + 1 === l.items.length - 1 ? `[data-up="${i + 1}"]` : `[data-down="${i + 1}"]`); announce(t('rd.moved', { n: i + 2 })); }));
    root.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.rm);
      const tid = l.items[i];
      listRemove(l, tid);
      save();
      draw('#li-h');
      toastAction(t('rd.removedFromList'), t('rd.undo'), () => { l.items.splice(i, 0, tid); save(); draw(); });
    }));
    $('#lq').addEventListener('input', (e) => { pick = e.target.value; drawPicks(); });
    if (focusSel) root.querySelector(focusSel)?.focus();
  }

  function drawPicks() {
    const box = root.querySelector('#picks');
    if (!pick.trim()) { box.innerHTML = `<li class="small muted">${t('rd.pickHint')}</li>`; return; }
    const res = searchTexts(pool, { q: pick }, { lang: rc.lang, progress: R.progress, favorites: R.favorites, catName: rc.catName, subName: rc.subName, catAlt: rc.catAlt, levelName: rc.levelName, lenName: rc.lenName, wpm: R.wpm });
    box.innerHTML = res.items.slice(0, 12).map((x) => `<li><span><strong>${esc(x.meta.title)}</strong> <span class="small muted">${esc(rc.catName(x.meta.cat))} · ${esc(fmtMin(x.minutes))}</span></span>
      <button class="btn secondary small" data-add="${esc(x.meta.id)}"${l.items.includes(x.meta.id) ? ' disabled' : ''}>${l.items.includes(x.meta.id) ? t('rd.alreadyIn') : `${icon('plus')}${t('rd.add')}`}</button></li>`).join('') || `<li class="small muted">${t('rd.noResults')}</li>`;
    box.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { listAdd(l, b.dataset.add); save(); draw('#lq'); announce(t('rd.addedToList', { name: l.name })); }));
  }
  draw();
}

// Yeni okuma oturumu: hedef süre + liste ya da otomatik öneri.
export async function readSessionView(root, ctx) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const pool = await allMeta(rc.lib, R, rc.lang);
  const st = { target: 60, custom: 45, source: R.lists.length ? 'list' : 'auto', listId: R.lists[0]?.id || '', cats: [], len: '', unread: true, breakEvery: 20, picks: [] };
  const metaOf = (id) => pool.find((m) => m.id === id);

  function suggest() {
    const target = st.target === 'custom' ? st.custom : st.target;
    const cand = pool.filter((m) => (!st.cats.length || st.cats.includes(m.cat)) && (!st.len || rc.cls(m) === st.len) && (!st.unread || statusOf(R, m.id) !== 'done') && (rc.profile.type !== 'child' || ['child', 'all'].includes(m.aud)));
    const shuffled = cand.map((m) => [Math.random(), m]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const out = [];
    let sum = 0;
    for (const m of shuffled) {
      if (sum >= target) break;
      if (sum + rc.minutes(m) > target * 1.25 && out.length) continue;
      out.push(m.id);
      sum += rc.minutes(m);
    }
    st.picks = out;
  }

  function draw() {
    const target = st.target === 'custom' ? st.custom : st.target;
    const pickMin = st.picks.reduce((n, id) => n + rc.minutes(metaOf(id) || { words: 0 }), 0);
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.sessionTitle')}</h1><p class="muted">${t('rd.sessionIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
      ${readNav('')}
      <form id="sf" class="panel">
        <fieldset class="field"><legend>${t('rd.targetDur')}</legend><div class="seg">${[...TARGETS, 'custom'].map((m) => `<label class="seg-opt"><input type="radio" name="tg" value="${m}"${String(st.target) === String(m) ? ' checked' : ''}><span>${esc(m === 'custom' ? t('rd.customDur') : t('rd.minShort', { n: m }))}</span></label>`).join('')}</div></fieldset>
        <div class="field"${st.target === 'custom' ? '' : ' hidden'}><label for="sc">${t('rd.customMin')}</label><input id="sc" type="number" min="5" max="300" step="5" value="${st.custom}" inputmode="numeric"></div>
        <div class="field"><label for="sb">${t('rd.breakEvery')}</label><select id="sb">${BREAKS.map((b) => `<option value="${b}"${b === st.breakEvery ? ' selected' : ''}>${esc(b ? t('rd.breakN', { n: b }) : t('rd.breakOff'))}</option>`).join('')}</select><p class="hint">${t('rd.breakHint')}</p></div>
        <fieldset class="field"><legend>${t('rd.sessionSource')}</legend>
          <label class="check"><input type="radio" name="src" value="list"${st.source === 'list' ? ' checked' : ''}${R.lists.length ? '' : ' disabled'}> ${t('rd.fromList')}</label>
          ${st.source === 'list' && R.lists.length ? `<div class="field indent"><label for="sl" class="sr-only">${t('rd.pickList')}</label><select id="sl">${R.lists.map((l) => `<option value="${l.id}"${l.id === st.listId ? ' selected' : ''}>${esc(l.name || t('rd.untitledList'))} (${esc(t('rd.textsN', { n: l.items.length }))})</option>`).join('')}</select></div>` : ''}
          <label class="check"><input type="radio" name="src" value="auto"${st.source === 'auto' ? ' checked' : ''}> ${t('rd.autoPick')}</label>
        </fieldset>
        ${st.source === 'auto' ? `<fieldset class="field"><legend>${t('rd.f.cat')}</legend><div class="check-grid">${rc.cats.categories.map((c) => `<label class="check small"><input type="checkbox" name="sc-cat" value="${c.id}"${st.cats.includes(c.id) ? ' checked' : ''}> ${esc(c.name[rc.ui])}</label>`).join('')}</div><p class="hint">${t('rd.catsHint')}</p></fieldset>
          <div class="grid2"><div class="field"><label for="sln">${t('rd.f.len')}</label><select id="sln"><option value="">${t('rd.f.any')}</option>${['short', 'medium', 'long'].map((c) => `<option value="${c}"${st.len === c ? ' selected' : ''}>${esc(rc.lenName(c))}</option>`).join('')}</select></div>
          <div class="field checks"><label class="check small"><input type="checkbox" id="su"${st.unread ? ' checked' : ''}> ${t('rd.skipDone')}</label></div></div>
          <button type="button" class="btn secondary" data-act="suggest">${icon('replay')}${t('rd.suggest')}</button>
          ${st.picks.length ? `<h2 class="h4">${esc(t('rd.suggested', { n: st.picks.length, time: fmtMin(pickMin), target: t('rd.minShort', { n: target }) }))}</h2>
            <ol class="pick-list">${st.picks.map((id, i) => { const m = metaOf(id); return `<li><span><strong>${esc(m.title)}</strong> <span class="small muted">${esc(rc.catName(m.cat))} · ${esc(fmtMin(rc.minutes(m)))}</span></span><button type="button" class="icon-btn" data-rmpick="${i}" aria-label="${esc(t('rd.removeFromList', { title: m.title }))}">${icon('cross')}</button></li>`; }).join('')}</ol>` : ''}` : ''}
        <p class="dlg-err small warn-text" role="alert" hidden>${t('rd.sessionNeedTexts')}</p>
        <div class="actions"><button class="btn primary large">${icon('play')}${t('rd.startSession')}</button></div>
      </form>`;
    const $ = (s) => root.querySelector(s);
    root.querySelectorAll('input[name=tg]').forEach((r) => r.addEventListener('change', () => { st.target = r.value === 'custom' ? 'custom' : Number(r.value); draw(); root.querySelector(`input[name=tg][value="${r.value}"]`).focus(); }));
    $('#sc')?.addEventListener('change', (e) => { st.custom = Math.min(300, Math.max(5, Math.round(Number(e.target.value) || 45))); });
    $('#sb').addEventListener('change', (e) => { st.breakEvery = Number(e.target.value); });
    root.querySelectorAll('input[name=src]').forEach((r) => r.addEventListener('change', () => { st.source = r.value; draw(); root.querySelector(`input[name=src][value="${r.value}"]`).focus(); }));
    $('#sl')?.addEventListener('change', (e) => { st.listId = e.target.value; });
    root.querySelectorAll('input[name=sc-cat]').forEach((c) => c.addEventListener('change', () => { st.cats = [...root.querySelectorAll('input[name=sc-cat]:checked')].map((x) => x.value); }));
    $('#sln')?.addEventListener('change', (e) => { st.len = e.target.value; });
    $('#su')?.addEventListener('change', (e) => { st.unread = e.target.checked; });
    $('[data-act=suggest]')?.addEventListener('click', () => { suggest(); draw(); root.querySelector('[data-act=suggest]').focus(); announce(t('rd.suggested', { n: st.picks.length, time: '', target: '' })); });
    root.querySelectorAll('[data-rmpick]').forEach((b) => b.addEventListener('click', () => { st.picks.splice(Number(b.dataset.rmpick), 1); draw(); }));
    $('#sf').addEventListener('submit', (e) => {
      e.preventDefault();
      const target = st.target === 'custom' ? st.custom : st.target;
      let l;
      if (st.source === 'list') l = R.lists.find((x) => x.id === (st.listId || R.lists[0]?.id));
      else {
        if (!st.picks.length) suggest();
        if (st.picks.length) l = createList(R, { name: t('rd.autoListName', { date: dateLabel(new Date().toISOString()) }), targetMin: target, breakEvery: st.breakEvery, items: st.picks });
      }
      if (!l || !l.items.length) { $('.dlg-err').hidden = false; return; }
      startList(ctx, R, l, { targetMin: target, breakEvery: st.breakEvery });
    });
  }
  draw();
}

// Süreli oturuma dönüş: listede sıradaki metin ya da en son okunan metin.
export async function readSessionContinue(ctx) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const s = R.timed;
  if (!s) { ctx.go('#/read/session'); return; }
  s.running = true;
  s.autoPaused = false;
  const l = s.listId ? R.lists.find((x) => x.id === s.listId) : null;
  const next = (l && listNext(R, l)) || s.texts[s.texts.length - 1] || l?.items[0];
  ctx.store.save();
  if (!next) { ctx.go('#/read/library'); return; }
  location.replace(`#/read/text/${next}${l ? `?list=${l.id}` : ''}`);
}
