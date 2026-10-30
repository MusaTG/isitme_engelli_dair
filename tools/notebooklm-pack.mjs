#!/usr/bin/env node
// NotebookLM üretim paketi: eksik okuma metinlerini NotebookLM'de ürettirmek için kaynak dosyaları, sohbet ayarı ve
// parti parti istemler üretir. Eksik listesinden (collectStatus) beslenir; içerik eklendikçe yeniden çalıştırın
// (içe aktarma ve yayın iş akışı bunu kendiliğinden yapar).
//   node tools/notebooklm-pack.mjs  →  docs/research/notebooklm/uretim/
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { collectStatus, TARGET } from './reading-status.mjs';
import { GUIDE, WORDS, CAT_KIND, MIN_WORDS, KIDS_MIN } from '../js/reading/rules.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'docs/research/notebooklm/uretim');
const PER_SHORT = 5; // NotebookLM yanıt uzunluğu sınırlı: bir yanıtta 5 kısa metin güvenli

const LN = { tr: 'Türkçe', en: 'İngilizce' };
const LANG_RULE = {
  tr: 'Metinleri TÜRKÇE yaz.',
  en: 'Write the texts in natural, fluent ENGLISH (not a word-for-word translation from Turkish). Meta keys stay in English as shown.',
};

function guideDoc(lang, cats) {
  const W = WORDS[lang];
  const L = [];
  L.push(`# Duyum okuma metni yazım kılavuzu — ${LN[lang]} (${lang})`, '');
  L.push('Bu belge NotebookLM defterine KAYNAK olarak yüklenir. Sohbetteki her üretim isteği bu kılavuza göre yanıtlanmalıdır.', '');
  L.push('## 1. Amaç', '', 'Duyum; işitme cihazı ve koklear implant kullanıcılarının da kullandığı ücretsiz bir okuma ve dinleme pratiği uygulamasıdır. Metinler ekranda okunur ve isteğe bağlı olarak cihazın sesiyle sesli okunur. Uygulamada mikrofon, ses kaydı ya da konuşma tanıma yoktur.', '');
  L.push('## 2. Kesin kurallar', '',
    '- Tamamen ÖZGÜN yaz. Bu defterdeki kaynaklar dahil hiçbir kitap, şarkı, şiir, makale ya da siteden alıntı yapma, uyarlama yapma; bilinen karakterleri kullanma.',
    '- Gerçek, yaşayan kişiler ve markalar hakkında yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.',
    '- Gerçek bilgi verdiğin yerde doğru ve genel ol; emin olmadığın rakam ya da tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.',
    '- Her metin kendi başına anlaşılır ve TAMAMLANMIŞ olsun; yarıda bitirme (dizi bölümleri hariç).',
    '- Metinler birbirinin tekrarı olmasın: farklı konu, karakter, mekân, başlık. "Mevcut başlıklar" kaynağındaki başlıkları kullanma.',
    '- Şiddet, korku, nefret, cinsellik, uyuşturucu yok. Herkesin okuyabileceği dil.',
    '- Yanıtta kaynak numarası / atıf ([1] gibi), giriş cümlesi, açıklama, kapanış notu YAZMA. Yalnızca metin blokları.', '');
  L.push('## 3. Çıktı biçimi (zorunlu)', '', 'Her metin şu blok biçimindedir; bloklar arasında bir boş satır:', '', '```text',
    '### | Metnin Başlığı',
    'sub: <alt kategori kimliği> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri>',
    '---',
    'Birinci paragraf. Paragraflar arasında boş satır.',
    '',
    '## Ara başlık (yalnızca orta ve uzun metinlerde)',
    '',
    'Devam paragrafı.',
    '```', '',
    '- `###` ile `|` arasına numara YAZMA. `level` ZORUNLU. `sub` yalnızca aşağıdaki listeden.',
    '- Meta satırından sonra tek başına `---` satırı ZORUNLU.',
    '- Diyaloglarda her satır `Ad: söz` biçiminde. Şiirde satır sonları korunur, kıtalar arasında boş satır.',
    '- Roman dizilerinde meta satırına `series: <dizi-kimligi> | part: <bölüm no>` ekle.', '');
  L.push('## 4. Uzunluk', '', `- Kısa: ${W.short[0]}–${W.short[1]} kelime`, `- Orta: ${W.medium[0]}–${W.medium[1]} kelime, 5–20 "## Ara başlık" bölümü`, `- Uzun: ${W.long[0]}–${W.long[1]} kelime, 5–20 bölüm`, `- En az: ${MIN_WORDS.default} kelime (şiir ${MIN_WORDS.poem}, çocuk ${KIDS_MIN}). Alt sınırın altına düşme.`, '');
  L.push('## 5. Kategoriler, alt kategoriler ve yönergeler', '');
  for (const c of cats.categories) {
    L.push(`### Kategori \`${c.id}\` — ${c.name[lang] || c.name.tr}`, '');
    L.push(`- Tanım: ${c.desc?.[lang] || c.desc?.tr || ''}`);
    L.push(`- Varsayılan tür: ${CAT_KIND[c.id] || 'fiction'}`);
    L.push(`- Alt kategoriler (sub): ${Object.entries(c.subs).map(([k, v]) => `\`${k}\` (${v[lang] || v.tr})`).join(', ')}`);
    L.push(`- Yönerge: ${GUIDE[c.id]}`, '');
  }
  L.push('## 6. Örnek blok', '', '```text', lang === 'tr'
    ? '### | Balkondaki Domates\nsub: home | tags: ev, bitki, sabır | level: 1\n---\nNeslihan balkondaki saksıya ilk domates fidesini dikti…\n\nHer sabah toprağı parmağıyla yokladı…'
    : '### | The Tomato on the Balcony\nsub: home | tags: home, plants, patience | level: 1\n---\nNell planted her first tomato seedling in the balcony pot…\n\nEvery morning she tested the soil with a finger…', '```', '');
  return `${L.join('\n')}\n`;
}

