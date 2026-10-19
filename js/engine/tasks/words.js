// D. Kelime tanıma ve kelime dağarcığı.
import { pick, shuffle, sample } from '../../core/rng.js';
import { audOk, wordOpt } from '../common.js';

// Anlamca birbirine yakın kategoriler kategori görevinde çeldirici olarak birlikte kullanılmaz.
const CONFUSABLE = [['home', 'kitchen'], ['nature', 'plants', 'weather'], ['school', 'office'], ['jobs', 'people'], ['food', 'restaurant', 'kitchen', 'shopping'], ['city', 'transport'], ['phone', 'tech'], ['emotions', 'phrases']];
const CONCRETE = ['people', 'body', 'home', 'kitchen', 'food', 'animals', 'nature', 'plants', 'colors', 'clothes', 'school', 'jobs', 'tech', 'transport', 'weather', 'time'];

const confusableWith = (cat) => new Set(CONFUSABLE.filter((g) => g.includes(cat)).flat());

function pool(gc, filter = () => true) {
  const cats = gc.filter?.categories;
  return gc.pack.words.filter((w) => audOk(w, gc.audience) && w.lvl <= gc.P.wordLvl && (!cats?.length || cats.includes(w.cat)) && filter(w));
}

function initial(w, L) {
  return L.code === 'tr' ? L.lower(w.w)[0] : (w.ipa ? w.ipa[0] : w.w[0].toLowerCase());
}

// Çeldirici seçimi: rastgele → aynı kategori → sesçe benzer (aynı hece sayısı + aynı ilk ses).
function distractors(gc, target, all, n) {
  const L = gc.pack.L;
  const others = all.filter((w) => w.id !== target.id && L.lower(w.w) !== L.lower(target.w));
  let primary;
  switch (gc.P.similarity) {
    case 'category': primary = others.filter((w) => w.cat === target.cat); break;
    case 'phonetic': primary = others.filter((w) => w.syl === target.syl && initial(w, L) === initial(target, L)); break;
    case 'phonetic-category': primary = others.filter((w) => w.cat === target.cat && w.syl === target.syl); break;
    default: primary = others.filter((w) => w.cat !== target.cat);
  }
  const fallbackA = others.filter((w) => w.syl === target.syl);
  const out = [];
  const seen = new Set();
  for (const w of [...shuffle(primary, gc.rng), ...shuffle(fallbackA, gc.rng), ...shuffle(others, gc.rng)]) {
    if (out.length >= n) break;
    if (!seen.has(w.id)) { seen.add(w.id); out.push(w); }
  }
  return out;
}

