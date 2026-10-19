// İlerleme istatistikleri — yalnızca uygulama içi pratik performansı. Klinik çıkarım yapılmaz.
import { groupOf } from './registry.js';

export function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function minutesOn(sessions, date) {
  const key = dayKey(date);
  const sec = sessions.filter((s) => dayKey(s.date) === key).reduce((a, s) => a + (s.durationSec || 0), 0);
  return Math.round((sec / 60) * 10) / 10;
}

export function dailySeries(sessions, now = new Date(), days = 14) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    out.push({ date: dayKey(d), minutes: minutesOn(sessions, d) });
  }
  return out;
}

const bump = (map, key, rec) => {
  const m = (map[key] ||= { items: 0, correct: 0, first: 0, replays: 0, timeouts: 0 });
  m.items += 1;
  if (rec.ok) m.correct += 1;
  if (rec.first) m.first += 1;
  m.replays += rec.rep || 0;
  if (rec.to) m.timeouts += 1;
  return m;
};

export function summarize(sessions) {
  const byTask = {}, byGroup = {}, byContrast = {}, byQtype = {}, byCategory = {};
  let items = 0, correct = 0, first = 0, replays = 0, seconds = 0, comfortN = 0, comfortSum = 0;
  const modes = { practice: 0, test: 0, learn: 0 };
  for (const s of sessions) {
    seconds += s.durationSec || 0;
    modes[s.mode || 'practice'] = (modes[s.mode || 'practice'] || 0) + 1;
    if (s.comfort) { comfortN += 1; comfortSum += s.comfort; }
    for (const r of s.items || []) {
      if (r.ok === null || r.ok === undefined) continue;
      items += 1;
      if (r.ok) correct += 1;
      if (r.first) first += 1;
      replays += r.rep || 0;
      bump(byTask, r.task, r);
      bump(byGroup, groupOf(r.task) || 'other', r);
      if (r.m?.contrast) bump(byContrast, r.m.contrast, r);
      if (r.m?.qtype) bump(byQtype, r.m.qtype, r);
      if (r.m?.category) bump(byCategory, r.m.category, r);
    }
  }
  return {
    sessions: sessions.length, modes, items, correct, first, minutes: Math.round(seconds / 60),
    accuracy: items ? correct / items : null, firstTry: items ? first / items : null, avgReplays: items ? replays / items : null,
    comfort: comfortN ? comfortSum / comfortN : null,
    byTask, byGroup, byContrast, byQtype, byCategory,
  };
}

export function weakest(map, minItems = 4, limit = 5) {
  return Object.entries(map).filter(([, v]) => v.items >= minItems)
    .map(([k, v]) => ({ key: k, ...v, acc: v.correct / v.items })).sort((a, b) => a.acc - b.acc).slice(0, limit);
}

// Son oturumlarda en az iki kez yanlış cevaplanan içerikler (tekrar önerisi).
export function reviewList(sessions, limit = 10) {
  const misses = new Map();
  for (const s of sessions.slice(-40)) {
    for (const r of s.items || []) if (r.ok === false && r.label) misses.set(r.label, (misses.get(r.label) || 0) + 1);
  }
  return [...misses.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, count]) => ({ label, count }));
}

// Hızlı başla için öneri: seçili eğitim yollarındaki görevlerden bugün en az çalışılanlar.
export function suggestTasks(sessions, candidates, now = new Date(), n = 3) {
  const today = dayKey(now);
  const score = Object.fromEntries(candidates.map((t) => [t, 0]));
  for (const s of sessions.slice(-60)) {
    for (const r of s.items || []) if (r.task in score) score[r.task] += dayKey(s.date) === today ? 5 : 1;
  }
  return candidates.slice().sort((a, b) => score[a] - score[b] || a.localeCompare(b)).slice(0, n);
}

export function goalProgress(goal, sessions) {
  const since = new Date(goal.date).getTime();
  const relevant = sessions.filter((s) => new Date(s.date).getTime() >= since && (s.items || []).some((r) => goal.tasks?.includes(r.task)));
  return { done: relevant.length, target: goal.target || 0 };
}
