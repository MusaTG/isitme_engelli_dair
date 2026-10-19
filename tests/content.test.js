import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPack, packStats } from '../js/content/loader.js';
import { readJSON } from './helpers.js';

test('yerleşik içerik paketleri hatasız ve eksiksiz', async () => {
  for (const lang of ['tr', 'en']) {
    const pack = await loadPack(lang, readJSON);
    assert.deepEqual(pack.report.errors, [], `${lang}: doğrulama hatası`);
    assert.deepEqual(pack.report.missing, [], `${lang}: eksik dosya`);
    const s = packStats(pack);
    assert.ok(s.words >= 500 && s.categories >= 30, `${lang}: kelime kapsamı ${s.words}/${s.categories}`);
    assert.ok(s.families >= 30 && s.templates >= 20 && s.paragraphs >= 12 && s.scenarios >= 20, `${lang}: kapsam ${JSON.stringify(s)}`);
  }
});

// Bozuk paket: eksik dosya, yinelenen kelime, minimal olmayan "çift", bozuk görsel, lisanssız meta.
test('bozuk içerik paketi: hatalı kayıtlar dışlanır, uygulama çalışmaya devam eder', async () => {
  const broken = async (p) => {
    if (p.endsWith('paragraphs.json')) throw new Error('404');
    const data = await readJSON(p);
    if (p.endsWith('words.json')) {
      data.words.push({ ...data.words[0], id: 'dup-1' });
      data.words.push({ ...data.words[1], id: 'bad-pic', w: 'yepyenikelime', e: 'resim.png' });
    }
    if (p.endsWith('pairs.json')) data.families.push({ id: 'not-minimal', minimal: true, lvl: 1, aud: 'both', words: [{ w: 'kedi', ipa: 'cedi' }, { w: 'masa', ipa: 'masa' }] });
    return data;
  };
  const pack = await loadPack('tr', broken);
  assert.deepEqual(pack.report.missing, ['paragraphs']);
  assert.equal(pack.paragraphs.length, 0);
  const paths = pack.report.errors.map((e) => e.path);
  assert.ok(paths.includes('word:dup-1'), 'yinelenen kelime yakalanır');
  assert.ok(paths.includes('word:bad-pic'), 'bozuk görsel yakalanır');
  assert.ok(paths.includes('family:not-minimal'), 'minimal olmayan çift yakalanır');
  assert.ok(!pack.words.some((w) => w.id === 'dup-1' || w.id === 'bad-pic'));
  assert.ok(!pack.families.some((f) => f.id === 'not-minimal'));
  assert.ok(pack.words.length > 500, 'geri kalan içerik kullanılabilir');
});

test('lisans bilgisi olmayan özel paket reddedilir', async () => {
  const pack = await loadPack('tr', readJSON, [{ app: 'duyum-pack', lang: 'tr', id: 'x', words: [{ id: 'x1', w: 'deneme', cat: 'home', lvl: 1, aud: 'both', syl: 3 }] }]);
  assert.equal(pack.report.custom[0].problems.length, 1);
  assert.ok(!pack.words.some((w) => w.id === 'x1'));
  const ok = await loadPack('tr', readJSON, [{ app: 'duyum-pack', lang: 'tr', id: 'y', license: 'CC0', words: [{ id: 'y1', w: 'deneme', cat: 'home', lvl: 1, aud: 'both', syl: 3 }] }]);
  assert.ok(ok.words.some((w) => w.id === 'y1'), 'lisanslı paket kod değişikliği olmadan eklenir');
});

test('yayın iş akışı uygulamanın tüm klasörlerini kopyalar', async () => {
  const { readFile } = await import('node:fs/promises');
  const { listAssets } = await import('../tools/sw-assets.mjs');
  const yml = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const cp = yml.split('\n').find((l) => l.includes('cp -r'));
  const tops = [...new Set((await listAssets()).map((a) => a.replace(/^\.\//, '').split('/')[0]).filter(Boolean))];
  for (const t of [...tops, 'sw.js']) assert.ok(cp.split(/\s+/).includes(t), `yayına kopyalanmıyor: ${t}`);
});
