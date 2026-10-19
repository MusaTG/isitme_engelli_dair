// Hedefler ve seans notları. Kişisel hedefler her zaman; uzmanın verdiği hedefler ve uzman notları
// yalnızca DKT bölümü açıkken görünür. Uygulama hiçbir hedefin uzman tarafından reçete edildiğini
// veya klinik olarak doğrulandığını iddia etmez; "uzmanın verdiği" kullanıcının kendi beyanıdır.
import { t, formatDate, pct } from '../i18n.js';
import { esc, icon, toast, toastAction, download, selectOptions, helpLink } from '../ui.js';
import { GROUPS, getTask } from '../engine/registry.js';
import { summarize } from '../engine/stats.js';
import {
  newGoal, newNote, noteIsEmpty, goalStats, filterGoals, filterNotes, suggestTasksFor,
  GOAL_STATUS, PRIORITY, NOTE_TYPES, DOMAINS,
} from '../goals.js';
import { taskTitle, groupTitle, langName } from './shared.js';
import { LEVEL_IDS, levelName } from '../engine/levels.js';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const todayISO = () => new Date().toISOString().slice(0, 10);

function chip(cls, text) { return `<span class="tag ${cls}">${esc(text)}</span>`; }

function statusChip(g) { return chip(`st-${g.status}`, t(`goal.status.${g.status}`)); }
function priorityChip(g) { return g.priority === 'normal' ? '' : chip(`pr-${g.priority}`, t(`goal.priority.${g.priority}`)); }
function sourceChip(g) { return g.source === 'specialist' ? chip('info', t('goal.source.specialist')) : ''; }

function goalBlocks(ctx, goal, profile, avail) {
  const tasks = goal.tasks.filter((x) => avail(x));
  const per = Math.max(3, Math.round((profile.prefs.sessionLength || 8) / Math.max(1, Math.min(3, tasks.length))));
  const ov = {};
  if (goal.preset?.level) ov.level = goal.preset.level;
  if (goal.preset?.options) ov.options = goal.preset.options;
  if (goal.preset?.noise) ov.noise = goal.preset.noise;
  return tasks.slice(0, 4).map((task) => ({ task, count: getTask(task).input === 'multi' ? 2 : per, overrides: { ...ov } }));
}

async function env(ctx) {
  const p = ctx.store.activeProfile();
  const st = await ctx.ttsStatus(p.exerciseLang, p.voice.en.accent);
  const voices = (await ctx.distinctVoices(p.exerciseLang)).length;
  return { p, avail: (task) => ctx.taskAvailable(task, { speechOk: st.ok, voices }) };
}

export async function startGoal(ctx, goal) {
  const { p, avail } = await env(ctx);
  const blocks = goalBlocks(ctx, goal, p, avail);
  if (!blocks.length) { toast(t('goal.noTasks')); return; }
  await ctx.startSession({ source: 'goal', label: `goal:${goal.id}`, goalId: goal.id, ...(goal.lang ? { lang: goal.lang } : {}), blocks });
}

function goalCard(g, stats, sltEnabled) {
  const showStart = g.status === 'active' || g.status === 'paused';
  return `<li class="goal-card st-${g.status}" data-goal="${g.id}">
    <div class="goal-head">
      <a class="goal-title" href="#/goal/${g.id}">${esc(g.title)}</a>
      <span class="goal-chips">${statusChip(g)}${priorityChip(g)}${sltEnabled ? sourceChip(g) : ''}${stats.overdue ? chip('warn', t('goal.overdue')) : ''}</span>
    </div>
    ${g.desc ? `<p class="small muted clamp">${esc(g.desc)}</p>` : ''}
    <p class="small goal-meta">
      ${g.group ? `<span>${esc(groupTitle(g.group))}</span>` : ''}
      ${g.tasks.length ? `<span>${esc(t('goal.taskCount', { n: g.tasks.length }))}</span>` : `<span class="warn-text">${t('goal.noTasksShort')}</span>`}
      <span>${stats.last ? esc(t('goal.lastStudied', { date: formatDate(stats.last) })) : t('goal.notStudied')}</span>
      ${g.due ? `<span>${esc(t('goal.dueOn', { date: formatDate(`${g.due}T12:00`) }))}</span>` : ''}
    </p>
    ${stats.plannedWeek ? `<div class="week-bar" aria-label="${esc(t('goal.weekProgress', { done: stats.weekMin, plan: stats.plannedWeek }))}"><span style="width:${Math.min(100, (stats.weekMin / stats.plannedWeek) * 100)}%"></span></div>
      <p class="small muted">${esc(t('goal.weekProgress', { done: stats.weekMin, plan: stats.plannedWeek }))}</p>` : ''}
    <div class="quick-actions">
      ${showStart ? `<button class="btn primary small" data-start="${g.id}">${icon('play')}${t('goal.start')}</button>` : ''}
      <a class="btn secondary small" href="#/notes/new?goal=${g.id}">${icon('notes')}${t('goal.addNote')}</a>
      <a class="btn ghost small" href="#/goals/edit/${g.id}">${t('goal.edit')}</a>
      ${g.status !== 'done' && g.status !== 'archived' ? `<button class="btn ghost small" data-done="${g.id}">${icon('check')}${t('goal.markDone')}</button>` : ''}
    </div>
  </li>`;
}

