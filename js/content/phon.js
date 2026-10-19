// IPA dizgelerini sesbirimlere ayırır ve minimal çift ilişkisini doğrular.

const MULTI = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ', 'iː', 'uː', 'ɑː', 'ɔː', 'ɜː', 'aː', 'eː', 'iː', 'oː', 'uː', 'ɯː', 'œː', 'yː', 't͡ʃ', 'd͡ʒ'];

export function tokenizeIPA(ipa) {
  const s = String(ipa).replace(/[ˈˌ.\s/]/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const m = MULTI.find((t) => s.startsWith(t, i));
    if (m) { out.push(m); i += m.length; } else { out.push(s[i]); i += 1; }
  }
  return out;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'ɯ', 'œ', 'y', 'ɪ', 'ɛ', 'æ', 'ʌ', 'ɑ', 'ɔ', 'ʊ', 'ə', 'ɝ', 'ɚ',
  'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ', 'iː', 'uː', 'ɑː', 'ɔː', 'ɜː', 'aː', 'eː', 'oː', 'ɯː', 'œː', 'yː']);
export const isVowel = (p) => VOWELS.has(p);

// İki sözcük tek bir konumda tek sesbirimle ayrılıyorsa karşıtlık bilgisini döndürür.
export function minimalContrast(ipaA, ipaB) {
  const a = tokenizeIPA(ipaA), b = tokenizeIPA(ipaB);
  if (a.length !== b.length) return null;
  const diff = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff.push(i);
  if (diff.length !== 1) return null;
  const i = diff[0];
  const position = i === 0 ? 'initial' : i === a.length - 1 ? 'final' : 'medial';
  const type = isVowel(a[i]) && isVowel(b[i]) ? 'vowel' : !isVowel(a[i]) && !isVowel(b[i]) ? 'consonant' : 'mixed';
  return { index: i, a: a[i], b: b[i], position, type, label: `${a[i]}/${b[i]}` };
}

// Ünsüz özellikleri (ötümlülük çifti) — karşıtlık türünü ayrıntılandırmak için.
const VOICING = [['p', 'b'], ['t', 'd'], ['k', 'g'], ['f', 'v'], ['s', 'z'], ['ʃ', 'ʒ'], ['ʧ', 'ʤ'], ['θ', 'ð']];
export function contrastFeature(c) {
  if (!c) return null;
  if (c.type === 'vowel') return 'vowel';
  if (VOICING.some(([x, y]) => (x === c.a && y === c.b) || (x === c.b && y === c.a))) return 'voicing';
  return 'consonant';
}