function titlesDoc(lang, rows) {
  const L = [`# Mevcut başlıklar — ${LN[lang]} (${lang})`, '', 'Bu başlıklar kütüphanede ZATEN VAR. Yeni metinlerde bunları ve benzerlerini kullanma.', ''];
  for (const r of rows.filter((x) => x.lang === lang)) {
    L.push(`## ${r.cat} (${r.have})`, '', r.titles.length ? r.titles.join(' · ') : '(henüz yok)', '');
  }
  return `${L.join('\n')}\n`;
}

function chatSetting(lang) {
  return `${LANG_RULE[lang]}
Sen Duyum okuma uygulaması için özgün okuma metinleri yazan bir editörsün. Kaynaklardaki "yazım kılavuzu" kurallarına ve çıktı biçimine HER yanıtta harfiyen uy. Kaynaklardan alıntı yapma; onları yalnızca kural ve tekrar denetimi için kullan. Yanıtta atıf numarası, giriş ya da açıklama yazma; yalnızca "### | Başlık" bloklarını yaz. Her metnin meta satırında sub ve level olsun ve ardından tek başına "---" satırı gelsin. Uzunluk alt sınırının altına düşme.
`;
}

function promptsDoc(lang, rows, cats) {
  const W = WORDS[lang];
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  const open = rows.filter((x) => x.lang === lang && (x.need || x.cls.medium < TARGET.medium || x.cls.long < TARGET.long));
  const L = [`# NotebookLM üretim istemleri — ${LN[lang]} (${lang})`, ''];
  L.push(`Bu dosya \`node tools/notebooklm-pack.mjs\` ile eksik listesinden üretilir; içerik ekledikçe sayılar güncellenir.`, '');
  if (!open.length) { L.push('Bu dilde eksik metin yok. 🎉'); return `${L.join('\n')}\n`; }
  L.push('| Kategori | Eksik | Kısa istek | Orta istek | Uzun istek | Kaydedilecek dosya adı |', '|---|---:|---:|---:|---:|---|');
  for (const r of open) {
    const med = Math.max(0, TARGET.medium - r.cls.medium);
    const lng = Math.max(0, TARGET.long - r.cls.long);
    const shortN = Math.max(0, r.need - med - lng);
    L.push(`| ${catById[r.cat].name.tr} (\`${r.cat}\`) | ${r.need} | ${r.cat === 'novel' ? `${Math.ceil(shortN / 5)} × 5 bölüm` : `${Math.ceil(shortN / PER_SHORT)} × ${PER_SHORT}`} | ${med} × 1 | ${lng} × 1 (parça parça) | \`${lang}-${r.cat}-01.txt\`, \`-02\`… |`);
  }
  L.push('', '---', '');
  for (const r of open) {
    const c = catById[r.cat];
    const med = Math.max(0, TARGET.medium - r.cls.medium);
    const lng = Math.max(0, TARGET.long - r.cls.long);
    const shortN = Math.max(0, r.need - med - lng);
    const subs = Object.keys(c.subs).join(', ');
    L.push(`## ${lang}-${r.cat} — ${c.name.tr}`, '', `Eksik **${r.need}** (kısa ${shortN}, orta ${med}, uzun ${lng}). Yanıtları \`${lang}-${r.cat}-NN.txt\` dosyalarına kaydedin.`, '');
    if (shortN && r.cat === 'novel') {
      L.push(`**Dizi bölümleri** — her dizi 10 bölüm; her dizi için 2 istek (bölüm 1–5, sonra 6–10), toplam ${Math.ceil(shortN / 10)} dizi:`, '', '```text',
        `Kılavuzdaki "novel" kategorisi için YENİ bir roman dizisi başlat: dizinin 1–5. bölümlerini yaz (her bölüm ${W.short[0]}–${W.short[1]} kelime). Her bölümün meta satırında aynı "series: <dizi-kimligi>" ve "part: <n>" olsun; başlık biçimi "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>". Önceki dizilerden farklı karakter, mekân ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.`,
        '```', '', 'Ardından:', '', '```text', 'Aynı dizinin 6–10. bölümlerini yaz; 10. bölümde hikâyeyi doğal biçimde bitir.', '```', '');
    } else if (shortN) {
      L.push(`**Kısa metinler** — bu istemi ${Math.ceil(shortN / PER_SHORT)} kez gönderin (her seferinde "parti" numarasını artırın):`, '', '```text',
        `Kılavuzdaki "${r.cat}" kategorisi için parti 1: ${PER_SHORT} KISA metin yaz (her biri ${W.short[0]}–${W.short[1]} kelime). Alt kategorileri dağıt (${subs}); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.`,
        '```', '');
    }
    if (med) {
      L.push(`**Orta metinler** — ${med} kez, her yanıtta 1 metin:`, '', '```text',
        `Kılavuzdaki "${r.cat}" kategorisi için 1 ORTA metin yaz: ${W.medium[0]}–${W.medium[1]} kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.`,
        '```', '');
    }
    if (lng) {
      L.push('**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:', '', '```text',
        `Kılavuzdaki "${r.cat}" kategorisi için 1 UZUN metin yazacağız (toplam ${W.long[0]}–${W.long[1]} kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.`,
        '```', '', 'Sonraki her istek:', '', '```text',
        'Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.',
        '```', '');
    }
  }
  return `${L.join('\n')}\n`;
}


