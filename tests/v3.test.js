// v3 testleri: hedefler/notlar modeli ve geçiş, kılavuz, beceri hiyerarşisi, yeni görevler
// (logatom, ortadaki ses, matris), adlandırılmış seviyeler, katalog araması ve yeni senaryolar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPack, allOk } from './helpers.js';
import { newGoal, newNote, noteIsEmpty, migrateGoals, goalStats, goalSessions, filterGoals, filterNotes, plannedToday, startOfWeek, suggestTasksFor } from '../js/goals.js';
import { TASKS, GROUPS, HIERARCHY, hierarchyOf, getTask } from '../js/engine/registry.js';
import { buildSession, checkMatrix } from '../js/engine/session.js';
import { makeRng } from '../js/core/rng.js';
import { minimalContrast } from '../js/content/phon.js';
import { validatePack } from '../js/content/validate.js';
import { normalize } from '../js/store.js';
import { setLocale, t } from '../js/i18n.js';
import { levelName, LEVEL_IDS } from '../js/engine/levels.js';
import { GUIDES, searchGuide } from '../js/views/guide.js';
import { searchTasks } from '../js/views/catalog.js';
import tr from '../locales/tr.js';
import en from '../locales/en.js';

const env = { voicesDistinct: 2, stereoOk: true, speechOk: true, qaStatus: allOk, catLabel: (c) => c };
const session = (pack, task, level = 3, extra = {}) => buildSession({
  config: { mode: 'practice', blocks: [{ task, count: 8, overrides: { level, ...extra } }] }, pack, ...env, levelFor: () => level, rng: makeRng(11),
});

// ---------- hedefler ----------
test('yeni hedef varsayılanları ve geçersiz değerlerin düzeltilmesi', () => {
  const g = newGoal({ title: '  Gürültüde cümle  ', priority: 'urgent', status: 'x', tasks: ['word-pick', 'word-pick'] });
  assert.equal(g.title, 'Gürültüde cümle');
  assert.equal(g.priority, 'normal');
  assert.equal(g.status, 'active');
  assert.deepEqual(g.tasks, ['word-pick']);
  assert.equal(g.source, 'self');
  assert.match(g.start, /^\d{4}-\d{2}-\d{2}$/);
});

test('v2 uzman hedefleri ve notları kayıpsız v3 biçimine taşınır, eski alanlar korunur', () => {
  const p = { slt: { enabled: true, goals: [{ id: 'g1', text: 'Telefonda anlama', domain: 'auditory', tasks: ['dialogue'], target: 5, date: '2026-01-02T10:00:00Z', done: true }], notes: [{ date: '2026-01-03T09:00:00Z', text: 'Haftada 3 gün' }] } };
  migrateGoals(p);
  assert.equal(p.goalsV3.length, 1);
  assert.equal(p.goalsV3[0].title, 'Telefonda anlama');
  assert.equal(p.goalsV3[0].source, 'specialist');
  assert.equal(p.goalsV3[0].status, 'done');
  assert.equal(p.goalsV3[0].target, 5);
  assert.equal(p.notesV3[0].text, 'Haftada 3 gün');
  assert.equal(p.notesV3[0].type, 'specialist');
  assert.equal(p.slt.goals.length, 1, 'eski veri silinmez');
  migrateGoals(p);
  assert.equal(p.goalsV3.length, 1, 'ikinci geçiş çoğaltmaz');
});

test('mağaza v2 durumunu v3 alanlarıyla açar', () => {
  const raw = { schema: 2, settings: { uiLang: 'tr', onboarded: true }, profiles: [{ id: 'p1', type: 'adult', slt: { enabled: true, goals: [{ id: 'g9', text: 'Hedef', tasks: [], date: '2026-02-01T00:00:00Z' }], notes: [] } }], activeProfileId: 'p1' };
  const st = normalize(raw);
  const p = st.profiles[0];
  assert.equal(p.goalsV3[0].title, 'Hedef');
  assert.ok(Array.isArray(p.notesV3));
  assert.equal(st.settings.volume, 0.7);
  assert.equal(p.prefs.breakEvery, 10);
  assert.equal(p.prefs.speakerVary, false);
});

