// Oturum oluşturucu: görev bloklarından öğeler üretir; tekrar önleme, konum dengeleme,
// havuz ayrımı ve telaffuz doğrulama (QA) kurallarını uygular.
import { makeRng, shuffle, hash } from '../core/rng.js';
import { render } from '../content/template.js';
import { getTask, resolveParams, taskSupports, groupOf } from './registry.js';
import { makeChooser, poolOf } from './exposure.js';

// Doğru cevabın konumunu oturum boyunca dengeli dağıtır; art arda aynı konumu önler.
export function makePositioner(rng) {
  const bags = {};
  let last = -1, run = 0;
  return function place(options, answerId) {
    const n = options.length;
    if (n < 2) return options;
    let bag = bags[n];
    if (!bag || !bag.length) bag = bags[n] = shuffle([...Array(n).keys()], rng);
    let idx = bag.pop();
    if (idx === last && n > 2 && run >= 1) {
      const alt = bag.findIndex((x) => x !== last);
      if (alt >= 0) { const tmp = idx; idx = bag[alt]; bag[alt] = tmp; }
    }
    run = idx === last ? run + 1 : 0;
    last = idx;
    const answer = options.find((o) => o.id === answerId);
    const others = shuffle(options.filter((o) => o.id !== answerId), rng);
    others.splice(idx, 0, answer);
    return others;
  };
}

export function buildSession({ config, pack, exposure = {}, qaStatus = () => undefined, voicesDistinct = 0, stereoOk = false, speechOk = true,
  levelFor = () => 1, catLabel = (c) => c, rng = makeRng(), now = Date.now() }) {
  const used = new Set();
  const warnings = [];
  const items = [];
  const place = makePositioner(rng);
  const mode = config.mode || 'practice';
  const log = (w) => warnings.push({ reason: w });
  const choose = makeChooser({ rng, exposure, used, mode, seenRatio: config.seenRatio ?? 0.25, now, log });
  const answerRuns = [];

  for (const block of config.blocks) {
    const def = getTask(block.task);
    if (!def) { warnings.push({ task: block.task, reason: 'unknown' }); continue; }
    const sup = taskSupports(def, { lang: pack.lang, voicesDistinct, stereoOk, speechOk });
    if (!sup.ok) { warnings.push({ task: def.id, reason: sup.reason }); continue; }
    const overrides = block.overrides || {};
    const level = overrides.level || levelFor(def.id);
    const { level: lvl, P, nOptions } = resolveParams(def, level, overrides);
    const qaRequired = def.qa === 'required' && mode === 'test';
    const gc = {
      rng, pack, L: pack.L, audience: config.audience || 'adult', level: lvl, P, nOptions, mode, filter: block.filter || {},
      used, choose, voicesDistinct, stereoOk, catLabel,
      exposure: (k) => exposure[k],
      qaStatus,
      // Pratikte hatalı işaretlenen içerik dışlanır; değerlendirmede yalnızca doğrulanmış içerik kullanılır.
      qaFilter: (list, keyFn) => list.filter((x) => {
        const s = qaStatus(keyFn(x));
        return qaRequired ? s === 'ok' : s !== 'bad';
      }),
      poolOk: (key) => poolOf(key) === (mode === 'test' ? 'A' : 'P'),
      render: (text, bind) => render(text, bind, {}, pack.pools, pack.L),
    };
    const count = block.count || config.count || 8;
    let made = 0, attempts = 0;
    while (made < count && attempts < count * 6) {
      attempts += 1;
      const raw = def.generate(gc);
      if (!raw) continue;
      const prev = items[items.length - 1];
      if (prev && prev.key === raw.key && def.group !== 'sound') continue;
      if (items.some((x) => x.task === def.id && x.key === raw.key && def.group !== 'sound')) continue;
      if ((def.optionCounts?.[0] === 2 || raw.fixedOrder) && typeof raw.answer === 'string') {
        const runKey = `${def.id}:${raw.answer}`;
        const lastThree = answerRuns.slice(-3);
        if (lastThree.length === 3 && lastThree.every((x) => x === runKey) && attempts < count * 5) continue;
        answerRuns.push(runKey);
      }
      const item = finalize(raw, def, { lvl, P, nOptions, pack, mode, qaStatus, place, rng, index: items.length });
      if (qaRequired && !item.qaVerified) continue;
      if (made === 0) item.blockStart = true;
      items.push(item);
      made += 1;
    }
    if (made < count) warnings.push({ task: def.id, reason: 'content', made, wanted: count });
  }
  return { items, warnings, mode, createdAt: now };
}

function finalize(raw, def, { lvl, P, nOptions, pack, mode, qaStatus, place, rng, index }) {
  const item = {
    ...raw,
    uid: `${def.id}:${hash(`${raw.key}:${index}:${rng()}`).toString(36)}`,
    task: def.id, group: groupOf(def.id), lang: pack.lang, level: lvl, input: raw.input || def.input,
    pool: poolOf(raw.key), noise: raw.noise ?? P.noise ?? 0, rate: P.rateFactor || 1,
    qaRequired: def.qa === 'required', nOptions,
  };
  const keys = raw.qaKeys || [];
  item.qaVerified = keys.length > 0 && keys.every((k) => qaStatus(k) === 'ok');
  item.qaUnverified = keys.some((k) => qaStatus(k) !== 'ok');
  if (item.input === 'choice' && item.options && !raw.fixedOrder && !raw.numeric) item.options = place(item.options, item.answer);
  if (item.input === 'sequence' && item.options) item.options = shuffle(item.options, rng);
  if (item.input === 'multi' && item.questions) {
    item.questions = item.questions.map((q) => ({ ...q, options: q.options.length > 1 ? place(q.options, q.answerId) : q.options }));
  }
  if (mode === 'test') delete item.explain;
  return item;
}

// Yazılı cevap karşılaştırması: tam eşleşme, Türkçe karakter eksikliği (hoşgörülü mod) ayrı raporlanır.
export function checkTyped(input, answer, L) {
  const norm = L.normalizeAnswer(input);
  if (!norm) return { correct: false, reason: 'empty' };
  if (answer.accept.some((a) => L.normalizeAnswer(a) === norm)) return { correct: true, exact: true };
  if (answer.lenient && answer.accept.some((a) => L.foldDiacritics(a) === L.foldDiacritics(input))) return { correct: true, exact: false, reason: 'diacritics' };
  return { correct: false, reason: 'mismatch' };
}

export function checkSequence(picked, answer) {
  return picked.length === answer.length && picked.every((x, i) => String(x) === String(answer[i]));
}

export function checkPress(pressAt, press) {
  if (pressAt === null || pressAt === undefined) return false;
  return pressAt >= press.at - 0.15 && pressAt <= press.at + press.tol;
}

// Matris cümlesi: her sütun ayrı puanlanır; öğe yalnızca tüm kelimeler doğruysa "doğru" sayılır.
export function checkMatrix(picked, answer) {
  const right = answer.reduce((n, id, i) => n + (String(picked[i]) === String(id) ? 1 : 0), 0);
  return { right, total: answer.length, ok: right === answer.length, complete: answer.every((_, i) => picked[i] !== undefined && picked[i] !== null) };
}