// ---------- Tek tek istek dosyaları ----------
// Her dosya NotebookLM'e olduğu gibi yapıştırılacak TEK bir istektir. Meta satırına lang/cat yazdırıldığı için
// yanıtlar hangi dosyaya yapıştırılırsa yapıştırılsın doğru dil/kategoriye aktarılır.
const LEN = {
  short: { tr: [300, 450], en: [350, 550] },
  kids: { tr: [200, 350], en: [250, 400] },
  poetry: { tr: [120, 300], en: [120, 300] },
  medium: { tr: [1000, 1800], en: [1300, 2200] },
  longPart: { tr: [900, 1200], en: [1100, 1500] },
};
const LONG_PARTS = 4;
const NOTE = {
  dialogue: 'Her konuşma AYRI SATIRDA "Ad: söz" biçiminde olsun; konuşmaları tek paragrafa yığma.',
  poetry: 'Şiirlerde satır sonlarını koru, kıtalar arasında boş satır bırak; meta satırına "kind: poem" ekle.',
  kids: 'Çocuklar için sade, sıcak ve güvenli dil; kısa cümleler.',
  news: 'Kurgusal haber: hayalî yer ve kişiler; gerçek bir olay gibi sunma.',
  letters: 'Mektup ya da günlük biçimi: hitap/tarih satırı ve kapanış olsun.',
};
const langName = (l) => (l === 'tr' ? 'Türkçe' : 'İngilizce (doğal İngilizce; Türkçeden çeviri değil)');