test('hedef istatistikleri: doğrudan ve ilişkili oturumlar, haftalık plan, gecikme', () => {
  const now = new Date('2026-10-15T12:00:00');
  const g = newGoal({ title: 'x', tasks: ['pair-pick'], start: '2026-10-01', due: '2026-10-10', plan: { days: [0, 2, 4], minutes: 10 } });
  const sessions = [
    { id: 's0', date: '2026-09-20T10:00:00', durationSec: 300, items: [{ task: 'pair-pick', ok: true }] },
    { id: 's1', date: '2026-10-13T10:00:00', durationSec: 600, goalId: g.id, items: [{ task: 'word-pick', ok: true }, { task: 'word-pick', ok: false }] },
    { id: 's2', date: '2026-10-14T10:00:00', durationSec: 300, items: [{ task: 'pair-pick', ok: true }, { task: 'tone-same', ok: false }] },
  ];
  assert.equal(goalSessions(g, sessions).length, 2, 'başlangıçtan önceki oturum sayılmaz');
  const s = goalStats(g, sessions, now);
  assert.equal(s.sessions, 2);
  assert.equal(s.items, 3);
  assert.equal(s.correct, 2);
  assert.equal(s.weekMin, 15);
  assert.equal(s.plannedWeek, 30);
  assert.equal(s.overdue, true);
  assert.equal(s.history[0].direct, false);
  assert.equal(s.history[1].direct, true);
  assert.equal(new Date(startOfWeek(now)).getDay(), 1, 'hafta pazartesi başlar');
});

test('hedef süzme ve bugünün planı', () => {
  const a = newGoal({ title: 'a', priority: 'low', plan: { days: [3] } });
  const b = newGoal({ title: 'b', priority: 'high', source: 'specialist', plan: { days: [3] } });
  const c = newGoal({ title: 'c', status: 'archived' });
  const d = newGoal({ title: 'd', status: 'done' });
  const all = [a, b, c, d];
  assert.deepEqual(filterGoals(all).map((x) => x.title), ['b', 'a'], 'öncelik sırası');
  assert.deepEqual(filterGoals(all, { sltEnabled: false }).map((x) => x.title), ['a'], 'uzman bölümü kapalıyken uzman hedefleri gizli');
  assert.deepEqual(filterGoals(all, { status: 'archived' }).map((x) => x.title), ['c']);
  assert.equal(filterGoals(all, { status: 'all' }).length, 4);
  assert.deepEqual(filterGoals(all, { source: 'specialist' }).map((x) => x.title), ['b']);
  const thursday = new Date('2026-10-15T09:00:00');
  assert.deepEqual(plannedToday(all, thursday).map((x) => x.title).sort(), ['a', 'b']);
  assert.equal(plannedToday(all, new Date('2026-10-16T09:00:00')).length, 0);
  assert.ok(suggestTasksFor(newGoal({ group: 'pairs', tasks: ['pair-pick'] }), GROUPS).includes('pair-middle'));
});

test('notlar: boşluk kontrolü, tarih/tür/hedef/metin süzgeci ve sıralama', () => {
  assert.equal(noteIsEmpty(newNote({ text: '   ' })), true);
  const n1 = newNote({ date: '2026-10-01', type: 'specialist', goals: ['g1'], recommendations: 'Gürültüde çalış' });
  const n2 = newNote({ date: '2026-10-05', type: 'self', experience: 'Telefon zordu' });
  const n3 = newNote({ date: '2026-09-20', type: 'practice', difficulties: 'S ve Ş' });
  const all = [n1, n2, n3];
  assert.deepEqual(filterNotes(all).map((n) => n.date), ['2026-10-05', '2026-10-01', '2026-09-20']);
  assert.deepEqual(filterNotes(all, { type: 'specialist' }), [n1]);
  assert.deepEqual(filterNotes(all, { goal: 'g1' }), [n1]);
  assert.deepEqual(filterNotes(all, { from: '2026-10-01', to: '2026-10-04' }), [n1]);
  assert.deepEqual(filterNotes(all, { q: 'telefon' }), [n2]);
  assert.deepEqual(filterNotes(all, { q: 's ve ş' }), [n3]);
  assert.equal(filterNotes(all, { sltEnabled: false }).length, 2);
});

// ---------- kılavuz ----------
test('kılavuz: TR ve EN aynı 25 konuyu (okuma dâhil) aynı sırayla içerir; ilgili bağlantılar geçerli', () => {
  const ids = (g) => g.topics.map((x) => x.id);
  assert.equal(GUIDES.tr.topics.length, 25);
  assert.deepEqual(ids(GUIDES.tr), ids(GUIDES.en));
  assert.deepEqual(Object.keys(GUIDES.tr.cats), Object.keys(GUIDES.en.cats));
  for (const g of [GUIDES.tr, GUIDES.en]) {
    for (const tp of g.topics) {
      assert.ok(tp.title && tp.summary, tp.id);
      assert.ok(g.cats[tp.cat], `kategori: ${tp.id}`);
      assert.ok(tp.steps?.length || tp.body?.length || tp.faq?.length, `içerik: ${tp.id}`);
      for (const r of tp.related || []) assert.ok(ids(g).includes(r), `${tp.id} → ${r}`);
    }
  }
});

