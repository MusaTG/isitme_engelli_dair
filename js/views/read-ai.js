// Yapay zekâ ile okuma metni oluştur: konu/başlık/anahtar kelime → seçilen servisten metin → önizle, düzenle,
// kendi metinlerime kaydet (ve istenirse ortak kütüphaneye öner). Bağlantı ayarları da burada ve Ayarlar'da.
import { t } from '../i18n.js';
import { esc, icon, helpLink, toast, download } from '../ui.js';
import { saveUserText, wordsOf } from '../reading/state.js';
import { makeText, estimateMinutes, lengthClass } from '../reading/core.js';
import { textProblems, catDefaults } from '../reading/rules.js';
import { PROVIDERS, loadAIConfig, saveAIConfig, clearAIConfig, effective, isConfigured, listModels, generateText, continuePrompt, complete, targetWords, toSourceBlock, AIError } from '../reading/ai.js';
import { loadGhConfig, saveGhConfig, clearGhConfig, ghReady, guessRepo, sendToLibrary } from '../reading/github.js';
import { rctx, readNav, fmtMin, fmtNum } from './read-common.js';

let draft = null; // bu oturumdaki son üretim (sayfa yeniden çizilince kaybolmasın)

export function aiErrorText(e) {
  const code = e instanceof AIError ? e.code : 'network';
  return `${t(`rd.ai.err.${code}`)}${e?.detail ? ` (${e.detail})` : ''}`;
}

// ---------- Bağlantı ayarları (Ayarlar ekranında da kullanılır) ----------
export function aiSettingsHtml(cfg = loadAIConfig()) {
  const e = effective(cfg);
  return `<div class="ai-settings" data-ai-settings>
    <p class="hint">${t('rd.ai.privacy')}</p>
    <div class="grid2">
      <div class="field"><label for="ai-prov">${t('rd.ai.provider')}</label><select id="ai-prov">${Object.entries(PROVIDERS).map(([k, p]) => `<option value="${k}"${k === e.id ? ' selected' : ''}>${esc(p.name)}${p.free ? ` — ${esc(t('rd.ai.freeTier'))}` : ''}</option>`).join('')}</select></div>
      <div class="field" data-row="key"><label for="ai-key">${t('rd.ai.key')}</label><div class="pw-row"><input id="ai-key" type="password" autocomplete="off" spellcheck="false" value="${esc(cfg.key || '')}" placeholder="${esc(t('rd.ai.keyPh'))}"><button type="button" class="btn ghost small" data-ai="show" aria-pressed="false">${t('rd.ai.show')}</button></div>
        <p class="hint" id="ai-keyhelp"></p></div>
      <div class="field"><label for="ai-model">${t('rd.ai.model')}</label><input id="ai-model" list="ai-models" value="${esc(cfg.model || '')}" placeholder="${esc(e.model || '')}" spellcheck="false"><datalist id="ai-models"></datalist></div>
      <div class="field" data-row="base"><label for="ai-base">${t('rd.ai.base')}</label><input id="ai-base" type="url" value="${esc(cfg.base || '')}" placeholder="${esc(PROVIDERS[e.id].base || 'https://…/v1')}" spellcheck="false"></div>
    </div>
    <div class="actions tight"><button type="button" class="btn secondary" data-ai="test">${icon('check')}${t('rd.ai.test')}</button><button type="button" class="btn ghost" data-ai="forget">${icon('trash')}${t('rd.ai.forget')}</button></div>
    <p class="small" id="ai-status" role="status" aria-live="polite"></p>
  </div>`;
}

