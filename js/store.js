// Yerel veri deposu (localStorage). Sunucuya hiçbir veri gönderilmez.
// Şema 3: görev tabanlı oturum kayıtları, gösterim geçmişi, uyarlama durumu, telaffuz doğrulamaları,
// yapılandırılmış hedefler (goalsV3) ve seans notları (notesV3). Eski alanlar silinmez.
// Şema 4: okuma modülü (profile.reading: konum, ayraç/vurgu/not, listeler, oturumlar, kendi metinleri).
import { migrateGoals } from './goals.js';
import { ensureReading } from './reading/state.js';

export const STORAGE_KEY = 'duyum.v1';
export const PACKS_KEY = 'duyum.packs';
export const SCHEMA_VERSION = 4;
const MAX_SESSIONS = 800;

export function defaultSettings() {
  return {
    uiLang: 'tr', theme: 'light', reducedMotion: 'system', textScale: 1, onboarded: false, disclaimerAccepted: false,
    advanced: false, stereoOk: false, volume: 0.7, readTTSButton: true, readTTSAutoHide: true,
  };
}

export function defaultState() {
  return { schema: SCHEMA_VERSION, settings: defaultSettings(), profiles: [], activeProfileId: null, qa: {} };
}

export function defaultPrefs(type) {
  return {
    mode: 'practice', options: null, replayLimit: null, timeLimit: null, textMode: 'after', seenRatio: 0.25,
    comfort: 'balanced', rateVary: false, noise: 0, sessionLength: type === 'child' ? 6 : 10, retry: true, pictures: true,
    passageText: 'after', speakerVary: false, breakEvery: 10,
  };
}

export function newProfile(partial = {}) {
  const type = partial.type === 'child' ? 'child' : 'adult';
  const p = {
    id: partial.id || `p_${Math.random().toString(36).slice(2, 10)}`,
    name: partial.name || '',
    type,
    ageRange: partial.ageRange || (type === 'child' ? '6-9' : '18-39'),
    hearing: partial.hearing || 'other',
    side: partial.side || 'unspecified',
    goals: partial.goals || '',
    experience: partial.experience || '',
    exerciseLang: partial.exerciseLang || 'tr',
    dailyGoalMin: partial.dailyGoalMin || (type === 'child' ? 5 : 10),
    subtitles: partial.subtitles || 'after',
    voice: partial.voice || {},
    prefs: { ...defaultPrefs(type), ...(partial.prefs || {}) },
    adapt: partial.adapt || {},
    manualLevel: partial.manualLevel || {},
    exposure: partial.exposure || {},
    plan: { paths: [], tasks: [], ...(partial.plan || {}) },
    slt: { enabled: false, goals: [], notes: [], ...(partial.slt || {}) },
    goalsV3: partial.goalsV3,
    notesV3: partial.notesV3,
    noteDraft: partial.noteDraft || null,
    sessions: partial.sessions || [],
    activeSession: partial.activeSession || null,
    reading: partial.reading,
    createdAt: partial.createdAt || new Date().toISOString(),
  };
  const dv = { tr: { voiceURI: null, rate: type === 'child' ? 0.85 : 0.95 }, en: { voiceURI: null, rate: type === 'child' ? 0.85 : 0.95, accent: 'en-US' }, rotate: false };
  p.voice = { ...dv, ...p.voice, tr: { ...dv.tr, ...(p.voice.tr || {}) }, en: { ...dv.en, ...(p.voice.en || {}) } };
  migrateGoals(p);
  ensureReading(p);
  return p;
}

// v1 oturumlarını (kategori tabanlı) v2 görev kayıtlarına dönüştürür; veri kaybı olmaz.
const V1_TASK = { tones: 'tone-same', words: 'word-pick', pairs: 'pair-pick', sentences: 'sent-question', daily: 'dialogue', noise: 'word-pick', memory: 'mem-missing' };
export function migrateSession(s) {
  if (!s || s.v === 2) return s;
  const task = V1_TASK[s.category] || 'word-pick';
  return {
    v: 2, id: s.id, date: s.date, mode: 'practice', lang: s.lang || null, source: 'v1', label: task, durationSec: s.durationSec || 0,
    items: (s.items || []).map((it) => ({ task, key: it.id, ok: Boolean(it.correct), first: Boolean(it.correct), rep: it.replays || 0, label: it.label || null })),
    total: s.total || 0, correct: s.correct || 0,
  };
}

export function normalize(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const state = {
    ...base, ...raw,
    settings: { ...base.settings, ...(raw.settings || {}) },
    profiles: Array.isArray(raw.profiles) ? raw.profiles.map((p) => newProfile(p)) : [],
    qa: raw.qa && typeof raw.qa === 'object' ? raw.qa : {},
  };
  for (const p of state.profiles) {
    p.sessions = p.sessions.map(migrateSession);
    if (p.slt?.goals) p.slt.goals = p.slt.goals.map((g, i) => ({ id: g.id || `g${i}_${Date.now()}`, domain: g.domain || 'auditory', tasks: g.tasks || [], target: g.target || 0, done: Boolean(g.done), ...g }));
  }
  if (!state.profiles.some((p) => p.id === state.activeProfileId)) state.activeProfileId = state.profiles[0]?.id || null;
  state.schema = SCHEMA_VERSION;
  return state;
}

export function createStore(storage = globalThis.localStorage) {
  let persistent = true;
  let state;
  try {
    state = normalize(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    persistent = false;
    state = defaultState();
  }

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistent = true;
    } catch {
      persistent = false;
    }
    return persistent;
  }

  return {
    get state() { return state; },
    get persistent() { return persistent; },
    save,
    activeProfile() {
      return state.profiles.find((p) => p.id === state.activeProfileId) || null;
    },
    addProfile(partial) {
      const p = newProfile(partial);
      state.profiles.push(p);
      state.activeProfileId = p.id;
      save();
      return p;
    },
    removeProfile(id) {
      state.profiles = state.profiles.filter((p) => p.id !== id);
      if (state.activeProfileId === id) state.activeProfileId = state.profiles[0]?.id || null;
      save();
    },
    recordSession(profile, session) {
      profile.sessions.push(session);
      if (profile.sessions.length > MAX_SESSIONS) profile.sessions.splice(0, profile.sessions.length - MAX_SESSIONS);
      save();
    },
    // Telaffuz doğrulama kayıtları cihaza ve sese bağlıdır (profil bağımsız).
    qaGet(voiceKey, key) { return state.qa[voiceKey]?.[key]; },
    qaSet(voiceKey, key, status) {
      state.qa[voiceKey] ||= {};
      if (status) state.qa[voiceKey][key] = status; else delete state.qa[voiceKey][key];
      save();
    },
    customPacks() {
      try { return JSON.parse(storage.getItem(PACKS_KEY) || '[]'); } catch { return []; }
    },
    saveCustomPacks(list) {
      try { storage.setItem(PACKS_KEY, JSON.stringify(list)); return true; } catch { return false; }
    },
    exportJSON() {
      return JSON.stringify({ app: 'duyum', exportedAt: new Date().toISOString(), ...state }, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || parsed.app !== 'duyum') throw new Error('invalid-file');
      const { app, exportedAt, ...rest } = parsed;
      state = normalize(rest);
      save();
    },
    wipe() {
      try { storage.removeItem(STORAGE_KEY); storage.removeItem(PACKS_KEY); } catch { /* yok say */ }
      state = defaultState();
    },
  };
}