test('kılavuz araması kelimeleri ve kategoriyi süzer', () => {
  assert.ok(searchGuide(GUIDES.tr, 'gürültü').some((x) => x.id === 'noise'));
  assert.ok(searchGuide(GUIDES.en, 'backup').some((x) => x.id === 'backup'));
  assert.equal(searchGuide(GUIDES.tr, 'qqqzzz').length, 0);
  assert.ok(searchGuide(GUIDES.tr, '', 'goals').every((x) => x.cat === 'goals'));
});

test('ekranlardaki yardım bağlantıları var olan kılavuz konularına gider', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const ids = GUIDES.tr.topics.map((x) => x.id);
  for (const f of await readdir(new URL('../js/views/', import.meta.url))) {
    const src = await readFile(new URL(`../js/views/${f}`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/helpLink\('([\w-]+)'/g)) assert.ok(ids.includes(m[1]), `${f}: ${m[1]}`);
  }
});

// ---------- hiyerarşi, seviyeler, katalog ----------
test('her görevin bir beceri hiyerarşisi etiketi var', () => {
  for (const def of TASKS) assert.ok(HIERARCHY.includes(hierarchyOf(def.id)), def.id);
});

test('seviye adları: klinik yeterlilik iddiası yok, TR/EN beş ad', () => {
  setLocale('tr');
  assert.deepEqual(LEVEL_IDS.map(levelName), ['Başlangıç', 'Temel', 'Orta', 'Orta-ileri', 'İleri']);
  setLocale('en');
  assert.equal(levelName(4), 'Upper-intermediate');
  assert.equal(levelName(99), 'Advanced');
  for (const loc of [tr, en]) for (const n of LEVEL_IDS) assert.doesNotMatch(loc[`lvl.${n}`], /uzman|expert|klinik|clinical/i);
  setLocale('tr');
});

test('katalog araması ve hiyerarşi süzgeci', () => {
  setLocale('tr');
  const all = searchTasks('', '');
  assert.equal(all.length, TASKS.length);
  assert.ok(searchTasks('gürültü', '').includes('pair-noise'));
  assert.ok(searchTasks('matris', '').includes('matrix'));
  assert.ok(searchTasks('', 'detect').every((id) => hierarchyOf(id) === 'detect'));
  assert.deepEqual(searchTasks('ünlü', 'identify').filter((x) => x === 'logatom-vowel'), ['logatom-vowel']);
  setLocale('en');
  assert.ok(searchTasks('middle', '').includes('pair-middle'));
  setLocale('tr');
});

// ---------- yeni görevler ----------
test('logatom görevleri: yalnızca logatom setleri, telaffuz doğrulaması zorunlu, 2–10 seçenek', async () => {
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    const kinds = pack.syllables.sets.filter((s) => s.kind);
    assert.ok(kinds.some((s) => s.kind === 'vcv') && kinds.some((s) => s.kind === 'cvc'), lang);
    for (const task of ['logatom-cons', 'logatom-vowel']) {
      assert.equal(getTask(task).qa, 'required');
      const kind = task === 'logatom-cons' ? 'vcv' : 'cvc';
      for (const lvl of [1, 5]) {
        const s = session(pack, task, lvl);
        assert.ok(s.items.length >= 2, `${lang} ${task} ${lvl}`);
        for (const it of s.items) {
          const set = pack.syllables.sets.find((x) => it.qaKeys[0] === `ss:${x.id}`);
          assert.equal(set.kind, kind);
          assert.equal(it.options.filter((o) => o.id === it.answer).length, 1);
          assert.ok(it.options.length >= 2 && it.options.length <= 10);
        }
      }
    }
    // Klasik hece görevleri logatom setlerini kullanmaz.
    for (const it of session(pack, 'syl-pick', 5).items) assert.ok(!pack.syllables.sets.find((x) => it.qaKeys[0] === `ss:${x.id}`).kind);
    // Test modunda doğrulanmamış logatom kullanılmaz.
    const strict = buildSession({ config: { mode: 'test', blocks: [{ task: 'logatom-cons', count: 4 }] }, pack, ...env, qaStatus: () => undefined, levelFor: () => 3, rng: makeRng(2) });
    assert.equal(strict.items.length, 0);
  }
});

