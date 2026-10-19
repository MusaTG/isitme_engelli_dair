// Görev kayıt defteri, beceri grupları, zorluk parametreleri ve eğitim yolları.
import { SOUND_TASKS } from './tasks/sound.js';
import { PHONEME_TASKS, PAIR_TASKS } from './tasks/phoneme.js';
import { WORD_TASKS } from './tasks/words.js';
import { SENTENCE_TASKS } from './tasks/sentences.js';
import { PASSAGE_TASKS, MEMORY_TASKS } from './tasks/passages.js';
import { ADVANCED_TASKS } from './tasks/advanced.js';
import { fitOptions } from './common.js';
import { clamp } from '../core/rng.js';

export const TASKS = [...SOUND_TASKS, ...PHONEME_TASKS, ...PAIR_TASKS, ...WORD_TASKS, ...SENTENCE_TASKS, ...PASSAGE_TASKS, ...MEMORY_TASKS, ...ADVANCED_TASKS];
export const TASK_MAP = Object.fromEntries(TASKS.map((t) => [t.id, t]));
export const getTask = (id) => TASK_MAP[id] || null;

// Ana ekrandaki "Beceriler" grupları (görev sırası kolaydan zora).
export const GROUPS = [
  { id: 'sound', tasks: ['tone-detect', 'tone-onset', 'tone-offset', 'tone-same', 'tone-length', 'tone-pitch', 'tone-loud', 'tone-count', 'tone-pattern', 'tone-odd', 'tone-target', 'tone-direction'] },
  { id: 'phoneme', tasks: ['syl-pick', 'syl-same', 'syl-seq', 'initial-sound', 'final-sound', 'sound-position', 'syl-count', 'syl-order', 'stress', 'letter-pick', 'digit-pick', 'logatom-cons', 'logatom-vowel'] },
  { id: 'pairs', tasks: ['pair-pick', 'pair-same', 'pair-middle', 'pair-noise', 'pair-sentence'] },
  { id: 'words', tasks: ['learn-words', 'word-pick', 'picture-pick', 'word-type', 'word-in-sentence', 'category-pick', 'word-seen'] },
  { id: 'sentences', tasks: ['sent-pick', 'sent-question', 'sent-changed', 'sent-yesno', 'sent-reply', 'instructions', 'info', 'matrix'] },
  { id: 'passages', tasks: ['paragraph'] },
  { id: 'memory', tasks: ['mem-order', 'digit-span', 'mem-missing'] },
  { id: 'daily', tasks: ['dialogue', 'speaker-id'] },
];
// İşitsel beceri hiyerarşisi (Erber 1982 çerçevesi): farkındalık → ayırt etme → tanıma → anlama.
// Katalogda süzgeç olarak kullanılır; sıralı ilerleme zorunlu değildir.
export const HIERARCHY = ['detect', 'discriminate', 'identify', 'comprehend'];
const HIER_OF = {
  detect: ['tone-detect', 'tone-onset', 'tone-offset', 'tone-count'],
  discriminate: ['tone-same', 'tone-length', 'tone-pitch', 'tone-loud', 'tone-pattern', 'tone-odd', 'tone-direction', 'syl-same', 'pair-same', 'syl-seq'],
  identify: ['tone-target', 'syl-pick', 'initial-sound', 'final-sound', 'sound-position', 'syl-count', 'syl-order', 'stress', 'letter-pick', 'digit-pick',
    'logatom-cons', 'logatom-vowel', 'pair-pick', 'pair-middle', 'pair-noise', 'pair-sentence', 'learn-words', 'word-pick', 'picture-pick', 'word-type',
    'word-in-sentence', 'category-pick', 'word-seen', 'sent-pick', 'sent-changed', 'matrix', 'mem-order', 'digit-span', 'mem-missing'],
  comprehend: ['sent-question', 'sent-yesno', 'sent-reply', 'instructions', 'info', 'paragraph', 'dialogue', 'speaker-id'],
};
export const hierarchyOf = (taskId) => Object.keys(HIER_OF).find((h) => HIER_OF[h].includes(taskId)) || null;

export const groupOf = (taskId) => GROUPS.find((g) => g.tasks.includes(taskId))?.id || getTask(taskId)?.group;

export const SCENARIO_GROUPS = ['home', 'social', 'transport', 'phone', 'work', 'health', 'public'];

