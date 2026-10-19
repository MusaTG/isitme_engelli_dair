// Okuma metinleri için ortak kurallar: varsayılan türler, en az uzunluklar, kalite denetimi,
// kategoriye özel yazım yönergeleri ve kelime aralıkları. Tarayıcıda ve Node araçlarında kullanılır (DOM yok).
import { sectionsText, sentences, fold } from './core.js';

export const MIN_WORDS = { poem: 40, default: 120 };
export const KIDS_MIN = 80;
export const NEAR_DUP = 0.3;
// Kategori bazında varsayılan içerik türü (metin kendi 'kind' alanıyla değiştirebilir)
export const CAT_KIND = { news: 'fictional-news', poetry: 'poem', info: 'nonfiction', travel: 'nonfiction', dialogue: 'dialogue', work: 'workdoc', language: 'practice', critical: 'essay', longform: 'essay' };


// Varsayılan tür: kategori + alt kategoriye göre (ör. çocuk diyaloğu ve söyleşi "Ad: söz" biçimindedir).
export const catDefaults = (catId, sub) => ({ aud: catId === 'kids' ? 'child' : 'all', kind: (catId === 'kids' && sub === 'dialogue') || (catId === 'longform' && sub === 'interview') ? 'dialogue' : CAT_KIND[catId] });

