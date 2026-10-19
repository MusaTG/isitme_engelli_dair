// Şablon motoru: yuvaları (slot) havuzlardan doldurur, dil kurallarına göre çekim/uyum biçimlerini üretir.
// Kurala güvenilemeyen biçimler (ör. Türkçede ünsüz yumuşaması) için veri içinde açık biçim zorunludur;
// yoksa TemplateError fırlatılır ve doğrulayıcı bu şablonu reddeder.
import { pick, randInt, shuffle, hash } from '../core/rng.js';

export class TemplateError extends Error {}

export const normItem = (item) => (typeof item === 'string' ? { v: item } : item);
export const itemValue = (item) => normItem(item).v;

function enArticle(phrase) {
  const w = phrase.trim().toLowerCase();
  if (/^(uni|use|usu|eu|one|once)/.test(w)) return `a ${phrase}`;
  if (/^(hour|honest|honour)/.test(w)) return `an ${phrase}`;
  return /^[aeiou]/.test(w) ? `an ${phrase}` : `a ${phrase}`;
}

const TR_CASES = ['loc', 'abl', 'dat', 'acc', 'gen', 'ins'];

export function formOf(raw, form, L, pool = {}) {
  const it = normItem(raw);
  if (!form || form === 'v') return it.v;
  if (it[form] !== undefined) return it[form];
  if (form === 'show' || form === 'short') return it.v;
  if (L.code === 'tr' && TR_CASES.includes(form)) {
    if (pool.possessive) throw new TemplateError(`İyelikli sözcükte açık biçim gerekli: ${it.v}.${form}`);
    if (['dat', 'acc', 'gen'].includes(form) && !pool.proper && L.needsExplicitForm(it.v)) {
      throw new TemplateError(`Ünsüz yumuşaması olabilir, açık biçim gerekli: ${it.v}.${form}`);
    }
    if (form === 'ins' && pool.proper) return `${it.v} ile`;
    return L.suffix(it.v, form, { proper: Boolean(pool.proper) });
  }
  if (L.code === 'en') {
    if (form === 'a') return enArticle(it.v);
    if (form === 'to') return `to ${it.v}`;
    if (form === 'at') return `at ${it.v}`;
    if (form === 'by') return `by ${it.v}`;
  }
  throw new TemplateError(`Biçim bulunamadı: ${it.v}.${form}`);
}

// ---------- Üreteç yuvaları (@time, @money, @number, @address, @date) ----------

function parseGen(spec) {
  const [name, a, b] = spec.slice(1).split(':');
  return { name, min: a !== undefined ? Number(a) : undefined, max: b !== undefined ? Number(b) : undefined };
}

export function isGenerator(spec) {
  return typeof spec === 'string' && spec.startsWith('@');
}

function timeItem(L, h, m) {
  const v = L.timeSpoken(h, m);
  return { v, at: L.code === 'tr' ? L.timeSpoken(h, m, { at: true }) : v, show: L.timeShown(h, m), raw: [h, m] };
}

function moneyItem(L, units, cents = 0) {
  return { v: L.moneySpoken(units, cents), show: L.moneyShown(units, cents), raw: [units, cents] };
}

function numberItem(L, n) {
  return { v: L.numberWords(n), show: String(n), raw: [n] };
}

export function generate(spec, L, rng, pools) {
  const g = parseGen(spec);
  switch (g.name) {
    case 'time': {
      const minH = g.min ?? 8, maxH = g.max ?? 20;
      return timeItem(L, randInt(minH, maxH, rng), pick([0, 15, 30, 45], rng));
    }
    case 'money': {
      if (L.code === 'tr') {
        const min = g.min ?? 10, max = g.max ?? 95;
        return moneyItem(L, Math.max(min, Math.round(randInt(min, max, rng) / 5) * 5));
      }
      const min = g.min ?? 2, max = g.max ?? 30;
      return moneyItem(L, randInt(min, max, rng), pick([0, 25, 50, 75], rng));
    }
    case 'number': return numberItem(L, randInt(g.min ?? 2, g.max ?? 20, rng));
    case 'date': {
      const mo = randInt(0, 11, rng);
      const d = randInt(1, 28, rng);
      return { v: L.dateSpoken(d, mo), show: L.dateShown(d, mo), raw: [d, mo] };
    }
    case 'address': {
      const street = itemValue(pick(pools.streets.items, rng));
      const no = randInt(2, 48, rng), flat = randInt(1, 12, rng);
      return { v: L.addressSpoken(street, no, flat), show: L.addressShown(street, no, flat), raw: [street, no, flat] };
    }
    default: throw new TemplateError(`Bilinmeyen üreteç: ${spec}`);
  }
}

