// v3 ileri algı görevleri: logatomlar (VCV ünsüz / CVC ünlü), ortadaki ses (iç sesteki minimal fark)
// ve matris cümleleri (her sütundan bir kelime; kelime bazında puanlama).
// Not: Matris görevi klinik Matris Testi değildir; özgün kelimelerle aynı yapıyı pratik amaçlı kullanır.
import { pick, sample, shuffle } from '../../core/rng.js';
import { minimalContrast, contrastFeature } from '../../content/phon.js';
import { syllableSet, sylOpt, familyPool, pairWord } from './phoneme.js';

function logatomTask(id, kind, promptKey) {
  return {
    id, group: 'phoneme', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4, 6, 8, 10],
    levels: [{ options: 2, setLvl: 1 }, { options: 3, setLvl: 2 }, { options: 4, setLvl: 2 }, { options: 6, setLvl: 3 }, { options: 8, setLvl: 3 }],
    generate(gc) {
      const set = syllableSet(gc, 2, kind);
      if (!set) return null;
      const items = set.items.length > gc.nOptions ? sample(set.items, gc.nOptions, gc.rng) : set.items;
      const target = pick(items, gc.rng);
      return {
        key: `log:${set.id}:${target.s}`, promptKey, qaKeys: [`ss:${set.id}`],
        play: { type: 'speech', text: target.say }, options: items.map(sylOpt), answer: target.s,
        subtitle: target.s, explain: { key: 'ex.explainLogatom', vars: { ipa: `/${target.ipa}/` } }, meta: { contrast: set.label, nonword: true, kind },
      };
    },
  };
}

// Ailedeki her kelime çifti için iç seste (ilk ve son ses dışında) fark var mı?
function medialPairs(fam) {
  const out = [];
  for (let i = 0; i < fam.words.length; i++) {
    for (let j = 0; j < fam.words.length; j++) {
      if (i === j) continue;
      const c = minimalContrast(fam.words[i].ipa, fam.words[j].ipa);
      if (c && c.position === 'medial') out.push([fam.words[i], fam.words[j], c]);
    }
  }
  return out;
}

export const ADVANCED_TASKS = [
  logatomTask('logatom-cons', 'vcv', 'q.whichLogatom'),
  logatomTask('logatom-vowel', 'cvc', 'q.whichLogatomVowel'),
  {
    id: 'pair-middle', group: 'pairs', input: 'choice', needsTTS: true, qa: 'required', optionCounts: [2, 3, 4],
    levels: [{ options: 2, famLvl: 1 }, { options: 2, famLvl: 2 }, { options: 3, famLvl: 2 }, { options: 3, famLvl: 3 }, { options: 4, famLvl: 3 }],
    generate(gc) {
      const fams = familyPool(gc, (f) => medialPairs(f).length > 0);
      const [fam] = gc.choose(fams, (f) => `pf:${f.id}:m`, { n: 1, soft: true });
      if (!fam) return null;
      const pairs = medialPairs(fam);
      const [target, other, c] = pick(pairs, gc.rng);
      // Diğer seçenekler de hedeften yalnızca iç seste ayrılan kelimelerdir.
      const more = shuffle(pairs.filter(([a, b]) => a === target && b !== other).map(([, b]) => b), gc.rng);
      const words = [target, other, ...more].slice(0, gc.nOptions);
      return {
        key: `pfm:${fam.id}:${target.w}`, promptKey: 'q.whichWordMiddle', qaKeys: [`pf:${fam.id}`],
        play: { type: 'speech', text: target.w }, options: words.map((w) => pairWord(fam, w)), answer: `${fam.id}:${target.w}`,
        subtitle: target.w, explain: { key: 'ex.explainPair', vars: { ipa: `/${target.ipa}/` } },
        meta: { family: fam.id, contrast: c.label, position: 'medial', feature: contrastFeature(c) },
      };
    },
  },
  {
    id: 'matrix', group: 'sentences', input: 'matrix', needsTTS: true, optionCounts: [3, 4, 5, 6, 8, 10],
    levels: [{ options: 3, cols: 3 }, { options: 4, cols: 4 }, { options: 5, cols: 5 }, { options: 6, cols: 5 }, { options: 10, cols: 5 }],
    generate(gc) {
      const m = gc.pack.matrix;
      if (!m) return null;
      const lang = gc.pack.lang;
      const cols = m.pattern.map((id) => m.columns.find((c) => c.id === id));
      const chosen = cols.map((c) => pick(c.words, gc.rng));
      // Düşük seviyede bazı sütunlar sabit gösterilir (yalnızca 3 ya da 4 sütun sorulur).
      const askN = Math.min(cols.length, gc.P.cols || cols.length);
      const asked = new Set(shuffle([...cols.keys()], gc.rng).slice(0, askN));
      const n = Math.max(2, Math.min(gc.nOptions, ...cols.map((c) => c.words.length)));
      const columns = cols.map((c, i) => {
        const others = sample(c.words.filter((w) => w !== chosen[i]), n - 1, gc.rng);
        const words = asked.has(i) ? shuffle([chosen[i], ...others], gc.rng) : [chosen[i]];
        return { id: c.id, label: c.label[gc.L.code] || c.label[lang], fixed: !asked.has(i), options: words.map((w) => ({ id: w, label: w })) };
      });
      const sentence = gc.L.capitalize(chosen.join(' ')) + '.';
      return {
        key: `mx:${chosen.join('|')}`, promptKey: 'q.matrix', play: { type: 'speech', text: sentence },
        columns, answer: chosen, subtitle: sentence, noExposure: false,
        meta: { cols: askN, words: chosen.length },
      };
    },
  },
];
