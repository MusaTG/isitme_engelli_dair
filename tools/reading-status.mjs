// Okuma kütüphanesinin eksiklerini çıkarır ve her eksik kategori için dışarıda kullanılacak hazır istem (prompt) üretir.
//   node tools/reading-status.mjs
// Çıktılar (otomatik üretilir, elle düzenlemeyin):
//   docs/reading/EKSIKLER.md                — dil × kategori tablosu: mevcut, eksik, kısa/orta/uzun
//   docs/reading/istemler/<dil>-<kategori>.md — kopyala-yapıştır istem + nereye kaydedileceği
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_WPM, estimateMinutes, lengthClass } from '../js/reading/core.js';
import { buildLang } from './build-reading.mjs';
import { GUIDE, WORDS } from '../js/reading/rules.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'docs/reading');
export const TARGET = { total: 100, medium: 5, long: 1 };
function prompt({ lang, cat, have, need, nextNum, cls, titles }) {
  const L = lang === 'tr' ? 'TÜRKÇE' : 'İNGİLİZCE (doğal, akıcı İngilizce; Türkçeden kelime kelime çeviri değil)';
  const W = WORDS[lang];
  const subs = Object.entries(cat.subs).map(([k, v]) => `${k} (${v.tr})`).join(', ');
  const needMed = Math.max(0, TARGET.medium - cls.medium);
  const needLong = Math.max(0, TARGET.long - cls.long);
  const dir = `content-src/reading/inbox/${lang}/${cat.id}/`;
  return `# İstem — ${lang.toUpperCase()} · ${cat.name.tr} (${cat.id})

**Durum:** ${have} metin var, **${need} eksik** (hedef ${TARGET.total}). Orta: ${cls.medium}/${TARGET.medium}, uzun: ${cls.long}/${TARGET.long}.
**Kaydedilecek yer:** her yanıtı bir \`.txt\` dosyası olarak \`${dir}\` klasörüne koyun (dosya adı serbest, ör. \`parti-01.txt\`). Sonra \`npm run reading:import\` (ya da GitHub'a yükleyin; yayın iş akışı aktarır). Numaraları araç verir.

**Parti planı:** ${need ? `${Math.ceil(Math.max(0, need - needMed - needLong) / 10)} parti × 10 kısa metin${needMed ? ` + ${Math.ceil(needMed / 2)} parti × 2 orta metin` : ''}${needLong ? ` + ${needLong} parti × 1 uzun metin` : ''}` : 'Eksik yok.'} Her partide aşağıdaki istemi gönderin, sonra "Devam et, sonraki 10 metin; öncekilerle aynı konu/başlık olmasın." deyin.

---

\`\`\`text
Sen bir okuma uygulaması için özgün okuma metinleri yazan bir editörsün. Metinleri ${L} yaz.

KATEGORİ: ${cat.name.tr} — ${cat.desc.tr}
ALT KATEGORİLER (sub alanına yalnızca bunlardan birini yaz): ${subs}
YÖNERGE: ${GUIDE[cat.id]}

BU PARTİDE: [10 KISA metin] / [2 ORTA metin] / [1 UZUN metin]   ← birini seç, diğerlerini sil
UZUNLUK (kelime): kısa ${W.short[0]}–${W.short[1]} · orta ${W.medium[0]}–${W.medium[1]} · uzun ${W.long[0]}–${W.long[1]}.
Orta ve uzun metinlerde "## Ara başlık" satırlarıyla 5–20 bölüm kullan. Uzunluk alt sınırının ALTINA düşme; yazdıktan sonra kelime sayısını kontrol et, eksikse yeni bölüm ekle.

KURALLAR
- Tamamen özgün yaz. Kitap, şarkı, şiir, makale ya da sitelerden alıntı/uyarlama yapma; bilinen karakterleri kullanma.
- Gerçek, yaşayan kişiler ve markalar hakkında içerik yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.
- Gerçek bilgi verdiğin yerde doğru ve genel ol; emin olmadığın rakam/tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.
- Her metin kendi başına anlaşılır, tamamlanmış olsun; yarıda bitirme, "devamı gelecek" yazma (dizi bölümleri hariç).
- Metinler birbirinin tekrarı olmasın: farklı konu, karakter, mekân, başlık. Aynı cümleyi tekrar etme.
- Şiddet, korku, nefret, cinsellik, uyuşturucu içeren öğe yok. Herkesin okuyabileceği dil.
- Uygulamada mikrofon/ses kaydı yok; metinler yalnızca okunacak.
${titles.length ? `- Şu başlıklar ZATEN VAR, tekrar etme: ${titles.join(' · ')}\n` : ''}
ÇIKTI BİÇİMİ — yalnızca bloklar, başka açıklama yazma. Her metin:

### | Metnin Başlığı
sub: <alt kategori> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri>${cat.id === 'novel' ? ' | series: <dizi-kimligi> | part: <n>' : ''}${['news', 'travel', 'poetry'].includes(cat.id) ? ' | kind: <gerekirse, yukarıya bak>' : ''}
---
Metnin gövdesi. Paragraflar arasında boş satır.

## Ara başlık (yalnızca orta/uzun metinlerde)

Devam paragrafı.

(Bloklar arasında bir boş satır bırak. "###" ile "|" arasına numara YAZMA. "level" ZORUNLU. Belirli bir kaynağa dayandıysan meta satırına "source: <kaynak adı/adres> | license: <lisans>" ekle; özgün metinde bu alanları yazma.)
\`\`\`
`;
}

