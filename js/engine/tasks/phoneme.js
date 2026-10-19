// B. Hece ve fonem ayırt etme + C. minimal çiftler.
// Türkçe yazım büyük ölçüde sesçil olduğundan Türkçe sesbirimler yazımdan, İngilizce sesbirimler IPA'dan alınır.
import { pick, shuffle, sample, randInt } from '../../core/rng.js';
import { tokenizeIPA, isVowel, minimalContrast, contrastFeature } from '../../content/phon.js';
import { audOk, wordOpt, numOpt } from '../common.js';

const singleWord = (w) => !/[\s-]/.test(w.w);

export function phonemesOf(word, L) {
  if (L.code === 'tr') return L.phonemes(word.w);
  return word.ipa ? tokenizeIPA(word.ipa) : null;
}

const EN_HINT = { ʃ: 'sh', ʧ: 'ch', ʤ: 'j', θ: 'th', ð: 'th', ŋ: 'ng', j: 'y' };
export function phonemeLabel(p, L) {
  if (L.code === 'tr') return L.lower(p);
  return EN_HINT[p] ? `/${p}/ (${EN_HINT[p]})` : `/${p}/`;
}

function wordPool(gc, filter = () => true) {
  return gc.pack.words.filter((w) => audOk(w, gc.audience) && w.lvl <= gc.P.wordLvl && singleWord(w) && filter(w));
}

// kind: null → klasik hece setleri; 'vcv' / 'cvc' → logatom setleri (ayrı görevlerde kullanılır).
export function syllableSet(gc, minItems, kind = null) {
  const sets = gc.pack.syllables.sets.filter((s) => (s.kind || null) === kind && s.lvl <= gc.P.setLvl && s.items.length >= minItems);
  const usable = gc.qaFilter(sets, (s) => `ss:${s.id}`);
  return usable.length ? pick(usable, gc.rng) : null;
}

export const sylOpt = (x) => ({ id: x.s, label: x.s, say: x.say, ipa: x.ipa });

