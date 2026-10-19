// Türkçe dil modülü: ünlü uyumu, kurallı ekler, sayıların okunuşu, saat/tarih/para/adres,
// heceleme ve yazılı cevap karşılaştırması. Tüm çıktılar birim testleriyle doğrulanır (tests/lang.test.js).

export const code = 'tr';
const VOWELS = 'aeıioöuüâîû';
const BACK = 'aıouâû';
const VOICELESS = 'çfhkpsşt';
const NORM = { 'â': 'a', 'î': 'i', 'û': 'u' };

export const lower = (s) => String(s).toLocaleLowerCase('tr');
export const upper = (s) => String(s).toLocaleUpperCase('tr');
export const capitalize = (s) => (s ? upper(s[0]) + s.slice(1) : s);

export function lastVowel(word) {
  const w = lower(word);
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i])) return NORM[w[i]] || w[i];
  return 'e';
}

function lastLetter(word) {
  const w = lower(word).replace(/[^a-zçğıöşüâîû]/g, '');
  return w[w.length - 1] || '';
}

// Kurallı ekler. Ünsüz yumuşaması (kitap→kitabı) burada YAPILMAZ: bu nedenle
// yönelme/belirtme/ilgi ekleri yalnızca özel isimlerde veya p/ç/t/k ile bitmeyen sözcüklerde kullanılır.
// Bulunma (-da) ve ayrılma (-dan) ekleri her sözcükte kurallıdır.
export function suffix(word, kind, { proper = false } = {}) {
  const v = lastVowel(word);
  const end = lastLetter(word);
  const endsVowel = VOWELS.includes(end);
  const voiceless = VOICELESS.includes(end);
  const two = BACK.includes(v) ? 'a' : 'e';
  const four = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v] || 'i';
  let s;
  switch (kind) {
    case 'loc': s = `${voiceless ? 't' : 'd'}${two}`; break;
    case 'abl': s = `${voiceless ? 't' : 'd'}${two}n`; break;
    case 'dat': s = `${endsVowel ? 'y' : ''}${two}`; break;
    case 'acc': s = `${endsVowel ? 'y' : ''}${four}`; break;
    case 'gen': s = `${endsVowel ? 'n' : ''}${four}n`; break;
    case 'ins': s = `${endsVowel ? 'y' : ''}l${two}`; break;
    default: throw new Error(`Bilinmeyen ek: ${kind}`);
  }
  return proper ? `${word}'${s}` : word + s;
}

// Ünsüz yumuşaması gerektirebilecek, kurala güvenilemeyecek sözcükler (yönelme/belirtme/ilgi için).
export function needsExplicitForm(word) {
  return 'pçtk'.includes(lastLetter(word));
}

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
export const DIGITS = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];

function under1000(n) {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  const parts = [];
  if (h) parts.push(h === 1 ? 'yüz' : `${ONES[h]} yüz`);
  if (t) parts.push(TENS[t]);
  if (o) parts.push(ONES[o]);
  return parts.join(' ');
}

export function numberWords(n) {
  n = Math.floor(Number(n));
  if (n === 0) return 'sıfır';
  if (n < 0) return `eksi ${numberWords(-n)}`;
  const parts = [];
  const millions = Math.floor(n / 1e6), thousands = Math.floor((n % 1e6) / 1000), rest = n % 1000;
  if (millions) parts.push(`${under1000(millions)} milyon`);
  if (thousands) parts.push(thousands === 1 ? 'bin' : `${under1000(thousands)} bin`);
  if (rest) parts.push(under1000(rest));
  return parts.join(' ');
}

export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Saat: 24 saat düzeninde resmî okunuş. "at" = bulunma eki ("saat on dört otuzda").
export function timeSpoken(h, m, { at = false } = {}) {
  let words = numberWords(h);
  if (m) words += ` ${numberWords(m)}`;
  return `saat ${at ? suffix(words, 'loc') : words}`;
}
export const timeShown = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export const dateSpoken = (d, mo) => `${numberWords(d)} ${MONTHS[mo]}`;
export const dateShown = (d, mo) => `${d} ${MONTHS[mo]}`;

