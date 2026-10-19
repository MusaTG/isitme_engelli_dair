// F. Paragraf ve uzun dinleme, H. günlük yaşam simülasyonları, G. işitsel hafıza, konuşmacı ayırt etme.
import { pick, shuffle, sample, randInt } from '../../core/rng.js';
import { bindSlots, render, bindKey, shortHash } from '../../content/template.js';
import { buildQuestion } from '../../content/questions.js';
import { audOk, wordOpt } from '../common.js';

function bindFresh(gc, slots, prefix, tries = 12) {
  let inPool = null, any = null;
  for (let i = 0; i < tries; i++) {
    const bind = bindSlots(slots, gc.pack.pools, gc.pack.L, gc.rng);
    const key = `${prefix}:${shortHash(bindKey(bind))}`;
    if (gc.used.has(key)) continue;
    const ok = gc.poolOk(key);
    if (ok && !gc.exposure(key)) { gc.used.add(key); return { bind, key }; }
    if (ok) inPool ||= { bind, key };
    any ||= { bind, key };
  }
  const res = inPool || any || { bind: bindSlots(slots, gc.pack.pools, gc.pack.L, gc.rng), key: `${prefix}:x${gc.rng()}` };
  gc.used.add(res.key);
  return res;
}

function questionsFor(gc, defs, ctx, max) {
  const out = [];
  const order = shuffle(defs, gc.rng);
  // Sıralama ve ana fikir soruları varsa en az birini dahil et (çeşitlilik).
  order.sort((a, b) => Number(['order', 'main', 'inference', 'why'].includes(b.type)) - Number(['order', 'main', 'inference', 'why'].includes(a.type)));
  for (const q of order) {
    if (out.length >= max) break;
    const built = buildQuestion(q, ctx, gc.nOptions);
    if (built) out.push(built);
  }
  return shuffle(out, gc.rng);
}

export const PASSAGE_TASKS = [
  {
    id: 'paragraph', group: 'passages', input: 'multi', needsTTS: true, optionCounts: [2, 3, 4, 5, 6],
    levels: [{ options: 3, size: 2, questions: 2 }, { options: 3, size: 3, questions: 3 }, { options: 4, size: 4, questions: 3 }, { options: 4, size: 6, questions: 4 }, { options: 4, size: 8, questions: 5 }],
    generate(gc) {
      const fit = gc.pack.paragraphs.filter((p) => audOk(p, gc.audience));
      const minSize = Math.min(...fit.map((p) => p.size));
      const list = fit.filter((p) => p.size <= Math.max(gc.P.size, minSize));
      const [pa] = gc.choose(list, (x) => `para:${x.id}`, { n: 1, soft: true });
      if (!pa) return null;
      const b = bindFresh(gc, pa.slots, `para:${pa.id}`);
      const L = gc.pack.L;
      const sentences = pa.sentences.map((alts) => render(pick(alts, gc.rng), b.bind, pa.slots, gc.pack.pools, L));
      const questions = questionsFor(gc, pa.questions, { bind: b.bind, slots: pa.slots, pools: gc.pack.pools, L, rng: gc.rng }, gc.P.questions);
      if (!questions.length) return null;
      return {
        key: b.key, promptKey: 'q.paragraph', title: pa.title, input: 'multi',
        play: { type: 'passage', sentences }, questions, subtitle: sentences.join(' '), meta: { size: pa.sentences.length, template: pa.id },
      };
    },
  },
  {
    id: 'dialogue', group: 'daily', input: 'multi', needsTTS: true, optionCounts: [2, 3, 4, 5],
    levels: [{ options: 2, lvl: 1, questions: 2 }, { options: 3, lvl: 2, questions: 2 }, { options: 3, lvl: 2, questions: 3 }, { options: 4, lvl: 3, questions: 3 }, { options: 4, lvl: 3, questions: 4 }],
    generate(gc) {
      const groups = gc.filter?.groups;
      const list = gc.pack.scenarios.filter((s) => audOk(s, gc.audience) && s.lvl <= gc.P.lvl && (!groups?.length || groups.includes(s.group)));
      const [sc] = gc.choose(list, (x) => `sc:${x.id}`, { n: 1, soft: true });
      if (!sc) return null;
      const vi = Math.floor(gc.rng() * sc.variants.length);
      const variant = sc.variants[vi];
      const b = bindFresh(gc, sc.slots, `sc:${sc.id}:${vi}`);
      const L = gc.pack.L;
      const roles = Object.fromEntries(Object.entries(sc.roles).map(([k, v]) => [k, render(v, b.bind, sc.slots, gc.pack.pools, L)]));
      const lines = variant.lines.map((l) => (l.sfx ? { sfx: l.sfx } : { sp: l.sp, role: roles[l.sp], text: render(l.t, b.bind, sc.slots, gc.pack.pools, L) }));
      const allowSpeaker = gc.voicesDistinct >= 2;
      const questions = questionsFor(gc, sc.questions, { bind: b.bind, slots: sc.slots, pools: gc.pack.pools, L, rng: gc.rng, lines: variant.lines, roles: sc.roles, allowSpeaker }, gc.P.questions);
      if (!questions.length) return null;
      return {
        key: b.key, promptKey: 'q.dialogue', title: sc.title, input: 'multi', noise: sc.noise || 0, disclaimer: sc.disclaimer || null,
        play: { type: 'dialog', lines, multiVoice: allowSpeaker }, questions,
        subtitle: lines.map((l) => (l.sfx ? `[${l.sfx}]` : `${l.role}: ${l.text}`)).join('\n'), meta: { group: sc.group, template: sc.id },
      };
    },
  },
  {
    id: 'speaker-id', group: 'daily', input: 'multi', needsTTS: true, needsVoices: 2, optionCounts: [2, 3],
    levels: [{ options: 2, lvl: 2 }, { options: 2, lvl: 2 }, { options: 3, lvl: 3 }, { options: 3, lvl: 3 }, { options: 3, lvl: 3 }],
    generate(gc) {
      if (gc.voicesDistinct < 2) return null;
      const list = gc.pack.scenarios.filter((s) => audOk(s, gc.audience) && s.lvl <= gc.P.lvl && s.questions.some((q) => q.type === 'speaker'));
      const [sc] = gc.choose(list, (x) => `spk:${x.id}`, { n: 1, soft: true });
      if (!sc) return null;
      const vi = Math.floor(gc.rng() * sc.variants.length);
      const variant = sc.variants[vi];
      const b = bindFresh(gc, sc.slots, `spk:${sc.id}:${vi}`);
      const L = gc.pack.L;
      const roles = Object.fromEntries(Object.entries(sc.roles).map(([k, v]) => [k, render(v, b.bind, sc.slots, gc.pack.pools, L)]));
      const lines = variant.lines.map((l) => (l.sfx ? { sfx: l.sfx } : { sp: l.sp, role: roles[l.sp], text: render(l.t, b.bind, sc.slots, gc.pack.pools, L) }));
      const qs = sc.questions.filter((q) => q.type === 'speaker').map((q) => buildQuestion(q, { bind: b.bind, slots: sc.slots, pools: gc.pack.pools, L, rng: gc.rng, lines: variant.lines, roles: sc.roles, allowSpeaker: true }, gc.nOptions)).filter(Boolean);
      if (!qs.length) return null;
      return {
        key: b.key, promptKey: 'q.speaker', title: sc.title, input: 'multi', speakerTask: true,
        play: { type: 'dialog', lines, multiVoice: true, hideRoles: true }, questions: qs, rolesLegend: [...new Set(Object.values(roles))],
        subtitle: lines.map((l) => (l.sfx ? `[${l.sfx}]` : `${l.role}: ${l.text}`)).join('\n'), meta: { template: sc.id },
      };
    },
  },
];

