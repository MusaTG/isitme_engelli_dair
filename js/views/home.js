// Ana sayfa: hızlı başla, beceriler, günlük yaşam, kişisel plan, serbest çalışma.
import { t } from '../i18n.js';
import { esc, icon, goalRing } from '../ui.js';
import { minutesOn, suggestTasks } from '../engine/stats.js';
import { PATHS, GROUPS, getTask } from '../engine/registry.js';
import { noVoiceAlert, resumeBanner, bindResume, groupTitle } from './shared.js';
import { plannedToday } from '../goals.js';
import { startGoal } from './goals.js';
import { ensureReading } from '../reading/state.js';
import { metaById } from '../reading/data.js';

const DEFAULT_QUICK = {
  child: ['picture-pick', 'tone-same', 'word-pick', 'pair-pick', 'mem-order', 'instructions', 'sent-question', 'tone-count'],
  adult: ['word-pick', 'pair-pick', 'sent-question', 'paragraph', 'dialogue', 'info', 'sent-pick', 'pair-same'],
};
const TONE_ONLY = ['tone-same', 'tone-length', 'tone-count', 'tone-pitch', 'tone-pattern', 'tone-odd'];

export async function quickCandidates(ctx, profile, speechOk, voices) {
  const fromPlan = profile.plan.paths.flatMap((id) => PATHS.find((p) => p.id === id)?.blocks.map((b) => b.task) || []).concat(profile.plan.tasks || []);
  const base = fromPlan.length ? [...new Set(fromPlan)] : DEFAULT_QUICK[profile.type];
  const usable = base.filter((task) => ctx.taskAvailable(task, { speechOk, voices }));
  return usable.length ? usable : TONE_ONLY;
}

export async function startQuick(ctx, minutes) {
  const profile = ctx.store.activeProfile();
  const st = await ctx.ttsStatus(profile.exerciseLang, profile.voice.en.accent);
  const voices = (await ctx.distinctVoices(profile.exerciseLang)).length;
  const cands = await quickCandidates(ctx, profile, st.ok, voices);
  const nBlocks = minutes >= 15 ? 4 : 3;
  const per = minutes <= 5 ? 3 : minutes <= 10 ? 4 : 5;
  const tasks = suggestTasks(profile.sessions, cands, new Date(), nBlocks);
  return ctx.startSession({ source: 'quick', label: 'quick', blocks: tasks.map((task) => ({ task, count: getTask(task).input === 'multi' ? 1 : per })) });
}

