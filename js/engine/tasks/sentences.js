// E. Cümle anlama + yönergeler + bilgi (sayı, saat, tarih, adres, para, telefon).
import { pick, shuffle, sample, randInt } from '../../core/rng.js';
import { bindSlots, render, isGenerator, perturb, normItem, itemValue, formOf, poolFor, bindKey, shortHash, TemplateError, generate } from '../../content/template.js';
import { buildQuestion } from '../../content/questions.js';
import { audOk } from '../common.js';

function templates(gc, filter = () => true) {
  const structs = gc.filter?.structs;
  return gc.pack.templates.filter((t) => audOk(t, gc.audience) && t.lvl <= gc.P.tplLvl && (!structs?.length || structs.includes(t.struct)) && filter(t));
}

// Bir şablondan, daha önce görülmemiş bir yuva kombinasyonu seçer.
function bindTemplate(gc, t, tries = 12) {
  let inPool = null, any = null;
  for (let i = 0; i < tries; i++) {
    const bind = bindSlots(t.slots, gc.pack.pools, gc.pack.L, gc.rng);
    const key = `t:${t.id}:${shortHash(bindKey(bind))}`;
    if (gc.used.has(key)) continue;
    const ok = gc.poolOk(key);
    if (ok && !gc.exposure(key)) { gc.used.add(key); return { bind, key }; }
    if (ok) inPool ||= { bind, key };
    any ||= { bind, key };
  }
  const res = inPool || any || { bind: bindSlots(t.slots, gc.pack.pools, gc.pack.L, gc.rng), key: `t:${t.id}:x${gc.rng()}` };
  gc.used.add(res.key);
  return res;
}

const R = (gc, t, text, bind) => render(text, bind, t.slots, gc.pack.pools, gc.pack.L);

// Tek yuvası değiştirilmiş alternatif bağlama.
function changeSlot(gc, t, bind, slot) {
  const spec = t.slots[slot];
  const L = gc.pack.L;
  if (isGenerator(spec)) {
    const [alt] = perturb(spec, normItem(bind[slot]), L, gc.rng, 1, gc.pack.pools);
    return alt ? { ...bind, [slot]: alt } : null;
  }
  const pool = gc.pack.pools[spec];
  const taken = new Set(Object.keys(t.slots).filter((s) => t.slots[s] === spec).map((s) => itemValue(bind[s])));
  const cands = shuffle(pool.items.filter((x) => !taken.has(itemValue(x))), gc.rng);
  return cands.length ? { ...bind, [slot]: normItem(cands[0]) } : null;
}

const COLORS = {
  tr: [['red', 'kırmızı', '#d93025'], ['blue', 'mavi', '#1a73e8'], ['yellow', 'sarı', '#f2c200'], ['green', 'yeşil', '#1e8e3e'], ['purple', 'mor', '#8e44ad'], ['orange', 'turuncu', '#f57c00']],
  en: [['red', 'red', '#d93025'], ['blue', 'blue', '#1a73e8'], ['yellow', 'yellow', '#f2c200'], ['green', 'green', '#1e8e3e'], ['purple', 'purple', '#8e44ad'], ['orange', 'orange', '#f57c00']],
};
const SHAPES = {
  tr: [['square', 'kare', 'kareye'], ['circle', 'daire', 'daireye'], ['triangle', 'üçgen', 'üçgene'], ['star', 'yıldız', 'yıldıza'], ['heart', 'kalp', 'kalbe']],
  en: [['square', 'square'], ['circle', 'circle'], ['triangle', 'triangle'], ['star', 'star'], ['heart', 'heart']],
};

