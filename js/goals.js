// Hedefler ve seans notları — saf veri modülü (DOM yok, Node ile test edilir).
// Hedefin kaynağı "self" (kişisel) veya "specialist" (uzmanın verdiği; kullanıcı elle girer).
// Uygulama bir hedefin uzman tarafından reçete edildiğini veya klinik olarak doğrulandığını İDDİA ETMEZ:
// "specialist" yalnızca kullanıcının kendi beyanıdır.

export const GOAL_STATUS = ['active', 'paused', 'done', 'archived'];
export const PRIORITY = ['high', 'normal', 'low'];
export const NOTE_TYPES = ['specialist', 'practice', 'self', 'other'];
export const DOMAINS = ['auditory', 'language', 'speech', 'other'];
const DAY = 864e5;

const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().slice(0, 10);

export function newGoal(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || uid('g'),
    title: String(partial.title || '').trim(),
    desc: partial.desc || '',
    source: partial.source === 'specialist' ? 'specialist' : 'self',
    domain: DOMAINS.includes(partial.domain) ? partial.domain : 'auditory',
    group: partial.group || '',
    lang: partial.lang || '',
    start: partial.start || today(),
    due: partial.due || '',
    priority: PRIORITY.includes(partial.priority) ? partial.priority : 'normal',
    specialistNote: partial.specialistNote || '',
    ownNote: partial.ownNote || '',
    tasks: Array.isArray(partial.tasks) ? [...new Set(partial.tasks)] : [],
    target: Number(partial.target) || 0,
    plan: { days: [], minutes: 10, ...(partial.plan || {}) },
    preset: partial.preset || null,
    status: GOAL_STATUS.includes(partial.status) ? partial.status : 'active',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    completedAt: partial.completedAt || null,
  };
}

export function newNote(partial = {}) {
  const now = new Date().toISOString();
  return {
    id: partial.id || uid('n'),
    date: partial.date || today(),
    type: NOTE_TYPES.includes(partial.type) ? partial.type : 'self',
    goals: Array.isArray(partial.goals) ? partial.goals : [],
    recommendations: partial.recommendations || '',
    experience: partial.experience || '',
    difficulties: partial.difficulties || '',
    next: partial.next || '',
    text: partial.text || '',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

export const noteIsEmpty = (n) => !['recommendations', 'experience', 'difficulties', 'next', 'text'].some((k) => String(n[k] || '').trim());

// v2 → v3: slt.goals ve slt.notes kayıpsız taşınır; eski alanlar silinmez (geri dönüş güvenliği).
export function migrateGoals(profile) {
  if (Array.isArray(profile.goalsV3) && Array.isArray(profile.notesV3)) return profile;
  const slt = profile.slt || {};
  profile.goalsV3 = (slt.goals || []).map((g) => newGoal({
    id: g.id, title: g.text, source: 'specialist', domain: g.domain, tasks: g.tasks, target: g.target,
    start: (g.date || '').slice(0, 10) || today(), status: g.done ? 'done' : 'active', createdAt: g.date,
  }));
  profile.notesV3 = (slt.notes || []).map((n) => newNote({ date: (n.date || '').slice(0, 10), type: 'specialist', text: n.text, createdAt: n.date }));
  return profile;
}

const ts = (d) => new Date(d).getTime();

// Bir hedefle ilişkili oturumlar: hedefe özel başlatılanlar (goalId) + hedef başladıktan sonra
// hedefin görevlerinden en az birini içerenler.
export function goalSessions(goal, sessions) {
  const since = ts(goal.start || goal.createdAt);
  return sessions.filter((s) => s.goalId === goal.id
    || (ts(s.date) >= since && goal.tasks.length && (s.items || []).some((r) => goal.tasks.includes(r.task))));
}

export function goalStats(goal, sessions, now = new Date()) {
  const list = goalSessions(goal, sessions);
  let items = 0, correct = 0, seconds = 0;
  const history = [];
  for (const s of list) {
    const rel = (s.items || []).filter((r) => (s.goalId === goal.id || goal.tasks.includes(r.task)) && (r.ok === true || r.ok === false));
    const c = rel.filter((r) => r.ok).length;
    items += rel.length;
    correct += c;
    seconds += s.durationSec || 0;
    history.push({ date: s.date, id: s.id, items: rel.length, correct: c, direct: s.goalId === goal.id });
  }
  const last = list.length ? list[list.length - 1].date : null;
  const weekStart = startOfWeek(now);
  const weekMin = Math.round(list.filter((s) => ts(s.date) >= weekStart).reduce((a, s) => a + (s.durationSec || 0), 0) / 60);
  const plannedWeek = (goal.plan?.days?.length || 0) * (goal.plan?.minutes || 0);
  const overdue = Boolean(goal.due && goal.status === 'active' && ts(`${goal.due}T23:59:59`) < now.getTime());
  return {
    sessions: list.length, items, correct, accuracy: items ? correct / items : null, minutes: Math.round(seconds / 60),
    last, history: history.slice(-20).reverse(), weekMin, plannedWeek, overdue,
    targetProgress: goal.target ? Math.min(1, list.length / goal.target) : null,
  };
}

export function startOfWeek(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Pazartesi = 0
  return d.getTime() - dow * DAY;
}

// Bugün planda olan aktif hedefler (gün: 0 = Pazartesi … 6 = Pazar).
export function plannedToday(goals, now = new Date()) {
  const dow = (now.getDay() + 6) % 7;
  return goals.filter((g) => g.status === 'active' && g.plan?.days?.includes(dow));
}

export function sortGoals(goals) {
  const st = { active: 0, paused: 1, done: 2, archived: 3 };
  const pr = { high: 0, normal: 1, low: 2 };
  return goals.slice().sort((a, b) => st[a.status] - st[b.status] || pr[a.priority] - pr[b.priority]
    || String(a.due || '9999').localeCompare(String(b.due || '9999')) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function filterGoals(goals, { status = 'open', source = 'all', sltEnabled = true } = {}) {
  return sortGoals(goals.filter((g) => {
    if (!sltEnabled && g.source === 'specialist') return false;
    if (source !== 'all' && g.source !== source) return false;
    if (status === 'open') return g.status === 'active' || g.status === 'paused';
    if (status === 'all') return true;
    return g.status === status;
  }));
}

export function filterNotes(notes, { type = 'all', goal = '', from = '', to = '', q = '', sltEnabled = true } = {}) {
  const needle = q.trim().toLocaleLowerCase();
  return notes.filter((n) => {
    if (!sltEnabled && n.type === 'specialist') return false;
    if (type !== 'all' && n.type !== type) return false;
    if (goal && !n.goals.includes(goal)) return false;
    if (from && n.date < from) return false;
    if (to && n.date > to) return false;
    if (needle) {
      const hay = [n.recommendations, n.experience, n.difficulties, n.next, n.text].join(' ').toLocaleLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

// Hedefin beceri grubuna göre görev önerisi (yalnızca öneri; uzman önerisi olduğu iddia edilmez).
export function suggestTasksFor(goal, groups) {
  const g = groups.find((x) => x.id === goal.group);
  return g ? g.tasks.filter((t) => !goal.tasks.includes(t)) : [];
}