export function bindAiSettings(root, onChange = () => {}) {
  const $ = (s) => root.querySelector(s);
  const read = () => ({ ...loadAIConfig(), provider: $('#ai-prov').value, key: $('#ai-key').value.trim(), model: $('#ai-model').value.trim(), base: $('#ai-base').value.trim() });
  const sync = () => {
    const p = PROVIDERS[$('#ai-prov').value];
    root.querySelector('[data-row=key]').hidden = !p.needsKey && $('#ai-prov').value !== 'custom';
    root.querySelector('[data-row=base]').hidden = !p.openai;
    $('#ai-model').placeholder = p.model || t('rd.ai.modelPh');
    $('#ai-base').placeholder = p.base || 'https://…/v1';
    $('#ai-keyhelp').innerHTML = p.keyUrl ? `${esc(t('rd.ai.keyWhere'))} <a href="${p.keyUrl}" target="_blank" rel="noopener">${esc(new URL(p.keyUrl).hostname)}</a>${p.free ? ` · ${esc(t('rd.ai.freeNote'))}` : ''}` : esc(t(p.id === 'ollama' || $('#ai-prov').value === 'ollama' ? 'rd.ai.ollamaNote' : 'rd.ai.customNote'));
  };
  const save = () => { saveAIConfig(read()); onChange(read()); };
  sync();
  $('#ai-prov').addEventListener('change', () => { $('#ai-model').value = ''; sync(); save(); });
  for (const id of ['#ai-key', '#ai-model', '#ai-base']) $(id).addEventListener('change', save);
  root.querySelector('[data-ai=show]').addEventListener('click', (ev) => {
    const on = $('#ai-key').type === 'password';
    $('#ai-key').type = on ? 'text' : 'password';
    ev.currentTarget.setAttribute('aria-pressed', String(on));
    ev.currentTarget.textContent = t(on ? 'rd.ai.hide' : 'rd.ai.show');
  });
  root.querySelector('[data-ai=test]').addEventListener('click', async (ev) => {
    save();
    const btn = ev.currentTarget;
    btn.disabled = true;
    $('#ai-status').textContent = t('rd.ai.testing');
    try {
      const models = await listModels(read());
      $('#ai-models').innerHTML = models.slice(0, 150).map((m) => `<option value="${esc(m)}">`).join('');
      const cur = effective(read()).model;
      $('#ai-status').textContent = t(models.includes(cur) || !models.length ? 'rd.ai.testOk' : 'rd.ai.testOkModel', { n: models.length, m: cur });
    } catch (err) {
      $('#ai-status').textContent = aiErrorText(err);
    } finally { btn.disabled = false; }
  });
  root.querySelector('[data-ai=forget]').addEventListener('click', () => {
    clearAIConfig();
    $('#ai-key').value = ''; $('#ai-model').value = ''; $('#ai-base').value = '';
    $('#ai-status').textContent = t('rd.ai.forgotten');
    onChange(loadAIConfig());
  });
}

export function ghSettingsHtml(c = loadGhConfig()) {
  const g = guessRepo();
  return `<div data-gh-settings>
    <p class="hint">${t('rd.gh.intro')}</p>
    <div class="grid2">
      <div class="field"><label for="gh-owner">${t('rd.gh.owner')}</label><input id="gh-owner" value="${esc(c.owner || g?.owner || '')}" spellcheck="false" autocomplete="off"></div>
      <div class="field"><label for="gh-repo">${t('rd.gh.repo')}</label><input id="gh-repo" value="${esc(c.repo || g?.repo || '')}" spellcheck="false" autocomplete="off"></div>
      <div class="field"><label for="gh-branch">${t('rd.gh.branch')}</label><input id="gh-branch" value="${esc(c.branch || 'main')}" spellcheck="false"></div>
      <div class="field"><label for="gh-token">${t('rd.gh.token')}</label><input id="gh-token" type="password" autocomplete="off" spellcheck="false" value="${esc(c.token || '')}"><p class="hint">${t('rd.gh.tokenHint')}</p></div>
    </div>
    <div class="actions tight"><button type="button" class="btn ghost" data-gh="forget">${icon('trash')}${t('rd.gh.forget')}</button></div>
    <p class="small" id="gh-status" role="status" aria-live="polite"></p>
  </div>`;
}