function instructionText(lang, steps) {
  if (lang === 'tr') {
    const ph = steps.map((s) => `${s.cName} ${s.sDat}`);
    if (ph.length === 1) return `${cap(ph[0])} dokun.`;
    if (ph.length === 2) return `Önce ${ph[0]}, sonra ${ph[1]} dokun.`;
    return `Önce ${ph[0]}, sonra ${ph[1]}, en son da ${ph[2]} dokun.`;
  }
  const ph = steps.map((s) => `the ${s.cName} ${s.sName}`);
  if (ph.length === 1) return `Touch ${ph[0]}.`;
  if (ph.length === 2) return `First touch ${ph[0]}, then ${ph[1]}.`;
  return `First touch ${ph[0]}, then ${ph[1]}, and finally ${ph[2]}.`;
}
const cap = (s) => s[0].toLocaleUpperCase('tr') + s.slice(1);

const INFO_KINDS = { 1: ['number'], 2: ['number', 'time', 'money'], 3: ['time', 'money', 'date'], 4: ['date', 'address', 'phone', 'money'], 5: ['time', 'date', 'address', 'phone', 'money'] };

function phoneItem(L, rng, digits) {
  const d = digits || (L.code === 'tr' ? ['0', '5', ...Array.from({ length: 9 }, () => String(randInt(0, 9, rng)))] : ['5', '5', '5', ...Array.from({ length: 7 }, () => String(randInt(0, 9, rng)))]);
  if (L.code === 'tr') {
    const g = [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    const say = (grp, i) => {
      const s = grp.join('');
      if (i === 0) return `sıfır ${L.numberWords(Number(s.slice(1)))}`;
      return s[0] === '0' ? `sıfır ${L.numberWords(Number(s.slice(1)))}` : L.numberWords(Number(s));
    };
    return { v: g.map(say).join(', '), show: g.map((x) => x.join('')).join(' '), raw: d };
  }
  const g = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)];
  return { v: g.map((grp) => grp.map((x) => L.DIGITS[Number(x)]).join(' ')).join(', '), show: g.map((x) => x.join('')).join(' '), raw: d };
}