const NEEDS_SOURCE = new Set(['feature', 'nonfiction']);

export async function collectStatus(cats) {
  const rows = [];
  const issues = [];
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    const errFor = (id) => r.errors.filter((e) => e.includes(id));
    for (const e of r.errors) issues.push({ lang, type: /benzer|aynı/.test(e) ? 'duplicate' : 'broken', level: 'error', msg: e });
    for (const w of r.warnings) if (/başlık .* ile aynı/.test(w)) issues.push({ lang, type: 'duplicate-title', level: 'warning', msg: w });
    for (const cat of cats.categories) {
      const list = r.texts.filter((t) => t.cat === cat.id);
      const cls = { short: 0, medium: 0, long: 0 };
      for (const t of list) cls[lengthClass(estimateMinutes(t.words, DEFAULT_WPM[lang]))] += 1;
      const levels = { 1: 0, 2: 0, 3: 0 };
      for (const t of list) levels[t.level] = (levels[t.level] || 0) + 1;
      const missingSource = list.filter((t) => NEEDS_SOURCE.has(t.kind) && !t.source).map((t) => t.id);
      const noLicense = list.filter((t) => t.source && !t.license).map((t) => t.id);
      const autoLevel = list.filter((t) => t.levelAuto).length;
      const broken = list.filter((t) => errFor(t.id).length).map((t) => t.id);
      const need = Math.max(0, TARGET.total - list.length);
      rows.push({ lang, cat: cat.id, catName: cat.name.tr, have: list.length, target: TARGET.total, need, cls, levels, autoLevel, missingSource: missingSource.length, noLicense: noLicense.length, broken: broken.length, reviewed: list.filter((t) => t.reviewed).length, nextNum: Math.max(0, ...list.map((t) => t.n)) + 1, titles: list.map((t) => t.title), missingSourceIds: missingSource.slice(0, 200), brokenIds: broken });
    }
  }
  // Sıradaki öncelikler: önce tamamen boş kategoriler (TR önce), sonra eksik sayısı, sonra orta/uzun açığı
  const priorities = rows.filter((x) => x.need || x.cls.medium < TARGET.medium || x.cls.long < TARGET.long)
    .sort((a, b) => (b.have === 0) - (a.have === 0) || (a.lang === 'tr' ? -1 : 1) - (b.lang === 'tr' ? -1 : 1) || b.need - a.need)
    .slice(0, 12).map((x) => ({ lang: x.lang, cat: x.cat, need: x.need, medium: Math.max(0, TARGET.medium - x.cls.medium), long: Math.max(0, TARGET.long - x.cls.long), prompt: `docs/reading/istemler/${x.lang}-${x.cat}.md` }));
  return { rows, issues, priorities };
}

