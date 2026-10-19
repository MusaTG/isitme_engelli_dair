import { t } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';

export function langName(lang) {
  return t(`lang.${lang}`).replace(/\s*\(.*\)$/, '');
}

export const taskTitle = (id) => t(`task.${id}.title`);
export const taskDesc = (id) => t(`task.${id}.desc`);
export const groupTitle = (id) => t(`group.${id}.title`);

export function ttsErrorMessage(err, lang) {
  if (err?.code === 'no-voice') return t('ex.ttsError.noVoice', { lang: langName(lang) });
  if (err?.code === 'unsupported') return t('ex.ttsError.unsupported');
  if (err?.code === 'empty-output') return t('ex.ttsError.empty');
  return t('ex.ttsError.failed', { detail: err?.detail || err?.message || '?' });
}

export function voiceHelpHtml(open = false) {
  return `<details class="help"${open ? ' open' : ''}>
    <summary>${t('help.voiceTitle')}</summary>
    <ul>
      <li>${esc(t('help.android'))}</li>
      <li>${esc(t('help.ios'))}</li>
      <li>${esc(t('help.windows'))}</li>
      <li>${esc(t('help.mac'))}</li>
    </ul>
    <p class="hint">${esc(t('help.after'))}</p>
  </details>`;
}

export async function voiceStatusBlock(ctx, lang, accent) {
  const status = await ctx.ttsStatus(lang, accent);
  if (!status.ok) {
    const msg = status.code === 'unsupported' ? t('ex.ttsError.unsupported') : t('set.voiceNone', { lang: langName(lang) });
    return `<div class="alert warn" role="status">${icon('info')}<div><p>${esc(msg)}</p>${voiceHelpHtml(true)}</div></div>`;
  }
  const v = status.voices[0];
  return `<div class="voice-ok">
    <p>${icon('check')} <strong>${esc(v.name)}</strong> <span class="muted">(${esc(v.lang)}, ${v.localService ? t('set.voiceOffline') : t('set.voiceOnline')})</span></p>
    <button type="button" class="btn secondary" data-act="test-voice">${icon('play')}${t('set.test')}</button>
  </div>`;
}

export function bindVoiceTest(scope, ctx, lang, prefs) {
  scope.querySelector('[data-act=test-voice]')?.addEventListener('click', async () => {
    try {
      await ctx.tts.speak(t(`set.testText.${lang}`), { lang, ...prefs });
    } catch (err) {
      toast(ttsErrorMessage(err, lang));
    }
  });
}

export function noVoiceAlert(lang) {
  return `<div class="alert warn" role="status">${icon('info')}<div><p>${esc(t('home.noVoice', { lang: langName(lang) }))}</p>${voiceHelpHtml(false)}</div></div>`;
}

export function resumeBanner(profile) {
  const a = profile.activeSession;
  if (!a || !a.items?.length || a.finished) return '';
  const done = a.results.length;
  return `<div class="resume" role="region" aria-label="${esc(t('resume.title'))}">
    <div><strong>${t('resume.title')}</strong><p class="small muted">${esc(t('resume.body', { done, total: a.items.length }))}</p></div>
    <div class="resume-actions"><a class="btn primary" href="#/run">${t('resume.continue')}</a><button class="btn ghost small" data-act="discard">${t('resume.discard')}</button></div>
  </div>`;
}

export function bindResume(root, ctx) {
  root.querySelector('[data-act=discard]')?.addEventListener('click', () => {
    ctx.store.activeProfile().activeSession = null;
    ctx.store.save();
    ctx.rerender();
  });
}
