// Kişisel plan: isteğe bağlı eğitim yolları, kişisel görev listesi ve (açıksa) DKT hedefleri.
// Hiçbir yol zorunlu değildir ve evrensel bir rehabilitasyon protokolü olarak sunulmaz.
import { t } from '../i18n.js';
import { esc, icon, toast, helpLink } from '../ui.js';
import { PATHS, GROUPS, getTask } from '../engine/registry.js';
import { summarize } from '../engine/stats.js';
import { taskTitle, groupTitle } from './shared.js';


export async function planView(root, ctx) {
  const { store } = ctx;
  const p = store.activeProfile();
  const st = await ctx.ttsStatus(p.exerciseLang, p.voice.en.accent);
  const voices = (await ctx.distinctVoices(p.exerciseLang)).length;
  const sum = summarize(p.sessions);

  function render() {
    const pathRows = PATHS.filter((x) => !x.personal).map((path) => {
      const tasks = [...new Set(path.blocks.map((b) => b.task))];
      const usable = tasks.filter((task) => ctx.taskAvailable(task, { speechOk: st.ok, voices }));
      const done = tasks.reduce((a, task) => a + (sum.byTask[task]?.items || 0), 0);
      const on = p.plan.paths.includes(path.id);
      return `<li class="path-row${on ? ' on' : ''}">
        <label class="check"><input type="checkbox" data-path="${path.id}"${on ? ' checked' : ''}${usable.length ? '' : ' disabled'}>
          <span><strong>${esc(t(`path.${path.id}.title`))}</strong><span class="small muted block">${esc(t(`path.${path.id}.desc`))}</span>
          <span class="small block">${tasks.map((x) => esc(taskTitle(x))).join(', ')}</span>
          ${usable.length ? '' : `<span class="tag warn">${t(path.needsVoices ? 'cat.needVoices' : 'cat.noTTS')}</span>`}
          ${done ? `<span class="small muted block">${esc(t('plan.answered', { n: done }))}</span>` : ''}</span></label>
        ${usable.length ? `<button class="btn ghost small" data-run="${path.id}">${icon('play')}${t('common.start')}</button>` : ''}</li>`;
    }).join('');
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('nav.plan')}</h1></div>${helpLink('catalog', t('guide.helpHere'))}</div>
      <p class="muted">${t('plan.intro')}</p>
      <section class="panel" aria-labelledby="pp-h"><h2 id="pp-h" class="h3">${t('plan.paths')}</h2>
        <p class="hint">${t('plan.pathsHint')}</p>
        <ul class="path-list">${pathRows}</ul></section>
      <section class="panel" aria-labelledby="pt-h"><h2 id="pt-h" class="h3">${t('plan.myTasks')}</h2>
        <p class="hint">${t('plan.myTasksHint')}</p>
        <div class="add-row"><label class="sr-only" for="addTask">${t('plan.addTask')}</label>
          <select id="addTask">${GROUPS.map((g) => `<optgroup label="${esc(groupTitle(g.id))}">${g.tasks.map((x) => `<option value="${x}">${esc(taskTitle(x))}</option>`).join('')}</optgroup>`).join('')}</select>
          <button class="btn secondary" data-act="addTask">${icon('plus')}${t('plan.addTask')}</button></div>
        ${p.plan.tasks.length ? `<ul class="note-list">${p.plan.tasks.map((x) => `<li><span>${esc(taskTitle(x))}</span><button class="btn ghost small" data-rmtask="${x}" aria-label="${esc(t('common.delete'))}: ${esc(taskTitle(x))}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="muted">${t('plan.noTasks')}</p>`}
      </section>
      <p class="small muted">${t('plan.goalsLink')} <a href="#/goals" class="link">${t('nav.goals')}</a></p>`;
    bind();
  }

  function bind() {
    const $ = (s) => root.querySelector(s);
    root.querySelectorAll('[data-path]').forEach((c) => c.addEventListener('change', () => {
      const id = c.dataset.path;
      p.plan.paths = c.checked ? [...new Set([...p.plan.paths, id])] : p.plan.paths.filter((x) => x !== id);
      store.save();
      toast(t('common.saved'));
      render();
    }));
    root.querySelectorAll('[data-run]').forEach((b) => b.addEventListener('click', async () => {
      const path = PATHS.find((x) => x.id === b.dataset.run);
      const blocks = path.blocks.filter((bl) => ctx.taskAvailable(bl.task, { speechOk: st.ok, voices }))
        .map((bl) => ({ ...bl, count: getTask(bl.task).input === 'multi' ? 2 : Math.max(3, Math.round(p.prefs.sessionLength / 2)) }));
      await ctx.startSession({ source: 'plan', label: `path:${path.id}`, blocks: blocks.slice(0, 4) });
    }));
    $('[data-act=addTask]').addEventListener('click', () => {
      const v = $('#addTask').value;
      if (!p.plan.tasks.includes(v)) p.plan.tasks.push(v);
      store.save();
      render();
    });
    root.querySelectorAll('[data-rmtask]').forEach((b) => b.addEventListener('click', () => { p.plan.tasks = p.plan.tasks.filter((x) => x !== b.dataset.rmtask); store.save(); render(); }));
  }

  render();
}