// ---------- Hedef listesi ----------
export async function goalsView(root, ctx, params) {
  const { store } = ctx;
  const p = store.activeProfile();
  const slt = p.slt.enabled;
  const st = { status: params.get('status') || 'open', source: params.get('source') || 'all' };

  function render() {
    const list = filterGoals(p.goalsV3, { ...st, sltEnabled: slt });
    const counts = Object.fromEntries(GOAL_STATUS.map((s) => [s, p.goalsV3.filter((g) => g.status === s && (slt || g.source !== 'specialist')).length]));
    const notesCount = filterNotes(p.notesV3, { sltEnabled: slt }).length;
    root.innerHTML = `<div class="page-head">
        <div><h1 tabindex="-1">${t(slt ? 'goal.titleSlt' : 'goal.title')}</h1>
        <p class="muted">${t(slt ? 'goal.introSlt' : 'goal.intro')}</p></div>
        <div class="page-actions"><a class="btn primary" href="#/goals/new">${icon('plus')}${t('goal.new')}</a>
        ${helpLink('goals', t('guide.helpHere'))}</div>
      </div>
      <div class="tabbar" role="tablist" aria-label="${esc(t('goal.filterStatus'))}">
        ${[['open', counts.active + counts.paused], ['done', counts.done], ['archived', counts.archived], ['all', null]].map(([k, n]) => `<button role="tab" class="tab${st.status === k ? ' on' : ''}" aria-selected="${st.status === k}" data-status="${k}">${t(`goal.tab.${k}`)}${n !== null ? ` <span class="count">${n}</span>` : ''}</button>`).join('')}
        ${slt ? `<label class="tab-select"><span class="sr-only">${t('goal.filterSource')}</span><select id="src">${selectOptions([['all', t('goal.source.all')], ['self', t('goal.source.self')], ['specialist', t('goal.source.specialist')]], st.source)}</select></label>` : ''}
      </div>
      ${list.length ? `<ul class="goal-list2">${list.map((g) => goalCard(g, goalStats(g, p.sessions), slt)).join('')}</ul>`
        : `<div class="empty"><p>${t(st.status === 'open' ? 'goal.emptyOpen' : 'goal.empty')}</p><a class="btn primary" href="#/goals/new">${icon('plus')}${t('goal.new')}</a></div>`}
      <section class="panel split-links" aria-labelledby="more-h"><h2 id="more-h" class="h3">${t('goal.more')}</h2>
        <ul class="link-rows">
          <li><a href="#/notes">${icon('notes')}<span><strong>${t('notes.title')}</strong><span class="small muted">${esc(t('notes.count', { n: notesCount }))}</span></span></a></li>
          <li><a href="#/plan">${icon('grid')}<span><strong>${t('plan.paths')}</strong><span class="small muted">${t('goal.pathsDesc')}</span></span></a></li>
          <li><a href="#/goals/report">${icon('download')}<span><strong>${t('slt.report')}</strong><span class="small muted">${t('goal.reportDesc')}</span></span></a></li>
        </ul>
      </section>
      <p class="small muted">${t('goal.disclaimer')}</p>`;
    root.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => { st.status = b.dataset.status; render(); }));
    root.querySelector('#src')?.addEventListener('change', (e) => { st.source = e.target.value; render(); });
    bindQuick(root, ctx, p, render);
  }
  render();
}

function bindQuick(root, ctx, p, rerender) {
  root.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    await startGoal(ctx, p.goalsV3.find((g) => g.id === b.dataset.start));
    b.disabled = false;
  }));
  root.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => {
    const g = p.goalsV3.find((x) => x.id === b.dataset.done);
    const prev = g.status;
    g.status = 'done';
    g.completedAt = new Date().toISOString();
    g.updatedAt = g.completedAt;
    ctx.store.save();
    rerender();
    toastAction(t('goal.doneToast'), t('common.undo'), () => { g.status = prev; g.completedAt = null; ctx.store.save(); rerender(); });
  }));
}

