// Okuma modülünün yerel kayıtları (profil başına). Saf fonksiyonlar; kaydetmeyi çağıran yapar.
// Okunan kelime sayısı DOĞRULANMAZ: konum, kullanıcının kaydırdığı/işaretlediği yerden hesaplanır.
import { locate, wordCount, allParas, remapLocation, DEFAULT_WPM } from './core.js';

export const MAX_SESSIONS = 1500;
export const MAX_VERSIONS = 5;
export const IDLE_SEC = 300; // 5 dk hareketsizlikte oturum süresi saymayı bırakır

export function defaultView() {
  return { size: 19, line: 1.7, para: 1, width: 'm', font: 'sans', align: 'left', theme: 'app', margin: 'normal', focus: false, hideSpeakers: false };
}

export function ensureReading(profile) {
  const r = profile.reading && typeof profile.reading === 'object' ? profile.reading : {};
  profile.reading = {
    lang: r.lang || profile.exerciseLang || 'tr',
    progress: r.progress && typeof r.progress === 'object' ? r.progress : {},
    favorites: Array.isArray(r.favorites) ? r.favorites : [],
    marks: Array.isArray(r.marks) ? r.marks : [],
    lists: Array.isArray(r.lists) ? r.lists : [],
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    timed: r.timed || null,
    userTexts: Array.isArray(r.userTexts) ? r.userTexts : [],
    view: { ...defaultView(), ...(r.view || {}) },
    wpm: { ...DEFAULT_WPM, ...(r.wpm || {}) },
  };
  return profile.reading;
}

const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

export function getProgress(R, id) {
  return R.progress[id] || null;
}

export function statusOf(R, id) {
  return R.progress[id]?.status || 'new';
}

// Konum kaydı: pid paragrafının başı. atEnd: metnin sonuna gelindi (son paragraf görünür).
export function setPosition(R, text, pid, { atEnd = false, manual = false } = {}) {
  const loc = locate(text, pid);
  if (!loc) return null;
  const total = Math.max(1, text.words);
  const pct = atEnd ? 1 : Math.min(1, loc.wordsBefore / total);
  const p = R.progress[text.id] || { status: 'new', firstAt: now(), timeSec: 0, maxPct: 0, completions: [] };
  const para = allParas(text).find((x) => x.id === pid);
  Object.assign(p, {
    v: text.hash, pid, stage: loc.stage, paraNo: loc.paraNo, pct, maxPct: Math.max(p.maxPct || 0, pct),
    wordsAt: atEnd ? text.words : loc.wordsBefore, pfx: para ? para.t.slice(0, 48) : '', lastAt: now(), ...(manual ? { manualAt: now() } : {}),
  });
  if (p.status === 'new' && (pct > 0 || manual)) p.status = 'reading';
  R.progress[text.id] = p;
  return p;
}

export function touchOpen(R, text) {
  const p = R.progress[text.id];
  if (p) p.lastAt = now();
  else R.progress[text.id] = { status: 'new', firstAt: now(), lastAt: now(), timeSec: 0, pct: 0, maxPct: 0, completions: [], v: text.hash };
  return R.progress[text.id];
}

export function setStatus(R, text, status) {
  const p = R.progress[text.id] || touchOpen(R, text);
  p.status = status;
  p.lastAt = now();
  if (status === 'done') { p.completedAt = now(); p.completions = [...(p.completions || []), now()]; }
  return p;
}

// Baştan başla: konum sıfırlanır; süre, tamamlama geçmişi ve oturum kayıtları korunur.
export function restart(R, text) {
  const p = R.progress[text.id] || touchOpen(R, text);
  p.restarts = [...(p.restarts || []), { at: now(), pct: p.pct || 0, status: p.status }];
  Object.assign(p, { pid: text.sections[0]?.paras[0]?.id || null, pct: 0, stage: 1, paraNo: 1, wordsAt: 0, status: 'reading', lastAt: now() });
  return p;
}

export function addTime(R, text, sec) {
  const p = R.progress[text.id] || touchOpen(R, text);
  p.timeSec = (p.timeSec || 0) + sec;
  return p;
}

export function toggleFavorite(R, id) {
  const i = R.favorites.indexOf(id);
  if (i >= 0) R.favorites.splice(i, 1); else R.favorites.push(id);
  return i < 0;
}

// Ayraç / vurgu / not. type: 'bookmark' | 'here' | 'highlight' | 'note'
export function addMark(R, text, { type, pid, quote = '', off = null, color = null, label = '', note = '' }) {
  const para = allParas(text).find((x) => x.id === pid);
  if (!para) return null;
  if (type === 'here') R.marks = R.marks.filter((m) => !(m.type === 'here' && m.textId === text.id));
  const m = { id: uid('m'), type, textId: text.id, v: text.hash, pid, quote: quote.slice(0, 400), off, pfx: para.t.slice(0, 48), color, label, note, createdAt: now(), updatedAt: now() };
  R.marks.push(m);
  return m;
}

export function updateMark(R, id, patch) {
  const m = R.marks.find((x) => x.id === id);
  if (m) Object.assign(m, patch, { updatedAt: now() });
  return m;
}

export function removeMark(R, id) {
  const i = R.marks.findIndex((x) => x.id === id);
  return i >= 0 ? R.marks.splice(i, 1)[0] : null;
}

export function marksFor(R, textId) {
  return R.marks.filter((m) => m.textId === textId);
}

