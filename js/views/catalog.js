// Beceriler kataloğu, beceri grubu ayrıntısı ve günlük yaşam senaryoları.
import { t } from '../i18n.js';
import { esc, icon, helpLink } from '../ui.js';
import { GROUPS, SCENARIO_GROUPS, getTask, TASKS, HIERARCHY, hierarchyOf, groupOf } from '../engine/registry.js';
import { levelName } from '../engine/levels.js';
import { noVoiceAlert, taskTitle, taskDesc, groupTitle, resumeBanner, bindResume } from './shared.js';

const REASON = { noVoice: 'cat.noTTS', voices: 'cat.needVoices', stereo: 'cat.needStereo', lang: 'cat.langOnly' };

function reasonFor(ctx, def, speechOk, voices) {
  const lang = ctx.store.activeProfile().exerciseLang;
  if (def.langs && !def.langs.includes(lang)) return 'lang';
  if (def.needsTTS && !speechOk) return 'noVoice';
  if (def.needsVoices && voices < def.needsVoices) return 'voices';
  if (def.needsStereo && !ctx.store.state.settings.stereoOk) return 'stereo';
  return null;
}

async function env(ctx) {
  const profile = ctx.store.activeProfile();
  const st = await ctx.ttsStatus(profile.exerciseLang, profile.voice.en.accent);
  const voices = (await ctx.distinctVoices(profile.exerciseLang)).length;
  return { profile, speechOk: st.ok, voices };
}

