// Tohumlanabilir rastgelelik ve yardımcılar.

export function makeRng(seed = Date.now() ^ Math.floor(Math.random() * 1e9)) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const pick = (list, rng) => list[Math.floor(rng() * list.length)];
export const randInt = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

export function sample(list, n, rng) {
  return shuffle(list, rng).slice(0, n);
}

// FNV-1a 32 bit — içerik kimlikleri ve havuz ayrımı için kararlı özet.
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function uniqueBy(list, keyFn) {
  const seen = new Set();
  return list.filter((x) => {
    const k = keyFn(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
