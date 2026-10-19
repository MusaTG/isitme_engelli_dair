// Görev üreteçlerinin ortak yardımcıları.
import { shuffle, sample, pick } from '../core/rng.js';

export const audOk = (entry, audience) => !entry.aud || entry.aud === 'both' || entry.aud === audience;

export function wordOpt(w, extra = {}) {
  return { id: w.id || w.w, label: w.w, emoji: w.e || null, say: w.say || w.w, ...extra };
}

export function numOpt(n) {
  return { id: String(n), label: String(n) };
}

// Seçenek sayısını görev sınırları ve mevcut içerikle uyumlu hâle getirir.
export function fitOptions(requested, def, available) {
  const allowed = def.optionCounts || [2, 3, 4, 5, 6, 8, 10];
  let n = allowed.reduce((best, x) => (Math.abs(x - requested) < Math.abs(best - requested) ? x : best), allowed[0]);
  n = Math.min(n, available ?? n);
  return Math.max(def.minOptions || 2, n);
}

export function distinctLabels(options) {
  const seen = new Set();
  return options.filter((o) => {
    const k = String(o.label).toLocaleLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export { shuffle, sample, pick };