test('ortadaki ses görevi: seçenekler hedeften yalnızca iç seste ayrılır', async () => {
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    const s = session(pack, 'pair-middle', 5);
    assert.ok(s.items.length >= 4, lang);
    for (const it of s.items) {
      const fam = pack.familiesById.get(it.meta.family);
      const target = fam.words.find((w) => `${fam.id}:${w.w}` === it.answer);
      for (const o of it.options.filter((x) => x.id !== it.answer)) {
        const w = fam.words.find((x) => `${fam.id}:${x.w}` === o.id);
        assert.equal(minimalContrast(target.ipa, w.ipa)?.position, 'medial', `${target.w}/${w.w}`);
      }
    }
  }
});

test('matris cümleleri: kalıba uygun, cevap seçeneklerde, sabit sütunlar düşük seviyede', async () => {
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    assert.ok(pack.matrix, lang);
    assert.equal(validatePack(pack, pack.L).errors.filter((e) => e.path === 'matrix').length, 0);
    for (const [lvl, asked] of [[1, 3], [3, 5], [5, 5]]) {
      const s = session(pack, 'matrix', lvl);
      assert.ok(s.items.length >= 6, `${lang} ${lvl}`);
      for (const it of s.items) {
        assert.equal(it.input, 'matrix');
        assert.equal(it.columns.length, pack.matrix.pattern.length);
        assert.equal(it.columns.filter((c) => !c.fixed).length, asked);
        it.columns.forEach((c, i) => {
          assert.equal(c.options.filter((o) => o.id === it.answer[i]).length, 1);
          assert.equal(new Set(c.options.map((o) => o.id)).size, c.options.length);
          if (c.fixed) assert.equal(c.options.length, 1);
        });
        assert.equal(it.play.text, it.subtitle);
        assert.match(it.subtitle, /^\p{Lu}.*\.$/u);
        assert.equal(it.subtitle.replace(/\.$/, '').toLocaleLowerCase(lang), it.answer.join(' ').toLocaleLowerCase(lang));
      }
      if (lvl === 5) assert.equal(s.items[0].columns[0].options.length, 10, '10 seçenek');
    }
  }
});

test('matris puanlama kelime bazında', () => {
  assert.deepEqual(checkMatrix(['a', 'b', 'c'], ['a', 'b', 'c']), { right: 3, total: 3, ok: true, complete: true });
  assert.deepEqual(checkMatrix(['a', 'x', 'c'], ['a', 'b', 'c']), { right: 2, total: 3, ok: false, complete: true });
  assert.equal(checkMatrix(['a', undefined, 'c'], ['a', 'b', 'c']).complete, false);
});

test('yeni günlük yaşam senaryoları her iki dilde var ve geçerli', async () => {
  const ids = ['family', 'voicemail', 'workphone', 'interview', 'meetingqa', 'presentation', 'friends'];
  for (const lang of ['tr', 'en']) {
    const pack = await getPack(lang);
    for (const id of ids) {
      const sc = pack.scenarios.find((s) => s.id === `${lang}.sc.${id}`);
      assert.ok(sc, `${lang}.sc.${id} (doğrulayıcı reddetmiş olabilir)`);
      assert.ok(sc.variants.length >= 2);
    }
    const work = buildSession({ config: { mode: 'practice', blocks: [{ task: 'dialogue', count: 3, filter: { groups: ['work'] } }] }, pack, ...env, levelFor: () => 3, rng: makeRng(4) });
    assert.ok(work.items.length >= 2, `${lang}: iş senaryoları`);
  }
});

test('v3 arayüz metinleri her iki dilde ve değişkenler eşleşiyor', () => {
  const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const k of Object.keys(tr)) {
    assert.ok(k in en, k);
    assert.equal(vars(tr[k]), vars(en[k]), `değişkenler: ${k}`);
  }
  setLocale('tr');
  assert.equal(t('goal.weekProgress', { done: 5, plan: 30 }), 'Bu hafta 5 / 30 dk');
});

test('paragraf ve diyalogda soru sayısı seviyeden bağımsız ayarlanır', async () => {
  const pack = await getPack('tr');
  for (const task of ['paragraph', 'dialogue']) {
    const one = session(pack, task, 5, { questions: 1 });
    assert.ok(one.items.length > 0 && one.items.every((it) => it.questions.length === 1), task);
    const many = session(pack, task, 1, { questions: 4 });
    assert.ok(many.items.some((it) => it.questions.length >= 3), `${task}: seviye 1'de 4 soru istendi`);
  }
});