export const SENTENCE_TASKS = [
  {
    id: 'sent-pick', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5, 6, 8, 10], longOptions: true,
    levels: [{ options: 2, tplLvl: 1, change: 2 }, { options: 3, tplLvl: 2, change: 2 }, { options: 4, tplLvl: 2, change: 1 }, { options: 6, tplLvl: 3, change: 1 }, { options: 8, tplLvl: 3, change: 1 }],
    generate(gc) {
      const tpls = templates(gc, (t) => Object.keys(t.slots).length >= 1 && t.struct !== 'imperative');
      const [t] = gc.choose(tpls, (x) => `tpl:${x.id}`, { n: 1, soft: true });
      if (!t) return null;
      const b = bindTemplate(gc, t);
      const vi = Math.floor(gc.rng() * t.text.length);
      const target = R(gc, t, t.text[vi], b.bind);
      const labels = new Set([target]);
      const slots = Object.keys(t.slots);
      let guard = 0;
      while (labels.size < gc.nOptions && guard++ < 80) {
        let nb = b.bind;
        for (const s of sample(slots, Math.min(gc.P.change, slots.length), gc.rng)) nb = changeSlot(gc, t, nb, s) || nb;
        try { labels.add(R(gc, t, t.text[vi], nb)); } catch (e) { if (!(e instanceof TemplateError)) throw e; }
      }
      if (labels.size < 2) return null;
      return {
        key: b.key, promptKey: 'q.whichSentence', play: { type: 'speech', text: target }, longOptions: true,
        options: [...labels].map((l, i) => ({ id: `s${i}`, label: l })), answer: 's0', subtitle: target, meta: { struct: t.struct, template: t.id },
      };
    },
  },
  {
    id: 'sent-question', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5, 6],
    levels: [{ options: 2, tplLvl: 1 }, { options: 3, tplLvl: 1 }, { options: 3, tplLvl: 2 }, { options: 4, tplLvl: 3 }, { options: 6, tplLvl: 3 }],
    generate(gc) {
      const [t] = gc.choose(templates(gc), (x) => `tpl:${x.id}`, { n: 1, soft: true });
      if (!t) return null;
      const b = bindTemplate(gc, t);
      const text = R(gc, t, pick(t.text, gc.rng), b.bind);
      const q = buildQuestion(pick(t.q, gc.rng), { bind: b.bind, slots: t.slots, pools: gc.pack.pools, L: gc.pack.L, rng: gc.rng }, gc.nOptions);
      if (!q) return null;
      return {
        key: `${b.key}:${q.qtype}`, prompt: q.prompt, play: { type: 'speech', text }, options: q.options, answer: q.answerId,
        subtitle: text, meta: { struct: t.struct, qtype: q.qtype, template: t.id },
      };
    },
  },
  {
    id: 'sent-changed', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5], fixedCount: true,
    levels: [{ tplLvl: 1, gap: 1200 }, { tplLvl: 2, gap: 1000 }, { tplLvl: 2, gap: 900 }, { tplLvl: 3, gap: 800 }, { tplLvl: 3, gap: 700 }],
    generate(gc) {
      const tpls = templates(gc, (t) => Object.keys(t.slots).length >= 2);
      const [t] = gc.choose(tpls, (x) => `tpl:${x.id}`, { n: 1, soft: true });
      if (!t) return null;
      const b = bindTemplate(gc, t);
      const vi = Math.floor(gc.rng() * t.text.length);
      const text = t.text[vi];
      const L = gc.pack.L;
      const slotStr = (bind, s) => {
        const m = text.match(new RegExp(`\\{${s}(?:\\.(\\w+))?\\}`));
        return formOf(bind[s], m?.[1], L, poolFor(t.slots, s, gc.pack.pools));
      };
      const slots = Object.keys(t.slots).filter((s) => text.includes(`{${s}`));
      const changed = pick(slots, gc.rng);
      const nb = changeSlot(gc, t, b.bind, changed);
      if (!nb) return null;
      let A, B;
      try { A = R(gc, t, text, b.bind); B = R(gc, t, text, nb); } catch (e) { if (e instanceof TemplateError) return null; throw e; }
      if (A === B) return null;
      const labels = slots.map((s) => ({ id: s, label: L.capitalize(slotStr(b.bind, s)) }));
      if (new Set(labels.map((x) => x.label)).size !== labels.length) return null;
      return {
        key: `${b.key}:chg:${changed}`, promptKey: 'q.whichChanged', play: { type: 'seq', parts: [{ text: A }, { pause: gc.P.gap }, { text: B }] },
        options: labels,
        answer: changed, subtitle: `1) ${A}\n2) ${B}`, meta: { struct: t.struct, template: t.id },
      };
    },
  },
  {
    id: 'sent-yesno', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2],
    levels: [{ tplLvl: 2 }, { tplLvl: 2 }, { tplLvl: 2 }, { tplLvl: 3 }, { tplLvl: 3 }],
    generate(gc) {
      const [t] = gc.choose(templates(gc, (x) => x.neg && x.yn), (x) => `tpl:${x.id}`, { n: 1, soft: true });
      if (!t) return null;
      const b = bindTemplate(gc, t);
      const positive = gc.rng() < 0.5;
      const vi = Math.floor(gc.rng() * t.text.length);
      const text = R(gc, t, positive ? t.text[vi] : t.neg[Math.min(vi, t.neg.length - 1)], b.bind);
      const L = gc.pack.L;
      return {
        key: `${b.key}:yn`, prompt: R(gc, t, t.yn, b.bind), play: { type: 'speech', text }, fixedOrder: true,
        options: [{ id: 'yes', label: L.yes }, { id: 'no', label: L.no }], answer: positive ? 'yes' : 'no', subtitle: text,
        meta: { struct: positive ? 'positive' : 'negative', template: t.id },
      };
    },
  },
  {
    id: 'sent-reply', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5], longOptions: true,
    levels: [{ options: 2 }, { options: 3 }, { options: 4 }, { options: 4 }, { options: 5 }],
    generate(gc) {
      const qa = gc.pack.qa.filter((x) => audOk(x, gc.audience));
      const [item] = gc.choose(qa, (x) => `qa:${shortHash(x.q)}`, { n: 1 });
      if (!item) return null;
      const others = sample(qa.filter((x) => x.t !== item.t), gc.nOptions - 1, gc.rng);
      return {
        key: `qa:${shortHash(item.q)}`, promptKey: 'q.bestReply', play: { type: 'speech', text: item.q }, longOptions: true,
        options: [item, ...others].map((x, i) => ({ id: `r${i}`, label: x.a })), answer: 'r0', subtitle: item.q, meta: { qtype: item.t },
      };
    },
  },
  {
    id: 'instructions', group: 'sentences', input: 'sequence', needsTTS: true, grid: true,
    levels: [{ steps: 1, tokens: 4 }, { steps: 2, tokens: 6 }, { steps: 2, tokens: 6 }, { steps: 3, tokens: 8 }, { steps: 3, tokens: 9 }],
    generate(gc) {
      const lang = gc.pack.lang;
      const combos = [];
      for (const c of COLORS[lang]) for (const s of SHAPES[lang]) combos.push({ id: `${c[0]}-${s[0]}`, color: c[0], hex: c[2], cName: c[1], shape: s[0], sName: s[1], sDat: s[2] || s[1] });
      const steps = sample(combos, gc.P.steps, gc.rng);
      // Çeldiriciler: aynı renk farklı şekil ve aynı şekil farklı renk öncelikli.
      const near = shuffle(combos.filter((x) => !steps.includes(x) && steps.some((s) => s.color === x.color || s.shape === x.shape)), gc.rng);
      const rest = shuffle(combos.filter((x) => !steps.includes(x) && !near.includes(x)), gc.rng);
      const tokens = shuffle([...steps, ...near, ...rest].slice(0, Math.max(gc.P.tokens, steps.length)), gc.rng);
      const text = instructionText(lang, steps);
      return {
        key: `instr:${steps.map((s) => s.id).join('>')}`, promptKey: 'q.followInstructions', play: { type: 'speech', text },
        options: tokens.map((x) => ({ id: x.id, label: `${x.cName} ${x.sName}`, shape: x.shape, color: x.hex })), answer: steps.map((s) => s.id),
        subtitle: text, meta: { steps: steps.length },
      };
    },
  },
  {
    id: 'info', group: 'sentences', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 6, 8],
    levels: [{ options: 2 }, { options: 3 }, { options: 4 }, { options: 6 }, { options: 8 }],
    generate(gc) {
      const L = gc.pack.L;
      const kinds = gc.filter?.infoKinds?.length ? gc.filter.infoKinds : INFO_KINDS[gc.level] || INFO_KINDS[3];
      const kind = pick(kinds, gc.rng);
      const frames = gc.pack.meta.infoFrames?.[kind];
      if (!frames?.length) return null;
      let item, alts;
      if (kind === 'phone') {
        item = phoneItem(L, gc.rng);
        alts = [];
        const seen = new Set([item.show]);
        let guard = 0;
        while (alts.length < gc.nOptions - 1 && guard++ < 50) {
          const d = item.raw.slice();
          const i = randInt(L.code === 'tr' ? 2 : 3, d.length - 1, gc.rng);
          d[i] = String((Number(d[i]) + randInt(1, 9, gc.rng)) % 10);
          const alt = phoneItem(L, gc.rng, d);
          if (!seen.has(alt.show)) { seen.add(alt.show); alts.push(alt); }
        }
      } else {
        const spec = { number: '@number:12:480', time: '@time:7:22', money: L.code === 'tr' ? '@money:15:950' : '@money:3:95', date: '@date', address: '@address' }[kind];
        item = generate(spec, L, gc.rng, gc.pack.pools);
        alts = perturb(spec, item, L, gc.rng, gc.nOptions - 1, gc.pack.pools);
      }
      const text = gc.render(pick(frames, gc.rng), { x: item });
      return {
        key: `info:${kind}:${item.show}`, promptKey: `q.info.${kind}`, play: { type: 'speech', text },
        options: [item, ...alts].map((x, i) => ({ id: `i${i}`, label: x.show })), answer: 'i0', subtitle: text, meta: { qtype: kind },
      };
    },
  },
];