function pickSubs(c, counts, n) {
  const out = [];
  const local = { ...counts };
  for (let i = 0; i < n; i += 1) {
    const subs = Object.keys(c.subs).sort((a, b) => (local[a] || 0) - (local[b] || 0) || Object.keys(c.subs).indexOf(a) - Object.keys(c.subs).indexOf(b));
    const pick = subs.find((x) => !out.includes(x)) || subs[0];
    out.push(pick);
    local[pick] = (local[pick] || 0) + 1;
  }
  Object.assign(counts, local);
  return out;
}

function metaLine(lang, cat, sub, level, extra = '') {
  return `lang: ${lang} | cat: ${cat} | sub: ${sub} | tags: <3-5 etiket> | level: ${level}${extra}`;
}

function shortPrompt(lang, c, items, [lo, hi], extra = '') {
  return `Kaynaklardaki yazım kılavuzuna göre ${items.length} KISA metin yaz.

- Dil: ${langName(lang)}
- Kategori: ${c.id} (${c.name.tr})
- Uzunluk: her metin ${lo}–${hi} kelime. Alt sınırın altına düşme.
- Metinler:
${items.map((x, i) => `  ${i + 1}) sub: ${x.sub} (${c.subs[x.sub].tr}) · level: ${x.level}`).join('\n')}
${NOTE[c.id] ? `- ${NOTE[c.id]}\n` : ''}${extra}
Her metin TAM OLARAK şu biçimde (YAML ya da başka biçim kullanma):

### | Metnin Başlığı
${metaLine(lang, c.id, '<yukarıdaki>', '<yukarıdaki>')}
---
Gövde. Paragraflar arasında boş satır.

"Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme; her metinde farklı karakter, mekân ve olay. Atıf numarası yazma. En sonda ayrı bir satıra yalnızca "Kontrol Özeti:" yaz ve altına istenen ve üretilen metin sayısını yaz.
`;
}

function mediumPrompt(lang, c, sub, level) {
  const [lo, hi] = LEN.medium[lang];
  return `Kaynaklardaki yazım kılavuzuna göre 1 ORTA uzunlukta metin yaz.

- Dil: ${langName(lang)}
- Kategori: ${c.id} (${c.name.tr}) · sub: ${sub} (${c.subs[sub].tr}) · level: ${level}
- Uzunluk: ${lo}–${hi} kelime, 6–10 bölüm; her bölüm "## Ara başlık" satırıyla başlasın. Alt sınırın altına düşme.
${NOTE[c.id] ? `- ${NOTE[c.id]}\n` : ''}
Biçim (YAML kullanma):

### | Metnin Başlığı
${metaLine(lang, c.id, sub, level)}
---
## İlk ara başlık

Paragraflar…

Daha önce yazdığın metinlerden farklı bir konu seç. Atıf numarası yazma. En sonda ayrı bir satıra yalnızca "Kontrol Özeti:" yaz ve altına kelime sayısını yaz.
`;
}

