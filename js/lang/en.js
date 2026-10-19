// English language module: numbers, times, dates, money, addresses, letter names, answer matching.
// English spelling is not phonemic; phoneme tasks use IPA stored in the content pack instead.

export const code = 'en';
export const lower = (s) => String(s).toLowerCase();
export const upper = (s) => String(s).toUpperCase();
export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export const DIGITS = ONES.slice(0, 10);

function under100(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}
function under1000(n) {
  const h = Math.floor(n / 100), r = n % 100;
  if (!h) return under100(r);
  return r ? `${ONES[h]} hundred and ${under100(r)}` : `${ONES[h]} hundred`;
}

export function numberWords(n) {
  n = Math.floor(Number(n));
  if (n === 0) return 'zero';
  if (n < 0) return `minus ${numberWords(-n)}`;
  const parts = [];
  const millions = Math.floor(n / 1e6), thousands = Math.floor((n % 1e6) / 1000), rest = n % 1000;
  if (millions) parts.push(`${under1000(millions)} million`);
  if (thousands) parts.push(`${under1000(thousands)} thousand`);
  if (rest) parts.push(rest < 100 && parts.length ? `and ${under100(rest)}` : under1000(rest));
  return parts.join(' ');
}

const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
export function ordinalWords(n) {
  const w = numberWords(n);
  const m = w.match(/(.*?)([a-z]+)$/);
  const last = m[2];
  let ord;
  if (ORD[last]) ord = ORD[last];
  else if (last.endsWith('y')) ord = `${last.slice(0, -1)}ieth`;
  else ord = `${last}th`;
  return m[1] + ord;
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 12-hour clock as commonly spoken: "three o'clock", "three fifteen", "three thirty".
export function timeSpoken(h, m) {
  const h12 = ((h + 11) % 12) + 1;
  return m ? `${numberWords(h12)} ${numberWords(m)}` : `${numberWords(h12)} o'clock`;
}
export const timeShown = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;

export const dateSpoken = (d, mo) => `${MONTHS[mo]} ${ordinalWords(d)}`;
export const dateShown = (d, mo) => `${MONTHS[mo]} ${d}`;

export function moneySpoken(dollars, cents = 0) {
  const d = `${numberWords(dollars)} ${dollars === 1 ? 'dollar' : 'dollars'}`;
  return cents ? `${d} and ${numberWords(cents)} ${cents === 1 ? 'cent' : 'cents'}` : d;
}
export const moneyShown = (dollars, cents = 0) => `$${dollars.toLocaleString('en-US')}${cents ? `.${String(cents).padStart(2, '0')}` : ''}`;

export const addressSpoken = (street, no, flat) => `${numberWords(no)} ${street}, apartment ${numberWords(flat)}`;
export const addressShown = (street, no, flat) => `${no} ${street}, Apt ${flat}`;

export const quantitySpoken = (n, unit) => `${numberWords(n)} ${unit}`;
export const quantityShown = (n, unit) => `${n} ${unit}`;

export const LETTERS = [
  ['A', 'ay'], ['B', 'bee'], ['C', 'see'], ['D', 'dee'], ['E', 'ee'], ['F', 'eff'], ['G', 'gee'], ['H', 'aitch'],
  ['I', 'eye'], ['J', 'jay'], ['K', 'kay'], ['L', 'el'], ['M', 'em'], ['N', 'en'], ['O', 'oh'], ['P', 'pee'],
  ['Q', 'cue'], ['R', 'are'], ['S', 'ess'], ['T', 'tee'], ['U', 'you'], ['V', 'vee'], ['W', 'double you'],
  ['X', 'ex'], ['Y', 'why'], ['Z', 'zee'],
];

export function normalizeAnswer(s) {
  return lower(s).replace(/[’']/g, "'").replace(/[.,!?;:"()]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}
export const foldDiacritics = (s) => normalizeAnswer(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

export const yes = 'Yes';
export const no = 'No';