// ---------- Hedef ayrıntısı ----------
export async function goalDetailView(root, ctx, id) {
  const { store } = ctx;
  const p = store.activeProfile();
  const g = p.goalsV3.find((x) => x.id === id);
  if (!g) { ctx.go('#/goals'); return; }
  const { avail } = await env(ctx);

  function render() {
    const s = goalStats(g, p.sessions);
    const notes = filterNotes(p.notesV3, { goal: g.id, sltEnabled: p.slt.enabled });
    root.innerHTML = `<a href="#/goals" class="btn ghost small">${icon('back')}${t('goal.backToList')}</a>
      <div class="page-head"><div>
        <h1 tabindex="-1">${esc(g.title)}</h1>
        <p class="goal-chips">${statusChip(g)}${priorityChip(g)}${p.slt.enabled ? sourceChip(g) : ''}${s.overdue ? chip('warn', t('goal.overdue')) : ''}</p>
      </div>${helpLink('goals', t('guide.helpHere'))}</div>
      ${g.desc ? `<p class="lead">${esc(g.desc)}</p>` : ''}
      <div class="quick-actions big">
        ${g.status === 'active' || g.status === 'paused' ? `<button class="btn primary" data-start="${g.id}">${icon('play')}${t('goal.start')}</button>` : ''}
        <a class="btn secondary" href="#/notes/new?goal=${g.id}">${icon('notes')}${t('goal.addNote')}</a>
        <a class="btn secondary" href="#/goals/edit/${g.id}">${t('goal.edit')}</a>
        ${g.status === 'active' ? `<button class="btn ghost" data-set="paused">${t('goal.pause')}</button>` : ''}
        ${g.status === 'paused' || g.status === 'done' || g.status === 'archived' ? `<button class="btn ghost" data-set="active">${t('goal.activate')}</button>` : ''}
        ${g.status !== 'done' && g.status !== 'archived' ? `<button class="btn ghost" data-done="${g.id}">${icon('check')}${t('goal.markDone')}</button>` : ''}
        ${g.status !== 'archived' ? `<button class="btn ghost" data-set="archived">${t('goal.archive')}</button>` : ''}
      </div>
      ${g.domain !== 'auditory' ? `<p class="alert info small">${icon('info')}<span>${t('slt.notInApp')}</span></p>` : ''}
      <dl class="stats">
        <div><dt>${t('goal.sessions')}</dt><dd>${s.sessions}${g.target ? `<small> / ${g.target}</small>` : ''}</dd></div>
        <div><dt>${t('prog.accuracy')}</dt><dd>${esc(pct(s.accuracy))}</dd></div>
        <div><dt>${t('prog.minutes')}</dt><dd>${s.minutes}</dd></div>
        <div><dt>${t('goal.thisWeek')}</dt><dd class="small-dd">${s.plannedWeek ? esc(t('goal.weekShort', { done: s.weekMin, plan: s.plannedWeek })) : esc(t('common.minutes', { n: s.weekMin }))}</dd></div>
      </dl>
      <section class="panel" aria-labelledby="gd-info"><h2 id="gd-info" class="h3">${t('goal.details')}</h2>
        <dl class="kv">
          <dt>${t('goal.f.group')}</dt><dd>${g.group ? esc(groupTitle(g.group)) : '–'}</dd>
          <dt>${t('goal.f.domain')}</dt><dd>${esc(t(`domain.${g.domain}`))}</dd>
          <dt>${t('goal.f.lang')}</dt><dd>${g.lang ? esc(langName(g.lang)) : t('goal.anyLang')}</dd>
          <dt>${t('goal.f.start')}</dt><dd>${esc(formatDate(`${g.start}T12:00`))}</dd>
          <dt>${t('goal.f.due')}</dt><dd>${g.due ? esc(formatDate(`${g.due}T12:00`)) : '–'}</dd>
          <dt>${t('goal.f.plan')}</dt><dd>${g.plan.days.length ? esc(`${g.plan.days.map((d) => t(`day.${d}`)).join(', ')} · ${t('common.minutes', { n: g.plan.minutes })}`) : '–'}</dd>
          <dt>${t('goal.f.preset')}</dt><dd>${g.preset ? esc(presetText(g.preset)) : t('goal.presetNone')}</dd>
          <dt>${t('goal.lastStudiedLabel')}</dt><dd>${s.last ? esc(formatDate(s.last)) : t('goal.notStudied')}</dd>
        </dl>
        ${g.specialistNote ? `<h3 class="h4">${t('goal.f.specialistNote')}</h3><p class="note-text">${esc(g.specialistNote)}</p>` : ''}
        ${g.ownNote ? `<h3 class="h4">${t('goal.f.ownNote')}</h3><p class="note-text">${esc(g.ownNote)}</p>` : ''}
      </section>
      <section class="panel" aria-labelledby="gd-tasks"><h2 id="gd-tasks" class="h3">${t('goal.f.tasks')}</h2>
        ${g.tasks.length ? `<ul class="task-mini">${g.tasks.map((x) => `<li><span>${esc(taskTitle(x))}</span>${avail(x) ? `<button class="btn ghost small" data-one="${x}">${icon('play')}${t('common.start')}</button>` : `<span class="tag warn">${t('goal.unavailable')}</span>`}</li>`).join('')}</ul>`
          : `<p class="muted">${t('goal.noTasks')}</p>`}
        <a class="btn ghost small" href="#/goals/edit/${g.id}#tasks">${t('goal.editTasks')}</a>
      </section>
      <section class="panel" aria-labelledby="gd-hist"><h2 id="gd-hist" class="h3">${t('goal.history')}</h2>
        ${s.history.length ? `<table class="table"><thead><tr><th scope="col">${t('prog.tableDate')}</th><th scope="col">${t('prog.tableScore')}</th><th scope="col">${t('goal.histKind')}</th></tr></thead>
          <tbody>${s.history.map((h) => `<tr><td>${esc(formatDate(h.date))}</td><td>${h.items ? `${h.correct}/${h.items}` : '–'}</td><td>${t(h.direct ? 'goal.histDirect' : 'goal.histRelated')}</td></tr>`).join('')}</tbody></table>
          <p class="hint">${t('goal.historyHint')}</p>` : `<p class="muted">${t('goal.noHistory')}</p>`}
      </section>
      <section class="panel" aria-labelledby="gd-notes"><h2 id="gd-notes" class="h3">${t('notes.title')}</h2>
        ${notes.length ? `<ul class="note-cards">${notes.slice(0, 5).map(noteCard).join('')}</ul>${notes.length > 5 ? `<a class="link" href="#/notes?goal=${g.id}">${t('notes.all')}</a>` : ''}` : `<p class="muted">${t('notes.emptyGoal')}</p>`}
        <a class="btn secondary small" href="#/notes/new?goal=${g.id}">${icon('plus')}${t('goal.addNote')}</a>
      </section>
      <p><button class="btn danger-ghost small" data-act="delete">${icon('trash')}${t('goal.delete')}</button></p>`;
    root.querySelector('h1').focus();
    bindQuick(root, ctx, p, render);
    root.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
      const prev = g.status;
      g.status = b.dataset.set;
      g.updatedAt = new Date().toISOString();
      store.save();
      render();
      toastAction(t(`goal.setToast.${g.status}`), t('common.undo'), () => { g.status = prev; store.save(); render(); });
    }));
    root.querySelectorAll('[data-one]').forEach((b) => b.addEventListener('click', async () => {
      const task = b.dataset.one;
      await ctx.startSession({ source: 'goal', label: `goal:${g.id}`, goalId: g.id, ...(g.lang ? { lang: g.lang } : {}), blocks: [{ task, count: getTask(task).input === 'multi' ? 2 : p.prefs.sessionLength }] });
    }));
    root.querySelector('[data-act=delete]').addEventListener('click', () => {
      if (!window.confirm(t('goal.deleteConfirm'))) return;
      const idx = p.goalsV3.indexOf(g);
      p.goalsV3.splice(idx, 1);
      store.save();
      ctx.go('#/goals');
      toastAction(t('goal.deletedToast'), t('common.undo'), () => { p.goalsV3.splice(idx, 0, g); store.save(); ctx.go(`#/goal/${g.id}`); });
    });
  }
  render();
}