export const PHONEME_TASKS = [
  {
    id: 'syl-pick', group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4, 6, 10],
    levels: [{ options: 2, setLvl: 1 }, { options: 2, setLvl: 2 }, { options: 3, setLvl: 2 }, { options: 6, setLvl: 3 }, { options: 10, setLvl: 3 }],
    generate(gc) {
      const set = syllableSet(gc, Math.min(gc.nOptions, 2)) ;
      if (!set) return null;
      const items = set.items.length >= gc.nOptions ? sample(set.items, gc.nOptions, gc.rng) : set.items;
      const target = pick(items, gc.rng);
      return {
        key: `syl:${set.id}:${target.s}`, promptKey: 'q.whichSyllable', qaKeys: [`ss:${set.id}`],
        play: { type: 'speech', text: target.say }, options: items.map(sylOpt), answer: target.s,
        subtitle: target.s, meta: { contrast: set.label, nonword: true },
      };
    },
  },
  {
    id: 'syl-same', group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2],
    levels: [{ setLvl: 1 }, { setLvl: 2 }, { setLvl: 2 }, { setLvl: 3 }, { setLvl: 3 }],
    generate(gc) {
      const set = syllableSet(gc, 2);
      if (!set) return null;
      const [a, b] = sample(set.items, 2, gc.rng);
      const same = gc.rng() < 0.4;
      const second = same ? a : b;
      return {
        key: `sylsame:${set.id}:${a.s}:${second.s}`, promptKey: 'q.sameOrDifferent', qaKeys: [`ss:${set.id}`],
        play: { type: 'seq', parts: [{ text: a.say }, { pause: 700 }, { text: second.say }] },
        options: [{ id: 'same', labelKey: 'opt.same' }, { id: 'diff', labelKey: 'opt.different' }], fixedOrder: true,
        answer: same ? 'same' : 'diff', subtitle: `${a.s} – ${second.s}`, meta: { contrast: set.label, nonword: true },
      };
    },
  },
  {
    id: 'syl-seq', group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4],
    levels: [{ len: 2, options: 2, setLvl: 1 }, { len: 2, options: 3, setLvl: 2 }, { len: 3, options: 3, setLvl: 2 }, { len: 3, options: 4, setLvl: 3 }, { len: 4, options: 4, setLvl: 3 }],
    generate(gc) {
      const set = syllableSet(gc, 2);
      if (!set) return null;
      const items = set.items;
      const seq = Array.from({ length: gc.P.len }, () => pick(items, gc.rng));
      const lbl = (s) => s.map((x) => x.s).join(' – ');
      const answer = lbl(seq);
      const opts = new Map([[answer, seq]]);
      let guard = 0;
      while (opts.size < gc.nOptions && guard++ < 60) {
        const alt = seq.slice();
        const i = randInt(0, alt.length - 1, gc.rng);
        alt[i] = pick(items.filter((x) => x.s !== seq[i].s), gc.rng);
        opts.set(lbl(alt), alt);
      }
      if (opts.size < 2) return null;
      return {
        key: `sylseq:${set.id}:${answer}`, promptKey: 'q.whichSequence', qaKeys: [`ss:${set.id}`],
        play: { type: 'seq', parts: seq.flatMap((x, i) => (i ? [{ pause: 450 }, { text: x.say }] : [{ text: x.say }])) },
        options: [...opts.keys()].map((k) => ({ id: k, label: k })), answer, subtitle: answer, meta: { contrast: set.label, nonword: true },
      };
    },
  },
  {
    id: 'initial-sound', group: 'phoneme', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4],
    levels: [{ options: 2, wordLvl: 1 }, { options: 3, wordLvl: 1 }, { options: 3, wordLvl: 2 }, { options: 4, wordLvl: 2 }, { options: 4, wordLvl: 3 }],
    generate(gc) { return soundMatch(gc, 'initial'); },
  },
  {
    id: 'final-sound', group: 'phoneme', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4],
    levels: [{ options: 2, wordLvl: 1 }, { options: 3, wordLvl: 1 }, { options: 3, wordLvl: 2 }, { options: 4, wordLvl: 2 }, { options: 4, wordLvl: 3 }],
    generate(gc) { return soundMatch(gc, 'final'); },
  },
  {
    id: 'sound-position', group: 'phoneme', input: 'choice', needsTTS: true, optionCounts: [3],
    levels: [{ wordLvl: 1 }, { wordLvl: 1 }, { wordLvl: 2 }, { wordLvl: 2 }, { wordLvl: 3 }],
    generate(gc) {
      const L = gc.pack.L;
      const target = pick(['s', 'm', 'k', 't', 'l', 'p', 'b', 'd', 'n', 'ʃ'].map((p) => (L.code === 'tr' && p === 'ʃ' ? 'ş' : p)), gc.rng);
      const cands = wordPool(gc, (w) => {
        const ph = phonemesOf(w, L);
        return ph && ph.length >= 3 && ph.filter((x) => x === target).length === 1;
      });
      const [w] = gc.choose(cands, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      const ph = phonemesOf(w, L);
      const i = ph.indexOf(target);
      const pos = i === 0 ? 'start' : i === ph.length - 1 ? 'end' : 'middle';
      return {
        key: `pos:${w.id}:${target}`, promptKey: 'q.soundPosition', promptVars: { sound: phonemeLabel(target, L) },
        play: { type: 'speech', text: w.w }, fixedOrder: true,
        options: [{ id: 'start', labelKey: 'opt.start' }, { id: 'middle', labelKey: 'opt.middle' }, { id: 'end', labelKey: 'opt.end' }],
        answer: pos, subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'syl-count', group: 'phoneme', input: 'choice', needsTTS: true, optionCounts: [3, 4, 5, 6],
    levels: [{ options: 3, wordLvl: 1 }, { options: 3, wordLvl: 2 }, { options: 4, wordLvl: 2 }, { options: 5, wordLvl: 3 }, { options: 6, wordLvl: 3 }],
    generate(gc) {
      const max = gc.nOptions;
      const cands = wordPool(gc, (w) => w.syl >= 1 && w.syl <= max && (gc.pack.L.code !== 'tr' || gc.pack.L.syllabifySafe(w.w)));
      const [w] = gc.choose(cands, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      return {
        key: `sylc:${w.id}`, promptKey: 'q.syllableCount', numeric: true, fixedOrder: true,
        play: { type: 'speech', text: w.w }, options: Array.from({ length: max }, (_, i) => numOpt(i + 1)),
        answer: String(w.syl), subtitle: gc.pack.L.code === 'tr' ? gc.pack.L.syllabify(w.w).join('-') : w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'syl-order', group: 'phoneme', input: 'sequence', needsTTS: true, langs: ['tr'],
    levels: [{ minSyl: 2, maxSyl: 2, extra: 0, wordLvl: 1 }, { minSyl: 2, maxSyl: 3, extra: 0, wordLvl: 1 }, { minSyl: 3, maxSyl: 3, extra: 0, wordLvl: 2 }, { minSyl: 3, maxSyl: 4, extra: 1, wordLvl: 2 }, { minSyl: 4, maxSyl: 5, extra: 2, wordLvl: 3 }],
    generate(gc) {
      const L = gc.pack.L;
      const cands = wordPool(gc, (w) => L.syllabifySafe(w.w) && w.syl >= gc.P.minSyl && w.syl <= gc.P.maxSyl);
      const [w] = gc.choose(cands, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      const syl = L.syllabify(w.w);
      if (new Set(syl).size !== syl.length) return null;
      const extras = [];
      for (const other of shuffle(cands, gc.rng)) {
        if (extras.length >= gc.P.extra) break;
        const s = pick(L.syllabify(other.w), gc.rng);
        if (!syl.includes(s) && !extras.includes(s)) extras.push(s);
      }
      return {
        key: `sylo:${w.id}`, promptKey: 'q.syllableOrder', play: { type: 'speech', text: w.w },
        options: [...syl, ...extras].map((s) => ({ id: s, label: s })), answer: syl, subtitle: syl.join('-'), meta: { category: w.cat },
      };
    },
  },
  {
    id: 'stress', group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', langs: ['en'], optionCounts: [2, 3, 4],
    levels: [{ syl: [2], wordLvl: 1 }, { syl: [2], wordLvl: 2 }, { syl: [2, 3], wordLvl: 2 }, { syl: [3], wordLvl: 3 }, { syl: [3, 4], wordLvl: 3 }],
    generate(gc) {
      const cands = wordPool(gc, (w) => w.stress && gc.P.syl.includes(w.syl));
      const usable = gc.qaFilter(cands, (w) => `st:${w.id}`);
      const [w] = gc.choose(usable, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      return {
        key: `stress:${w.id}`, promptKey: 'q.stress', promptVars: { word: w.w }, numeric: true, fixedOrder: true, qaKeys: [`st:${w.id}`],
        play: { type: 'speech', text: w.w }, options: Array.from({ length: w.syl }, (_, i) => numOpt(i + 1)), answer: String(w.stress),
        subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'letter-pick', group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4, 6, 10],
    levels: [{ options: 2, confusable: false }, { options: 3, confusable: false }, { options: 4, confusable: true }, { options: 6, confusable: true }, { options: 10, confusable: true }],
    generate(gc) {
      const L = gc.pack.L;
      const ok = gc.qaFilter(L.LETTERS, ([l]) => `lt:${L.code}:${l}`);
      const rhymes = L.code === 'tr' ? ok.filter(([, n]) => /e$/.test(n) && n.length <= 3) : ok.filter(([l]) => 'BCDEGPTVZ'.includes(l));
      const pool = gc.P.confusable && rhymes.length >= gc.nOptions ? rhymes : ok;
      if (pool.length < 2) return null;
      const opts = sample(pool, Math.min(gc.nOptions, pool.length), gc.rng);
      const [letter, name] = pick(opts, gc.rng);
      return {
        key: `letter:${letter}`, promptKey: 'q.whichLetter', qaKeys: [`lt:${L.code}:${letter}`],
        play: { type: 'speech', text: name }, options: opts.map(([l, n]) => ({ id: l, label: l, say: n })), answer: letter, subtitle: `${letter} (${name})`,
      };
    },
  },
  {
    id: 'digit-pick', group: 'phoneme', input: 'choice', needsTTS: true, optionCounts: [3, 4, 6, 8, 10],
    levels: [{ options: 3 }, { options: 4 }, { options: 6 }, { options: 8 }, { options: 10 }],
    generate(gc) {
      const L = gc.pack.L;
      if (gc.qaStatus(`dg:${L.code}`) === 'bad') return null;
      const digits = gc.nOptions >= 10 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], gc.nOptions, gc.rng).sort((a, b) => a - b);
      const d = pick(digits, gc.rng);
      return {
        key: `digit:${d}`, promptKey: 'q.whichDigit', numeric: true, digitKeys: true, fixedOrder: true, qaKeys: [`dg:${L.code}`],
        play: { type: 'speech', text: L.DIGITS[d] }, options: digits.map(numOpt), answer: String(d), subtitle: `${d} (${L.DIGITS[d]})`,
      };
    },
  },
];

// İlk/son ses eşleştirme: yalnızca sesli seçenekler (yazı gizli) — görsel ipucu olmadan işitsel karar.
function soundMatch(gc, where) {
  const L = gc.pack.L;
  const at = (w) => { const ph = phonemesOf(w, L); return ph ? (where === 'initial' ? ph[0] : ph[ph.length - 1]) : null; };
  const cands = wordPool(gc, (w) => { const p = at(w); return p && !(where === 'final' && isVowel(p) && L.code === 'en'); });
  const [target] = gc.choose(cands, (x) => `w:${x.id}`, { n: 1 });
  if (!target) return null;
  const p = at(target);
  const same = cands.filter((w) => w.id !== target.id && at(w) === p);
  const diff = cands.filter((w) => at(w) !== p);
  if (!same.length || diff.length < gc.nOptions - 1) return null;
  const correct = pick(same, gc.rng);
  const distract = [];
  const usedP = new Set([p]);
  for (const w of shuffle(diff, gc.rng)) {
    if (distract.length >= gc.nOptions - 1) break;
    const q = at(w);
    if (!usedP.has(q)) { usedP.add(q); distract.push(w); }
  }
  if (distract.length < gc.nOptions - 1) return null;
  const options = [correct, ...distract].map((w) => wordOpt(w, { hidden: true }));
  return {
    key: `${where}:${target.id}`, promptKey: where === 'initial' ? 'q.sameStart' : 'q.sameEnd', audioOptions: true,
    play: { type: 'speech', text: target.w }, options, answer: correct.id,
    subtitle: `${target.w} → ${correct.w}`, explain: { key: 'ex.explainSound', vars: { sound: phonemeLabel(p, L) } }, meta: { phoneme: p },
  };
}

// ---------- Minimal çiftler ----------

export function familyPool(gc, filter = () => true) {
  const fams = gc.pack.families.filter((f) => audOk(f, gc.audience) && f.lvl <= gc.P.famLvl && filter(f));
  return gc.qaFilter(fams, (f) => `pf:${f.id}`);
}

export const pairWord = (f, w) => ({ id: `${f.id}:${w.w}`, label: w.w, emoji: w.e || null, say: w.w, ipa: w.ipa });

function contrastMeta(a, b) {
  const c = minimalContrast(a.ipa, b.ipa);
  return c ? { contrast: c.label, position: c.position, feature: contrastFeature(c) } : {};
}

function pairPick(gc, noise = 0) {
  const fams = familyPool(gc);
  const [fam] = gc.choose(fams, (f) => `pf:${f.id}`, { n: 1 });
  if (!fam) return null;
  const n = Math.min(gc.nOptions, fam.words.length);
  const words = sample(fam.words, n, gc.rng);
  const target = pick(words, gc.rng);
  const other = words.find((w) => w !== target);
  return {
    key: `pf:${fam.id}:${target.w}`, promptKey: 'q.whichWord', qaKeys: [`pf:${fam.id}`],
    play: { type: 'speech', text: target.w }, noise, options: words.map((w) => pairWord(fam, w)), answer: `${fam.id}:${target.w}`,
    subtitle: target.w, explain: { key: 'ex.explainPair', vars: { ipa: `/${target.ipa}/` } }, meta: { family: fam.id, ...contrastMeta(target, other) },
  };
}

export const PAIR_TASKS = [
  {
    id: 'pair-pick', group: 'pairs', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4, 5],
    levels: [{ options: 2, famLvl: 1 }, { options: 2, famLvl: 2 }, { options: 3, famLvl: 2 }, { options: 4, famLvl: 3 }, { options: 5, famLvl: 3 }],
    generate: (gc) => pairPick(gc, 0),
  },
  {
    id: 'pair-same', group: 'pairs', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2],
    levels: [{ famLvl: 1, gap: 900 }, { famLvl: 2, gap: 800 }, { famLvl: 2, gap: 600 }, { famLvl: 3, gap: 500 }, { famLvl: 3, gap: 400 }],
    generate(gc) {
      const [fam] = gc.choose(familyPool(gc), (f) => `pf:${f.id}`, { n: 1 });
      if (!fam) return null;
      const [a, b] = sample(fam.words, 2, gc.rng);
      const same = gc.rng() < 0.4;
      const second = same ? a : b;
      return {
        key: `psame:${fam.id}:${a.w}:${second.w}`, promptKey: 'q.sameOrDifferent', qaKeys: [`pf:${fam.id}`],
        play: { type: 'seq', parts: [{ text: a.w }, { pause: gc.P.gap }, { text: second.w }] }, fixedOrder: true,
        options: [{ id: 'same', labelKey: 'opt.same' }, { id: 'diff', labelKey: 'opt.different' }], answer: same ? 'same' : 'diff',
        subtitle: `${a.w} – ${second.w}`, meta: { family: fam.id, ...contrastMeta(a, b) },
      };
    },
  },
  {
    id: 'pair-noise', group: 'pairs', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4],
    levels: [{ options: 2, famLvl: 1, noise: 1 }, { options: 2, famLvl: 2, noise: 1 }, { options: 2, famLvl: 2, noise: 2 }, { options: 3, famLvl: 3, noise: 2 }, { options: 3, famLvl: 3, noise: 3 }],
    generate: (gc) => pairPick(gc, gc.P.noise),
  },
  {
    id: 'pair-sentence', group: 'pairs', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4],
    levels: [{ options: 2, famLvl: 2 }, { options: 2, famLvl: 2 }, { options: 3, famLvl: 3 }, { options: 3, famLvl: 3 }, { options: 4, famLvl: 3 }],
    generate(gc) {
      const fams = familyPool(gc, (f) => Boolean(f.frame));
      const [fam] = gc.choose(fams, (f) => `pf:${f.id}:s`, { n: 1 });
      if (!fam) return null;
      const allowed = fam.words.filter((w) => !fam.frameWords || fam.frameWords.includes(w.w));
      const words = sample(allowed, Math.min(gc.nOptions, allowed.length), gc.rng);
      if (words.length < 2) return null;
      const target = pick(words, gc.rng);
      const sent = (w) => gc.pack.L.capitalize(fam.frame.replace('{w}', w.w));
      return {
        key: `psent:${fam.id}:${target.w}`, promptKey: 'q.whichSentence', qaKeys: [`pf:${fam.id}`],
        play: { type: 'speech', text: sent(target) }, options: words.map((w) => ({ id: w.w, label: sent(w) })), answer: target.w, longOptions: true,
        subtitle: sent(target), meta: { family: fam.id, ...contrastMeta(target, words.find((w) => w !== target)) },
      };
    },
  },
];