function longPrompts(lang, c, sub, level) {
  const [lo, hi] = LEN.longPart[lang];
  const first = `Kaynaklardaki yazım kılavuzuna göre 1 UZUN metin yazacağız; ${LONG_PARTS} parçada tamamlanacak (toplam ${LONG_PARTS * 3} bölüm).

- Dil: ${langName(lang)}
- Kategori: ${c.id} (${c.name.tr}) · sub: ${sub} (${c.subs[sub].tr}) · level: ${level}
- Bu parça: başlık bloğu + ilk 3 bölüm, ${lo}–${hi} kelime. Her bölüm "## Ara başlık" ile başlasın.
${NOTE[c.id] ? `- ${NOTE[c.id]}\n` : ''}
Biçim (YAML kullanma):

### | Metnin Başlığı
${metaLine(lang, c.id, sub, level)}
---
## İlk ara başlık

Paragraflar…

Metni bu parçada BİTİRME. Atıf numarası ve kontrol özeti yazma.
`;
  const rest = Array.from({ length: LONG_PARTS - 1 }, (_, k) => {
    const last = k === LONG_PARTS - 2;
    return `Aynı uzun metne kaldığın yerden devam et: sonraki 3 bölümü yaz (${lo}–${hi} kelime).
Başlık satırını, meta satırını ve "---" satırını TEKRAR YAZMA; yalnızca "## Ara başlık" satırları ve paragraflar.
Giriş ya da açıklama cümlesi yazma; yanıta doğrudan "## " ile başla.
${last ? 'Bu son parça: metni doğal biçimde bitir. En sonda ayrı bir satıra yalnızca \"Kontrol Özeti:\" yaz ve altına tüm metnin toplam kelime sayısını yaz.' : 'Metni bu parçada bitirme. Atıf numarası ve kontrol özeti yazma.'}
`;
  });
  return [first, ...rest];
}

function seriesPrompts(lang, c, sub, seriesId) {
  const [lo, hi] = LEN.short[lang];
  const base = (from, to) => `Kaynaklardaki yazım kılavuzuna göre roman dizisi "${seriesId}" için ${from}–${to}. bölümleri yaz.

- Dil: ${langName(lang)}
- Kategori: novel · sub: ${sub} (${c.subs[sub].tr})
- Her bölüm ${lo}–${hi} kelime; her bölüm ayrı blok.
- Başlık biçimi: "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>"
${from === 1 ? '- Yeni bir dizi başlat: önceki dizilerden farklı karakterler, mekân ve konu.' : '- Aynı dizinin devamı; karakterler ve olay örgüsü önceki bölümlerle tutarlı olsun. 10. bölümde hikâyeyi doğal biçimde bitir.'}

Her bölüm TAM OLARAK şu biçimde (YAML kullanma):

### | <Dizi Adı> — <n>. Bölüm: <Bölüm adı>
lang: ${lang} | cat: novel | sub: ${sub} | series: ${seriesId} | part: <n> | tags: <3-5 etiket> | level: 2
---
Gövde.

Atıf numarası yazma. En sonda ayrı bir satıra yalnızca "Kontrol Özeti:" yaz ve altına istenen ve üretilen bölüm sayısını yaz.
`;
  return [base(1, 5), base(6, 10)];
}

