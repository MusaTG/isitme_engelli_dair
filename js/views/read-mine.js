// Kendi metinlerim: ekle, düzenle (sürümlü), arşivle, sil; okuma paketi içe/dışa aktar.
import { t } from '../i18n.js';
import { esc, icon, helpLink, toast, toastAction, download } from '../ui.js';
import { saveUserText, wordsOf } from '../reading/state.js';
import { userMeta } from '../reading/data.js';
import { shingles, jaccard, fnv, packFromSource } from '../reading/core.js';
import { rctx, readNav, fmtMin, fmtNum, dateLabel } from './read-common.js';
import { proposeToLibrary } from './read-ai.js';
import { loadGhConfig, ghReady } from '../reading/github.js';

const MIN_WORDS = 20;
const MAX_BODY = 200000;

export function validatePack(json, cats) {
  const problems = [];
  if (!json || json.app !== 'duyum-reading') return { problems: ['rd.pack.badFormat'], texts: [] };
  if (!['tr', 'en'].includes(json.lang)) problems.push('rd.pack.badLang');
  const texts = [];
  for (const [i, x] of (json.texts || []).entries()) {
    const errs = [];
    if (!x?.title || typeof x.title !== 'string') errs.push('title');
    if (!x?.body || typeof x.body !== 'string' || wordsOf(x.body) < MIN_WORDS) errs.push('body');
    if (!x?.license || typeof x.license !== 'string') errs.push('license');
    if (!cats.categories.some((c) => c.id === x?.cat)) errs.push('cat');
    if (x?.body?.length > MAX_BODY) errs.push('size');
    if (errs.length) problems.push(`#${i + 1}: ${errs.join(', ')}`); else texts.push(x);
  }
  if (!texts.length && !problems.length) problems.push('rd.pack.empty');
  return { problems, texts };
}