// Tek bir metnin kalite denetimi (derleyici, içe aktarma aracı ve uygulama içi yapay zekâ üretimi ortak kullanır).
export function textProblems(t, cat, cats) {
  const out = [];
  const err = (msg) => out.push({ msg });
  if (!t.title) err('başlık yok');
  if (!t.sub || !cat.subs[t.sub]) err(`alt kategori geçersiz (${t.sub || 'boş'}; geçerli: ${Object.keys(cat.subs).join(', ')})`);
  if (!cats.kinds[t.kind]) err(`içerik türü geçersiz (${t.kind})`);
  if (!['all', 'child', 'adult'].includes(t.aud)) err(`hedef kitle geçersiz (${t.aud})`);
  const min = t.kind === 'poem' ? MIN_WORDS.poem : cat.id === 'kids' ? KIDS_MIN : MIN_WORDS.default;
  if (t.words < min) err(`çok kısa (${t.words} kelime < ${min})`);
  const plain = sectionsText(t.sections);
  const last = plain.trim().slice(-1);
  if (!/[.!?…"”»)’'*]/.test(last)) err(`yarıda kesilmiş olabilir (son karakter "${last}")`);
  const counts = new Map();
  for (const s of sentences(plain)) {
    if (s.split(/\s+/).length < 5) continue;
    const k = fold(s, t.lang);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const rep = [...counts.values()].some((n) => n >= 3);
  if (rep && !['twisters', 'poem'].includes(t.sub) && t.kind !== 'poem') out.push({ msg: 'aynı cümle 3+ kez tekrarlanıyor', warn: true });
  if (t.part && !t.series) err('"part" var ama "series" yok');
  return out;
}


// Kelime aralıkları (sesli okuma hızına göre: kısa < 7 dk, orta 7–25 dk, uzun ≥ 25 dk)
export const WORDS = {
  tr: { short: [150, 600], medium: [800, 2500], long: [2900, 5000] },
  en: { short: [200, 800], medium: [1050, 3300], long: [3700, 6000] },
};

// Kategoriye özel yazım yönergeleri (istemlere eklenir).
export const GUIDE = {
  daily: 'Sade, gerçekçi günlük yaşam anlatıları (ev, sabah, alışveriş, arkadaş, aile, yeni yer, plan, alışkanlık). Küçük bir olay ve doğal bir kapanış olsun. Gerçek kişi/marka adı yok.',
  stories: 'Bağımsız, başı-ortası-sonu olan özgün öyküler. Türler: gerçekçi, dostluk, aile, öğrenme, yolculuk, doğa, merak, mizah, edebî. Her öykü farklı karakter ve olay örgüsüne sahip olsun.',
  novel: 'Roman tarzı DİZİLER: her dizi 10 bölümden oluşur; her bölüm bir öncekinin devamıdır. Her bölümde "series: <dizi-kimligi> | part: <bölüm no>" ZORUNLU. Başlık biçimi: "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>". Dizi kimliği küçük harf ve tire (ör. ruzgar-adasi). Bir yanıtta tek dizinin bölümlerini sırayla yaz. Tek parça uzun novella da olabilir (series yazma).',
  news: 'Gazete/dergi tarzı. İki tür var ve her metinde belirtilmeli: (1) KURGUSAL HABER — "kind: fictional-news"; hayalî yer/kişi/kurum adları kullan, gerçek bir olay gibi sunma. (2) DERGİ YAZISI — "kind: feature"; yalnızca iyi bilinen, doğrulanabilir genel bilgilere dayan (bilim, doğa, tarih, uzay...). Kesin tarih/rakam verirken emin ol; emin değilsen genel ifade kullan. Gerçek kişiler hakkında haber yazma.',
  info: 'Bilgilendirici, öğretici metinler. Doğru ve genel bilgi; sağlık, hukuk ve para konularında kişisel tavsiye verme, gerektiğinde "uzmana danışın" de. Tartışmalı konularda tarafsız ol. Kesin rakamları yalnızca iyi biliniyorsa ver.',
  travel: 'Gezi ve seyahat: gerçek yer tanıtımları (yalnızca uzun süre değişmeyen, iyi bilinen bilgiler; fiyat/saat/telefon YOK), seyahat planlama ipuçları ve kurgusal gezi günlükleri. Kurgusal günlüklerde "sub: journal | kind: fictional-journal" yaz. Gerçek yer metinlerinde kind yazma (varsayılan: genel bilgi).',
  dialogue: 'Konuşmacısı belli diyaloglar. HER SATIR "Ad: söz" biçiminde olsun (ör. "Elif: Günaydın!"). Anlatıcı cümlesi gerekiyorsa ayrı paragraf yaz. Bağlam: günlük konuşma, restoran, alışveriş, iş görüşmesi, toplantı, telefon, okul, yol tarifi, tanışma, sorun çözme. Doğal, nazik, gerçekçi dil.',
  work: 'İş ve mesleki okuma: e-posta, toplantı notu, kısa rapor, proje açıklaması, sunum metni, talimat, müşteri iletişimi, teknoloji, mesleki gelişim. Kişi ve şirket adları HAYALÎ olsun. Gerçek bir belge gibi biçimlendir (konu satırı, maddeler, imza) ama gerçek iletişim bilgisi verme.',
  poetry: 'Özgün şiirler ve kısa edebî düzyazılar. Şiirlerde dize sonlarında satır atla; kıtalar arasında boş satır bırak. Düzyazı/betimlemelerde "kind: fiction" yaz (şiirlerde kind yazma). Bilinen şiirleri taklit etme, alıntı yapma.',
  language: 'Sesli okuma ve diksiyon pratiği: kısa açık cümleler, uzun cümleler, noktalama ve duraklama, soru/ünlem, benzer sesler, hece uzunlukları, sayı-tarih-saat okuma, tekerleme, diksiyon. Her metnin başında bir cümlelik "Bu metinde ... çalışıyoruz." açıklaması olsun. Tekerlemeler özgün olsun.',
  kids: 'Çocuklar için (yaklaşık 6–10 yaş): kısa, sıcak, yaşa uygun hikâyeler, hayvan öyküleri, basit diyaloglar ("Ad: söz"), günlük yaşam, doğa, eğitici hikâye, merak edilen bilgiler. Korkutucu/şiddet içeren öğe yok. Basit cümleler. En az 90 kelime.',
  longform: 'Yetişkinler için uzun okumalar: deneme, uzun gezi yazısı, bilim, kişisel gelişim, tarih-kültür, uzun hikâye, HAYALÎ kişilerle söyleşi (söyleşide "Ad: söz" biçimi), uzun makale. Bu kategoride ORTA ve UZUN metin ağırlıklı olsun; "## Ara başlık" kullan.',
  letters: 'Kişisel günlükler, mektuplar, anılar, düşünce yazıları — tümü özgün ve kurgusal; gerçek kişilere mektup yazma. Günlüklerde tarih başlıkları ("## 3 Mart") kullanılabilir.',
  critical: 'Eleştirel düşünme: iki görüşü adil biçimde karşılaştırma, bir sorunu açıklama, artılar-eksiler, farklı açılardan bakma, iddia ile kanıtı ayırma. Güncel siyasi tartışmalarda taraf tutma; konuları gündelik ve genel tut (ör. ev ödevi, uzaktan çalışma, şehirde bisiklet). Sonunda okura bir soru bırak.',
};