async function main() {
  const cats = JSON.parse(await readFile(join(ROOT, 'content-src/reading/categories.json'), 'utf8'));
  await rm(join(OUT, 'istemler'), { recursive: true, force: true });
  await mkdir(join(OUT, 'istemler'), { recursive: true });
  const { rows, issues, priorities } = await collectStatus(cats);
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  let totalNeed = 0;
  for (const x of rows) {
    totalNeed += x.need;
    if (x.need || x.cls.medium < TARGET.medium || x.cls.long < TARGET.long) {
      await writeFile(join(OUT, 'istemler', `${x.lang}-${x.cat}.md`), prompt({ lang: x.lang, cat: catById[x.cat], have: x.have, need: x.need, nextNum: x.nextNum, cls: x.cls, titles: x.titles }));
    }
  }
  const json = { generatedAt: new Date().toISOString(), target: TARGET, totals: { tr: rows.filter((x) => x.lang === 'tr').reduce((n, x) => n + x.have, 0), en: rows.filter((x) => x.lang === 'en').reduce((n, x) => n + x.have, 0), missing: totalNeed },
    categories: rows.map(({ titles, ...x }) => x), issues, priorities };
  await writeFile(join(OUT, 'status.json'), `${JSON.stringify(json, null, 2)}\n`);
  const lines = ['# Okuma kütüphanesi — durum ve eksikler', '', 'Otomatik üretilir: `node tools/reading-status.mjs` (içe aktarma ve yayın sırasında kendiliğinden çalışır). Makine okunur sürüm: `docs/reading/status.json`.', '',
    `Hedef: her dil ve kategoride en az ${TARGET.total} metin; bunlardan en az ${TARGET.medium} orta ve ${TARGET.long} uzun. **Toplam eksik: ${totalNeed} metin.** Bozuk/tekrar sorunu: ${issues.filter((x) => x.level === 'error').length} hata, ${issues.filter((x) => x.level === 'warning').length} uyarı.`, '',
    'Nasıl tamamlanır: `docs/reading/istemler/` içindeki istemi bir yapay zekâ sohbetine yapıştırın, yanıtı `content-src/reading/inbox/<dil>/<kategori>/` klasörüne kaydedin (birden çok metin tek dosyada olabilir; .txt, .md, .json, .csv), `npm run reading:import` ile ön izleyip onaylayın. Ayrıntı: `docs/reading-format.md`.', '',
    '## Sıradaki öncelikler', '', ...priorities.map((p, i) => `${i + 1}. ${p.lang}/${p.cat}: ${p.need} metin${p.medium ? `, ${p.medium} orta` : ''}${p.long ? `, ${p.long} uzun` : ''} → [istem](istemler/${p.lang}-${p.cat}.md)`), '',
    '## Kategori tablosu', '',
    '| Dil | Kategori | Mevcut | Eksik | Kısa | Orta | Uzun | Seviye 1/2/3 | Seviyesi tahmini | Kaynak bilgisi eksik* | Bozuk | İstem |', '|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---|'];
  for (const x of rows) {
    const open = x.need || x.cls.medium < TARGET.medium || x.cls.long < TARGET.long;
    lines.push(`| ${x.lang} | ${x.catName} (\`${x.cat}\`) | ${x.have} | ${x.need ? `**${x.need}**` : '0'} | ${x.cls.short} | ${x.cls.medium}${x.cls.medium < TARGET.medium ? ` (+${TARGET.medium - x.cls.medium})` : ''} | ${x.cls.long}${x.cls.long < TARGET.long ? ` (+${TARGET.long - x.cls.long})` : ''} | ${x.levels[1]}/${x.levels[2]}/${x.levels[3]} | ${x.autoLevel} | ${x.missingSource} | ${x.broken} | ${open ? `[${x.lang}-${x.cat}.md](istemler/${x.lang}-${x.cat}.md)` : 'tamam'} |`);
  }
  lines.push('', '\\* Gerçek bilgiye dayanan türlerde (bilgilendirici, dergi yazısı, gerçek yer tanıtımı) metin başına `source` alanı olmayanlar. Genel bilgi metinlerinde zorunlu değildir; inceleme önceliği için gösterilir.', '');
  if (issues.length) lines.push('## Bozuk ve tekrar kayıtlar', '', ...issues.slice(0, 200).map((x) => `- ${x.level === 'error' ? 'HATA' : 'uyarı'} (${x.lang}, ${x.type}): ${x.msg}`), '');
  await writeFile(join(OUT, 'EKSIKLER.md'), `${lines.join('\n')}\n`);
  console.log(`Eksik toplam: ${totalNeed} metin. Ayrıntı: docs/reading/EKSIKLER.md, docs/reading/status.json`);
  for (const p of priorities.slice(0, 6)) console.log(`  öncelik: ${p.lang}/${p.cat} — ${p.need} eksik`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