// İsteğe bağlı eğitim yolları. Hiçbiri zorunlu değildir; evrensel bir tıbbi protokol değildir.
export const PATHS = [
  { id: 'awareness', blocks: [{ task: 'tone-detect' }, { task: 'tone-onset' }, { task: 'tone-offset' }] },
  { id: 'features', blocks: [{ task: 'tone-same' }, { task: 'tone-length' }, { task: 'tone-pitch' }, { task: 'tone-loud' }, { task: 'tone-count' }, { task: 'tone-pattern' }, { task: 'tone-odd' }] },
  { id: 'phonemes', blocks: [{ task: 'syl-pick' }, { task: 'syl-same' }, { task: 'initial-sound' }, { task: 'final-sound' }, { task: 'syl-count' }] },
  { id: 'words', blocks: [{ task: 'learn-words' }, { task: 'word-pick' }, { task: 'picture-pick' }, { task: 'category-pick' }, { task: 'word-type' }] },
  { id: 'similar', blocks: [{ task: 'pair-pick' }, { task: 'pair-same' }, { task: 'pair-middle' }, { task: 'pair-sentence' }] },
  { id: 'sentences', blocks: [{ task: 'sent-question' }, { task: 'sent-pick' }, { task: 'sent-yesno' }, { task: 'sent-changed' }, { task: 'word-in-sentence' }, { task: 'matrix' }] },
  { id: 'paragraphs', blocks: [{ task: 'paragraph' }] },
  { id: 'memory', blocks: [{ task: 'mem-order' }, { task: 'digit-span' }, { task: 'mem-missing' }] },
  { id: 'speakers', blocks: [{ task: 'speaker-id' }, { task: 'dialogue', overrides: { multiVoice: true } }], needsVoices: 2 },
  { id: 'rate', blocks: [{ task: 'word-pick', overrides: { rateVary: true } }, { task: 'sent-question', overrides: { rateVary: true } }] },
  { id: 'noise', blocks: [{ task: 'pair-noise' }, { task: 'word-pick', overrides: { noise: 1 } }, { task: 'sent-question', overrides: { noise: 1 } }] },
  { id: 'daily', blocks: [{ task: 'dialogue' }, { task: 'info' }, { task: 'instructions' }, { task: 'sent-reply' }] },
  { id: 'phone', blocks: [{ task: 'dialogue', filter: { groups: ['phone'] } }, { task: 'word-pick', filter: { categories: ['phone', 'phrases'] } }] },
  { id: 'long', blocks: [{ task: 'paragraph', overrides: { level: 5 } }, { task: 'dialogue' }] },
  { id: 'personal', blocks: [], personal: true },
  { id: 'logatoms', blocks: [{ task: 'logatom-cons' }, { task: 'logatom-vowel' }] },
];

const RATE_STEPS = [0.9, 0.95, 1, 1.05, 1.1];

// Seviye (1–5) parametreleri + kullanıcı/plan geçersiz kılmaları → nihai parametreler.
export function resolveParams(def, level, overrides = {}) {
  const lvl = clamp(Math.round(overrides.level || level || 1), 1, 5);
  const P = { ...(def.levels?.[lvl - 1] || {}) };
  if (overrides.noise !== undefined && overrides.noise !== null && def.needsTTS && def.input !== 'multi') P.noise = overrides.noise;
  P.rateFactor = overrides.rateVary ? RATE_STEPS[lvl - 1] : 1;
  // Paragraf/diyalogda soru sayısı seviyeden bağımsız seçilebilir (1–6; metinde yeterli soru yoksa daha az).
  if (overrides.questions && P.questions !== undefined) P.questions = clamp(Math.round(overrides.questions), 1, 6);
  const requested = overrides.options || P.options || def.optionCounts?.[0] || 2;
  const nOptions = def.optionCounts ? fitOptions(requested, def) : requested;
  return { level: lvl, P, nOptions };
}

export function taskSupports(def, { lang, voicesDistinct = 0, stereoOk = false, speechOk = true } = {}) {
  if (def.langs && !def.langs.includes(lang)) return { ok: false, reason: 'lang' };
  if (def.needsTTS && !speechOk) return { ok: false, reason: 'noVoice' };
  if (def.needsVoices && voicesDistinct < def.needsVoices) return { ok: false, reason: 'voices' };
  if (def.needsStereo && !stereoOk) return { ok: false, reason: 'stereo' };
  return { ok: true };
}
