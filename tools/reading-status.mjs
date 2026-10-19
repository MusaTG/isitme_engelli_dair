// Okuma kütüphanesinin eksiklerini çıkarır ve her eksik kategori için dışarıda kullanılacak hazır istem (prompt) üretir.
//   node tools/reading-status.mjs
// Çıktılar (otomatik üretilir, elle düzenlemeyin):
//   docs/reading/EKSIKLER.md                — dil × kategori tablosu: mevcut, eksik, kısa/orta/uzun
//   docs/reading/istemler/<dil>-<kategori>.md — kopyala-yapıştır istem + nereye kaydedileceği
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_WPM, estimateMinutes, lengthClass } from '../js/reading/core.js';
import { buildLang } from './build-reading.mjs';
import { GUIDE, WORDS } from '../js/reading/rules.js';

const ROOT = new URL('..', import.meta.url).pathname;
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

(Bloklar arasında bir boş satır bırak. "###" ile "|" arasına numara YAZMA.)
\`\`\`
`;
}

async function main() {
  const cats = JSON.parse(await readFile(join(ROOT, 'content-src/reading/categories.json'), 'utf8'));
  const rows = [];
  await rm(join(OUT, 'istemler'), { recursive: true, force: true });
  await mkdir(join(OUT, 'istemler'), { recursive: true });
  let totalNeed = 0;
  for (const lang of ['tr', 'en']) {
    const r = await buildLang(lang, cats);
    for (const cat of cats.categories) {
      const list = r.texts.filter((t) => t.cat === cat.id);
      const cls = { short: 0, medium: 0, long: 0 };
      for (const t of list) cls[lengthClass(estimateMinutes(t.words, DEFAULT_WPM[lang]))] += 1;
      const need = Math.max(0, TARGET.total - list.length);
      totalNeed += need;
      const nextNum = Math.max(0, ...list.map((t) => t.n)) + 1;
      rows.push({ lang, cat, have: list.length, need, cls, nextNum });
      if (need || cls.medium < TARGET.medium || cls.long < TARGET.long) {
        await writeFile(join(OUT, 'istemler', `${lang}-${cat.id}.md`), prompt({ lang, cat, have: list.length, need, nextNum, cls, titles: list.map((t) => t.title) }));
      }
    }
  }
  const lines = ['# Okuma kütüphanesi — eksikler', '', 'Otomatik üretilir: `node tools/reading-status.mjs` (içe aktarma sonrası kendiliğinden çalışır).', '',
    `Hedef: her dil ve kategoride en az ${TARGET.total} metin; bunlardan en az ${TARGET.medium} orta ve ${TARGET.long} uzun. **Toplam eksik: ${totalNeed} metin.**`, '',
    'Nasıl tamamlanır: `docs/reading/istemler/` içindeki ilgili dosyayı açın, istemi bir yapay zekâ sohbetine yapıştırın, yanıtı `content-src/reading/inbox/<dil>/<kategori>/` klasörüne `.txt` olarak kaydedin, `npm run reading:import` çalıştırın. Ayrıntı: `docs/reading-format.md`.', '',
    '| Dil | Kategori | Mevcut | Eksik | Kısa | Orta | Uzun | İstem |', '|---|---|---:|---:|---:|---:|---:|---|'];
  for (const x of rows) {
    const open = x.need || x.cls.medium < TARGET.medium || x.cls.long < TARGET.long;
    lines.push(`| ${x.lang} | ${x.cat.name.tr} (\`${x.cat.id}\`) | ${x.have} | ${x.need ? `**${x.need}**` : '0'} | ${x.cls.short} | ${x.cls.medium}${x.cls.medium < TARGET.medium ? ` (+${TARGET.medium - x.cls.medium})` : ''} | ${x.cls.long}${x.cls.long < TARGET.long ? ` (+${TARGET.long - x.cls.long})` : ''} | ${open ? `[${x.lang}-${x.cat.id}.md](istemler/${x.lang}-${x.cat.id}.md)` : 'tamam'} |`);
  }
  await writeFile(join(OUT, 'EKSIKLER.md'), `${lines.join('\n')}\n`);
  console.log(`Eksik toplam: ${totalNeed} metin. Ayrıntı: docs/reading/EKSIKLER.md`);
  for (const x of rows.filter((y) => y.need)) console.log(`  ${x.lang}/${x.cat.id}: ${x.have} var, ${x.need} eksik`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) await main();