function presetText(pr) {
  const parts = [];
  if (pr.level) parts.push(levelName(pr.level));
  if (pr.options) parts.push(t('goal.presetOptions', { n: pr.options }));
  if (pr.noise) parts.push(t('ex.noise', { level: t(`ex.noiseLevel.${pr.noise}`) }));
  return parts.join(' · ') || t('goal.presetNone');
}

// ---------- Hedef oluştur / düzenle ----------
export async function goalEditView(root, ctx, id) {
  const { store } = ctx;
  const p = store.activeProfile();
  const existing = id ? p.goalsV3.find((x) => x.id === id) : null;
  if (id && !existing) { ctx.go('#/goals'); return; }
  const g = existing ? { ...existing, plan: { ...existing.plan }, tasks: [...existing.tasks], preset: existing.preset ? { ...existing.preset } : null } : newGoal({ lang: p.exerciseLang });
  const slt = p.slt.enabled;
  const { avail } = await env(ctx);
  let filterText = '';

  function taskList() {
    const needle = filterText.trim().toLocaleLowerCase();
    return GROUPS.map((gr) => {
      const rows = gr.tasks.filter((x) => !needle || taskTitle(x).toLocaleLowerCase().includes(needle) || groupTitle(gr.id).toLocaleLowerCase().includes(needle));
      if (!rows.length) return '';
      return `<fieldset class="task-group"><legend>${esc(groupTitle(gr.id))}</legend>${rows.map((x) => `<label class="check small"><input type="checkbox" name="task" value="${x}"${g.tasks.includes(x) ? ' checked' : ''}> ${esc(taskTitle(x))}${avail(x) ? '' : ` <span class="muted">(${t('goal.unavailable')})</span>`}</label>`).join('')}</fieldset>`;
    }).join('');
  }

  function render() {
    root.innerHTML = `<a href="${existing ? `#/goal/${g.id}` : '#/goals'}" class="btn ghost small">${icon('back')}${t('common.back')}</a>
      <div class="page-head"><h1 tabindex="-1">${t(existing ? 'goal.editTitle' : 'goal.newTitle')}</h1>${helpLink('goals', t('guide.helpHere'))}</div>
      <form class="goal-editor" novalidate>
        <div id="form-errors" role="alert"></div>
        <section class="panel"><h2 class="h3">${t('goal.sec.basic')}</h2>
          <div class="field"><label for="g-title">${t('goal.f.title')} <span class="req" aria-hidden="true">*</span></label>
            <input id="g-title" maxlength="120" required value="${esc(g.title)}" placeholder="${esc(t('goal.ph.title'))}" aria-describedby="g-title-err"><p class="field-error" id="g-title-err"></p></div>
          <div class="field"><label for="g-desc">${t('goal.f.desc')} <span class="muted">(${t('common.optional')})</span></label><textarea id="g-desc" rows="2" maxlength="500">${esc(g.desc)}</textarea></div>
          <div class="grid2">
            ${slt ? `<div class="field"><label for="g-source">${t('goal.f.source')}</label><select id="g-source">${selectOptions([['self', t('goal.source.self')], ['specialist', t('goal.source.specialist')]], g.source)}</select><p class="hint">${t('goal.sourceHint')}</p></div>` : ''}
            <div class="field"><label for="g-domain">${t('goal.f.domain')}</label><select id="g-domain">${selectOptions(DOMAINS.map((d) => [d, t(`domain.${d}`)]), g.domain)}</select></div>
            <div class="field"><label for="g-group">${t('goal.f.group')}</label><select id="g-group">${selectOptions([['', t('goal.groupNone')], ...GROUPS.map((x) => [x.id, groupTitle(x.id)])], g.group)}</select></div>
            <div class="field"><label for="g-lang">${t('goal.f.lang')}</label><select id="g-lang">${selectOptions([['', t('goal.anyLang')], ['tr', t('lang.tr')], ['en', t('lang.en')]], g.lang)}</select></div>
            <div class="field"><label for="g-priority">${t('goal.f.priority')}</label><select id="g-priority">${selectOptions(PRIORITY.map((x) => [x, t(`goal.priority.${x}`)]), g.priority)}</select></div>
            ${existing ? `<div class="field"><label for="g-status">${t('goal.f.status')}</label><select id="g-status">${selectOptions(GOAL_STATUS.map((x) => [x, t(`goal.status.${x}`)]), g.status)}</select></div>` : ''}
          </div>
        </section>
        <section class="panel"><h2 class="h3">${t('goal.sec.dates')}</h2>
          <div class="grid2">
            <div class="field"><label for="g-start">${t('goal.f.start')}</label><input id="g-start" type="date" value="${esc(g.start)}"></div>
            <div class="field"><label for="g-due">${t('goal.f.due')} <span class="muted">(${t('common.optional')})</span></label><input id="g-due" type="date" value="${esc(g.due)}" aria-describedby="g-due-err"><p class="field-error" id="g-due-err"></p></div>
            <div class="field"><label for="g-target">${t('slt.target')}</label><input id="g-target" type="number" min="0" max="500" inputmode="numeric" value="${g.target}"></div>
            <div class="field"><label for="g-min">${t('goal.f.minutes')}</label><select id="g-min">${selectOptions([5, 10, 15, 20, 30].map((m) => [m, t('common.minutes', { n: m })]), g.plan.minutes)}</select></div>
          </div>
          <fieldset class="field"><legend>${t('goal.f.days')}</legend>
            <div class="day-pick">${DAYS.map((d) => `<label><input type="checkbox" name="day" value="${d}"${g.plan.days.includes(d) ? ' checked' : ''}><span>${t(`day.${d}`)}</span></label>`).join('')}</div>
            <p class="hint">${t('goal.daysHint')}</p></fieldset>
        </section>
        <section class="panel" id="tasks"><h2 class="h3">${t('goal.f.tasks')}</h2>
          <p class="hint">${t('goal.tasksHint')}</p>
          <div class="add-row"><label class="sr-only" for="t-filter">${t('goal.taskSearch')}</label><input id="t-filter" type="search" placeholder="${esc(t('goal.taskSearch'))}" value="${esc(filterText)}">
            <button type="button" class="btn secondary" data-act="suggest"${g.group ? '' : ' disabled'}>${t('goal.suggest')}</button></div>
          <div id="task-box" class="task-box">${taskList()}</div>
        </section>
        <section class="panel"><h2 class="h3">${t('goal.f.preset')}</h2>
          <p class="hint">${t('goal.presetHint')}</p>
          <div class="grid2">
            <div class="field"><label for="g-level">${t('study.level')}</label><select id="g-level">${selectOptions([['', t('set.levelAuto')], ...LEVEL_IDS.map((n) => [n, levelName(n)])], g.preset?.level || '')}</select></div>
            <div class="field"><label for="g-opts">${t('study.options')}</label><select id="g-opts">${selectOptions([['', t('study.auto')], ...[2, 3, 4, 5, 6, 8, 10].map((n) => [n, String(n)])], g.preset?.options || '')}</select></div>
            <div class="field"><label for="g-noise">${t('study.noise')}</label><select id="g-noise">${selectOptions([['0', t('study.noNoise')], ['1', t('ex.noiseLevel.1')], ['2', t('ex.noiseLevel.2')], ['3', t('ex.noiseLevel.3')]], g.preset?.noise || 0)}</select></div>
          </div>
        </section>
        <section class="panel"><h2 class="h3">${t('goal.sec.notes')}</h2>
          ${slt ? `<div class="field" id="spec-field"${g.source === 'specialist' ? '' : ' hidden'}><label for="g-spec">${t('goal.f.specialistNote')}</label><textarea id="g-spec" rows="3" maxlength="1000">${esc(g.specialistNote)}</textarea><p class="hint">${t('goal.specNoteHint')}</p></div>` : ''}
          <div class="field"><label for="g-own">${t('goal.f.ownNote')}</label><textarea id="g-own" rows="3" maxlength="1000">${esc(g.ownNote)}</textarea></div>
        </section>
        <div class="actions sticky-actions"><button class="btn primary large" type="submit">${t(existing ? 'common.save' : 'goal.create')}</button>
          <a class="btn ghost" href="${existing ? `#/goal/${g.id}` : '#/goals'}">${t('common.cancel')}</a></div>
      </form>`;
    root.querySelector('h1').focus();
    if (location.hash.endsWith('#tasks')) root.querySelector('#tasks').scrollIntoView();
    bind();
  }

  function collect() {
    const $ = (s) => root.querySelector(s);
    Object.assign(g, {
      title: $('#g-title').value.trim(), desc: $('#g-desc').value.trim(),
      source: slt ? $('#g-source').value : g.source, domain: $('#g-domain').value, group: $('#g-group').value, lang: $('#g-lang').value,
      priority: $('#g-priority').value, start: $('#g-start').value || todayISO(), due: $('#g-due').value,
      target: Math.max(0, Number($('#g-target').value) || 0), ownNote: $('#g-own').value.trim(),
    });
    if (slt) g.specialistNote = $('#g-spec').value.trim();
    if ($('#g-status')) g.status = $('#g-status').value;
    g.plan = { days: [...root.querySelectorAll('input[name=day]:checked')].map((x) => Number(x.value)), minutes: Number($('#g-min').value) };
    syncTasks();
    const level = Number($('#g-level').value) || null, options = Number($('#g-opts').value) || null, noise = Number($('#g-noise').value) || 0;
    g.preset = level || options || noise ? { level, options, noise } : null;
  }
  function syncTasks() {
    const visible = [...root.querySelectorAll('input[name=task]')];
    const checked = new Set(visible.filter((x) => x.checked).map((x) => x.value));
    const vis = new Set(visible.map((x) => x.value));
    g.tasks = [...g.tasks.filter((x) => !vis.has(x)), ...checked];
  }

  function validate() {
    const errs = [];
    const set = (sel, msg) => { const el = root.querySelector(sel); if (el) el.textContent = msg || ''; };
    set('#g-title-err', ''); set('#g-due-err', '');
    if (!g.title) { errs.push(['#g-title', t('goal.err.title')]); set('#g-title-err', t('goal.err.title')); }
    if (g.due && g.start && g.due < g.start) { errs.push(['#g-due', t('goal.err.due')]); set('#g-due-err', t('goal.err.due')); }
    root.querySelector('#g-title').setAttribute('aria-invalid', String(!g.title));
    root.querySelector('#form-errors').innerHTML = errs.length ? `<div class="alert warn">${icon('info')}<div><p><strong>${t('goal.err.summary')}</strong></p><ul>${errs.map(([sel, m]) => `<li><a href="${sel}" data-focus="${sel}">${esc(m)}</a></li>`).join('')}</ul></div></div>` : '';
    if (errs.length) root.querySelector(errs[0][0]).focus();
    return !errs.length;
  }

  function bind() {
    const $ = (s) => root.querySelector(s);
    $('#g-source')?.addEventListener('change', (e) => { $('#spec-field').hidden = e.target.value !== 'specialist'; });
    $('#g-group').addEventListener('change', (e) => { $('[data-act=suggest]').disabled = !e.target.value; });
    $('#t-filter').addEventListener('input', (e) => { syncTasks(); filterText = e.target.value; $('#task-box').innerHTML = taskList(); });
    $('[data-act=suggest]').addEventListener('click', () => {
      syncTasks();
      g.group = $('#g-group').value;
      const add = suggestTasksFor(g, GROUPS).filter((x) => avail(x));
      g.tasks = [...new Set([...g.tasks, ...add])];
      filterText = '';
      $('#t-filter').value = '';
      $('#task-box').innerHTML = taskList();
      toast(t('goal.suggestAdded', { n: add.length }));
    });
    // Hata özetindeki bağlantılar alana odaklanır (adres çubuğundaki rota değişmez).
    $('#form-errors').addEventListener('click', (e) => {
      const link = e.target.closest('[data-focus]');
      if (!link) return;
      e.preventDefault();
      root.querySelector(link.dataset.focus)?.focus();
    });
    $('form').addEventListener('submit', (e) => {
      e.preventDefault();
      collect();
      if (!validate()) return;
      g.updatedAt = new Date().toISOString();
      if (g.status === 'done' && !g.completedAt) g.completedAt = g.updatedAt;
      if (existing) Object.assign(existing, g); else p.goalsV3.push(newGoal(g));
      store.save();
      toast(t('common.saved'));
      ctx.go(`#/goal/${g.id}`);
    });
  }
  render();
}