export async function readMineView(root, ctx, params) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const tab = params.get('tab') === 'archived' ? 'archived' : 'active';
  const list = R.userTexts.filter((u) => Boolean(u.archived) === (tab === 'archived')).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const gh = ghReady(loadGhConfig());
  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.mineTitle')}</h1><p class="muted">${t('rd.mineIntro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
    ${readNav('#/read/mine')}
    <div class="actions"><a class="btn primary" href="#/read/mine/new">${icon('plus')}${t('rd.newText')}</a><a class="btn secondary" href="#/read/ai">${icon('spark')}${t('rd.ai.ctaTitle')}</a>
      <label class="btn secondary file-btn">${icon('download')}${t('rd.importPack')}<input type="file" id="pack" accept="application/json,.json,.txt,.md,text/plain,text/markdown"></label>
      ${R.userTexts.length ? `<button class="btn ghost" data-act="export">${t('rd.exportPack')}</button>` : ''}</div>
    <p class="hint">${t('rd.packHint')}</p>
    <p class="hint">${t('rd.mineStoreHint')}</p>
    <div class="tabbar" role="tablist"><a class="tab${tab === 'active' ? ' on' : ''}" href="#/read/mine" role="tab" aria-selected="${tab === 'active'}">${t('rd.mine.active')} <span class="count">${R.userTexts.filter((u) => !u.archived).length}</span></a><a class="tab${tab === 'archived' ? ' on' : ''}" href="#/read/mine?tab=archived" role="tab" aria-selected="${tab === 'archived'}">${t('rd.mine.archived')} <span class="count">${R.userTexts.filter((u) => u.archived).length}</span></a></div>
    ${list.length ? `<ul class="marks-list">${list.map((u) => { const m = userMeta(u); return `<li class="mark-item">
      <p class="small muted">${u.ai ? `<span class="rbadge">${icon('spark')}${t('rd.ai.badge')}</span> ` : ''}${esc(t(`lang.${m.lang}`))} · ${esc(rc.catName(m.cat))} · ${esc(t('rd.versionN', { n: m.version }))} · ${esc(dateLabel(u.updatedAt))}</p>
      <h2 class="h4">${esc(m.title)}</h2>
      <p class="small">${esc(t('rd.words', { n: fmtNum(m.words) }))} · ${esc(fmtMin(rc.minutes(m)))}${u.license ? ` · ${esc(u.license)}` : ''}</p>
      <div class="actions">${u.archived ? '' : `<a class="btn primary small" href="#/read/text/${u.id}">${t('rd.open')}</a>`}<a class="btn secondary small" href="#/read/mine/edit/${u.id}">${icon('pencil')}${t('rd.edit')}</a>
        <button class="btn ghost small" data-propose="${u.id}" title="${esc(t('rd.gh.proposeHint'))}">${icon('download')}${t(gh ? 'rd.ai.propose' : 'rd.ai.downloadTxt')}</button>
        <button class="btn ghost small" data-arch="${u.id}">${icon('archive')}${t(u.archived ? 'rd.unarchive' : 'rd.archive')}</button>
        <button class="btn danger-ghost small" data-del="${u.id}">${icon('trash')}${t('common.delete')}</button></div></li>`; }).join('')}</ul>` : `<div class="empty"><p>${t(tab === 'archived' ? 'rd.mine.noArchived' : 'rd.mine.empty')}</p></div>`}`;

  root.querySelectorAll('[data-propose]').forEach((b) => b.addEventListener('click', async () => {
    const u = R.userTexts.find((x) => x.id === b.dataset.propose);
    b.disabled = true;
    await proposeToLibrary({ lang: u.lang || 'tr', cat: u.cat, sub: u.sub, title: u.title, tags: u.tags || [], level: u.ai?.level, body: u.versions[u.versions.length - 1].body });
    b.disabled = false;
  }));
  root.querySelectorAll('[data-arch]').forEach((b) => b.addEventListener('click', () => {
    const u = R.userTexts.find((x) => x.id === b.dataset.arch);
    u.archived = !u.archived;
    ctx.store.save();
    toast(t(u.archived ? 'rd.archived' : 'rd.unarchived'));
    ctx.rerender();
  }));
  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    if (!window.confirm(t('rd.deleteTextConfirm'))) return;
    const i = R.userTexts.findIndex((x) => x.id === b.dataset.del);
    const [removed] = R.userTexts.splice(i, 1);
    ctx.store.save();
    ctx.rerender();
    setTimeout(() => toastAction(t('rd.textDeleted'), t('rd.undo'), () => { R.userTexts.splice(i, 0, removed); ctx.store.save(); ctx.rerender(); }), 50);
  }));
  root.querySelector('[data-act=export]')?.addEventListener('click', () => {
    for (const lang of ['tr', 'en']) {
      const own = R.userTexts.filter((u) => (u.lang || 'tr') === lang);
      if (!own.length) continue;
      const pack = { app: 'duyum-reading', lang, texts: own.map((u) => ({ title: u.title, cat: u.cat, sub: u.sub || undefined, tags: u.tags || [], author: u.author || '', source: u.source || '', license: u.license || '', body: u.versions[u.versions.length - 1].body })) };
      download(`duyum-okuma-${lang}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(pack, null, 2));
    }
  });
  root.querySelector('#pack').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const packs = /^\s*[[{]/.test(raw) ? [JSON.parse(raw)] : packFromSource(raw, { lang: rc.lang, license: t('rd.importedLicense') });
      if (!packs.length) throw new Error('empty');
      const existing = new Set(R.userTexts.map((u) => fnv(`${u.title}\n${u.versions[u.versions.length - 1]?.body}`)));
      let added = 0;
      let dup = 0;
      const problems = [];
      for (const json of packs) {
      const r = validatePack(json, rc.cats);
      problems.push(...r.problems);
      for (const x of r.texts) {
        if (existing.has(fnv(`${x.title}\n${x.body}`))) { dup += 1; continue; }
        saveUserText(R, { title: x.title.trim(), lang: json.lang, cat: x.cat, sub: x.sub && rc.catById[x.cat]?.subs[x.sub] ? x.sub : Object.keys(rc.catById[x.cat].subs)[0], aud: ['all', 'child', 'adult'].includes(x.aud) ? x.aud : 'all', tags: Array.isArray(x.tags) ? x.tags.slice(0, 10) : [], author: x.author || '', source: x.source || '', license: x.license, kind: 'user', body: x.body });
        added += 1;
      }
      }
      if (!ctx.store.save()) { toast(t('rd.storageFull')); return; }
      toast(t('rd.packResult', { added, dup, bad: problems.length }));
      if (problems.length) console.warn('Okuma paketi sorunları:', problems);
      ctx.rerender();
    } catch {
      toast(t('rd.pack.badFormat'));
    }
  });
}

