// İlerleme: yalnızca uygulama içi pratik performansı. Klinik iddia yoktur.
import { t, formatDate, pct } from '../i18n.js';
import { esc, helpLink } from '../ui.js';
import { summarize, dailySeries, reviewList, minutesOn, weakest } from '../engine/stats.js';
import { GROUPS } from '../engine/registry.js';
import { taskTitle, groupTitle, langName } from './shared.js';

function barChart(series) {
  const max = Math.max(5, ...series.map((d) => d.minutes));
  const w = 28, gap = 8, h = 120;
  const width = series.length * (w + gap);
  const bars = series.map((d, i) => {
    const bh = d.minutes ? Math.max(3, (d.minutes / max) * h) : 0;
    const x = i * (w + gap);
    const day = new Date(`${d.date}T12:00`).getDate();
    return `<g><rect x="${x}" y="${h - bh}" width="${w}" height="${bh}" rx="5" class="bar"/>
      <rect x="${x}" y="${h - 2}" width="${w}" height="2" rx="1" class="bar-base"/>
      <text x="${x + w / 2}" y="${h + 16}" class="bar-label">${day}</text></g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 -6 ${width} ${h + 26}" role="img" aria-labelledby="chart-t"><title id="chart-t">${esc(t('prog.last14'))}</title>${bars}</svg>
    <details class="help"><summary>${esc(t('prog.asTable'))}</summary>
    <table class="table"><thead><tr><th scope="col">${t('prog.tableDate')}</th><th scope="col">${t('prog.minutes')}</th></tr></thead>
    <tbody>${series.map((d) => `<tr><td>${esc(formatDate(`${d.date}T12:00`))}</td><td>${d.minutes}</td></tr>`).join('')}</tbody></table></details>`;
}

const pctOf = (v) => (v.items ? pct(v.correct / v.items) : '–');

function table(rows, head) {
  return `<table class="table"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

export async function progressView(root, ctx) {
  const profile = ctx.store.activeProfile();
  const sessions = profile.sessions;
  const sum = summarize(sessions);
  const review = reviewList(sessions);
  const today = Math.floor(minutesOn(sessions, new Date()));
  const enough = sessions.length >= 3;
  const pack = await ctx.getPack(profile.exerciseLang);
  const catLabel = ctx.catLabel(pack);

  const groupRows = GROUPS.filter((g) => sum.byGroup[g.id]).map((g) => {
    const v = sum.byGroup[g.id];
    const acc = v.correct / v.items;
    return `<tr><th scope="row">${esc(groupTitle(g.id))}</th><td>${v.items}</td>
      <td><span class="meter" aria-hidden="true"><span style="width:${Math.round(acc * 100)}%"></span></span> ${esc(pct(acc))}</td>
      <td>${esc(pct(v.first / v.items))}</td><td>${(v.replays / v.items).toFixed(1)}</td></tr>`;
  });
  const taskRows = Object.entries(sum.byTask).sort((a, b) => b[1].items - a[1].items).map(([task, v]) =>
    `<tr><th scope="row">${esc(taskTitle(task))}</th><td>${v.items}</td><td>${esc(pctOf(v))}</td><td>${esc(pct(v.first / v.items))}</td><td>${v.timeouts}</td></tr>`);
  const weak = [
    ...weakest(sum.byContrast).map((w) => ({ label: t('prog.contrast', { c: w.key }), acc: w.acc, items: w.items })),
    ...weakest(sum.byCategory).map((w) => ({ label: t('prog.category', { c: catLabel(w.key) }), acc: w.acc, items: w.items })),
    ...weakest(sum.byQtype).map((w) => ({ label: t('prog.qtype', { c: t(`qtype.${w.key}`) }), acc: w.acc, items: w.items })),
  ].sort((a, b) => a.acc - b.acc).slice(0, 6);

  root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('prog.title')}</h1></div>${helpLink('progress', t('guide.helpHere'))}</div>
    <p class="muted">${t('prog.intro')}</p>
    <p><strong>${esc(t('prog.goalStatus', { done: today, goal: profile.dailyGoalMin }))}</strong></p>
    ${sessions.length === 0 ? `<div class="empty"><p>${t('prog.none')}</p><a class="btn primary" href="#/skills">${t('nav.skills')}</a></div>` : `
    <dl class="stats">
      <div><dt>${t('prog.sessions')}</dt><dd>${sum.sessions}</dd></div>
      <div><dt>${t('prog.minutes')}</dt><dd>${sum.minutes}</dd></div>
      <div><dt>${t('prog.accuracy')}</dt><dd>${esc(pct(sum.accuracy))}</dd></div>
      <div><dt>${t('prog.firstTry')}</dt><dd>${esc(pct(sum.firstTry))}</dd></div>
      <div><dt>${t('prog.replays')}</dt><dd>${sum.avgReplays === null ? '–' : sum.avgReplays.toFixed(1)}</dd></div>
      <div><dt>${t('prog.modes')}</dt><dd class="small-dd">${t('prog.modeCounts', { p: sum.modes.practice || 0, t: sum.modes.test || 0 })}</dd></div>
    </dl>
    ${sum.comfort ? `<p class="small muted">${esc(t('prog.comfortAvg', { v: t(`res.comfort.${Math.round(sum.comfort)}`) }))}</p>` : ''}
    <section aria-labelledby="c14"><h2 id="c14" class="h3">${t('prog.last14')}</h2>
      ${enough ? barChart(dailySeries(sessions)) : `<p class="muted">${t('prog.notEnough', { n: sessions.length })}</p>`}</section>
    <section aria-labelledby="bygroup"><h2 id="bygroup" class="h3">${t('prog.bySkill')}</h2>
      ${groupRows.length ? table(groupRows, [t('prog.skill'), t('prog.tableItems'), t('prog.tableAcc'), t('prog.firstTry'), t('prog.replays')]) : `<p class="muted">${t('prog.reviewEmpty')}</p>`}</section>
    <section aria-labelledby="weak"><h2 id="weak" class="h3">${t('prog.weak')}</h2>
      ${weak.length ? `<ul class="weak-list">${weak.map((w) => `<li><span>${esc(w.label)}</span><span class="muted">${esc(pct(w.acc))} (${w.items})</span></li>`).join('')}</ul><p class="hint">${t('prog.weakHint')}</p>` : `<p class="muted">${t('prog.weakEmpty')}</p>`}</section>
    <section aria-labelledby="rv"><h2 id="rv" class="h3">${t('prog.review')}</h2>
      ${review.length ? `<ul class="chips">${review.map((r) => `<li>${esc(r.label)} <span class="muted">×${r.count}</span></li>`).join('')}</ul>` : `<p class="muted">${t('prog.reviewEmpty')}</p>`}</section>
    <details class="panel"><summary class="h3">${t('prog.byTask')}</summary>${table(taskRows, [t('prog.tableTask'), t('prog.tableItems'), t('prog.tableAcc'), t('prog.firstTry'), t('prog.timeouts')])}</details>
    <section aria-labelledby="hist"><h2 id="hist" class="h3">${t('prog.history')}</h2>
      ${table(sessions.slice(-12).reverse().map((s) => `<tr><td>${esc(formatDate(s.date))}</td><td>${esc(t(`mode.${s.mode || 'practice'}`))}</td><td>${esc(s.label && s.label.startsWith('daily:') ? t(`scgroup.${s.label.slice(6)}`) : s.label === 'quick' ? t('home.quick') : s.label ? taskTitle(s.label) : '')}</td><td>${s.lang ? esc(langName(s.lang)) : '–'}</td><td>${s.correct}/${s.total}</td></tr>`),
        [t('prog.tableDate'), t('study.mode'), t('prog.tableTask'), t('prog.tableLang'), t('prog.tableScore')])}
    </section>`}`;
}
