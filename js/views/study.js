// Serbest çalışma: kullanıcı görevi, dili, modu, soru/seçenek sayısını, tekrar ve süre sınırını,
// yazılı desteği, gürültüyü, hız çeşitlemesini ve içerik filtrelerini kendisi belirler.
import { t } from '../i18n.js';
import { esc, icon, selectOptions, toast, helpLink } from '../ui.js';
import { levelName, LEVEL_IDS } from '../engine/levels.js';
import { GROUPS, SCENARIO_GROUPS, getTask } from '../engine/registry.js';
import { taskTitle, groupTitle } from './shared.js';

const STRUCTS = ['short', 'quantity', 'place', 'imperative', 'past', 'present', 'future', 'time', 'relation', 'negative', 'subordinate', 'work'];
const INFO_KINDS = ['number', 'time', 'money', 'date', 'address', 'phone'];
const WORD_TASKS = ['learn-words', 'word-pick', 'picture-pick', 'word-type', 'word-in-sentence', 'mem-order', 'mem-missing'];
const SENT_TASKS = ['sent-pick', 'sent-question', 'sent-changed', 'sent-yesno'];

export async function studyView(root, ctx, params) {
  const profile = ctx.store.activeProfile();
  const prefs = profile.prefs;
  const st = { task: params.get('task') || 'word-pick', lang: profile.exerciseLang };

  async function render() {
    const def = getTask(st.task);
    const pack = await ctx.getPack(st.lang);
    const speech = await ctx.ttsStatus(st.lang, profile.voice.en.accent);
    const voices = (await ctx.distinctVoices(st.lang)).length;
    const levelFor = ctx.levelFor(profile, st.lang);
    const catLabel = ctx.catLabel(pack);
    const available = ctx.taskAvailable(st.task, { speechOk: speech.ok, voices });
    const taskOptions = GROUPS.map((g) => `<optgroup label="${esc(groupTitle(g.id))}">${g.tasks.map((id) => `<option value="${id}"${id === st.task ? ' selected' : ''}>${esc(taskTitle(id))}</option>`).join('')}</optgroup>`).join('');
    const counts = def.optionCounts || [];
    const isMulti = def.input === 'multi';
    const cats = Object.keys(pack.meta.categories || {});

    const goals = (profile.goalsV3 || []).filter((g) => g.status === 'active' || g.status === 'paused').filter((g) => profile.slt?.enabled || g.source !== 'specialist');
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('home.study')}</h1>
      <p class="muted">${t('study.intro')}</p></div>${helpLink('levels', t('guide.helpHere'))}</div>
      <form class="panel study" novalidate>
        <div class="field"><label for="task">${t('study.task')}</label><select id="task">${taskOptions}</select>
          <p class="hint">${esc(t(`task.${st.task}.desc`))}</p></div>
        <div class="grid2">
          <div class="field"><label for="lang">${t('set.exerciseLang')}</label><select id="lang">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], st.lang)}</select></div>
          <div class="field"><label for="mode">${t('study.mode')}</label><select id="mode">${selectOptions([['practice', t('mode.practice')], ['test', t('mode.test')]], prefs.mode)}</select>
            <p class="hint" id="mode-h">${t('study.modeHint')}</p></div>
          <div class="field"><label for="count">${isMulti ? t('study.passages') : t('study.count')}</label><select id="count">${selectOptions((isMulti ? [1, 2, 3, 4, 5] : [5, 8, 10, 15, 20, 30]).map((n) => [n, String(n)]), isMulti ? 2 : prefs.sessionLength)}</select></div>
          ${isMulti ? `<div class="field"><label for="qcount">${t('study.questions')}</label><select id="qcount">${selectOptions([['', t('study.auto')], ...[1, 2, 3, 4, 5, 6].map((n) => [n, String(n)])], '')}</select><p class="hint">${t('study.questionsHint')}</p></div>` : ''}
          ${counts.length > 1 ? `<div class="field"><label for="options">${t('study.options')}</label><select id="options">${selectOptions([['', t('study.auto')], ...counts.map((n) => [n, String(n)])], prefs.options && counts.includes(prefs.options) ? prefs.options : '')}</select></div>` : ''}
          <div class="field"><label for="level">${t('study.level')}</label><select id="level">${selectOptions([['', `${t('set.levelAuto')} (${levelName(levelFor(st.task))})`], ...LEVEL_IDS.map((n) => [n, levelName(n)])], profile.manualLevel?.[st.task] || '')}</select></div>
          <div class="field"><label for="replay">${t('study.replays')}</label><select id="replay">${selectOptions([['', t('study.unlimited')], ['3', '3'], ['2', '2'], ['1', t('study.once')]], prefs.replayLimit ?? '')}</select></div>
          <div class="field"><label for="time">${t('study.time')}</label><select id="time">${selectOptions([['', t('study.noLimit')], ['30', t('study.sec', { n: 30 })], ['20', t('study.sec', { n: 20 })], ['10', t('study.sec', { n: 10 })]], prefs.timeLimit ?? '')}</select></div>
          <div class="field"><label for="text">${t('set.subtitles')}</label><select id="text">${isMulti
            ? selectOptions(['before', 'with', 'audio', 'after'].map((m) => [m, t(`passage.${m}`)]), prefs.passageText)
            : selectOptions(['after', 'always', 'never'].map((m) => [m, t(`sub.mode.${m}`)]), profile.subtitles)}</select></div>
          ${def.needsTTS && !isMulti ? `<div class="field"><label for="noise">${t('study.noise')}</label><select id="noise">${selectOptions([['0', t('study.noNoise')], ['1', t('ex.noiseLevel.1')], ['2', t('ex.noiseLevel.2')], ['3', t('ex.noiseLevel.3')]], prefs.noise || 0)}</select></div>` : ''}
          <div class="field"><label for="seen">${t('study.seen')}</label><select id="seen">${selectOptions([['0', '0%'], ['0.25', '25%'], ['0.5', '50%'], ['0.75', '75%']], prefs.seenRatio)}</select><p class="hint">${t('study.seenHint')}</p></div>
        </div>
        ${def.needsTTS ? `<label class="check"><input type="checkbox" id="rate"${prefs.rateVary ? ' checked' : ''}> ${t('study.rateVary')}</label><p class="hint">${t('study.rateHint')}</p>` : ''}
        ${WORD_TASKS.includes(st.task) ? `<fieldset class="field"><legend>${t('study.categories')}</legend><div class="check-grid">${cats.map((c) => `<label class="check small"><input type="checkbox" name="cat" value="${c}"> ${esc(catLabel(c))}</label>`).join('')}</div><p class="hint">${t('study.catHint')}</p></fieldset>` : ''}
        ${st.task === 'dialogue' ? `<fieldset class="field"><legend>${t('study.scgroups')}</legend><div class="check-grid">${SCENARIO_GROUPS.map((g) => `<label class="check small"><input type="checkbox" name="grp" value="${g}"> ${esc(t(`scgroup.${g}`))}</label>`).join('')}</div></fieldset>` : ''}
        ${SENT_TASKS.includes(st.task) ? `<fieldset class="field"><legend>${t('study.structs')}</legend><div class="check-grid">${STRUCTS.map((s) => `<label class="check small"><input type="checkbox" name="struct" value="${s}"> ${esc(t(`struct.${s}`))}</label>`).join('')}</div></fieldset>` : ''}
        ${st.task === 'info' ? `<fieldset class="field"><legend>${t('study.infoKinds')}</legend><div class="check-grid">${INFO_KINDS.map((k) => `<label class="check small"><input type="checkbox" name="info" value="${k}"> ${esc(t(`info.${k}`))}</label>`).join('')}</div></fieldset>` : ''}
        ${available ? '' : `<p class="alert warn">${icon('info')}<span>${t('study.unavailable')}</span></p>`}
        <p class="hint">${t('lvl.note')}</p>
        <div class="actions"><button class="btn primary large" type="submit"${available ? '' : ' disabled'}>${icon('play')}${t('common.start')}</button></div>
        <details class="help"><summary>${t('study.saveToGoal')}</summary>
          ${goals.length ? `<div class="field"><label for="toGoal">${t('study.pickGoal')}</label><select id="toGoal">${selectOptions(goals.map((g) => [g.id, g.title]), goals[0].id)}</select></div>
            <button type="button" class="btn secondary" data-act="toGoal">${t('common.save')}</button>`
            : `<p class="small muted">${t('study.noGoal')} <a class="link" href="#/goals/new">${t('goal.new')}</a></p>`}
        </details>
      </form>`;
    root.querySelector('h1').focus();
    const $ = (s) => root.querySelector(s);
    $('#task').addEventListener('change', (e) => { st.task = e.target.value; render(); });
    $('#lang').addEventListener('change', (e) => { st.lang = e.target.value; render(); });
    $('#mode').addEventListener('change', (e) => {
      if (e.target.value === 'test') { $('#replay').value = '2'; $('#text').value = isMulti ? 'audio' : 'never'; }
    });
    // Seçili görev ve zorluk ayarını hedefe bağlar (hedefin "Zorluk ayarı" güncellenir).
    $('[data-act=toGoal]')?.addEventListener('click', () => {
      const g = profile.goalsV3.find((x) => x.id === $('#toGoal').value);
      if (!g) return;
      if (!g.tasks.includes(st.task)) g.tasks.push(st.task);
      const level = Number($('#level').value) || null;
      const options = Number($('#options')?.value) || null;
      const noise = Number($('#noise')?.value) || 0;
      g.preset = level || options || noise ? { level, options, noise } : g.preset;
      g.updatedAt = new Date().toISOString();
      ctx.store.save();
      toast(t('study.savedToGoal'));
    });
    root.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const vals = (name) => [...root.querySelectorAll(`input[name=${name}]:checked`)].map((x) => x.value);
      const overrides = {};
      if ($('#options')?.value) overrides.options = Number($('#options').value);
      if ($('#level').value) overrides.level = Number($('#level').value);
      if ($('#qcount')?.value) overrides.questions = Number($('#qcount').value);
      if ($('#noise') && Number($('#noise').value)) overrides.noise = Number($('#noise').value);
      if ($('#rate')?.checked) overrides.rateVary = true;
      const filter = {};
      if (vals('cat').length) filter.categories = vals('cat');
      if (vals('grp').length) filter.groups = vals('grp');
      if (vals('struct').length) filter.structs = vals('struct');
      if (vals('info').length) filter.infoKinds = vals('info');
      const mode = $('#mode').value;
      const text = $('#text').value;
      e.submitter && (e.submitter.disabled = true);
      await ctx.startSession({
        source: 'free', label: st.task, lang: st.lang, mode, seenRatio: Number($('#seen').value),
        replayLimit: $('#replay').value ? Number($('#replay').value) : null, timeLimit: $('#time').value ? Number($('#time').value) : null,
        textMode: isMulti ? (text === 'audio' ? 'never' : 'after') : text, passageText: isMulti ? text : prefs.passageText,
        retry: mode !== 'test' && prefs.retry,
        blocks: [{ task: st.task, count: Number($('#count').value), overrides, filter }],
      });
    });
  }
  await render();
}