export function bindGhSettings(root) {
  const $ = (s) => root.querySelector(s);
  const save = () => saveGhConfig({ owner: $('#gh-owner').value.trim(), repo: $('#gh-repo').value.trim(), branch: $('#gh-branch').value.trim() || 'main', token: $('#gh-token').value.trim() });
  for (const id of ['#gh-owner', '#gh-repo', '#gh-branch', '#gh-token']) $(id).addEventListener('change', () => { save(); $('#gh-status').textContent = t('rd.gh.saved'); });
  root.querySelector('[data-gh=forget]').addEventListener('click', () => { clearGhConfig(); $('#gh-token').value = ''; $('#gh-status').textContent = t('rd.gh.forgotten'); });
}

// Kendi metnini ortak kütüphaneye öner (GitHub ayarı varsa doğrudan, yoksa .txt indir).
export async function proposeToLibrary({ lang, cat, sub, title, tags, level, body }) {
  const content = toSourceBlock({ title, sub, tags, level, body });
  const gh = loadGhConfig();
  if (!ghReady(gh)) {
    download(`${lang}-${cat}-${Date.now().toString(36)}.txt`, content, 'text/plain');
    toast(t('rd.gh.downloaded', { path: `content-src/reading/inbox/${lang}/${cat}/` }));
    return { ok: true, downloaded: true };
  }
  const r = await sendToLibrary(gh, { lang, cat, title, content });
  toast(r.ok ? t('rd.gh.sent') : `${t(`rd.gh.err.${r.code}`)} (${r.detail || ''})`);
  return r;
}