// ---------- Notlar ----------
function noteCard(n) {
  const fields = ['recommendations', 'experience', 'difficulties', 'next', 'text'].filter((k) => n[k]);
  return `<li class="note-card" data-note="${n.id}">
    <div class="note-head"><strong>${esc(formatDate(`${n.date}T12:00`))}</strong> ${chip(`nt-${n.type}`, t(`notes.type.${n.type}`))}</div>
    ${fields.slice(0, 2).map((k) => `<p class="small"><span class="muted">${t(`notes.f.${k}`)}:</span> ${esc(n[k].length > 160 ? `${n[k].slice(0, 160)}…` : n[k])}</p>`).join('')}
    <a class="link small" href="#/notes/edit/${n.id}">${t('notes.open')}</a>
  </li>`;
}

export async function notesView(root, ctx, params) {
  const { store } = ctx;
  const p = store.activeProfile();
  const slt = p.slt.enabled;
  const st = { type: params.get('type') || 'all', goal: params.get('goal') || '', from: '', to: '', q: '' };
  const types = NOTE_TYPES.filter((x) => slt || x !== 'specialist');

  function render(keepFocus) {
    const list = filterNotes(p.notesV3, { ...st, sltEnabled: slt });
    const goalTitle = (gid) => p.goalsV3.find((g) => g.id === gid)?.title;
    const html = `<a href="#/goals" class="btn ghost small">${icon('back')}${t('goal.backToList')}</a>
      <div class="page-head"><div><h1 tabindex="-1">${t('notes.title')}</h1><p class="muted">${t(slt ? 'notes.introSlt' : 'notes.intro')}</p></div>
        <div class="page-actions"><a class="btn primary" href="#/notes/new${st.goal ? `?goal=${st.goal}` : ''}">${icon('plus')}${t('notes.new')}</a>${helpLink('notes', t('guide.helpHere'))}</div></div>
      ${p.noteDraft ? `<p class="alert info small">${icon('info')}<span>${t('notes.draftExists')} <a class="link" href="#/notes/new">${t('notes.continueDraft')}</a></span></p>` : ''}
      <form class="filters" role="search" aria-label="${esc(t('notes.filters'))}">
        <div class="field"><label for="f-q">${t('notes.search')}</label><input id="f-q" type="search" value="${esc(st.q)}"></div>
        <div class="field"><label for="f-type">${t('notes.f.type')}</label><select id="f-type">${selectOptions([['all', t('notes.type.all')], ...types.map((x) => [x, t(`notes.type.${x}`)])], st.type)}</select></div>
        <div class="field"><label for="f-goal">${t('notes.f.goal')}</label><select id="f-goal">${selectOptions([['', t('notes.anyGoal')], ...p.goalsV3.filter((g) => slt || g.source !== 'specialist').map((g) => [g.id, g.title])], st.goal)}</select></div>
        <div class="field"><label for="f-from">${t('notes.from')}</label><input id="f-from" type="date" value="${st.from}"></div>
        <div class="field"><label for="f-to">${t('notes.to')}</label><input id="f-to" type="date" value="${st.to}"></div>
      </form>
      <p class="small muted" aria-live="polite">${esc(t('notes.found', { n: list.length }))}</p>
      ${list.length ? `<ul class="note-cards wide">${list.map((n) => {
        const gs = n.goals.map(goalTitle).filter(Boolean);
        return noteCard(n).replace('</div>', `</div>${gs.length ? `<p class="small muted">${icon('notes')} ${esc(gs.join(', '))}</p>` : ''}`);
      }).join('')}</ul>` : `<div class="empty"><p>${t(p.notesV3.length ? 'notes.noMatch' : 'notes.empty')}</p></div>`}`;
    root.innerHTML = html;
    if (keepFocus) { const el = root.querySelector(keepFocus); el?.focus(); if (el?.setSelectionRange && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); } else root.querySelector('h1').focus();
    const bindF = (sel, key, ev = 'change') => root.querySelector(sel).addEventListener(ev, (e) => { st[key] = e.target.value; render(sel); });
    bindF('#f-q', 'q', 'input'); bindF('#f-type', 'type'); bindF('#f-goal', 'goal'); bindF('#f-from', 'from'); bindF('#f-to', 'to');
    root.querySelector('form.filters').addEventListener('submit', (e) => e.preventDefault());
  }
  render();
}

