// A. Temel ses farkındalığı — Web Audio ile üretilen tonlar. Dil bağımsızdır.
// Bu görevler işitme eşiği ölçümü veya tanı testi DEĞİLDİR; cihaz ve işitme cihazı ayarları sonucu etkiler.
import { randInt, pick, shuffle } from '../../core/rng.js';
import { numOpt } from '../common.js';

const base = (gc) => randInt(300, 700, gc.rng);
const two = (a, b) => [{ id: a[0], labelKey: a[1] }, { id: b[0], labelKey: b[1] }];

function rhythm(beats, rng, gap) {
  return Array.from({ length: beats }, () => ({ d: pick([0.12, 0.3], rng), gapAfter: gap }));
}

export const SOUND_TASKS = [
  {
    id: 'tone-detect', group: 'sound', input: 'choice', optionCounts: [2],
    levels: [{ gain: 0.25 }, { gain: 0.15 }, { gain: 0.09 }, { gain: 0.06 }, { gain: 0.04 }],
    generate(gc) {
      const present = gc.rng() >= 0.3;
      return {
        key: 'tone-detect', promptKey: 'q.toneDetect',
        play: { type: 'tones', tones: present ? [{ f: base(gc), d: 0.6, gain: gc.P.gain, at: randInt(3, 15, gc.rng) / 10 }] : [], window: 2.2 },
        options: two(['yes', 'opt.heard'], ['no', 'opt.notHeard']), answer: present ? 'yes' : 'no',
        subtitleKey: present ? 'sub.toneHeard' : 'sub.toneSilent', fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-same', group: 'sound', input: 'choice', optionCounts: [2],
    levels: [{ ratio: 2 }, { ratio: 1.5 }, { ratio: 1.25 }, { ratio: 1.12 }, { ratio: 1.06 }],
    generate(gc) {
      const f = base(gc), same = gc.rng() < 0.5;
      const f2 = same ? f : Math.round(f * (gc.rng() < 0.5 ? gc.P.ratio : 1 / gc.P.ratio));
      return {
        key: 'tone-same', promptKey: 'q.toneSame', play: { type: 'tones', tones: [{ f, d: 0.5 }, { f: f2, d: 0.5 }], gap: 0.45 },
        options: two(['same', 'opt.same'], ['diff', 'opt.different']), answer: same ? 'same' : 'diff',
        subtitleKey: same ? 'sub.toneSame' : 'sub.toneDiff', fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-length', group: 'sound', input: 'choice', optionCounts: [2],
    levels: [{ s: 0.2, l: 0.9 }, { s: 0.25, l: 0.7 }, { s: 0.3, l: 0.55 }, { s: 0.35, l: 0.5 }, { s: 0.4, l: 0.5 }],
    generate(gc) {
      const long = gc.rng() < 0.5;
      return {
        key: 'tone-length', promptKey: 'q.toneLength', play: { type: 'tones', tones: [{ f: base(gc), d: long ? gc.P.l : gc.P.s }] },
        options: two(['short', 'opt.short'], ['long', 'opt.long']), answer: long ? 'long' : 'short',
        subtitleKey: long ? 'sub.toneLong' : 'sub.toneShort', fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-pitch', group: 'sound', input: 'choice', optionCounts: [2],
    levels: [{ ratio: 2 }, { ratio: 1.5 }, { ratio: 1.25 }, { ratio: 1.12 }, { ratio: 1.06 }],
    generate(gc) {
      const f = base(gc), up = gc.rng() < 0.5;
      return {
        key: 'tone-pitch', promptKey: 'q.tonePitch',
        play: { type: 'tones', tones: [{ f, d: 0.5 }, { f: Math.round(up ? f * gc.P.ratio : f / gc.P.ratio), d: 0.5 }], gap: 0.45 },
        options: two(['high', 'opt.higher'], ['low', 'opt.lower']), answer: up ? 'high' : 'low',
        subtitleKey: up ? 'sub.toneUp' : 'sub.toneDown', fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-loud', group: 'sound', input: 'choice', optionCounts: [3],
    levels: [{ db: 12 }, { db: 9 }, { db: 6 }, { db: 4 }, { db: 3 }],
    generate(gc) {
      const kind = pick(['louder', 'softer', 'same'], gc.rng);
      const g1 = 0.12;
      const g2 = kind === 'same' ? g1 : g1 * 10 ** ((kind === 'louder' ? 1 : -1) * gc.P.db / 20);
      const f = base(gc);
      return {
        key: 'tone-loud', promptKey: 'q.toneLoud', play: { type: 'tones', tones: [{ f, d: 0.6, gain: g1 }, { f, d: 0.6, gain: g2 }], gap: 0.5 },
        options: [{ id: 'louder', labelKey: 'opt.louder' }, { id: 'softer', labelKey: 'opt.softer' }, { id: 'same', labelKey: 'opt.sameLoud' }],
        answer: kind, subtitleKey: `sub.loud.${kind}`, fixedOrder: true, note: 'note.deviceVolume',
      };
    },
  },
  {
    id: 'tone-count', group: 'sound', input: 'choice', optionCounts: [3, 4, 5, 6, 8, 10],
    levels: [{ options: 3, d: 0.3, gap: 0.35 }, { options: 4, d: 0.25, gap: 0.3 }, { options: 5, d: 0.2, gap: 0.22 }, { options: 6, d: 0.16, gap: 0.16 }, { options: 8, d: 0.12, gap: 0.12 }],
    generate(gc) {
      const n = Math.min(10, Math.max(3, gc.nOptions));
      const count = randInt(1, n, gc.rng);
      const f = base(gc);
      return {
        key: 'tone-count', promptKey: 'q.toneCount', numeric: true,
        play: { type: 'tones', tones: Array.from({ length: count }, () => ({ f, d: gc.P.d })), gap: gc.P.gap },
        options: Array.from({ length: n }, (_, i) => numOpt(i + 1)), answer: String(count),
        subtitleKey: 'sub.toneCount', subtitleVars: { n: count }, fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-pattern', group: 'sound', input: 'choice', optionCounts: [2],
    levels: [{ beats: 3, gap: 0.25 }, { beats: 4, gap: 0.22 }, { beats: 4, gap: 0.18 }, { beats: 5, gap: 0.15 }, { beats: 6, gap: 0.12 }],
    generate(gc) {
      const a = rhythm(gc.P.beats, gc.rng, gc.P.gap);
      const same = gc.rng() < 0.5;
      const b = a.map((x) => ({ ...x }));
      if (!same) { const i = randInt(0, b.length - 1, gc.rng); b[i].d = b[i].d > 0.2 ? 0.12 : 0.3; }
      const f = base(gc);
      const toTones = (r) => r.map((x) => ({ f, d: x.d }));
      return {
        key: 'tone-pattern', promptKey: 'q.tonePattern',
        play: { type: 'tones', groups: [toTones(a), toTones(b)], gap: gc.P.gap, groupGap: 1.0 },
        options: two(['same', 'opt.same'], ['diff', 'opt.different']), answer: same ? 'same' : 'diff',
        subtitleKey: same ? 'sub.patternSame' : 'sub.patternDiff', fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-odd', group: 'sound', input: 'choice', optionCounts: [3, 4, 5, 6, 8, 10],
    levels: [{ options: 3, ratio: 1.6 }, { options: 4, ratio: 1.4 }, { options: 5, ratio: 1.25 }, { options: 6, ratio: 1.15 }, { options: 8, ratio: 1.1 }],
    generate(gc) {
      const len = Math.min(10, Math.max(3, gc.nOptions));
      const f = base(gc), odd = randInt(0, len - 1, gc.rng);
      const of = Math.round(gc.rng() < 0.5 ? f * gc.P.ratio : f / gc.P.ratio);
      return {
        key: 'tone-odd', promptKey: 'q.toneOdd', numeric: true,
        play: { type: 'tones', tones: Array.from({ length: len }, (_, i) => ({ f: i === odd ? of : f, d: 0.3 })), gap: 0.35, countVisual: true },
        options: Array.from({ length: len }, (_, i) => numOpt(i + 1)), answer: String(odd + 1),
        subtitleKey: 'sub.toneOdd', subtitleVars: { n: odd + 1 }, fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-target', group: 'sound', input: 'choice', optionCounts: [3, 4, 5, 6, 8],
    levels: [{ options: 3, ratio: 1.6 }, { options: 4, ratio: 1.4 }, { options: 4, ratio: 1.25 }, { options: 5, ratio: 1.15 }, { options: 6, ratio: 1.1 }],
    generate(gc) {
      const len = Math.min(8, Math.max(3, gc.nOptions));
      const f = base(gc);
      const pool = shuffle([f, Math.round(f * gc.P.ratio), Math.round(f / gc.P.ratio), Math.round(f * gc.P.ratio * gc.P.ratio), Math.round(f / gc.P.ratio / gc.P.ratio)], gc.rng);
      const target = pool[0];
      const pos = randInt(0, len - 1, gc.rng);
      const seq = Array.from({ length: len }, (_, i) => (i === pos ? target : pool[1 + (i % (pool.length - 1))]));
      return {
        key: 'tone-target', promptKey: 'q.toneTarget', numeric: true,
        play: { type: 'tones', groups: [[{ f: target, d: 0.6 }], seq.map((x) => ({ f: x, d: 0.35 }))], gap: 0.4, groupGap: 1.2, countVisual: true },
        options: Array.from({ length: len }, (_, i) => numOpt(i + 1)), answer: String(pos + 1),
        subtitleKey: 'sub.toneOdd', subtitleVars: { n: pos + 1 }, fixedOrder: true,
      };
    },
  },
  {
    id: 'tone-onset', group: 'sound', input: 'press',
    levels: [{ tol: 1.5, gain: 0.2 }, { tol: 1.2, gain: 0.15 }, { tol: 1.0, gain: 0.1 }, { tol: 0.85, gain: 0.08 }, { tol: 0.7, gain: 0.06 }],
    generate(gc) {
      const at = randInt(12, 45, gc.rng) / 10;
      return {
        key: 'tone-onset', promptKey: 'q.toneOnset',
        play: { type: 'tones', tones: [{ f: base(gc), d: 1.6, gain: gc.P.gain, at }], window: at + 2.5 },
        press: { event: 'start', at, tol: gc.P.tol }, subtitleKey: 'sub.onset',
      };
    },
  },
  {
    id: 'tone-offset', group: 'sound', input: 'press',
    levels: [{ tol: 1.5 }, { tol: 1.2 }, { tol: 1.0 }, { tol: 0.85 }, { tol: 0.7 }],
    generate(gc) {
      const d = randInt(15, 40, gc.rng) / 10;
      return {
        key: 'tone-offset', promptKey: 'q.toneOffset',
        play: { type: 'tones', tones: [{ f: base(gc), d, gain: 0.15, at: 0.3 }], window: d + 2.5 },
        press: { event: 'end', at: 0.3 + d, tol: gc.P.tol }, subtitleKey: 'sub.offset',
      };
    },
  },
  {
    id: 'tone-direction', group: 'sound', input: 'choice', optionCounts: [2, 3], needsStereo: true,
    levels: [{ pan: 1, options: 2 }, { pan: 1, options: 2 }, { pan: 0.7, options: 3 }, { pan: 0.5, options: 3 }, { pan: 0.35, options: 3 }],
    generate(gc) {
      const withCenter = gc.nOptions >= 3;
      const side = pick(withCenter ? ['left', 'right', 'center'] : ['left', 'right'], gc.rng);
      const pan = side === 'left' ? -gc.P.pan : side === 'right' ? gc.P.pan : 0;
      const options = [{ id: 'left', labelKey: 'opt.left' }, ...(withCenter ? [{ id: 'center', labelKey: 'opt.center' }] : []), { id: 'right', labelKey: 'opt.right' }];
      return {
        key: 'tone-direction', promptKey: 'q.toneDirection', play: { type: 'tones', tones: [{ f: base(gc), d: 0.7, pan }] },
        options, answer: side, subtitleKey: `sub.dir.${side}`, fixedOrder: true, note: 'note.stereo',
      };
    },
  },
];