// Arama: başlık, açıklama ve grup adında; Türkçe büyük/küçük harf duyarsız.
export function searchTasks(query, hier, { title = taskTitle, desc = taskDesc, group = groupTitle } = {}) {
  const words = String(query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const order = GROUPS.flatMap((g) => g.tasks);
  return order.filter((id) => getTask(id)).filter((id) => {
    if (hier && hierarchyOf(id) !== hier) return false;
    if (!words.length) return true;
    const hay = `${title(id)} ${desc(id)} ${group(groupOf(id))}`.toLocaleLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

function taskRow(ctx, id, { speechOk, voices, levelFor, showGroup = false }) {
  const def = getTask(id);
  const reason = reasonFor(ctx, def, speechOk, voices);
  const meta = [];
  if (def.qa === 'required') meta.push(`<span class="tag info" title="${esc(t('cat.qaHint'))}">${t('cat.qa')}</span>`);
  const h = hierarchyOf(id);
  if (h) meta.push(`<span class="tag subtle">${t(`hier.${h}`)}</span>`);
  if (showGroup) meta.push(`<span class="tag subtle">${esc(groupTitle(groupOf(id)))}</span>`);
  return `<li class="task-row${reason ? ' is-disabled' : ''}">
      <div class="cat-text"><span class="cat-title">${esc(taskTitle(id))}</span><span class="cat-desc">${esc(taskDesc(id))}</span>
        <span class="task-meta">${reason ? `<span class="tag warn">${t(REASON[reason])}</span>` : `<span class="tag">${esc(levelName(levelFor(id)))}</span>`}${meta.join('')}</span></div>
      <div class="task-actions">
        ${reason ? (reason === 'stereo' ? `<a class="btn ghost small" href="#/settings#stereo">${t('cat.calibrate')}</a>` : reason === 'voices' ? `<a class="btn ghost small" href="#/qa">${t('nav.qa')}</a>` : '')
          : `<button class="btn primary small" data-start="${id}">${icon('play')}${t('common.start')}</button>
             <a class="btn ghost small" href="#/study?task=${id}">${t('skills.customize')}</a>`}
      </div></li>`;
}

function bindStart(root, ctx, profile) {
  root.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const def = getTask(b.dataset.start);
    await ctx.startSession({ source: 'skill', label: def.id, blocks: [{ task: def.id, count: def.input === 'multi' ? (profile.type === 'child' ? 2 : 3) : profile.prefs.sessionLength }] });
  }));
}

export async function skillsView(root, ctx, params) {
  const { profile, speechOk, voices } = await env(ctx);
  const levelFor = ctx.levelFor(profile, profile.exerciseLang);
  const st = { q: params?.get('q') || '', h: params?.get('h') || '' };
  const listHtml = () => {
    if (!st.q.trim() && !st.h) return '';
    const ids = searchTasks(st.q, st.h);
    return `<h2 class="h3">${t('cat.results')}</h2><p class="small muted" aria-live="polite">${esc(t('cat.found', { n: ids.length }))}</p>
      ${ids.length ? `<ul class="task-list">${ids.map((id) => taskRow(ctx, id, { speechOk, voices, levelFor, showGroup: true })).join('')}</ul>` : `<div class="empty"><p>${t('cat.noMatch')}</p></div>`}`;
  };
  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('nav.skills')}</h1>
    <p class="muted">${t('skills.intro')}</p></div>${helpLink('catalog', t('guide.helpHere'))}</div>
    ${resumeBanner(profile)}
    ${speechOk ? '' : noVoiceAlert(profile.exerciseLang)}
    <div class="cat-tools">
      <div class="field"><label for="cat-q">${t('cat.search')}</label><input id="cat-q" type="search" autocomplete="off" placeholder="${esc(t('cat.searchPh'))}" value="${esc(st.q)}"></div>
      <div class="chip-filter" role="group" aria-label="${esc(t('hier.label'))}">
        ${['', ...HIERARCHY].map((h) => `<button class="chipf${st.h === h ? ' on' : ''}" data-h="${h}" aria-pressed="${st.h === h}">${t(h ? `hier.${h}` : 'hier.all')}</button>`).join('')}
      </div>
    </div>
    <div id="cat-results">${listHtml()}</div>
    <ul class="group-list" id="cat-groups"${st.q.trim() || st.h ? ' hidden' : ''}>${GROUPS.map((g) => `<li><a class="group-row" href="${g.id === 'daily' ? '#/daily' : `#/group/${g.id}`}">
      <span class="cat-mark g-${g.id}" aria-hidden="true">${icon(g.id === 'sound' ? 'play' : 'wave')}</span>
      <span class="cat-text"><span class="cat-title">${esc(groupTitle(g.id))}</span><span class="cat-desc">${esc(t(`group.${g.id}.desc`))}</span></span>
      <span class="tag">${t('skills.count', { n: g.tasks.length })}</span></a></li>`).join('')}</ul>
    <p><a class="btn secondary" href="#/study">${icon('gear')}${t('home.study')}</a></p>`;
  bindResume(root, ctx);
  const refresh = () => {
    root.querySelector('#cat-results').innerHTML = listHtml();
    root.querySelector('#cat-groups').hidden = Boolean(st.q.trim() || st.h);
    root.querySelectorAll('[data-h]').forEach((b) => { const on = b.dataset.h === st.h; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    bindStart(root.querySelector('#cat-results'), ctx, profile);
    history.replaceState(null, '', `#/skills${st.q || st.h ? `?${new URLSearchParams({ ...(st.q ? { q: st.q } : {}), ...(st.h ? { h: st.h } : {}) })}` : ''}`);
  };
  root.querySelector('#cat-q').addEventListener('input', (e) => { st.q = e.target.value; refresh(); });
  root.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => { st.h = b.dataset.h; refresh(); }));
  bindStart(root.querySelector('#cat-results'), ctx, profile);
}

export async function groupView(root, ctx, groupId) {
  const group = GROUPS.find((g) => g.id === groupId);
  if (!group) { ctx.go('#/skills'); return; }
  const { profile, speechOk, voices } = await env(ctx);
  const levelFor = ctx.levelFor(profile, profile.exerciseLang);
  const rows = group.tasks.map((id) => taskRow(ctx, id, { speechOk, voices, levelFor })).join('');
  root.innerHTML = `<a href="#/skills" class="btn ghost small">${icon('back')}${t('common.back')}</a>
    <h1 tabindex="-1">${esc(groupTitle(group.id))}</h1>
    <p class="lead">${esc(t(`group.${group.id}.desc`))}</p>
    ${group.id === 'sound' ? `<p class="small muted">${t('note.notThreshold')}</p>` : ''}
    ${speechOk || group.id === 'sound' ? '' : noVoiceAlert(profile.exerciseLang)}
    <ul class="task-list">${rows}</ul>`;
  bindStart(root, ctx, profile);
}

export async function dailyView(root, ctx) {
  const { profile, speechOk, voices } = await env(ctx);
  const pack = await ctx.getPack(profile.exerciseLang);
  const counts = Object.fromEntries(SCENARIO_GROUPS.map((g) => [g, pack.scenarios.filter((s) => s.group === g && (s.aud === 'both' || s.aud === profile.type)).length]));
  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('home.daily')}</h1>
    <p class="muted">${t('daily.intro')}</p></div>${helpLink('daily', t('guide.helpHere'))}</div>
    ${speechOk ? '' : noVoiceAlert(profile.exerciseLang)}
    <ul class="group-list">${SCENARIO_GROUPS.filter((g) => counts[g]).map((g) => `<li><div class="group-row">
      <span class="cat-text"><span class="cat-title">${esc(t(`scgroup.${g}`))}</span><span class="cat-desc">${esc(t(`scgroup.${g}.desc`))}</span>
      ${g === 'public' || g === 'health' ? `<span class="small muted">${t('note.emergency')}</span>` : ''}</span>
      <span class="task-actions"><span class="tag">${t('daily.count', { n: counts[g] })}</span>
      <button class="btn primary small" data-group="${g}" ${speechOk ? '' : 'disabled'}>${icon('play')}${t('common.start')}</button></span></div></li>`).join('')}</ul>
    <section class="panel" aria-labelledby="dl-more">
      <h2 id="dl-more" class="h3">${t('daily.more')}</h2>
      <ul class="chip-links">
        ${['info', 'instructions', 'sent-reply', 'speaker-id'].map((id) => {
          const ok = ctx.taskAvailable(id, { speechOk, voices });
          return `<li>${ok ? `<button class="link-btn" data-task="${id}">${esc(taskTitle(id))}</button>` : `<span class="muted">${esc(taskTitle(id))} (${t(id === 'speaker-id' ? 'cat.needVoices' : 'cat.noTTS')})</span>`}</li>`;
        }).join('')}
      </ul>
    </section>`;
  root.querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    await ctx.startSession({ source: 'daily', label: `daily:${b.dataset.group}`, blocks: [{ task: 'dialogue', count: profile.type === 'child' ? 2 : 3, filter: { groups: [b.dataset.group] } }] });
  }));
  root.querySelectorAll('[data-task]').forEach((b) => b.addEventListener('click', async () => {
    const def = getTask(b.dataset.task);
    await ctx.startSession({ source: 'daily', label: def.id, blocks: [{ task: def.id, count: def.input === 'multi' ? 3 : profile.prefs.sessionLength }] });
  }));
}