export async function homeView(root, ctx) {
  const { store } = ctx;
  const profile = store.activeProfile();
  const lang = profile.exerciseLang;
  const st = await ctx.ttsStatus(lang, profile.voice.en.accent);
  const done = minutesOn(profile.sessions, new Date());
  const goal = profile.dailyGoalMin;
  const name = profile.name ? `, ${profile.name}` : '';
  const pathCount = profile.plan.paths.length;
  const R = ensureReading(profile);
  const lastRead = Object.entries(R.progress).filter(([, p]) => p.status === 'reading').sort((a, b) => String(b[1].lastAt).localeCompare(String(a[1].lastAt)))[0];
  const lastMeta = lastRead ? await metaById(ctx.library, R, lastRead[0]).catch(() => null) : null;

  root.innerHTML = `
    <h1 tabindex="-1" class="greet">${esc(t('home.greeting', { name }))}</h1>
    ${resumeBanner(profile)}
    <section class="today" aria-labelledby="today-h">
      ${goalRing(done, goal, t('home.todayProgress', { done: Math.floor(done), goal }))}
      <div class="today-text">
        <h2 id="today-h" class="h3">${t('home.todayTitle')}</h2>
        <p class="today-num">${t('home.todayProgress', { done: Math.floor(done), goal })}</p>
        <p class="muted">${done >= goal ? t('home.goalDone') : t('home.goalOpen')}</p>
      </div>
    </section>
    ${st.ok ? '' : noVoiceAlert(lang)}
    ${todayPlan(profile)}
    ${lastMeta ? `<section class="panel read-mini" aria-labelledby="rm-h"><h2 id="rm-h" class="h3">${icon('book')}${t('rd.continueTitle')}</h2>
      <p><strong>${esc(lastMeta.title)}</strong> <span class="small muted">${esc(t('rd.homePct', { pct: Math.round((lastRead[1].pct || 0) * 100) }))}</span></p>
      <a class="btn primary small" href="#/read/text/${esc(lastMeta.id)}">${t('rd.continue')}</a> <a class="btn ghost small" href="#/read">${t('nav.read')}</a></section>` : ''}

    <section class="quick" aria-labelledby="quick-h">
      <div class="quick-head">
        <span class="suggest-play" aria-hidden="true">${icon('play')}</span>
        <div><h2 id="quick-h" class="h3">${t('home.quick')}</h2><p class="muted small">${t(pathCount ? 'home.quickPlan' : 'home.quickDefault')}</p></div>
      </div>
      <div class="segmented" role="group" aria-label="${esc(t('home.quickLength'))}">
        ${[5, 10, 15].map((m) => `<button class="btn ${m === 10 ? 'primary' : 'secondary'}" data-quick="${m}">${t('common.minutes', { n: m })}</button>`).join('')}
      </div>
    </section>

    <nav class="hub" aria-label="${esc(t('home.sections'))}">
      <a class="hub-item" href="#/skills">${icon('grid')}<span><strong>${t('nav.skills')}</strong><span class="small muted">${t('home.skillsDesc')}</span></span></a>
      <a class="hub-item" href="#/read">${icon('book')}<span><strong>${t('nav.read')}</strong><span class="small muted">${t('rd.hubDesc')}</span></span></a>
      <a class="hub-item" href="#/daily">${icon('wave')}<span><strong>${t('home.daily')}</strong><span class="small muted">${t('home.dailyDesc')}</span></span></a>
      <a class="hub-item" href="#/plan">${icon('grid')}<span><strong>${t('nav.plan')}</strong><span class="small muted">${pathCount ? t('home.planCount', { n: pathCount }) : t('home.planDesc')}</span></span></a>
      <a class="hub-item" href="#/goals">${icon('notes')}<span><strong>${t('nav.goals')}</strong><span class="small muted">${t('goal.pathsDescShort')}</span></span></a>
      <a class="hub-item" href="#/guide">${icon('info')}<span><strong>${t('nav.guide')}</strong><span class="small muted">${t('guide.intro')}</span></span></a>
      ${store.state.settings.advanced ? `<a class="hub-item" href="#/study">${icon('gear')}<span><strong>${t('home.study')}</strong><span class="small muted">${t('home.studyDesc')}</span></span></a>` : ''}
    </nav>

    <section aria-labelledby="sk-h">
      <h2 id="sk-h" class="h3">${t('home.skillShortcuts')}</h2>
      <ul class="chip-links">${GROUPS.filter((g) => g.id !== 'daily').map((g) => `<li><a href="#/group/${g.id}">${esc(groupTitle(g.id))}</a></li>`).join('')}</ul>
    </section>
    <p class="small muted">${esc(t('common.lastNote'))}</p>`;
  bindResume(root, ctx);
  root.querySelectorAll('[data-today]').forEach((b) => b.addEventListener('click', async () => {
    const g = profile.goalsV3.find((x) => x.id === b.dataset.today);
    if (g) { b.disabled = true; await startGoal(ctx, g); b.disabled = false; }
  }));
  root.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    await startQuick(ctx, Number(b.dataset.quick));
  }));
}

// "Bugünün planı": bugün çalışma günü olarak seçilmiş etkin hedefler.
function todayPlan(profile) {
  const goals = (profile.goalsV3 || []).filter((g) => profile.slt?.enabled || g.source !== 'specialist');
  if (!goals.some((g) => g.status === 'active')) return '';
  const list = plannedToday(goals);
  return `<section class="panel today-plan" aria-labelledby="tp-h">
    <h2 id="tp-h" class="h3">${t('home.today')}</h2>
    ${list.length ? `<ul class="task-mini">${list.map((g) => `<li><span><a href="#/goal/${g.id}">${esc(g.title)}</a> <span class="small muted">${esc(t('home.todayMin', { n: g.plan.minutes || 10 }))}</span></span>
      <button class="btn primary small" data-today="${g.id}">${icon('play')}${t('goal.start')}</button></li>`).join('')}</ul>`
      : `<p class="muted small">${t('home.todayEmpty')} <a class="link" href="#/goals">${t('home.todaySetup')}</a></p>`}
  </section>`;
}