// Metin sürümü değişmişse konum ve işaretleri yeni sürüme taşır; eşleşmeyenler "orphan" olur, silinmez.
export function migrateForText(R, text) {
  let changed = false;
  const p = R.progress[text.id];
  if (p && p.v && p.v !== text.hash) {
    const r = remapLocation(text, { v: p.v, pid: p.pid, pfx: p.pfx });
    p.prevV = p.v;
    if (r && !r.orphan) { p.pid = r.pid; } else { p.pid = text.sections[0]?.paras[0]?.id; p.lostPosition = true; }
    p.v = text.hash;
    changed = true;
  }
  R.marks = R.marks.map((m) => {
    if (m.textId !== text.id || m.v === text.hash) return m;
    changed = true;
    return remapLocation(text, m);
  });
  return changed;
}

export function recordSession(R, s) {
  if (!s || s.sec < 10) return null;
  const rec = { id: uid('rs'), ...s };
  R.sessions.push(rec);
  if (R.sessions.length > MAX_SESSIONS) R.sessions.splice(0, R.sessions.length - MAX_SESSIONS);
  return rec;
}

// Okuma listeleri
export function createList(R, { name, targetMin = 60, breakEvery = 0, items = [] }) {
  const l = { id: uid('rl'), name: name || '', items: [...new Set(items)], targetMin, breakEvery, idx: 0, createdAt: now(), updatedAt: now(), completedAt: null };
  R.lists.push(l);
  return l;
}

export function listAdd(l, id) { if (!l.items.includes(id)) { l.items.push(id); l.updatedAt = now(); return true; } return false; }
export function listRemove(l, id) { const i = l.items.indexOf(id); if (i >= 0) { l.items.splice(i, 1); if (l.idx > i) l.idx -= 1; l.updatedAt = now(); } }
export function listMove(l, from, to) {
  if (to < 0 || to >= l.items.length || from === to) return false;
  const [x] = l.items.splice(from, 1);
  l.items.splice(to, 0, x);
  l.updatedAt = now();
  return true;
}

export function listMinutes(items, metaOf, wpm) {
  return items.reduce((n, id) => { const m = metaOf(id); return n + (m ? m.words / (wpm[m.lang || 'tr'] || 120) : 0); }, 0);
}

// Listede sıradaki tamamlanmamış metin.
export function listNext(R, l, after = null) {
  const start = after ? l.items.indexOf(after) + 1 : 0;
  for (let i = start; i < l.items.length; i++) if (statusOf(R, l.items[i]) !== 'done') return l.items[i];
  return null;
}

// Süreli okuma oturumu (30/60/90/120 dk). Oturum süresi ile metin ilerlemesi ayrı tutulur.
export function startTimed(R, { targetMin, breakEvery = 0, listId = null }) {
  R.timed = { id: uid('ts'), targetMin, breakEvery, listId, startedAt: now(), elapsedSec: 0, running: true, lastBreakSec: 0, texts: [], reachedAt: null };
  return R.timed;
}

export function tickTimed(R, sec, textId) {
  const s = R.timed;
  if (!s || !s.running) return null;
  s.elapsedSec += sec;
  if (textId && !s.texts.includes(textId)) s.texts.push(textId);
  const events = {};
  if (!s.reachedAt && s.elapsedSec >= s.targetMin * 60) { s.reachedAt = now(); events.reached = true; }
  if (s.breakEvery && s.elapsedSec - s.lastBreakSec >= s.breakEvery * 60) { s.lastBreakSec = s.elapsedSec; events.break = true; }
  return events;
}

export function endTimed(R) {
  const s = R.timed;
  if (!s) return null;
  const rec = recordSession(R, { kind: 'timed', listId: s.listId, startedAt: s.startedAt, endedAt: now(), sec: Math.round(s.elapsedSec), targetMin: s.targetMin, texts: s.texts, reached: Boolean(s.reachedAt) });
  R.timed = null;
  return rec;
}

export function timedRatio(s) {
  return s ? Math.min(1, s.elapsedSec / (s.targetMin * 60)) : 0;
}

// Kendi metinleri: sürümlü saklanır; düzenleme yeni sürüm oluşturur, eski sürümler (en çok 5) korunur.
export function saveUserText(R, data, existingId = null) {
  const body = String(data.body || '').trim();
  let ut = existingId ? R.userTexts.find((x) => x.id === existingId) : null;
  if (!ut) {
    ut = { id: uid('u').replace('u_', 'u-'), createdAt: now(), versions: [], archived: false };
    R.userTexts.push(ut);
  }
  const meta = ['title', 'lang', 'cat', 'sub', 'aud', 'tags', 'author', 'source', 'license', 'kind'];
  for (const k of meta) if (k in data) ut[k] = data[k];
  const last = ut.versions[ut.versions.length - 1];
  if (!last || last.body !== body) {
    ut.versions.push({ version: (last?.version || 0) + 1, body, savedAt: now() });
    if (ut.versions.length > MAX_VERSIONS) ut.versions.splice(0, ut.versions.length - MAX_VERSIONS);
  }
  ut.updatedAt = now();
  // Tarayıcıdan kalıcı depolama iste: kendi metinleri yer darlığında kendiliğinden silinmesin.
  try { globalThis.navigator?.storage?.persist?.().catch(() => {}); } catch { /* desteklenmiyor */ }
  return ut;
}

export function wordsOf(body) {
  return wordCount(body);
}

export function readingStats(R, metaOf) {
  const prog = Object.entries(R.progress);
  return {
    started: prog.filter(([, p]) => p.status !== 'new').length,
    done: prog.filter(([, p]) => p.status === 'done').length,
    reading: prog.filter(([, p]) => p.status === 'reading').length,
    timeSec: prog.reduce((n, [, p]) => n + (p.timeSec || 0), 0),
    wordsAt: prog.reduce((n, [id, p]) => n + (metaOf(id) ? Math.round((p.maxPct || 0) * metaOf(id).words) : 0), 0),
  };
}
