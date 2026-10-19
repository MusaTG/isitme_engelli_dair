// Gösterim geçmişi ve aralıklı tekrar (Leitner kutuları). Veriler yalnızca yerelde tutulur.
// Kayıt: [gösterim sayısı, doğru sayısı, son gösterim (ms), kutu 0–5, sonraki tekrar zamanı (ms)]
import { hash } from '../core/rng.js';

const DAY = 864e5;
const INTERVALS = [0, 1, 2, 4, 8, 16];
export const MAX_KEYS = 6000;

// İçerik, kararlı özetine göre değerlendirme (A, ~%20) ve alıştırma (P) havuzlarına ayrılır.
export const poolOf = (key) => (hash(String(key)) % 5 === 0 ? 'A' : 'P');

export function recordExposure(store, key, correct, now = Date.now(), { learning = false } = {}) {
  const e = store[key] || [0, 0, 0, 0, 0];
  e[0] += 1;
  if (correct) e[1] += 1;
  e[2] = now;
  if (learning) e[3] = Math.max(e[3], 1);
  else e[3] = correct ? Math.min(5, e[3] + 1) : 1;
  e[4] = now + INTERVALS[e[3]] * DAY;
  store[key] = e;
  return e;
}

export function pruneExposure(store) {
  const keys = Object.keys(store);
  if (keys.length <= MAX_KEYS) return;
  keys.sort((a, b) => store[a][2] - store[b][2]);
  for (const k of keys.slice(0, keys.length - MAX_KEYS)) delete store[k];
}

export function classify(e, now) {
  if (!e) return 'unseen';
  if (e[4] <= now && e[3] <= 2) return 'due';
  return 'seen';
}

// İçerik seçici: aynı oturumda tekrar yok, havuz ayrımı, görülmemiş/tekrar zamanı gelmiş dengesi.
export function makeChooser({ rng, exposure, used, mode, seenRatio = 0.25, now = Date.now(), log }) {
  const wantPool = mode === 'test' ? 'A' : 'P';
  return function choose(cands, keyFn, { n = 1, soft = false } = {}) {
    let list = cands.map((c) => ({ c, k: keyFn(c) }));
    if (soft) {
      const fresh = list.filter((x) => !used.has(x.k));
      list = fresh.length ? fresh : list;
    } else {
      list = list.filter((x) => !used.has(x.k));
      const inPool = list.filter((x) => poolOf(x.k) === wantPool);
      if (inPool.length >= n) list = inPool;
      else if (mode === 'test' && list.length) log?.('poolFallback');
    }
    const groups = { unseen: [], due: [], seen: [] };
    for (const x of list) groups[classify(exposure[x.k], now)].push(x);
    groups.seen.sort((a, b) => exposure[a.k][2] - exposure[b.k][2]);
    const out = [];
    const take = (arr, i) => { const [x] = arr.splice(i, 1); out.push(x); };
    while (out.length < n && (groups.unseen.length || groups.due.length || groups.seen.length)) {
      const r = rng();
      if (groups.due.length && (r < seenRatio || !groups.unseen.length)) take(groups.due, Math.floor(rng() * groups.due.length));
      else if (groups.unseen.length && (r >= seenRatio * 0.5 || !groups.seen.length)) take(groups.unseen, Math.floor(rng() * groups.unseen.length));
      else if (groups.seen.length) take(groups.seen, Math.floor(rng() * Math.min(5, groups.seen.length)));
      else take(groups.unseen, Math.floor(rng() * groups.unseen.length));
    }
    for (const x of out) used.add(x.k);
    return out.map((x) => x.c);
  };
}