function memoryWords(gc) {
  const cats = gc.filter?.categories;
  return gc.pack.words.filter((w) => audOk(w, gc.audience) && w.lvl <= gc.P.wordLvl && !/[\s-]/.test(w.w) && (!cats?.length || cats.includes(w.cat)) && (w.e || gc.level >= 3));
}

export const MEMORY_TASKS = [
  {
    id: 'mem-order', group: 'memory', input: 'sequence', needsTTS: true,
    levels: [{ span: 2, extra: 0, wordLvl: 1 }, { span: 3, extra: 0, wordLvl: 1 }, { span: 3, extra: 1, wordLvl: 2 }, { span: 4, extra: 2, wordLvl: 2 }, { span: 5, extra: 2, wordLvl: 3 }],
    generate(gc) {
      const all = memoryWords(gc);
      const words = gc.choose(all, (x) => `w:${x.id}`, { n: gc.P.span + gc.P.extra });
      if (words.length < gc.P.span + gc.P.extra) return null;
      const heard = words.slice(0, gc.P.span);
      return {
        key: `memo:${heard.map((w) => w.id).join('>')}`, promptKey: 'q.memOrder',
        play: { type: 'seq', parts: heard.flatMap((w, i) => (i ? [{ pause: 650 }, { text: w.w }] : [{ text: w.w }])) },
        options: shuffle(words, gc.rng).map((w) => wordOpt(w)), answer: heard.map((w) => w.id), subtitle: heard.map((w) => w.w).join(', '),
        meta: { span: gc.P.span, skill: 'memory' },
      };
    },
  },
  {
    id: 'digit-span', group: 'memory', input: 'keypad', needsTTS: true,
    levels: [{ span: 3 }, { span: 4 }, { span: 5 }, { span: 6 }, { span: 7 }],
    generate(gc) {
      const L = gc.pack.L;
      if (gc.qaStatus(`dg:${L.code}`) === 'bad') return null;
      const digits = [];
      while (digits.length < gc.P.span) {
        const d = randInt(0, 9, gc.rng);
        if (d !== digits[digits.length - 1]) digits.push(d);
      }
      return {
        key: `dspan:${digits.join('')}`, promptKey: 'q.digitSpan', qaKeys: [`dg:${L.code}`],
        play: { type: 'seq', parts: digits.flatMap((d, i) => (i ? [{ pause: 550 }, { text: L.DIGITS[d] }] : [{ text: L.DIGITS[d] }])) },
        answer: digits.map(String), subtitle: digits.join(' '), meta: { span: gc.P.span, skill: 'memory' },
      };
    },
  },
  {
    id: 'mem-missing', group: 'memory', input: 'choice', needsTTS: true, optionCounts: [3, 4, 5, 6, 7],
    levels: [{ options: 3, wordLvl: 1 }, { options: 4, wordLvl: 1 }, { options: 5, wordLvl: 2 }, { options: 6, wordLvl: 2 }, { options: 7, wordLvl: 3 }],
    generate(gc) {
      const span = Math.max(2, gc.nOptions - 1);
      const words = gc.choose(memoryWords(gc), (x) => `w:${x.id}`, { n: span + 1 });
      if (words.length < span + 1) return null;
      const heard = words.slice(0, span), missing = words[span];
      return {
        key: `memm:${missing.id}:${heard.map((w) => w.id).join(',')}`, promptKey: 'q.notHeard',
        play: { type: 'seq', parts: heard.flatMap((w, i) => (i ? [{ pause: 650 }, { text: w.w }] : [{ text: w.w }])) },
        options: words.map((w) => wordOpt(w)), answer: missing.id, subtitle: heard.map((w) => w.w).join(', '), meta: { span, skill: 'memory' },
      };
    },
  },
];
