// sw.js içindeki önbellek listesini (ASSETS) uygulama dosyalarından yeniden üretir.
// Kullanım: node tools/sw-assets.mjs   (içerik veya kod dosyası eklendiğinde çalıştırın)
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRS = ['css', 'js', 'locales', 'content', 'icons'];
const TOP = ['index.html', 'manifest.webmanifest'];

async function walk(dir) {
  const out = [];
  for (const name of (await readdir(join(ROOT, dir))).sort()) {
    const rel = `${dir}/${name}`;
    if ((await stat(join(ROOT, rel))).isDirectory()) out.push(...await walk(rel));
    // Okuma kütüphanesinin büyük gövde ve arama dosyaları önceden indirilmez (açıldıkça veya
    // "kütüphaneyi indir" ile önbelleğe girer); kategori listesi ve kataloglar önbelleğe alınır.
    else if (rel.startsWith('content/reading/') && !/\/(categories|manifest|catalog)\.json$/.test(rel)) continue;
    else if (/\.(js|json|css|svg|png)$/.test(name)) out.push(rel);
  }
  return out;
}

export async function listAssets() {
  const files = [...TOP];
  for (const d of DIRS) files.push(...await walk(d));
  return ['./', ...files.map((f) => `./${f}`)];
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const assets = await listAssets();
  const sw = await readFile(join(ROOT, 'sw.js'), 'utf8');
  const body = `const ASSETS = [\n${assets.map((a) => `  '${a}',`).join('\n')}\n];`;
  // Önbellek adı: paket sürümü + dosya içeriklerinin özeti. İçerik (ör. aktarılan okuma metinleri) değişince
  // kullanıcılar otomatik olarak yeni sürümü alır.
  const { createHash } = await import('node:crypto');
  const h = createHash('sha1');
  for (const a of assets.filter((x) => x !== './')) h.update(await readFile(join(ROOT, a.slice(2))));
  for (const f of ['content/reading/tr/catalog.json', 'content/reading/en/catalog.json']) { try { h.update(await readFile(join(ROOT, f))); } catch { /* yok */ } }
  const { version } = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
  const cache = `duyum-v${version}-${h.digest('hex').slice(0, 8)}`;
  const next = sw.replace(/const ASSETS = \[[\s\S]*?\];/, body).replace(/const CACHE = '[^']*';/, `const CACHE = '${cache}';`);
  await writeFile(join(ROOT, 'sw.js'), next);
  console.log(`sw.js: ${assets.length} dosya, önbellek ${cache}`);
}