// Üretilmiş bir bilginin tek bileşeni değiştirilmiş çeldiricileri (anlamlı ve benzersiz).
export function perturb(spec, item, L, rng, n, pools) {
  const g = parseGen(spec);
  const out = [];
  const seen = new Set([item.show]);
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    let alt;
    if (g.name === 'time') {
      const [h, m] = item.raw;
      alt = rng() < 0.5
        ? timeItem(L, Math.min(23, Math.max(0, h + pick([-2, -1, 1, 2, 3], rng))), m)
        : timeItem(L, h, pick([0, 15, 30, 45].filter((x) => x !== m), rng));
    } else if (g.name === 'money') {
      const [u, c] = item.raw;
      const step = L.code === 'tr' ? 5 : 1;
      alt = rng() < 0.7 || L.code === 'tr'
        ? moneyItem(L, Math.max(step, u + pick([-3, -2, -1, 1, 2, 3], rng) * step), c)
        : moneyItem(L, u, pick([0, 25, 50, 75].filter((x) => x !== c), rng));
    } else if (g.name === 'number') {
      const [k] = item.raw;
      const spread = Math.max(2, Math.round(k * 0.2));
      alt = numberItem(L, Math.max(0, k + pick([-1, 1], rng) * randInt(1, spread, rng)));
    } else if (g.name === 'date') {
      const [d, mo] = item.raw;
      if (rng() < 0.5) {
        const d2 = Math.min(28, Math.max(1, d + pick([-3, -2, -1, 1, 2, 3], rng)));
        alt = { v: L.dateSpoken(d2, mo), show: L.dateShown(d2, mo), raw: [d2, mo] };
      } else {
        const m2 = (mo + pick([1, 2, 11, 10], rng)) % 12;
        alt = { v: L.dateSpoken(d, m2), show: L.dateShown(d, m2), raw: [d, m2] };
      }
    } else if (g.name === 'address') {
      const [street, no, flat] = item.raw;
      const r = rng();
      const s2 = r < 0.34 ? itemValue(pick(pools.streets.items.filter((x) => itemValue(x) !== street), rng)) : street;
      const no2 = r >= 0.34 && r < 0.67 ? Math.max(1, no + pick([-2, -1, 1, 2, 10], rng)) : no;
      const f2 = r >= 0.67 ? Math.max(1, flat + pick([-1, 1, 2], rng)) : flat;
      alt = { v: L.addressSpoken(s2, no2, f2), show: L.addressShown(s2, no2, f2) };
    }
    if (alt && !seen.has(alt.show)) { seen.add(alt.show); out.push(alt); }
  }
  return out;
}

// ---------- Yuva bağlama ve metin üretimi ----------

// Aynı havuzdan gelen yuvalar birbirinden farklı seçilir (ör. iki farklı kişi).
export function bindSlots(slots, pools, L, rng, fixed = {}) {
  const bind = {};
  const usedByPool = {};
  for (const [slot, spec] of Object.entries(slots)) {
    if (fixed[slot] !== undefined) { bind[slot] = fixed[slot]; continue; }
    if (isGenerator(spec)) { bind[slot] = generate(spec, L, rng, pools); continue; }
    const pool = pools[spec];
    if (!pool) throw new TemplateError(`Havuz yok: ${spec}`);
    const used = (usedByPool[spec] ||= new Set(Object.entries(fixed).filter(([s]) => slots[s] === spec).map(([, v]) => itemValue(v))));
    const options = pool.items.filter((x) => !used.has(itemValue(x)));
    if (!options.length) throw new TemplateError(`Havuz yetersiz: ${spec}`);
    const chosen = normItem(pick(options, rng));
    used.add(chosen.v);
    bind[slot] = chosen;
  }
  return bind;
}

export function poolFor(slots, slot, pools) {
  const spec = slots[slot];
  return isGenerator(spec) ? {} : pools[spec] || {};
}

const PLACEHOLDER = /\{(\w+)(?:\.(\w+))?\}/g;

export function render(text, bind, slots, pools, L) {
  const out = text.replace(PLACEHOLDER, (_, slot, form) => {
    if (!(slot in bind)) throw new TemplateError(`Yuva yok: ${slot}`);
    return formOf(bind[slot], form, L, poolFor(slots, slot, pools));
  });
  return finalize(out, L);
}

export function finalize(text, L) {
  let t = text.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  const m = t.match(/^([“"'(]*)(.)/);
  if (m) t = m[1] + L.capitalize(m[2]) + t.slice(m[0].length);
  // Cümle içindeki her yeni cümlenin ilk harfini büyüt (yuva başa geldiğinde).
  return t.replace(/([.!?]\s+)([^\s])/g, (_, sep, ch) => sep + L.capitalize(ch));
}

export function slotsInText(text) {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]);
}

export const bindKey = (bind) => Object.keys(bind).sort().map((k) => `${k}=${normItem(bind[k]).show ?? normItem(bind[k]).v}`).join('|');
export const shortHash = (s) => hash(s).toString(36);
export { shuffle };
