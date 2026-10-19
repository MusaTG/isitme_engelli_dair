import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPack, allOk } from './helpers.js';
import { TASKS, GROUPS, PATHS, getTask, resolveParams } from '../js/engine/registry.js';
import { buildSession, makePositioner, checkTyped, checkSequence, checkPress } from '../js/engine/session.js';
import { makeRng } from '../js/core/rng.js';
import { recordExposure, poolOf, classify } from '../js/engine/exposure.js';
import { updateLevel } from '../js/engine/adaptive.js';

const ctx = (lang) => ({ voicesDistinct: 2, stereoOk: true, speechOk: true, qaStatus: allOk, catLabel: (c) => c });

function checkItem(item, def) {
  assert.ok(item.uid && item.key, `${def.id}: kimlik`);
  assert.ok(item.play, `${def.id}: oynatma`);
  if (item.input === 'choice') {
    const ids = item.options.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, `${def.id}: yinelenen seçenek kimliği`);
    const labels = item.options.map((o) => String(o.label ?? o.labelKey).toLocaleLowerCase());
    assert.equal(new Set(labels).size, labels.length, `${def.id}: yinelenen seçenek etiketi ${labels}`);
    assert.equal(item.options.filter((o) => o.id === item.answer).length, 1, `${def.id}: tek doğru cevap`);
    assert.ok(item.options.length >= 2 && item.options.length <= 10, `${def.id}: seçenek sayısı ${item.options.length}`);
  } else if (item.input === 'sequence') {
    for (const a of item.answer) assert.ok(item.options.some((o) => o.id === a), `${def.id}: sıra cevabı seçeneklerde`);
  } else if (item.input === 'multi') {
    assert.ok(item.questions.length >= 1);
    for (const q of item.questions) {
      assert.equal(q.options.filter((o) => o.id === q.answerId).length, 1, `${def.id}: alt soru tek cevap`);
      assert.equal(new Set(q.options.map((o) => o.label)).size, q.options.length, `${def.id}: alt soru yinelenen seçenek`);
    }
  } else if (item.input === 'type') {
    assert.ok(item.answer.accept.length);
  } else if (item.input === 'keypad') {
    assert.ok(item.answer.every((d) => /^\d$/.test(d)));
  } else if (item.input === 'press') {
    assert.ok(item.press.at > 0);
  }
}

test('her görev, her dilde, her seviyede, çocuk ve yetişkin için geçerli öğe üretir', async () => {
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    for (const def of TASKS) {
      if (def.langs && !def.langs.includes(lang)) continue;
      for (const audience of ['child', 'adult']) {
        for (let level = 1; level <= 5; level++) {
          const exposure = {};
          if (def.id === 'word-seen') for (const w of pack.words.slice(0, 40)) exposure[`w:${w.id}`] = [1, 1, Date.now() - 1e6, 1, 0];
          const s = buildSession({ config: { mode: 'practice', audience, blocks: [{ task: def.id, count: 4 }] }, pack, exposure, levelFor: () => level, rng: makeRng(level * 31 + def.id.length), ...ctx(lang) });
          assert.ok(s.items.length >= 1, `${lang}/${def.id}/L${level}/${audience}: öğe üretilemedi ${JSON.stringify(s.warnings)}`);
          for (const it of s.items) checkItem(it, def);
        }
      }
    }
  }
});

test('2–10 seçenek: seçenek sayısı istenen değere uyar', async () => {
  const pack = await getPack('tr');
  for (const n of [2, 3, 4, 5, 6, 8, 10]) {
    const s = buildSession({ config: { blocks: [{ task: 'word-pick', count: 6, overrides: { options: n } }] }, pack, rng: makeRng(n), ...ctx('tr') });
    for (const it of s.items) assert.equal(it.options.length, n, `word-pick ${n}`);
  }
  for (const n of [2, 4, 6, 8, 10]) {
    const s = buildSession({ config: { blocks: [{ task: 'sent-pick', count: 4, overrides: { options: n } }] }, pack, rng: makeRng(n + 1), levelFor: () => 3, ...ctx('tr') });
    for (const it of s.items) assert.equal(it.options.length, n, `sent-pick ${n}`);
  }
});