export async function noteEditView(root, ctx, id, params) {
  const { store } = ctx;
  const p = store.activeProfile();
  const slt = p.slt.enabled;
  const existing = id ? p.notesV3.find((n) => n.id === id) : null;
  if (id && !existing) { ctx.go('#/notes'); return; }
  const fromDraft = !existing && p.noteDraft;
  const n = existing ? { ...existing, goals: [...existing.goals] }
    : newNote(fromDraft ? p.noteDraft : { goals: params.get('goal') ? [params.get('goal')] : [], type: slt ? 'specialist' : 'self' });
  const types = NOTE_TYPES.filter((x) => slt || x !== 'specialist');
  let dirty = false;
  let draftTimer = null;
  const FIELDS = ['recommendations', 'experience', 'difficulties', 'next', 'text'];

  root.innerHTML = `<a href="#/notes" class="btn ghost small">${icon('back')}${t('notes.title')}</a>
    <div class="page-head"><h1 tabindex="-1">${t(existing ? 'notes.editTitle' : 'notes.newTitle')}</h1>${helpLink('notes', t('guide.helpHere'))}</div>
    ${fromDraft ? `<p class="alert info small">${icon('info')}<span>${t('notes.draftRestored')} <button type="button" class="link-btn" data-act="discard">${t('notes.discardDraft')}</button></span></p>` : ''}
    <form class="note-editor" novalidate>
      <div class="grid2">
        <div class="field"><label for="n-date">${t('notes.f.date')}</label><input id="n-date" type="date" value="${esc(n.date)}" max="2100-12-31"></div>
        <div class="field"><label for="n-type">${t('notes.f.type')}</label><select id="n-type">${selectOptions(types.map((x) => [x, t(`notes.type.${x}`)]), n.type)}</select></div>
      </div>
      <fieldset class="field"><legend>${t('notes.f.goals')}</legend>
        ${p.goalsV3.filter((g) => g.status !== 'archived' && (slt || g.source !== 'specialist')).length
          ? `<div class="check-grid">${p.goalsV3.filter((g) => g.status !== 'archived' && (slt || g.source !== 'specialist')).map((g) => `<label class="check small"><input type="checkbox" name="ngoal" value="${g.id}"${n.goals.includes(g.id) ? ' checked' : ''}> ${esc(g.title)}</label>`).join('')}</div>`
          : `<p class="muted small">${t('notes.noGoals')} <a class="link" href="#/goals/new">${t('goal.new')}</a></p>`}
      </fieldset>
      ${FIELDS.map((k) => (k === 'recommendations' && !slt && n.type !== 'specialist' && !n.recommendations ? '' : `<div class="field"><label for="n-${k}">${t(`notes.f.${k}`)}</label>
        <textarea id="n-${k}" rows="${k === 'text' ? 4 : 2}" maxlength="3000" placeholder="${esc(t(`notes.ph.${k}`))}">${esc(n[k])}</textarea></div>`)).join('')}
      <p id="n-err" class="field-error" role="alert"></p>
      <div class="actions sticky-actions"><button class="btn primary large" type="submit">${t('common.save')}</button>
        <span class="save-state" id="save-state" aria-live="polite">${existing ? '' : t('notes.draftAuto')}</span>
        ${existing ? `<button type="button" class="btn danger-ghost" data-act="delete">${icon('trash')}${t('common.delete')}</button>` : ''}</div>
    </form>`;
  root.querySelector('h1').focus();
  const $ = (s) => root.querySelector(s);

  function collect() {
    n.date = $('#n-date').value || todayISO();
    n.type = $('#n-type').value;
    n.goals = [...root.querySelectorAll('input[name=ngoal]:checked')].map((x) => x.value);
    for (const k of FIELDS) if ($(`#n-${k}`)) n[k] = $(`#n-${k}`).value.trim();
  }
  const stamp = () => new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  root.querySelector('form').addEventListener('input', () => {
    if (existing) { dirty = true; $('#save-state').textContent = t('notes.unsaved'); return; }
    clearTimeout(draftTimer);
    $('#save-state').textContent = t('notes.saving');
    draftTimer = setTimeout(() => {
      collect();
      p.noteDraft = noteIsEmpty(n) ? null : { ...n, id: undefined };
      store.save();
      $('#save-state').textContent = p.noteDraft ? t('notes.draftSaved', { time: stamp() }) : t('notes.draftAuto');
    }, 500);
  });
  // "closed": kaydedildi ya da taslak silindi → ekrandan çıkarken taslak yeniden yazılmaz.
  let closed = false;
  $('[data-act=discard]')?.addEventListener('click', () => { clearTimeout(draftTimer); closed = true; p.noteDraft = null; store.save(); ctx.go('#/notes/new'); });
  root.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(draftTimer);
    collect();
    if (noteIsEmpty(n)) { $('#n-err').textContent = t('notes.errEmpty'); $('#n-text').focus(); return; }
    n.updatedAt = new Date().toISOString();
    if (existing) Object.assign(existing, n); else { p.notesV3.push(newNote(n)); p.noteDraft = null; }
    dirty = false;
    closed = true;
    store.save();
    toast(t('common.saved'));
    ctx.go(n.goals.length === 1 ? `#/goal/${n.goals[0]}` : '#/notes');
  });
  $('[data-act=delete]')?.addEventListener('click', () => {
    if (!window.confirm(t('notes.deleteConfirm'))) return;
    const idx = p.notesV3.indexOf(existing);
    p.notesV3.splice(idx, 1);
    store.save();
    ctx.go('#/notes');
    toastAction(t('notes.deletedToast'), t('common.undo'), () => { p.notesV3.splice(idx, 0, existing); store.save(); ctx.rerender(); });
  });
  const onLeave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  addEventListener('beforeunload', onLeave);
  return () => {
    removeEventListener('beforeunload', onLeave);
    if (!existing && draftTimer && !closed) { clearTimeout(draftTimer); collect(); p.noteDraft = noteIsEmpty(n) ? null : { ...n, id: undefined }; store.save(); }
  };
}