const rank = (r) => (r.need && r.have ? 0 : r.need ? 1 : 2);
async function requestFiles(rows, cats) {
  const dir = join(OUT, 'istekler');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const catById = Object.fromEntries(cats.categories.map((c) => [c.id, c]));
  const order = [...rows].filter((r) => r.need || r.cls.medium < TARGET.medium || r.cls.long < TARGET.long)
    // Sıra: TR önce; başlanmış ama bitmemiş kategori önce (önce biri bitsin), sonra boşlar, en son yalnızca orta/uzun eksikler.
    .sort((a, b) => (a.lang === b.lang ? 0 : a.lang === 'tr' ? -1 : 1) || rank(a) - rank(b) || b.have - a.have);
  const index = ['# Sıra listesi — NotebookLM istekleri', '',
    'Her klasör bir dil–kategori. Dosyaları **numara sırasıyla** açın, içeriğini olduğu gibi NotebookLM sohbetine yapıştırın, yanıtı kopyalayıp bir yanıt dosyasının sonuna ekleyin (ör. `yanitlar-tr-dialogue.txt`; tüm yanıtlar tek dosyada da olabilir — dil ve kategori yanıtın içinde yazar). Uzun metin parçalarını sırayla, araya başka yanıt koymadan ekleyin.',
    '', 'Yanıt dosyalarını Claude\'a gönderin ya da `content-src/reading/inbox/` içine koyun. Bu liste her aktarmadan sonra eksiklere göre yeniden üretilir.', ''];
  let total = 0;
  for (const [i, r] of order.entries()) {
    const c = catById[r.cat];
    let catalog = { texts: [] };
    try { catalog = JSON.parse(await readFile(join(ROOT, `content/reading/${r.lang}/catalog.json`), 'utf8')); } catch { /* yok */ }
    const mine = catalog.texts.filter((t) => t.cat === r.cat);
    const counts = {};
    for (const t of mine) counts[t.sub] = (counts[t.sub] || 0) + 1;
    const med = Math.max(0, TARGET.medium - r.cls.medium);
    const lng = Math.max(0, TARGET.long - r.cls.long);
    const shortN = Math.max(0, r.need - med - lng);
    const files = [];
    let lv = mine.length;
    const nextLevel = () => [1, 2, 3, 2][(lv++) % 4];
    if (r.cat === 'novel') {
      const used = new Set(mine.map((t) => t.series).filter(Boolean));
      let k = 1;
      for (let s = 0; s < Math.ceil(shortN / 10); s += 1) {
        while (used.has(`${r.lang}-dizi-${String(k).padStart(2, '0')}`)) k += 1;
        const sid = `${r.lang}-dizi-${String(k).padStart(2, '0')}`; used.add(sid);
        const [sub] = pickSubs(c, counts, 1);
        seriesPrompts(r.lang, c, sub, sid).forEach((txt, j) => files.push({ kind: `dizi${s + 1}-${j ? 'b6-10' : 'b1-5'}`, txt }));
      }
    } else {
      const [lo, hi] = (r.cat === 'kids' ? LEN.kids : r.cat === 'poetry' ? LEN.poetry : LEN.short)[r.lang];
      for (let left = shortN; left > 0; left -= PER_SHORT) {
        const n = Math.min(PER_SHORT, left);
        const items = pickSubs(c, counts, n).map((sub) => ({ sub, level: nextLevel() }));
        files.push({ kind: 'kisa', txt: shortPrompt(r.lang, c, items, [lo, hi]) });
      }
    }
    for (let m = 0; m < med; m += 1) { const [sub] = pickSubs(c, counts, 1); files.push({ kind: 'orta', txt: mediumPrompt(r.lang, c, sub, [2, 3][m % 2]) }); }
    for (let m = 0; m < lng; m += 1) { const [sub] = pickSubs(c, counts, 1); longPrompts(r.lang, c, sub, 3).forEach((txt, j) => files.push({ kind: `uzun-parca${j + 1}`, txt })); }
    const folder = `${String(i + 1).padStart(2, '0')}-${r.lang}-${r.cat}`;
    await mkdir(join(dir, folder), { recursive: true });
    index.push(`## ${folder} — ${c.name.tr} (${r.lang}) · eksik ${r.need}${med ? `, orta ${med}` : ''}${lng ? `, uzun ${lng}` : ''}`, '');
    for (const [j, f] of files.entries()) {
      const name = `${String(j + 1).padStart(2, '0')}-${f.kind}.txt`;
      await writeFile(join(dir, folder, name), f.txt);
      index.push(`- [ ] \`${folder}/${name}\``);
    }
    index.push('');
    total += files.length;
  }
  index.splice(4, 0, `Toplam **${total}** istek.`, '');
  await writeFile(join(dir, 'SIRA.md'), `${index.join('\n')}\n`);
  return total;
}

export async function main() {
  const cats = JSON.parse(await readFile(join(ROOT, 'content-src/reading/categories.json'), 'utf8'));
  const { rows } = await collectStatus(cats);
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const lang of ['tr', 'en']) {
    await writeFile(join(OUT, `kaynak-1-kilavuz-${lang}.md`), guideDoc(lang, cats));
    await writeFile(join(OUT, `kaynak-2-mevcut-basliklar-${lang}.md`), titlesDoc(lang, rows));
    await writeFile(join(OUT, `sohbet-ayari-${lang}.txt`), chatSetting(lang));
    await writeFile(join(OUT, `istemler-${lang}.md`), promptsDoc(lang, rows, cats));
  }
  const reqs = await requestFiles(rows, cats);
  const need = rows.reduce((a, r) => a + r.need, 0);
  console.log(`NotebookLM paketi güncellendi: docs/research/notebooklm/uretim/ (eksik ${need} metin, ${reqs} hazır istek: uretim/istekler/SIRA.md)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
