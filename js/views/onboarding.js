import { t, setLocale } from '../i18n.js';
import { esc, icon, selectOptions } from '../ui.js';
import { voiceStatusBlock, bindVoiceTest } from './shared.js';

export const AGE_RANGES = { child: ['0-2', '3-5', '6-9', '10-12', '13-17'], adult: ['18-39', '40-64', '65+'] };

export function onboardingView(root, ctx, params) {
  const { store } = ctx;
  const adding = params.get('add') === '1';
  const settings = store.state.settings;
  const steps = adding || settings.disclaimerAccepted ? ['who', 'hearing', 'practice', 'voice'] : ['welcome', 'who', 'hearing', 'practice', 'voice'];
  let step = 0;
  const draft = { type: 'adult', name: '', ageRange: '18-39', hearing: 'other', side: 'unspecified', goals: '', experience: '', exerciseLang: settings.uiLang, dailyGoalMin: 10, sltEnabled: false };

  function header() {
    const showCount = steps.length > 1;
    return `<div class="onb-head">
      ${step > 0 ? `<button class="btn ghost small" data-act="back">${icon('back')}${t('common.back')}</button>` : '<span></span>'}
      ${showCount ? `<p class="muted small">${t('onb.step', { n: step + 1, total: steps.length })}</p>` : ''}
    </div>
    <div class="steps" aria-hidden="true">${steps.map((_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>`;
  }

  function radioTiles(name, items, selected) {
    return `<div class="tiles" role="radiogroup">${items.map(([value, label, desc]) => `
      <label class="tile">
        <input type="radio" name="${name}" value="${esc(value)}"${value === selected ? ' checked' : ''}>
        <span class="tile-body"><span class="tile-title">${esc(label)}</span>${desc ? `<span class="tile-desc">${esc(desc)}</span>` : ''}</span>
      </label>`).join('')}</div>`;
  }

  function body() {
    switch (steps[step]) {
      case 'welcome':
        return `<h1 tabindex="-1">${t('onb.welcomeTitle')}</h1>
          <p class="lead">${t('onb.welcomeBody')}</p>
          <div class="field">
            <label for="uiLang">${t('onb.uiLang')}</label>
            <select id="uiLang">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], settings.uiLang)}</select>
          </div>
          <section class="notice" aria-labelledby="dis-h">
            <h2 id="dis-h" class="h3">${icon('info')}${t('onb.disclaimerTitle')}</h2>
            <p>${t('onb.disclaimer')}</p>
            <label class="check"><input type="checkbox" id="accept"${settings.disclaimerAccepted ? ' checked' : ''}> ${t('onb.disclaimerAccept')}</label>
          </section>`;
      case 'who':
        return `<h1 tabindex="-1">${adding ? t('onb.addProfileTitle') : t('onb.whoTitle')}</h1>
          <p class="muted">${t('onb.whoHint')}</p>
          ${radioTiles('type', [['child', t('profile.child'), t('profile.childDesc')], ['adult', t('profile.adult'), t('profile.adultDesc')]], draft.type)}
          <div class="field">
            <label for="name">${t('onb.name')} <span class="muted">(${t('common.optional')})</span></label>
            <input id="name" type="text" maxlength="30" autocomplete="off" value="${esc(draft.name)}" aria-describedby="name-hint">
            <p class="hint" id="name-hint">${t('onb.nameHint')}</p>
          </div>
          <div class="field">
            <label for="age">${t('onb.ageRange')}</label>
            <select id="age">${selectOptions(AGE_RANGES[draft.type].map((a) => [a, a]), draft.ageRange)}</select>
          </div>`;
      case 'hearing':
        return `<h1 tabindex="-1">${t('onb.hearingTitle')}</h1>
          <p class="muted">${t('onb.hearingHint')}</p>
          ${radioTiles('hearing', ['ha', 'ci', 'bimodal', 'other'].map((h) => [h, t(`hearing.${h}`)]), draft.hearing)}
          <div class="field">
            <label for="side">${t('onb.side')} <span class="muted">(${t('common.optional')})</span></label>
            <select id="side">${selectOptions(['unspecified', 'left', 'right', 'both'].map((s) => [s, t(`side.${s}`)]), draft.side)}</select>
          </div>
          <div class="field">
            <label for="goals">${t('onb.goals')} <span class="muted">(${t('common.optional')})</span></label>
            <textarea id="goals" rows="2" maxlength="200" placeholder="${esc(t('onb.goalsPlaceholder'))}">${esc(draft.goals)}</textarea>
          </div>
          <div class="field">
            <label for="exp">${t('onb.experience')} <span class="muted">(${t('common.optional')})</span></label>
            <textarea id="exp" rows="2" maxlength="600" aria-describedby="exp-h">${esc(draft.experience)}</textarea>
            <p class="hint" id="exp-h">${t('onb.experienceHint')}</p>
          </div>`;
      case 'practice':
        return `<h1 tabindex="-1">${t('onb.practiceTitle')}</h1>
          <div class="field">
            <label for="exLang">${t('onb.exerciseLang')}</label>
            <select id="exLang" aria-describedby="exLang-hint">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], draft.exerciseLang)}</select>
            <p class="hint" id="exLang-hint">${t('onb.exerciseLangHint')}</p>
          </div>
          <fieldset class="field">
            <legend>${t('onb.dailyGoal')}</legend>
            <div class="segmented">${[5, 10, 15, 20].map((m) => `<label><input type="radio" name="goal" value="${m}"${m === draft.dailyGoalMin ? ' checked' : ''}><span>${t('common.minutes', { n: m })}</span></label>`).join('')}</div>
          </fieldset>
          <label class="check"><input type="checkbox" id="adv"${ctx.store.state.settings.advanced ? ' checked' : ''}> ${t('onb.advanced')}</label>
          <p class="hint">${t('set.advancedHint')}</p>
          <label class="check"><input type="checkbox" id="slt"${draft.sltEnabled ? ' checked' : ''}> ${t('onb.sltToggle')}</label>
          <p class="hint">${t('onb.sltHint')}</p>`;
      case 'voice':
        return `<h1 tabindex="-1">${t('onb.voiceTitle')}</h1>
          <p>${t('onb.voiceBody')}</p>
          <div id="voice-status" class="voice-status"><p class="muted">${t('ex.preparing')}</p></div>`;
      default:
        return '';
    }
  }

  function collect() {
    const q = (sel) => root.querySelector(sel);
    switch (steps[step]) {
      case 'welcome':
        settings.disclaimerAccepted = q('#accept').checked;
        return settings.disclaimerAccepted;
      case 'who':
        draft.type = q('input[name=type]:checked').value;
        draft.name = q('#name').value.trim();
        draft.ageRange = q('#age').value;
        if (!AGE_RANGES[draft.type].includes(draft.ageRange)) draft.ageRange = AGE_RANGES[draft.type][draft.type === 'child' ? 2 : 0];
        draft.dailyGoalMin = draft.type === 'child' ? 5 : 10;
        return true;
      case 'hearing':
        draft.hearing = q('input[name=hearing]:checked').value;
        draft.side = q('#side').value;
        draft.goals = q('#goals').value.trim();
        draft.experience = q('#exp').value.trim();
        return true;
      case 'practice':
        draft.exerciseLang = q('#exLang').value;
        draft.dailyGoalMin = Number(q('input[name=goal]:checked').value);
        draft.sltEnabled = q('#slt').checked;
        settings.advanced = q('#adv').checked;
        return true;
      default:
        return true;
    }
  }

  function render() {
    const last = step === steps.length - 1;
    root.innerHTML = `<div class="onboarding">
      ${header()}
      <form class="onb-form" novalidate>
        ${body()}
        <div class="actions">
          <button class="btn primary large" type="submit">${last ? t('onb.finish') : t('common.next')}</button>
        </div>
      </form>
    </div>`;
    root.querySelector('h1')?.focus();

    const form = root.querySelector('form');
    const nextBtn = form.querySelector('button[type=submit]');

    if (steps[step] === 'welcome') {
      const accept = root.querySelector('#accept');
      const sync = () => { nextBtn.disabled = !accept.checked; };
      accept.addEventListener('change', sync);
      sync();
      root.querySelector('#uiLang').addEventListener('change', (e) => {
        settings.uiLang = e.target.value;
        draft.exerciseLang = e.target.value;
        setLocale(settings.uiLang);
        store.save();
        ctx.refreshShell();
        render();
      });
    }

    if (steps[step] === 'who') {
      root.querySelectorAll('input[name=type]').forEach((r) => r.addEventListener('change', () => {
        draft.type = r.value;
        const age = root.querySelector('#age');
        age.innerHTML = selectOptions(AGE_RANGES[draft.type].map((a) => [a, a]), AGE_RANGES[draft.type][draft.type === 'child' ? 2 : 0]);
      }));
    }

    if (steps[step] === 'voice') {
      const box = root.querySelector('#voice-status');
      const voicePrefs = { rate: draft.type === 'child' ? 0.85 : 0.95, accent: 'en-US' };
      voiceStatusBlock(ctx, draft.exerciseLang, voicePrefs.accent).then((html) => {
        box.innerHTML = html;
        bindVoiceTest(box, ctx, draft.exerciseLang, voicePrefs);
      });
    }

    root.querySelector('[data-act=back]')?.addEventListener('click', () => { step -= 1; render(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!collect()) return;
      if (!last) { step += 1; render(); return; }
      const profile = store.addProfile({ ...draft, slt: { enabled: draft.sltEnabled, goals: [], notes: [] } });
      ctx.clearTTSCache?.();
      settings.onboarded = true;
      store.save();
      ctx.applyPrefs();
      ctx.refreshShell();
      ctx.go('#/home');
      return profile;
    });
  }

  render();
}