export async function readMineEditView(root, ctx, id) {
  const rc = await rctx(ctx);
  const { R } = rc;
  const u = id ? R.userTexts.find((x) => x.id === id) : null;
  if (id && !u) { root.innerHTML = `<div class="empty"><h1 tabindex="-1">${t('rd.notFound')}</h1><a class="btn primary" href="#/read/mine">${t('rd.tab.mine')}</a></div>`; return; }
  const last = u?.versions[u.versions.length - 1];
  const st = { lang: u?.lang || rc.lang, cat: u?.cat || 'daily', confirmDup: false };
  const subOpts = (cat, cur) => Object.entries(rc.catById[cat].subs).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v[rc.ui])}</option>`).join('');
  root.innerHTML = `<a href="#/read/mine" class="btn ghost small">${icon('back')}${t('rd.tab.mine')}</a>
    <h1 tabindex="-1">${t(u ? 'rd.editText' : 'rd.newText')}</h1>
    <div class="alert error-summary" id="err" role="alert" tabindex="-1" hidden></div>
    <form id="tf" novalidate>
      <div class="field"><label for="tt">${t('rd.textTitle')} *</label><input id="tt" maxlength="120" value="${esc(u?.title || '')}" required aria-describedby="tt-e"><p class="field-err small" id="tt-e" hidden>${t('rd.titleReq')}</p></div>
      <div class="grid2">
        <div class="field"><label for="tl">${t('rd.textLang')}</label><select id="tl"><option value="tr"${st.lang === 'tr' ? ' selected' : ''}>${t('lang.tr')}</option><option value="en"${st.lang === 'en' ? ' selected' : ''}>${t('lang.en')}</option></select></div>
        <div class="field"><label for="ta">${t('rd.audience')}</label><select id="ta">${['all', 'child', 'adult'].map((a) => `<option value="${a}"${(u?.aud || 'all') === a ? ' selected' : ''}>${t(`rd.aud.${a}`)}</option>`).join('')}</select></div>
        <div class="field"><label for="tc">${t('rd.f.cat')}</label><select id="tc">${rc.cats.categories.map((c) => `<option value="${c.id}"${c.id === st.cat ? ' selected' : ''}>${esc(c.name[rc.ui])}</option>`).join('')}</select></div>
        <div class="field"><label for="ts">${t('rd.f.sub')}</label><select id="ts">${subOpts(st.cat, u?.sub)}</select></div>
        <div class="field"><label for="tg">${t('rd.tags')}</label><input id="tg" value="${esc((u?.tags || []).join(', '))}" placeholder="${esc(t('rd.tagsPh'))}"></div>
        <div class="field"><label for="tau">${t('rd.author')}</label><input id="tau" maxlength="120" value="${esc(u?.author || '')}"></div>
        <div class="field"><label for="tso">${t('rd.source')}</label><input id="tso" maxlength="300" value="${esc(u?.source || '')}" placeholder="${esc(t('rd.sourcePh'))}"></div>
        <div class="field"><label for="tli">${t('rd.license')}</label><input id="tli" maxlength="160" value="${esc(u?.license || t('rd.licenseOwn'))}"></div>
      </div>
      <p class="hint">${t('rd.copyrightHint')}</p>
      <div class="field"><label for="tb">${t('rd.textBody')} *</label><textarea id="tb" rows="16" aria-describedby="tb-h tb-e">${esc(last?.body || '')}</textarea>
        <p class="hint" id="tb-h">${t('rd.bodyHint')}</p><p class="small muted" id="tb-count" aria-live="polite"></p><p class="field-err small" id="tb-e" hidden>${esc(t('rd.bodyShort', { n: MIN_WORDS }))}</p></div>
      <div id="dup" class="alert warn" hidden role="alert"></div>
      <div class="actions"><a class="btn ghost" href="#/read/mine">${t('rd.cancel')}</a><button class="btn primary">${t('common.save')}</button></div>
    </form>
    ${u && u.versions.length > 1 ? `<section class="panel"><h2 class="h3">${t('rd.versions')}</h2><p class="hint">${t('rd.versionsHint')}</p><ul class="mini-list">${u.versions.slice().reverse().map((v) => `<li><span>${esc(t('rd.versionN', { n: v.version }))} · ${esc(dateLabel(v.savedAt))} · ${esc(t('rd.words', { n: fmtNum(wordsOf(v.body)) }))}</span>${v === last ? `<span class="rbadge">${t('rd.currentVersion')}</span>` : `<button class="btn ghost small" data-restore="${v.version}">${t('rd.restoreVersion')}</button>`}</li>`).join('')}</ul></section>` : ''}`;

  const $ = (s) => root.querySelector(s);
  const count = () => { $('#tb-count').textContent = t('rd.words', { n: fmtNum(wordsOf($('#tb').value)) }); };
  count();
  $('#tb').addEventListener('input', () => { count(); st.confirmDup = false; $('#dup').hidden = true; });
  $('#tc').addEventListener('change', (e) => { st.cat = e.target.value; $('#ts').innerHTML = subOpts(st.cat); });
  root.querySelectorAll('[data-restore]').forEach((b) => b.addEventListener('click', () => {
    const v = u.versions.find((x) => String(x.version) === b.dataset.restore);
    if (!v || !window.confirm(t('rd.restoreConfirm', { n: v.version }))) return;
    saveUserText(R, { body: v.body }, u.id);
    ctx.store.save();
    toast(t('rd.restoredVersion'));
    ctx.rerender();
  }));

  $('#tf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('#tt').value.trim();
    const body = $('#tb').value.trim();
    const errs = [];
    $('#tt-e').hidden = Boolean(title);
    $('#tb-e').hidden = wordsOf(body) >= MIN_WORDS;
    if (!title) errs.push(['tt', t('rd.titleReq')]);
    if (wordsOf(body) < MIN_WORDS) errs.push(['tb', t('rd.bodyShort', { n: MIN_WORDS })]);
    if (body.length > MAX_BODY) errs.push(['tb', t('rd.bodyLong')]);
    $('#tt').setAttribute('aria-invalid', String(!title));
    $('#tb').setAttribute('aria-invalid', String(wordsOf(body) < MIN_WORDS));
    if (errs.length) {
      const box = $('#err');
      box.hidden = false;
      box.innerHTML = `<div><p><strong>${t('rd.fixErrors')}</strong></p><ul>${errs.map(([f, msg]) => `<li><a href="#" data-focus="${f}">${esc(msg)}</a></li>`).join('')}</ul></div>`;
      box.querySelectorAll('[data-focus]').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); $(`#${a.dataset.focus}`).focus(); }));
      box.focus();
      return;
    }
    $('#err').hidden = true;
    // Yinelenen / çok benzer metin denetimi (kendi metinleri + aynı kategorideki kütüphane metinleri)
    if (!st.confirmDup) {
      const lang = $('#tl').value;
      const mine = shingles(body, lang);
      let best = null;
      for (const o of R.userTexts) {
        if (o.id === u?.id) continue;
        const j = jaccard(mine, shingles(o.versions[o.versions.length - 1]?.body || '', lang));
        if (!best || j > best.j) best = { j, title: o.title };
      }
      try {
        const bodies = await rc.lib.bodies(lang, $('#tc').value);
        for (const b of Object.values(bodies)) {
          const plain = b.sections.map((s) => s.paras.map((p) => p.t).join(' ')).join(' ');
          const j = jaccard(mine, shingles(plain, lang));
          if (!best || j > best.j) best = { j, title: Object.keys(bodies).find((k) => bodies[k] === b) };
        }
      } catch { /* kütüphane yüklenemedi; yalnızca kendi metinleriyle karşılaştırıldı */ }
      if (best && best.j >= 0.5) {
        st.confirmDup = true;
        const box = $('#dup');
        box.hidden = false;
        box.innerHTML = `${icon('info')}<p>${esc(t('rd.dupWarn', { title: best.title, pct: Math.round(best.j * 100) }))}</p>`;
        box.focus?.();
        return;
      }
    }
    const tags = $('#tg').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10);
    const saved = saveUserText(R, { title, lang: $('#tl').value, cat: $('#tc').value, sub: $('#ts').value, aud: $('#ta').value, tags, author: $('#tau').value.trim(), source: $('#tso').value.trim(), license: $('#tli').value.trim(), kind: 'user', body }, u?.id);
    if (!ctx.store.save()) { toast(t('rd.storageFull')); return; }
    toast(t('common.saved'));
    ctx.go(`#/read/text/${saved.id}`);
  });
}