// ---------- Rapor (açık onayla) ----------
export function buildReport(profile) {
  const sum = summarize(profile.sessions);
  const slt = profile.slt.enabled;
  const goals = profile.goalsV3.filter((g) => g.status !== 'archived' && (slt || g.source !== 'specialist'));
  const notes = filterNotes(profile.notesV3, { sltEnabled: slt });
  const lines = [
    t('slt.reportHeader'), new Date().toLocaleString(), '',
    `${t('onb.name')}: ${profile.name || '-'}`, `${t('onb.ageRange')}: ${profile.ageRange}`,
    `${t('onb.hearingTitle')}: ${t(`hearing.${profile.hearing}`)}`, `${t('set.exerciseLang')}: ${langName(profile.exerciseLang)}`, '',
    `${t('prog.sessions')}: ${sum.sessions} | ${t('prog.minutes')}: ${sum.minutes} | ${t('prog.accuracy')}: ${pct(sum.accuracy)} | ${t('prog.firstTry')}: ${pct(sum.firstTry)}`, '',
    `${t('prog.bySkill')}:`,
    ...GROUPS.filter((g) => sum.byGroup[g.id]).map((g) => { const v = sum.byGroup[g.id]; return `  - ${groupTitle(g.id)}: ${v.correct}/${v.items} (${pct(v.correct / v.items)})`; }),
    '', `${t('slt.goals')}:`,
    ...(goals.length ? goals.flatMap((g) => {
      const s = goalStats(g, profile.sessions);
      return [`  - ${g.title} [${t(`goal.status.${g.status}`)}${g.source === 'specialist' ? `, ${t('goal.source.specialist')}` : ''}] — ${t(`domain.${g.domain}`)}`,
        `    ${t('goal.sessions')}: ${s.sessions}${g.target ? `/${g.target}` : ''}, ${t('prog.accuracy')}: ${pct(s.accuracy)}, ${t('goal.lastStudiedLabel')}: ${s.last ? formatDate(s.last) : '-'}`,
        ...(g.tasks.length ? [`    ${t('goal.f.tasks')}: ${g.tasks.map(taskTitle).join(', ')}`] : [])];
    }) : ['  -']),
    '', `${t('notes.title')}:`,
    ...(notes.length ? notes.slice(0, 30).flatMap((n) => [`  - ${n.date} (${t(`notes.type.${n.type}`)})`, ...FIELD_KEYS.filter((k) => n[k]).map((k) => `    ${t(`notes.f.${k}`)}: ${n[k]}`)]) : ['  -']),
    '', t('slt.reportNote'),
  ];
  return lines.join('\n');
}
const FIELD_KEYS = ['recommendations', 'experience', 'difficulties', 'next', 'text'];

export async function reportView(root, ctx) {
  const p = ctx.store.activeProfile();
  root.innerHTML = `<a href="#/goals" class="btn ghost small">${icon('back')}${t('goal.backToList')}</a>
    <h1 tabindex="-1">${t('slt.report')}</h1>
    <p>${t('slt.reportBody')}</p>
    <p class="small muted">${t('goal.reportContents')}</p>
    <label class="check"><input type="checkbox" id="consent"> ${t('slt.consent')}</label>
    <div class="actions"><button class="btn primary" data-act="report" disabled>${icon('download')}${t('slt.download')}</button></div>
    <details class="help"><summary>${t('goal.reportPreview')}</summary><pre class="report-pre">${esc(buildReport(p))}</pre></details>
    <p class="small muted">${t('goal.disclaimer')}</p>`;
  root.querySelector('h1').focus();
  const consent = root.querySelector('#consent');
  const btn = root.querySelector('[data-act=report]');
  consent.addEventListener('change', () => { btn.disabled = !consent.checked; });
  btn.addEventListener('click', () => { if (consent.checked) download(`duyum-rapor-${todayISO()}.txt`, buildReport(p), 'text/plain'); });
}