export const WORD_TASKS = [
  {
    id: 'learn-words', group: 'words', input: 'learn', needsTTS: true,
    levels: [{ wordLvl: 1 }, { wordLvl: 1 }, { wordLvl: 2 }, { wordLvl: 3 }, { wordLvl: 3 }],
    generate(gc) {
      const [w] = gc.choose(pool(gc), (x) => `w:${x.id}`, { n: 1, learning: true });
      if (!w) return null;
      const frames = gc.pack.meta.frames?.[w.cat];
      const example = w.frame && frames ? gc.render(pick(frames, gc.rng), { w: { v: w.w } }) : null;
      return {
        key: `w:${w.id}`, promptKey: 'q.learnWord', play: { type: 'speech', text: w.w }, card: { word: w.w, emoji: w.e || null, cat: w.cat, example, syl: w.syl },
        subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'word-pick', group: 'words', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5, 6, 8, 10],
    levels: [{ options: 2, wordLvl: 1, similarity: 'random' }, { options: 3, wordLvl: 1, similarity: 'category' }, { options: 4, wordLvl: 2, similarity: 'category' }, { options: 6, wordLvl: 2, similarity: 'phonetic' }, { options: 8, wordLvl: 3, similarity: 'phonetic-category' }],
    generate(gc) {
      const all = pool(gc);
      const [w] = gc.choose(all, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      const ds = distractors(gc, w, all, gc.nOptions - 1);
      if (ds.length < 1) return null;
      return {
        key: `w:${w.id}`, promptKey: 'q.whichWord', play: { type: 'speech', text: w.w }, noise: gc.P.noise || 0,
        options: [w, ...ds].map((x) => wordOpt(x)), answer: w.id, subtitle: w.w, meta: { category: w.cat, similarity: gc.P.similarity },
      };
    },
  },
  {
    id: 'picture-pick', group: 'words', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 6, 8],
    levels: [{ options: 2, wordLvl: 1, similarity: 'random' }, { options: 3, wordLvl: 1, similarity: 'random' }, { options: 4, wordLvl: 2, similarity: 'category' }, { options: 6, wordLvl: 2, similarity: 'category' }, { options: 8, wordLvl: 3, similarity: 'phonetic' }],
    generate(gc) {
      const all = pool(gc, (w) => Boolean(w.e));
      const [w] = gc.choose(all, (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      const ds = distractors(gc, w, all, gc.nOptions - 1).filter((x) => x.e !== w.e);
      if (!ds.length) return null;
      return {
        key: `w:${w.id}`, promptKey: 'q.whichPicture', play: { type: 'speech', text: w.w }, pictureOnly: true,
        options: [w, ...ds].map((x) => wordOpt(x)), answer: w.id, subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'word-type', group: 'words', input: 'type', needsTTS: true,
    levels: [{ wordLvl: 1, maxSyl: 2, lenient: true }, { wordLvl: 1, maxSyl: 3, lenient: true }, { wordLvl: 2, maxSyl: 3, lenient: true }, { wordLvl: 2, maxSyl: 4, lenient: false }, { wordLvl: 3, maxSyl: 6, lenient: false }],
    generate(gc) {
      const [w] = gc.choose(pool(gc, (x) => x.syl <= gc.P.maxSyl && !/\d/.test(x.w)), (x) => `w:${x.id}`, { n: 1 });
      if (!w) return null;
      return {
        key: `w:${w.id}`, promptKey: 'q.typeWord', play: { type: 'speech', text: w.w },
        answer: { accept: [w.w], lenient: gc.P.lenient }, subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'word-in-sentence', group: 'words', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5, 6],
    levels: [{ options: 2, wordLvl: 1 }, { options: 3, wordLvl: 1 }, { options: 4, wordLvl: 2 }, { options: 4, wordLvl: 3 }, { options: 6, wordLvl: 3 }],
    generate(gc) {
      const all = pool(gc, (w) => w.frame);
      const [w] = gc.choose(all, (x) => `wis:${x.id}`, { n: 1 });
      if (!w) return null;
      const sameCat = shuffle(all.filter((x) => x.cat === w.cat && x.id !== w.id), gc.rng).slice(0, gc.nOptions - 1);
      if (!sameCat.length) return null;
      const sentence = gc.render(pick(gc.pack.meta.frames[w.cat], gc.rng), { w: { v: w.w } });
      return {
        key: `wis:${w.id}`, promptKey: 'q.wordInSentence', promptVars: { cat: gc.catLabel(w.cat) },
        play: { type: 'speech', text: sentence }, options: [w, ...sameCat].map((x) => wordOpt(x)), answer: w.id,
        subtitle: sentence, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'category-pick', group: 'words', input: 'choice', needsTTS: true, optionCounts: [2, 3, 4, 5, 6],
    levels: [{ options: 2, wordLvl: 1 }, { options: 3, wordLvl: 1 }, { options: 4, wordLvl: 2 }, { options: 5, wordLvl: 2 }, { options: 6, wordLvl: 3 }],
    generate(gc) {
      const all = pool(gc, (w) => CONCRETE.includes(w.cat));
      const [w] = gc.choose(all, (x) => `cat:${x.id}`, { n: 1 });
      if (!w) return null;
      const avoid = confusableWith(w.cat);
      const others = sample(CONCRETE.filter((c) => c !== w.cat && !avoid.has(c)), gc.nOptions - 1, gc.rng);
      return {
        key: `cat:${w.id}`, promptKey: 'q.whichCategory', play: { type: 'speech', text: w.w },
        options: [w.cat, ...others].map((c) => ({ id: c, label: gc.catLabel(c) })), answer: w.cat, subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
  {
    id: 'word-seen', group: 'words', input: 'choice', needsTTS: true, optionCounts: [2], minSeen: 8,
    levels: [{ wordLvl: 2 }, { wordLvl: 2 }, { wordLvl: 3 }, { wordLvl: 3 }, { wordLvl: 3 }],
    generate(gc) {
      const all = pool(gc);
      const seen = all.filter((w) => gc.exposure(`w:${w.id}`)?.[0] > 0);
      const unseen = all.filter((w) => !gc.exposure(`w:${w.id}`));
      if (seen.length < 8 || !unseen.length) return null;
      const wasSeen = gc.rng() < 0.5;
      const w = pick(wasSeen ? seen : unseen, gc.rng);
      return {
        key: `seen:${w.id}`, promptKey: 'q.seenBefore', play: { type: 'speech', text: w.w }, fixedOrder: true, noExposure: true,
        options: [{ id: 'yes', labelKey: 'opt.seenYes' }, { id: 'no', labelKey: 'opt.seenNo' }], answer: wasSeen ? 'yes' : 'no',
        subtitle: w.w, meta: { category: w.cat },
      };
    },
  },
];
