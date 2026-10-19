// Ayarlar: basit görünüm varsayılan; gelişmiş ayarlar isteğe bağlı açılır.
import { t, setLocale } from '../i18n.js';
import { esc, icon, selectOptions, toast, download, helpLink } from '../ui.js';
import { guideSettingsSection } from './guide.js';
import { levelName } from '../engine/levels.js';
import { setMasterVolume } from '../audio.js';
import { GROUPS } from '../engine/registry.js';
import { accentsFor } from '../tts.js';
import { packStats, validateCustomPack } from '../content/loader.js';
import { playSide } from '../audio.js';
import { langName, taskTitle, groupTitle, ttsErrorMessage, voiceHelpHtml } from './shared.js';
import { AGE_RANGES } from './onboarding.js';
import { aiSettingsHtml, bindAiSettings, ghSettingsHtml, bindGhSettings } from './read-ai.js';
import { ensureReading } from '../reading/state.js';

const THEMES = ['light', 'dark', 'pastel', 'contrast'];

export async function settingsView(root, ctx) {
  const { store } = ctx;
  const s = store.state.settings;
  const p = store.activeProfile();
  const others = store.state.profiles.filter((x) => x.id !== p.id);
  const adv = s.advanced;
  const packs = { tr: await ctx.getPack('tr'), en: await ctx.getPack('en') };
  const custom = store.customPacks();

  const distinctN = (await ctx.distinctVoices(p.exerciseLang)).length;
  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('set.title')}</h1></div>${helpLink('setup', t('guide.helpHere'))}</div>
  ${guideSettingsSection()}
  <label class="switch"><input type="checkbox" id="advanced"${adv ? ' checked' : ''}> <span>${t('set.advanced')}</span></label>
  <p class="hint">${t('set.advancedHint')}</p>

  <section class="panel" aria-labelledby="s-app"><h2 id="s-app" class="h3">${t('set.appearance')}</h2>
    <div class="grid2">
      <div class="field"><label for="uiLang">${t('set.uiLang')}</label><select id="uiLang">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], s.uiLang)}</select></div>
      <div class="field"><label for="exLang">${t('set.exerciseLang')}</label><select id="exLang">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], p.exerciseLang)}</select></div>
    </div>
    <p class="hint">${t('onb.exerciseLangHint')}</p>
    <fieldset class="field"><legend>${t('set.theme')}</legend>
      <div class="theme-pick">${THEMES.map((th) => `<label class="theme-opt"><input type="radio" name="theme" value="${th}"${s.theme === th ? ' checked' : ''}>
        <span class="swatch" data-theme-preview="${th}" aria-hidden="true"><i></i><i></i><i></i></span><span>${t(`theme.${th}`)}</span></label>`).join('')}</div></fieldset>
    <div class="grid2">
      <div class="field"><label for="textScale">${t('set.textScale')}</label><select id="textScale">${selectOptions([[1, t('text.1')], [1.15, t('text.1.15')], [1.3, t('text.1.3')]], s.textScale)}</select></div>
      <div class="field"><label for="motion">${t('set.motion')}</label><select id="motion">${selectOptions([['system', t('motion.system')], ['reduce', t('motion.reduce')], ['full', t('motion.full')]], s.reducedMotion)}</select></div>
    </div>
    <div class="field"><label for="appVol">${t('set.volume')}: <output id="appVolOut">${Math.round((s.volume ?? 0.7) * 100)}%</output></label>
      <input id="appVol" type="range" min="0" max="100" step="5" value="${Math.round((s.volume ?? 0.7) * 100)}" aria-describedby="appVol-h">
      <p class="hint" id="appVol-h">${t('set.volumeHint')}</p></div>
  </section>

  <section class="panel" id="a11y" aria-labelledby="s-a11y"><h2 id="s-a11y" class="h3">${t('set.a11y')}</h2>
    <p class="hint">${t('set.a11yHint')}</p>
    <label class="switch-row"><span><strong>${t('set.readTTSButton')}</strong><span class="hint block">${t('set.readTTSButtonHint')}</span></span><input type="checkbox" role="switch" id="readTTS"${s.readTTSButton ? ' checked' : ''}></label>
    <label class="switch-row"><span><strong>${t('set.readTTSAutoHide')}</strong><span class="hint block">${t('set.readTTSAutoHideHint')}</span></span><input type="checkbox" role="switch" id="readTTSHide"${s.readTTSAutoHide ? ' checked' : ''}${s.readTTSButton ? '' : ' disabled'}></label>
    <h3 class="h4">${t('set.readSpeed')}</h3>
    <p class="hint">${t('set.readSpeedHint')}</p>
    <div class="grid2">${['tr', 'en'].map((l) => `<div class="field"><label for="wpm-${l}">${esc(t('set.readSpeedFor', { lang: langName(l) }))}</label><input id="wpm-${l}" type="number" min="60" max="250" step="5" inputmode="numeric" value="${ensureReading(p).wpm[l]}"></div>`).join('')}</div>
  </section>

  <section class="panel" id="ai" aria-labelledby="s-ai"><h2 id="s-ai" class="h3">${icon('spark')}${t('rd.ai.settingsTitle')}</h2>
    <p class="muted small">${t('rd.ai.settingsIntro')}</p>${aiSettingsHtml()}
    <details class="sub-details"><summary>${t('rd.gh.title')}</summary>${ghSettingsHtml()}</details></section>
  <section class="panel" aria-labelledby="s-pr"><h2 id="s-pr" class="h3">${t('set.practice')}</h2>
    <div class="grid2">
      <div class="field"><label for="goal">${t('set.dailyGoal')}</label><input id="goal" type="number" inputmode="numeric" min="1" max="120" value="${p.dailyGoalMin}"></div>
      <div class="field"><label for="len">${t('set.sessionLength')}</label><select id="len">${selectOptions([4, 6, 8, 10, 15, 20].map((n) => [n, String(n)]), p.prefs.sessionLength)}</select></div>
      <div class="field"><label for="subs">${t('set.subtitles')}</label><select id="subs">${selectOptions(['after', 'always', 'never'].map((m) => [m, t(`sub.mode.${m}`)]), p.subtitles)}</select></div>
      <div class="field"><label for="ptext">${t('set.passageText')}</label><select id="ptext">${selectOptions(['before', 'with', 'audio', 'after'].map((m) => [m, t(`passage.${m}`)]), p.prefs.passageText)}</select></div>
    </div>
    <label class="check"><input type="checkbox" id="pics"${p.prefs.pictures ? ' checked' : ''}> ${t('set.pictures')}</label>
    <label class="check"><input type="checkbox" id="retry"${p.prefs.retry ? ' checked' : ''}> ${t('set.retry')}</label>
    <div class="grid2">
      <div class="field"><label for="breakEvery">${t('set.breakEvery')}</label><select id="breakEvery" aria-describedby="breakEvery-h">${selectOptions([[0, t('set.breakOff')], ...[5, 10, 15, 20, 30].map((n) => [n, t('set.breakMin', { n })])], p.prefs.breakEvery ?? 10)}</select>
        <p class="hint" id="breakEvery-h">${t('set.breakHint')}</p></div>
      <div class="field"><label class="check"><input type="checkbox" id="speakerVary"${p.prefs.speakerVary ? ' checked' : ''}${distinctN < 2 ? ' disabled' : ''} aria-describedby="sv-h"> ${t('set.speakerVary')}</label>
        <p class="hint" id="sv-h">${distinctN < 2 ? `${t('set.speakerVaryNeed')} <a class="link" href="#/qa">${t('nav.qa')}</a>` : t('set.speakerVaryHint')}</p></div>
    </div>
    ${adv ? `<div class="grid2">
      <div class="field"><label for="mode">${t('set.defaultMode')}</label><select id="mode">${selectOptions([['practice', t('mode.practice')], ['test', t('mode.test')]], p.prefs.mode)}</select></div>
      <div class="field"><label for="opts">${t('set.defaultOptions')}</label><select id="opts">${selectOptions([['', t('study.auto')], ...[2, 3, 4, 5, 6, 8, 10].map((n) => [n, String(n)])], p.prefs.options ?? '')}</select></div>
      <div class="field"><label for="replay">${t('study.replays')}</label><select id="replay">${selectOptions([['', t('study.unlimited')], ['3', '3'], ['2', '2'], ['1', t('study.once')]], p.prefs.replayLimit ?? '')}</select></div>
      <div class="field"><label for="time">${t('study.time')}</label><select id="time">${selectOptions([['', t('study.noLimit')], ['30', t('study.sec', { n: 30 })], ['20', t('study.sec', { n: 20 })], ['10', t('study.sec', { n: 10 })]], p.prefs.timeLimit ?? '')}</select></div>
      <div class="field"><label for="seen">${t('study.seen')}</label><select id="seen">${selectOptions([['0', '0%'], ['0.25', '25%'], ['0.5', '50%'], ['0.75', '75%']], p.prefs.seenRatio)}</select></div>
      <div class="field"><label for="comfort">${t('set.comfort')}</label><select id="comfort">${selectOptions(['relaxed', 'balanced', 'challenging'].map((c) => [c, t(`comfort.${c}`)]), p.prefs.comfort)}</select></div>
      <div class="field"><label for="noise">${t('study.noise')}</label><select id="noise">${selectOptions([['0', t('study.noNoise')], ['1', t('ex.noiseLevel.1')], ['2', t('ex.noiseLevel.2')], ['3', t('ex.noiseLevel.3')]], p.prefs.noise)}</select></div>
    </div>
    <label class="check"><input type="checkbox" id="rateVary"${p.prefs.rateVary ? ' checked' : ''}> ${t('study.rateVary')}</label>
    <p class="hint">${t('study.rateHint')}</p>
    <details class="help"><summary>${t('set.levels')}</summary><p class="hint">${t('set.levelsHint')}</p>
      ${GROUPS.map((g) => `<h3 class="h4">${esc(groupTitle(g.id))}</h3><div class="level-grid">${g.tasks.map((id) => `<label for="lv-${id}">${esc(taskTitle(id))}</label>
        <select id="lv-${id}" data-level="${id}">${selectOptions([['auto', t('set.levelAuto')], ...[1, 2, 3, 4, 5].map((n) => [n, `${n} – ${levelName(n)}`])], p.manualLevel?.[id] || 'auto')}</select>`).join('')}</div>`).join('')}
    </details>` : ''}
  </section>

  <section class="panel" aria-labelledby="s-v"><h2 id="s-v" class="h3">${t('set.voice')}</h2>
    <p class="hint">${t('set.engine')}</p>
    <div id="voice-tr" class="voice-block"></div>
    <div id="voice-en" class="voice-block"></div>
    <p><a class="btn secondary" href="#/qa">${icon('check')}${t('nav.qa')}</a></p>
    <p class="hint">${t('set.qaHint')}</p>
  </section>

  ${adv ? `<section class="panel" id="stereo" aria-labelledby="s-st"><h2 id="s-st" class="h3">${t('set.stereo')}</h2>
    <p>${t('set.stereoBody')}</p>
    <p class="small">${t('set.stereoStatus')}: <strong>${s.stereoOk ? t('set.stereoOn') : t('set.stereoOff')}</strong></p>
    <div class="actions"><button class="btn secondary" data-act="stereo">${icon('play')}${t('set.stereoStart')}</button>
    ${s.stereoOk ? `<button class="btn ghost" data-act="stereoOff">${t('set.stereoDisable')}</button>` : ''}</div>
    <div id="stereo-box"></div></section>` : ''}

  <section class="panel" aria-labelledby="s-p"><h2 id="s-p" class="h3">${t('set.profile')}</h2>
    <div class="grid2">
      <div class="field"><label for="pName">${t('onb.name')}</label><input id="pName" maxlength="30" value="${esc(p.name)}" autocomplete="off"></div>
      <div class="field"><label for="pType">${t('onb.whoTitle')}</label><select id="pType">${selectOptions([['child', t('profile.child')], ['adult', t('profile.adult')]], p.type)}</select></div>
      <div class="field"><label for="pAge">${t('onb.ageRange')}</label><select id="pAge">${selectOptions(AGE_RANGES[p.type].map((a) => [a, a]), p.ageRange)}</select></div>
      <div class="field"><label for="pHear">${t('onb.hearingTitle')}</label><select id="pHear">${selectOptions(['ha', 'ci', 'bimodal', 'other'].map((h) => [h, t(`hearing.${h}`)]), p.hearing)}</select></div>
      <div class="field"><label for="pSide">${t('onb.side')}</label><select id="pSide">${selectOptions(['unspecified', 'left', 'right', 'both'].map((x) => [x, t(`side.${x}`)]), p.side)}</select></div>
    </div>
    <div class="field"><label for="pGoals">${t('onb.goals')}</label><textarea id="pGoals" rows="2" maxlength="200">${esc(p.goals)}</textarea></div>
    <div class="field"><label for="pExp">${t('onb.experience')}</label><textarea id="pExp" rows="3" maxlength="600" aria-describedby="pExp-h">${esc(p.experience)}</textarea><p class="hint" id="pExp-h">${t('onb.experienceHint')}</p></div>
    <button class="btn primary" data-act="saveProfile">${t('common.save')}</button>
    ${others.length ? `<ul class="profile-list">${others.map((o) => `<li><span>${icon('user')} ${esc(o.name || t(`profile.${o.type}`))} <span class="muted small">(${t(`profile.${o.type}`)})</span></span>
      <button class="btn secondary small" data-switch="${o.id}">${t('set.switch')}</button></li>`).join('')}</ul>` : ''}
    <div class="actions"><a class="btn secondary" href="#/onboarding?add=1">${icon('plus')}${t('set.addProfile')}</a>
      <button class="btn danger-ghost" data-act="removeProfile">${icon('trash')}${t('set.removeProfile')}</button></div>
  </section>

  <section class="panel" aria-labelledby="s-slt"><h2 id="s-slt" class="h3">${t('set.slt')}</h2>
    <label class="check"><input type="checkbox" id="sltOn"${p.slt.enabled ? ' checked' : ''}> ${t('set.sltToggle')}</label>
    <p class="hint">${t('onb.sltHint')}</p></section>

  ${adv ? `<section class="panel" aria-labelledby="s-c"><h2 id="s-c" class="h3">${t('set.content')}</h2>
    <p class="hint">${t('set.contentHint')}</p>
    ${['tr', 'en'].map((l) => { const ps = packStats(packs[l]); return `<h3 class="h4">${esc(langName(l))}</h3>
      <p class="small">${esc(t('set.packStats', ps))}</p>
      ${ps.errors ? `<details class="help"><summary class="warn-text">${esc(t('set.packErrors', { n: ps.errors }))}</summary><ul>${packs[l].report.errors.slice(0, 30).map((e) => `<li class="small">${esc(e.path)}: ${esc(e.msg)}</li>`).join('')}</ul></details>` : `<p class="small">${icon('check')} ${t('set.packValid')}</p>`}`; }).join('')}
    <h3 class="h4">${t('set.customPacks')}</h3>
    ${custom.length ? `<ul class="note-list">${custom.map((c, i) => `<li><span>${esc(c.id)} (${esc(c.lang)}, ${esc(c.license)})</span><button class="btn ghost small" data-rmpack="${i}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="muted small">${t('set.noCustom')}</p>`}
    <label class="btn secondary file-btn">${t('set.importPack')}<input type="file" id="packFile" accept="application/json,.json"></label>
    <p class="hint">${t('set.packFormat')}</p></section>` : ''}

  <section class="panel" aria-labelledby="s-priv"><h2 id="s-priv" class="h3">${t('set.privacy')}</h2>
    <p>${t('set.privacyBody')}</p>
    <div class="actions">
      <button class="btn secondary" data-act="export">${icon('download')}${t('set.export')}</button>
      <label class="btn secondary file-btn">${t('set.import')}<input type="file" id="importFile" accept="application/json,.json"></label>
      <button class="btn danger" data-act="wipe">${icon('trash')}${t('set.wipe')}</button>
    </div></section>

  <section class="panel" aria-labelledby="s-ab"><h2 id="s-ab" class="h3">${t('set.about')}</h2>
    <p>${t('set.aboutBody')}</p><p class="small muted">${t('onb.disclaimer')}</p><p class="small muted">${t('note.emergency')}</p></section>`;

  const $ = (sel) => root.querySelector(sel);
  const saved = () => { store.save(); toast(t('common.saved')); };
  const on = (sel, ev, fn) => $(sel)?.addEventListener(ev, fn);

  on('#advanced', 'change', (e) => { s.advanced = e.target.checked; store.save(); ctx.rerender(); });
  on('#uiLang', 'change', (e) => { s.uiLang = e.target.value; setLocale(s.uiLang); store.save(); ctx.refreshShell(); ctx.rerender(); });
  on('#exLang', 'change', (e) => { p.exerciseLang = e.target.value; p.activeSession = null; saved(); });
  root.querySelectorAll('input[name=theme]').forEach((r) => r.addEventListener('change', () => { s.theme = r.value; ctx.applyPrefs(); saved(); }));
  on('#textScale', 'change', (e) => { s.textScale = Number(e.target.value); ctx.applyPrefs(); saved(); });
  on('#motion', 'change', (e) => { s.reducedMotion = e.target.value; ctx.applyPrefs(); saved(); });
  on('#goal', 'change', (e) => { p.dailyGoalMin = Math.min(120, Math.max(1, Math.round(Number(e.target.value) || 10))); e.target.value = p.dailyGoalMin; saved(); });
  on('#len', 'change', (e) => { p.prefs.sessionLength = Number(e.target.value); saved(); });
  on('#subs', 'change', (e) => { p.subtitles = e.target.value; saved(); });
  on('#ptext', 'change', (e) => { p.prefs.passageText = e.target.value; saved(); });
  on('#pics', 'change', (e) => { p.prefs.pictures = e.target.checked; saved(); });
  on('#retry', 'change', (e) => { p.prefs.retry = e.target.checked; saved(); });
  on('#breakEvery', 'change', (e) => { p.prefs.breakEvery = Number(e.target.value); saved(); });
  on('#speakerVary', 'change', (e) => { p.prefs.speakerVary = e.target.checked; saved(); });
  on('#appVol', 'input', (e) => { s.volume = Number(e.target.value) / 100; setMasterVolume(s.volume); $('#appVolOut').textContent = `${e.target.value}%`; });
  on('#appVol', 'change', () => { store.save(); toast(t('common.saved')); });
  on('#readTTS', 'change', (e) => { s.readTTSButton = e.target.checked; $('#readTTSHide').disabled = !e.target.checked; saved(); });
  bindAiSettings(root.querySelector('#ai'));
  bindGhSettings(root.querySelector('#ai'));
  on('#readTTSHide', 'change', (e) => { s.readTTSAutoHide = e.target.checked; saved(); });
  for (const l of ['tr', 'en']) on(`#wpm-${l}`, 'change', (e) => { const v = Math.min(250, Math.max(60, Math.round(Number(e.target.value) || 120))); ensureReading(p).wpm[l] = v; e.target.value = v; saved(); });
  on('#mode', 'change', (e) => { p.prefs.mode = e.target.value; saved(); });
  on('#opts', 'change', (e) => { p.prefs.options = e.target.value ? Number(e.target.value) : null; saved(); });
  on('#replay', 'change', (e) => { p.prefs.replayLimit = e.target.value ? Number(e.target.value) : null; saved(); });
  on('#time', 'change', (e) => { p.prefs.timeLimit = e.target.value ? Number(e.target.value) : null; saved(); });
  on('#seen', 'change', (e) => { p.prefs.seenRatio = Number(e.target.value); saved(); });
  on('#comfort', 'change', (e) => { p.prefs.comfort = e.target.value; saved(); });
  on('#noise', 'change', (e) => { p.prefs.noise = Number(e.target.value); saved(); });
  on('#rateVary', 'change', (e) => { p.prefs.rateVary = e.target.checked; saved(); });
  root.querySelectorAll('[data-level]').forEach((sel) => sel.addEventListener('change', () => {
    if (sel.value === 'auto') delete p.manualLevel[sel.dataset.level]; else p.manualLevel[sel.dataset.level] = Number(sel.value);
    saved();
  }));

  // Stereo kalibrasyonu: kullanıcı iki taraftaki tonu doğru tanırsa yön görevi açılır.
  on('[data-act=stereo]', 'click', async () => {
    const box = $('#stereo-box');
    const order = Math.random() < 0.5 ? ['left', 'right'] : ['right', 'left'];
    let correct = 0;
    for (const side of order) {
      box.innerHTML = `<p>${t('set.stereoListen')}</p>`;
      await playSide(side);
      const ans = await new Promise((resolve) => {
        box.innerHTML = `<p>${t('set.stereoWhich')}</p><div class="segmented"><button class="btn secondary" data-side="left">${t('opt.left')}</button><button class="btn secondary" data-side="right">${t('opt.right')}</button><button class="btn ghost" data-side="none">${t('set.stereoUnsure')}</button></div>`;
        box.querySelectorAll('[data-side]').forEach((b) => b.addEventListener('click', () => resolve(b.dataset.side)));
        box.querySelector('[data-side]').focus();
      });
      if (ans === side) correct += 1;
    }
    s.stereoOk = correct === 2;
    store.save();
    box.innerHTML = `<p class="alert ${s.stereoOk ? 'info' : 'warn'}">${icon('info')}<span>${t(s.stereoOk ? 'set.stereoPass' : 'set.stereoFail')}</span></p>`;
  });
  on('[data-act=stereoOff]', 'click', () => { s.stereoOk = false; store.save(); ctx.rerender(); });

  on('#pType', 'change', (e) => { $('#pAge').innerHTML = selectOptions(AGE_RANGES[e.target.value].map((a) => [a, a]), AGE_RANGES[e.target.value][0]); });
  on('[data-act=saveProfile]', 'click', () => {
    Object.assign(p, { name: $('#pName').value.trim(), type: $('#pType').value, ageRange: $('#pAge').value, hearing: $('#pHear').value, side: $('#pSide').value, goals: $('#pGoals').value.trim(), experience: $('#pExp').value.trim() });
    ctx.applyPrefs();
    ctx.refreshShell();
    saved();
  });
  root.querySelectorAll('[data-switch]').forEach((b) => b.addEventListener('click', () => {
    store.state.activeProfileId = b.dataset.switch;
    store.save();
    ctx.applyPrefs();
    ctx.refreshShell();
    ctx.go('#/home');
  }));
  on('[data-act=removeProfile]', 'click', () => {
    if (!window.confirm(t('set.removeConfirm'))) return;
    store.removeProfile(p.id);
    ctx.applyPrefs();
    ctx.refreshShell();
    ctx.go(store.activeProfile() ? '#/home' : '#/onboarding?add=1');
  });
  on('#sltOn', 'change', (e) => { p.slt.enabled = e.target.checked; ctx.refreshShell(); saved(); });

  on('#packFile', 'change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const problems = validateCustomPack(json);
      if (problems.length) { toast(problems[0]); return; }
      const list = store.customPacks().filter((c) => c.id !== json.id);
      list.push(json);
      if (!store.saveCustomPacks(list)) { toast(t('set.packTooBig')); return; }
      ctx.clearPacks();
      toast(t('set.packAdded'));
      ctx.rerender();
    } catch {
      toast(t('set.importFail'));
    }
  });
  root.querySelectorAll('[data-rmpack]').forEach((b) => b.addEventListener('click', () => {
    const list = store.customPacks();
    list.splice(Number(b.dataset.rmpack), 1);
    store.saveCustomPacks(list);
    ctx.clearPacks();
    ctx.rerender();
  }));

  on('[data-act=export]', 'click', () => download(`duyum-yedek-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON()));
  on('#importFile', 'change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      store.importJSON(await file.text());
      setLocale(store.state.settings.uiLang);
      ctx.applyPrefs();
      ctx.refreshShell();
      toast(t('set.importOk'));
      ctx.go(store.activeProfile() ? '#/home' : '#/onboarding');
    } catch {
      toast(t('set.importFail'));
    }
  });
  on('[data-act=wipe]', 'click', () => {
    if (!window.confirm(t('set.wipeConfirm'))) return;
    store.wipe();
    ctx.clearPacks();
    setLocale('tr');
    ctx.applyPrefs();
    ctx.refreshShell();
    ctx.go('#/onboarding');
  });

  for (const lang of ['tr', 'en']) renderVoiceBlock(root.querySelector(`#voice-${lang}`), ctx, p, lang);
}

async function renderVoiceBlock(box, ctx, p, lang) {
  const prefs = p.voice[lang];
  const engine = ctx.tts.engines['web-speech'];
  const all = engine?.isSupported() ? await engine.loadVoices() : [];
  const st = await ctx.ttsStatus(lang, lang === 'en' ? prefs.accent : undefined);
  const voices = st.voices || [];
  const title = `<h3 class="h4">${esc(t('set.voiceFor', { lang: langName(lang) }))}</h3>`;
  if (!voices.length) {
    box.innerHTML = `${title}<div class="alert warn">${icon('info')}<div><p>${esc(t('set.voiceNone', { lang: langName(lang) }))}</p>${voiceHelpHtml(false)}</div></div>`;
    return;
  }
  const accents = lang === 'en' ? accentsFor(all, 'en') : [];
  box.innerHTML = `${title}
    <div class="field"><label for="v-${lang}">${esc(t('set.voiceFor', { lang: langName(lang) }))}</label>
      <select id="v-${lang}">${selectOptions(voices.map((v) => [v.voiceURI, `${v.name} (${v.lang}, ${v.localService ? t('set.voiceOffline') : t('set.voiceOnline')})`]), prefs.voiceURI || voices[0].voiceURI)}</select>
      <p class="hint">${t('set.voiceQaNote')}</p></div>
    ${accents.length > 1 ? `<div class="field"><label for="acc">${t('set.accent')}</label><select id="acc">${selectOptions(accents.map((x) => [x, x]), prefs.accent)}</select></div>` : ''}
    <div class="field"><label for="r-${lang}">${t('set.rate')}: <output id="ro-${lang}">${prefs.rate.toFixed(2)}</output></label>
      <div class="range-row"><span class="small muted">${t('set.rateSlow')}</span><input type="range" id="r-${lang}" min="0.6" max="1.2" step="0.05" value="${prefs.rate}"><span class="small muted">${t('set.rateFast')}</span></div></div>
    <button class="btn secondary" data-test="${lang}">${icon('play')}${t('set.test')}</button>`;
  box.querySelector(`#v-${lang}`).addEventListener('change', (e) => { prefs.voiceURI = e.target.value; ctx.store.save(); });
  box.querySelector('#acc')?.addEventListener('change', (e) => { prefs.accent = e.target.value; prefs.voiceURI = null; ctx.store.save(); ctx.clearTTSCache(); renderVoiceBlock(box, ctx, p, lang); });
  const range = box.querySelector(`#r-${lang}`);
  range.addEventListener('input', () => { box.querySelector(`#ro-${lang}`).textContent = Number(range.value).toFixed(2); });
  range.addEventListener('change', () => { prefs.rate = Number(range.value); ctx.store.save(); });
  box.querySelector(`[data-test=${lang}]`).addEventListener('click', async () => {
    try { await ctx.tts.speak(t(`set.testText.${lang}`), { lang, voiceURI: prefs.voiceURI, rate: prefs.rate, accent: prefs.accent }); } catch (err) { toast(ttsErrorMessage(err, lang)); }
  });
}