test('10 seçenekli rakam modunda 0–9 rakamları sıralı ve tuş = rakam', async () => {
  const pack = await getPack('tr');
  const s = buildSession({ config: { blocks: [{ task: 'digit-pick', count: 10, overrides: { options: 10 } }] }, pack, rng: makeRng(9), ...ctx('tr') });
  for (const it of s.items) {
    assert.deepEqual(it.options.map((o) => o.label), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    assert.ok(it.digitKeys && it.numeric);
  }
  const five = buildSession({ config: { blocks: [{ task: 'digit-pick', count: 5, overrides: { options: 4 } }] }, pack, rng: makeRng(3), ...ctx('tr') });
  for (const it of five.items) assert.equal(it.options.length, 4, '4 seçenekli modda yalnızca 4 rakam görünür');
});

test('aynı içerik art arda ve oturum içinde tekrar etmez; doğru cevap konumu dengelidir', async () => {
  const pack = await getPack('en');
  const s = buildSession({ config: { blocks: [{ task: 'word-pick', count: 40, overrides: { options: 4 } }] }, pack, rng: makeRng(5), ...ctx('en') });
  const keys = s.items.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length, 'oturumda tekrar yok');
  const pos = s.items.map((i) => i.options.findIndex((o) => o.id === i.answer));
  const counts = [0, 0, 0, 0];
  pos.forEach((p) => counts[p]++);
  for (const c of counts) assert.ok(c >= 7 && c <= 13, `konum dağılımı dengeli: ${counts}`);
  let maxRun = 1, run = 1;
  for (let i = 1; i < pos.length; i++) { run = pos[i] === pos[i - 1] ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  assert.ok(maxRun <= 2, `aynı konum en fazla 2 kez art arda: ${maxRun}`);
});

test('iki seçenekli görevlerde aynı cevap 3 kereden fazla art arda gelmez', async () => {
  const pack = await getPack('tr');
  for (const task of ['tone-same', 'pair-same', 'sent-yesno']) {
    const s = buildSession({ config: { blocks: [{ task, count: 30 }] }, pack, rng: makeRng(11), ...ctx('tr') });
    let run = 1, maxRun = 1;
    for (let i = 1; i < s.items.length; i++) { run = s.items[i].answer === s.items[i - 1].answer ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
    assert.ok(maxRun <= 3, `${task}: ${maxRun}`);
  }
});

test('yeniden açılan egzersiz önceki oturumdan farklı içerik getirir (ezber önleme)', async () => {
  const pack = await getPack('tr');
  const exposure = {};
  const first = buildSession({ config: { blocks: [{ task: 'word-pick', count: 10 }] }, pack, exposure, rng: makeRng(1), ...ctx('tr') });
  for (const it of first.items) recordExposure(exposure, it.key, true);
  const second = buildSession({ config: { blocks: [{ task: 'word-pick', count: 10 }] }, pack, exposure, rng: makeRng(1), ...ctx('tr') });
  const overlap = second.items.filter((i) => first.items.some((f) => f.key === i.key)).length;
  assert.ok(overlap <= 3, `varsayılan tekrar oranında örtüşme sınırlı: ${overlap}`);
  const strict = buildSession({ config: { seenRatio: 0, blocks: [{ task: 'word-pick', count: 10 }] }, pack, exposure, rng: makeRng(1), ...ctx('tr') });
  assert.equal(strict.items.filter((i) => first.items.some((f) => f.key === i.key)).length, 0, 'tekrar oranı 0 iken görülen içerik gelmez');
  const p1 = buildSession({ config: { blocks: [{ task: 'paragraph', count: 3 }] }, pack, exposure: {}, levelFor: () => 3, rng: makeRng(2), ...ctx('tr') });
  const exp2 = {};
  for (const it of p1.items) recordExposure(exp2, it.key, true);
  const p2 = buildSession({ config: { blocks: [{ task: 'paragraph', count: 3 }] }, pack, exposure: exp2, levelFor: () => 3, rng: makeRng(2), ...ctx('tr') });
  for (const it of p2.items) assert.ok(!p1.items.some((x) => x.subtitle === it.subtitle), 'aynı paragraf metni tekrar gelmez');
});

test('alıştırma ve değerlendirme havuzları ayrıdır', async () => {
  const pack = await getPack('en');
  const practice = buildSession({ config: { mode: 'practice', blocks: [{ task: 'word-pick', count: 30 }] }, pack, rng: makeRng(4), ...ctx('en') });
  const testS = buildSession({ config: { mode: 'test', blocks: [{ task: 'word-pick', count: 30 }] }, pack, rng: makeRng(4), ...ctx('en') });
  assert.ok(practice.items.every((i) => i.pool === 'P'));
  assert.ok(testS.items.every((i) => i.pool === 'A'));
  assert.ok(testS.items.every((i) => !i.explain));
});

test('doğrulanmamış veya hatalı telaffuz değerlendirmeye girmez', async () => {
  const pack = await getPack('tr');
  const bad = (k) => (k.startsWith('pf:tr.p.bal') ? 'bad' : undefined);
  const prac = buildSession({ config: { mode: 'practice', blocks: [{ task: 'pair-pick', count: 20 }] }, pack, qaStatus: bad, rng: makeRng(8), voicesDistinct: 1 });
  assert.ok(prac.items.length > 0);
  assert.ok(prac.items.every((i) => !i.key.startsWith('pf:tr.p.bal-dal')), 'hatalı işaretli çift pratikte de kullanılmaz');
  assert.ok(prac.items.every((i) => i.qaUnverified), 'doğrulanmamış öğeler işaretlenir');
  const none = buildSession({ config: { mode: 'test', blocks: [{ task: 'pair-pick', count: 5 }] }, pack, qaStatus: () => undefined, rng: makeRng(8) });
  assert.equal(none.items.length, 0, 'hiç doğrulama yoksa değerlendirme öğesi üretilmez');
  assert.ok(none.warnings.some((w) => w.reason === 'content'));
  const okOne = (k) => (k === 'pf:tr.p.kutu-kuzu' ? 'ok' : undefined);
  const some = buildSession({ config: { mode: 'test', blocks: [{ task: 'pair-pick', count: 3 }] }, pack, qaStatus: okOne, rng: makeRng(8), levelFor: () => 3 });
  assert.ok(some.items.every((i) => i.key.startsWith('pf:tr.p.kutu-kuzu') && i.qaVerified));
});

test('desteklenmeyen özellikler sahte gösterilmez', async () => {
  const pack = await getPack('tr');
  const noStereo = buildSession({ config: { blocks: [{ task: 'tone-direction', count: 3 }] }, pack, stereoOk: false });
  assert.equal(noStereo.items.length, 0);
  assert.ok(noStereo.warnings.some((w) => w.reason === 'stereo'));
  const oneVoice = buildSession({ config: { blocks: [{ task: 'speaker-id', count: 3 }] }, pack, voicesDistinct: 1 });
  assert.equal(oneVoice.items.length, 0);
  const dlg = buildSession({ config: { blocks: [{ task: 'dialogue', count: 10 }] }, pack, voicesDistinct: 1, levelFor: () => 5, rng: makeRng(3) });
  assert.ok(dlg.items.every((i) => i.questions.every((q) => q.qtype !== 'speaker')), 'tek seste konuşmacı sorusu yok');
  const enOnly = buildSession({ config: { blocks: [{ task: 'stress', count: 3 }] }, pack });
  assert.equal(enOnly.items.length, 0);
  const noVoice = buildSession({ config: { blocks: [{ task: 'word-pick', count: 3 }] }, pack, speechOk: false });
  assert.equal(noVoice.items.length, 0);
});

test('uyarlanabilir zorluk tek hatayla sıçramaz, en fazla bir seviye değişir', () => {
  let { entry, change } = updateLevel({ level: 2 }, [{ correct: false }]);
  assert.equal(change, 0);
  ({ entry, change } = updateLevel({ level: 2 }, Array(10).fill({ correct: true, replays: 1 })));
  assert.deepEqual([entry.level, change], [3, 1]);
  ({ entry, change } = updateLevel({ level: 3 }, Array(10).fill({ correct: false })));
  assert.deepEqual([entry.level, change], [2, -1]);
  ({ change } = updateLevel({ level: 2 }, Array(10).fill({ correct: true, replays: 4 })));
  assert.equal(change, 0, 'çok fazla tekrar dinleme varsa artmaz');
  ({ change } = updateLevel({ level: 5 }, Array(10).fill({ correct: true })));
  assert.equal(change, 0, 'üst sınır');
  ({ entry } = updateLevel({ level: 2 }, Array(5).fill({ correct: true })));
  ({ change } = updateLevel(entry, Array(2).fill({ correct: true })));
  assert.equal(change, 0, '8 cevaptan önce değişmez');
  ({ change } = updateLevel({ level: 2 }, [...Array(8).fill({ correct: true }), { correct: false }, { correct: true }], 'relaxed'));
  assert.equal(change, 1, 'rahat modda %90');
});

test('cevap denetimi: yazılı, sıralı, basma', async () => {
  const pack = await getPack('tr');
  const L = pack.L;
  assert.ok(checkTyped(' Çiçek ', { accept: ['çiçek'] }, L).correct);
  assert.deepEqual(checkTyped('cicek', { accept: ['çiçek'], lenient: true }, L), { correct: true, exact: false, reason: 'diacritics' });
  assert.equal(checkTyped('cicek', { accept: ['çiçek'], lenient: false }, L).correct, false);
  assert.equal(checkTyped('', { accept: ['x'] }, L).correct, false);
  assert.ok(checkSequence(['a', 'b'], ['a', 'b']));
  assert.ok(!checkSequence(['b', 'a'], ['a', 'b']));
  assert.ok(checkPress(2.3, { at: 2, tol: 1 }));
  assert.ok(!checkPress(1.5, { at: 2, tol: 1 }), 'ses başlamadan basmak doğru sayılmaz');
  assert.ok(!checkPress(null, { at: 2, tol: 1 }));
});

test('havuz ayrımı ve aralıklı tekrar', () => {
  const keys = Array.from({ length: 500 }, (_, i) => `w:tr.w.${i}`);
  const a = keys.filter((k) => poolOf(k) === 'A').length;
  assert.ok(a > 70 && a < 130, `değerlendirme havuzu ~%20: ${a}`);
  const store = {};
  const now = Date.now();
  recordExposure(store, 'x', false, now);
  assert.equal(classify(store.x, now + 2 * 864e5), 'due');
  recordExposure(store, 'x', true, now);
  recordExposure(store, 'x', true, now);
  assert.equal(classify(store.x, now + 864e5), 'seen');
});

test('beceri grupları ve eğitim yolları geçerli görevlere işaret eder', () => {
  for (const g of GROUPS) for (const t of g.tasks) assert.ok(getTask(t), t);
  for (const p of PATHS) for (const b of p.blocks) assert.ok(getTask(b.task), b.task);
  assert.equal(PATHS.length, 16);
  const grouped = new Set(GROUPS.flatMap((g) => g.tasks));
  for (const t of TASKS) assert.ok(grouped.has(t.id), `grupsuz görev: ${t.id}`);
  const r = resolveParams(getTask('word-pick'), 9, { options: 7 });
  assert.equal(r.level, 5);
  assert.ok([6, 8].includes(r.nOptions));
});

test('konumlandırıcı her seçeneği kullanır', () => {
  const place = makePositioner(makeRng(3));
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const opts = place([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'a');
    seen.add(opts.findIndex((o) => o.id === 'a'));
  }
  assert.equal(seen.size, 3);
});