// ---------- Üretim ekranı ----------
export async function readAIView(root, ctx, params) {
  const rc = await rctx(ctx);
  const { R } = rc;
  let cfg = loadAIConfig();
  const st = draft?.form || { lang: params.get('lang') || rc.lang, cat: params.get('cat') || 'stories', sub: '', len: 'short', level: 2, aud: rc.profile.type === 'child' ? 'child' : 'all', topic: params.get('q') || '', notes: '' };
  const subOpts = (cat, cur) => `<option value="">${t('rd.ai.subAuto')}</option>${Object.entries(rc.catById[cat].subs).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v[rc.ui])}</option>`).join('')}`;
  const seg = (name, items, cur) => `<div class="seg" role="radiogroup">${items.map(([v, l]) => `<label class="seg-opt"><input type="radio" name="${name}" value="${v}"${String(v) === String(cur) ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('rd.ai.title')}</h1><p class="muted">${t('rd.ai.intro')}</p></div>${helpLink('reading', t('guide.helpHere'))}</div>
    ${readNav('#/read/ai')}
    <details class="panel ai-conn"${isConfigured(cfg) ? '' : ' open'}><summary><span class="h4">${icon('gear')}${t('rd.ai.connection')}</span> <span class="rbadge" id="ai-conn-state"></span></summary>${aiSettingsHtml(cfg)}</details>
    <form id="ai-form" class="panel" novalidate>
      <div class="field"><label for="ai-topic">${t('rd.ai.topic')} *</label><textarea id="ai-topic" rows="2" maxlength="400" placeholder="${esc(t('rd.ai.topicPh'))}" aria-describedby="ai-topic-h ai-topic-e">${esc(st.topic)}</textarea>
        <p class="hint" id="ai-topic-h">${t('rd.ai.topicHint')}</p><p class="field-err small" id="ai-topic-e" hidden>${t('rd.ai.topicReq')}</p></div>
      <div class="grid2">
        <div class="field"><label for="ai-lang">${t('rd.textLang')}</label><select id="ai-lang"><option value="tr"${st.lang === 'tr' ? ' selected' : ''}>${t('lang.tr')}</option><option value="en"${st.lang === 'en' ? ' selected' : ''}>${t('lang.en')}</option></select></div>
        <div class="field"><label for="ai-aud">${t('rd.audience')}</label><select id="ai-aud">${['all', 'child', 'adult'].map((a) => `<option value="${a}"${st.aud === a ? ' selected' : ''}>${t(`rd.aud.${a}`)}</option>`).join('')}</select></div>
        <div class="field"><label for="ai-cat">${t('rd.f.cat')}</label><select id="ai-cat">${rc.cats.categories.map((c) => `<option value="${c.id}"${c.id === st.cat ? ' selected' : ''}>${esc(c.name[rc.ui])}</option>`).join('')}</select></div>
        <div class="field"><label for="ai-sub">${t('rd.f.sub')}</label><select id="ai-sub">${subOpts(st.cat, st.sub)}</select></div>
      </div>
      <fieldset class="field"><legend>${t('rd.ai.length')}</legend>${seg('ai-len', [['short', t('rd.ai.len.short')], ['medium', t('rd.ai.len.medium')], ['long', t('rd.ai.len.long')]], st.len)}<p class="hint" id="ai-len-h"></p></fieldset>
      <fieldset class="field"><legend>${t('rd.ai.level')}</legend>${seg('ai-level', [[1, rc.levelName(1)], [2, rc.levelName(2)], [3, rc.levelName(3)]], st.level)}</fieldset>
      <div class="field"><label for="ai-notes">${t('rd.ai.notes')}</label><textarea id="ai-notes" rows="2" maxlength="500" placeholder="${esc(t('rd.ai.notesPh'))}">${esc(st.notes)}</textarea></div>
      <div class="alert error-summary" id="ai-err" role="alert" hidden></div>
      <div class="actions"><button class="btn primary" id="ai-go">${icon('spark')}${t('rd.ai.generate')}</button><button type="button" class="btn ghost" id="ai-cancel" hidden>${t('rd.ai.cancel')}</button></div>
      <p class="small muted ai-progress" id="ai-prog" role="status" aria-live="polite"></p>
    </form>
    <section id="ai-result" class="panel" hidden aria-labelledby="ai-res-h"></section>`;

  const $ = (s) => root.querySelector(s);
  const connState = () => { const ok = isConfigured(loadAIConfig()); $('#ai-conn-state').textContent = t(ok ? 'rd.ai.connOk' : 'rd.ai.connMissing'); $('#ai-conn-state').className = `rbadge ${ok ? 'st-done' : 'st-new'}`; };
  connState();
  bindAiSettings(root.querySelector('.ai-conn'), (c) => { cfg = c; connState(); });
  const form = () => ({ topic: $('#ai-topic').value.trim(), lang: $('#ai-lang').value, cat: $('#ai-cat').value, sub: $('#ai-sub').value, aud: $('#ai-aud').value, len: root.querySelector('input[name=ai-len]:checked').value, level: Number(root.querySelector('input[name=ai-level]:checked').value), notes: $('#ai-notes').value.trim() });
  const lenHint = () => { const f = form(); const tw = targetWords(f.lang, f.len); $('#ai-len-h').textContent = t('rd.ai.lenHint', { min: fmtNum(tw.min), max: fmtNum(tw.max), m: fmtMin(estimateMinutes(tw.min, R.wpm[f.lang] || 120)) }); };
  lenHint();
  $('#ai-cat').addEventListener('change', () => { $('#ai-sub').innerHTML = subOpts($('#ai-cat').value, ''); });
  root.querySelectorAll('input[name=ai-len], #ai-lang').forEach((x) => x.addEventListener('change', lenHint));

  let ctrl = null;
  const busy = (on, msg = '') => {
    $('#ai-go').disabled = on; $('#ai-cancel').hidden = !on;
    $('#ai-prog').innerHTML = on ? `<span class="spinner" aria-hidden="true"></span> ${esc(msg)}` : esc(msg);
    root.querySelectorAll('#ai-result button').forEach((b) => { b.disabled = on; });
  };
  $('#ai-cancel').addEventListener('click', () => ctrl?.abort());
  const showErr = (msg) => { $('#ai-err').hidden = !msg; $('#ai-err').textContent = msg || ''; if (msg) $('#ai-err').focus?.(); };

  async function run(continueOnly = false) {
    showErr('');
    const f = continueOnly && draft ? draft.form : form();
    if (!continueOnly && !f.topic) { $('#ai-topic-e').hidden = false; $('#ai-topic').setAttribute('aria-invalid', 'true'); $('#ai-topic').focus(); return; }
    $('#ai-topic-e').hidden = true; $('#ai-topic').removeAttribute('aria-invalid');
    if (!isConfigured(loadAIConfig())) { root.querySelector('.ai-conn').open = true; showErr(t('rd.ai.err.config')); root.querySelector('#ai-prov').focus(); return; }
    ctrl = new AbortController();
    const cat = rc.catById[f.cat];
    try {
      if (continueOnly) {
        const body = $('#ai-body')?.value || draft.body;
        busy(true, t('rd.ai.extending'));
        const tw = targetWords(f.lang, f.len);
        const c = continuePrompt({ lang: f.lang, soFar: body, need: Math.max(250, tw.min - wordsOf(body) + 150) });
        const more = (await complete(loadAIConfig(), { ...c, maxTokens: 8192, signal: ctrl.signal })).replace(/^```[a-z]*\n?|```\s*$/gi, '').trim();
        draft = { ...draft, title: $('#ai-title').value, body: `${body.trim()}\n\n${more}` };
      } else {
        const own = R.userTexts.filter((u) => u.cat === f.cat).map((u) => u.title);
        busy(true, t('rd.ai.writing', { step: 1 }));
        const out = await generateText(loadAIConfig(), { ...f, cat, avoidTitles: own }, { signal: ctrl.signal, onProgress: (p) => busy(true, p.step === 1 ? t('rd.ai.writing', { step: 1 }) : t('rd.ai.continuing', { step: p.step, w: fmtNum(p.words), min: fmtNum(p.target) })) });
        const sub = cat.subs[out.meta.sub] ? out.meta.sub : (f.sub || Object.keys(cat.subs)[0]);
        draft = { form: f, title: out.title, body: out.body, sub, tags: (out.meta.tags || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6), kind: out.meta.kind, model: effective(loadAIConfig()) };
      }
      busy(false, t('rd.ai.done'));
      showResult();
    } catch (err) {
      busy(false, '');
      showErr(aiErrorText(err));
    }
  }

  function quality(d) {
    const cat = rc.catById[d.form.cat];
    const tx = makeText({ lang: d.form.lang, cat: cat.id, num: 0, title: d.title, meta: { sub: d.sub, ...(d.kind && rc.cats.kinds[d.kind] ? { kind: d.kind } : {}) }, body: d.body, defaults: catDefaults(cat.id, d.sub) });
    const probs = textProblems(tx, cat, rc.cats).map((p) => p.msg);
    const tw = targetWords(d.form.lang, d.form.len);
    if (tx.words < tw.min) probs.unshift(t('rd.ai.short', { w: fmtNum(tx.words), min: fmtNum(tw.min) }));
    if (R.userTexts.some((u) => u.title.trim().toLocaleLowerCase(rc.ui) === d.title.trim().toLocaleLowerCase(rc.ui))) probs.push(t('rd.ai.sameTitle'));
    return { tx, probs };
  }

  function showResult() {
    if (!draft) return;
    const sec = $('#ai-result');
    sec.hidden = false;
    const meta = () => { const { tx, probs } = quality(draft); const m = estimateMinutes(tx.words, R.wpm[draft.form.lang] || 120);
      return `<p class="small muted">${esc(rc.catName(draft.form.cat))} · ${esc(rc.subName(draft.form.cat, draft.sub))} · ${esc(t('rd.words', { n: fmtNum(tx.words) }))} · ${esc(fmtMin(m))} · ${esc(rc.lenName(lengthClass(m)))} · ${esc(t('rd.ai.stages', { n: tx.sections.length }))}</p>
        ${probs.length ? `<div class="alert warn small" role="status">${icon('info')}<div><p><strong>${t('rd.ai.check')}</strong></p><ul>${probs.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div></div>` : `<p class="small ok-text">${icon('check')}${t('rd.ai.checkOk')}</p>`}`; };
    sec.innerHTML = `<h2 class="h3" id="ai-res-h">${t('rd.ai.result')}</h2>
      <div class="field"><label for="ai-title">${t('rd.textTitle')}</label><input id="ai-title" maxlength="120" value="${esc(draft.title)}"></div>
      <div id="ai-meta">${meta()}</div>
      <div class="field"><label for="ai-body">${t('rd.textBody')}</label><textarea id="ai-body" rows="18" aria-describedby="ai-body-h">${esc(draft.body)}</textarea><p class="hint" id="ai-body-h">${t('rd.ai.editHint')}</p></div>
      <p class="hint">${esc(t('rd.ai.source', { p: draft.model?.name || '', m: draft.model?.model || '' }))}</p>
      <div class="actions"><button class="btn primary" data-r="save">${icon('check')}${t('rd.ai.saveRead')}</button>
        <button class="btn secondary" data-r="saveonly">${t('rd.ai.saveOnly')}</button>
        <button class="btn ghost" data-r="extend">${t('rd.ai.extend')}</button>
        <button class="btn ghost" data-r="again">${icon('replay')}${t('rd.ai.again')}</button>
        <button class="btn ghost" data-r="propose">${icon('download')}${t(ghReady(loadGhConfig()) ? 'rd.ai.propose' : 'rd.ai.downloadTxt')}</button></div>`;
    let tmr = null;
    const upd = () => { draft.title = $('#ai-title').value; draft.body = $('#ai-body').value; clearTimeout(tmr); tmr = setTimeout(() => { $('#ai-meta').innerHTML = meta(); }, 300); };
    $('#ai-title').addEventListener('input', upd);
    $('#ai-body').addEventListener('input', upd);
    const save = (open) => {
      draft.title = $('#ai-title').value.trim() || draft.form.topic.slice(0, 80);
      draft.body = $('#ai-body').value;
      if (wordsOf(draft.body) < 20) { toast(t('rd.bodyShort', { n: 20 })); return; }
      const u = saveUserText(R, { title: draft.title, lang: draft.form.lang, cat: draft.form.cat, sub: draft.sub, aud: draft.form.aud, tags: draft.tags || [], author: '', source: t('rd.ai.source', { p: draft.model?.name || '', m: draft.model?.model || '' }), license: t('rd.ai.license'), kind: 'user', body: draft.body });
      u.ai = { provider: draft.model?.id || '', model: draft.model?.model || '', topic: draft.form.topic, level: draft.form.level, at: new Date().toISOString() };
      if (!ctx.store.save()) { toast(t('rd.storageFull')); return; }
      toast(t('rd.ai.saved'));
      draft = null;
      location.hash = open ? `#/read/text/${u.id}` : '#/read/mine';
    };
    sec.querySelector('[data-r=save]').addEventListener('click', () => save(true));
    sec.querySelector('[data-r=saveonly]').addEventListener('click', () => save(false));
    sec.querySelector('[data-r=extend]').addEventListener('click', () => run(true));
    sec.querySelector('[data-r=again]').addEventListener('click', () => run(false));
    sec.querySelector('[data-r=propose]').addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true;
      await proposeToLibrary({ lang: draft.form.lang, cat: draft.form.cat, sub: draft.sub, title: $('#ai-title').value.trim(), tags: draft.tags, level: draft.form.level, body: $('#ai-body').value });
      ev.currentTarget.disabled = false;
    });
  }

  $('#ai-form').addEventListener('submit', (e) => { e.preventDefault(); run(false); });
  if (draft) showResult();
}