export function moneySpoken(lira, kurus = 0) {
  return `${numberWords(lira)} lira${kurus ? ` ${numberWords(kurus)} kuruş` : ''}`;
}
export const moneyShown = (lira, kurus = 0) => `${lira.toLocaleString('tr-TR')}${kurus ? `,${String(kurus).padStart(2, '0')}` : ''} TL`;

export const addressSpoken = (street, no, flat) => `${street}, numara ${numberWords(no)}, daire ${numberWords(flat)}`;
export const addressShown = (street, no, flat) => `${street} No ${no}, Daire ${flat}`;

export const quantitySpoken = (n, unit) => `${numberWords(n)} ${unit}`;
export const quantityShown = (n, unit) => `${n} ${unit}`;

// Heceleme: her hecede tek ünlü; ünlüler arası 1 ünsüz → sonraki heceye, 2+ ünsüz → sonuncusu sonraki heceye.
export function syllabify(word) {
  const w = lower(word);
  const idx = [];
  for (let i = 0; i < w.length; i++) if (VOWELS.includes(w[i])) idx.push(i);
  if (idx.length <= 1) return [w];
  const cuts = [];
  for (let k = 0; k < idx.length - 1; k++) {
    const between = idx[k + 1] - idx[k] - 1;
    cuts.push(between === 0 ? idx[k] + 1 : idx[k + 1] - 1);
  }
  const out = [];
  let start = 0;
  for (const c of cuts) { out.push(w.slice(start, c)); start = c; }
  out.push(w.slice(start));
  return out;
}

export const syllableCount = (word) => (lower(word).match(/[aeıioöuüâîû]/g) || []).length;

// Hece görevleri için güvenli sözcük: tek parça, başta ünsüz kümesi yok, ünlüler arası en çok 2 ünsüz.
export function syllabifySafe(word) {
  const w = lower(word);
  if (/[^a-zçğıöşü]/.test(w)) return false;
  if (/^[^aeıioöuü]{2}/.test(w)) return false;
  return !/[aeıioöuü][^aeıioöuü]{3,}[aeıioöuü]/.test(w);
}

export const LETTERS = [
  ['A', 'a'], ['B', 'be'], ['C', 'ce'], ['Ç', 'çe'], ['D', 'de'], ['E', 'e'], ['F', 'fe'], ['G', 'ge'],
  ['Ğ', 'yumuşak ge'], ['H', 'he'], ['I', 'ı'], ['İ', 'i'], ['J', 'je'], ['K', 'ke'], ['L', 'le'], ['M', 'me'],
  ['N', 'ne'], ['O', 'o'], ['Ö', 'ö'], ['P', 'pe'], ['R', 're'], ['S', 'se'], ['Ş', 'şe'], ['T', 'te'],
  ['U', 'u'], ['Ü', 'ü'], ['V', 've'], ['Y', 'ye'], ['Z', 'ze'],
];

// Sözcüğün sesbirimleri: Türkçe yazım büyük ölçüde sesçildir; 'ğ' ayrı ses sayılmaz (uzatma).
export function phonemes(word) {
  return [...lower(word).replace(/[^a-zçğıöşüâîû]/g, '')].filter((c) => c !== 'ğ').map((c) => NORM[c] || c);
}

const FOLD = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
export function normalizeAnswer(s) {
  return lower(s).replace(/[’']/g, "'").replace(/[.,!?;:"()]/g, ' ').replace(/\s+/g, ' ').trim();
}
export const foldDiacritics = (s) => normalizeAnswer(s).replace(/[çğıöşüâîû]/g, (c) => FOLD[c]);

export const yes = 'Evet';
export const no = 'Hayır';
