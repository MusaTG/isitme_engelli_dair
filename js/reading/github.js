// Kendi metnini ortak kütüphaneye göndermek (isteğe bağlı): metin, deponun
// content-src/reading/inbox/<dil>/<kategori>/ klasörüne bir .txt dosyası olarak yazılır; yayın iş akışı
// onu denetleyip kütüphaneye aktarır. GitHub erişim anahtarı yalnızca bu cihazda saklanır, yedeğe girmez.
const STORE_KEY = 'duyum.github.v1';

export function loadGhConfig(storage = globalThis.localStorage) {
  try { return { owner: '', repo: '', branch: 'main', token: '', ...(JSON.parse(storage.getItem(STORE_KEY) || '{}')) }; } catch { return { owner: '', repo: '', branch: 'main', token: '' }; }
}
export function saveGhConfig(c, storage = globalThis.localStorage) {
  try { storage.setItem(STORE_KEY, JSON.stringify(c)); return true; } catch { return false; }
}
export function clearGhConfig(storage = globalThis.localStorage) {
  try { storage.removeItem(STORE_KEY); } catch { /* yok */ }
}
export const ghReady = (c) => Boolean(c.owner && c.repo && c.token);

// Sayfa GitHub Pages'ten yayınlanıyorsa sahip/depo adını adresten tahmin eder (kullanıcı.github.io/depo/).
export function guessRepo(loc = globalThis.location) {
  const m = String(loc?.hostname || '').match(/^([\w-]+)\.github\.io$/i);
  if (!m) return null;
  const repo = String(loc.pathname || '').split('/').filter(Boolean)[0] || `${m[1]}.github.io`;
  return { owner: m[1], repo };
}

export function slug(s) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(s).toLowerCase().replace(/[çğıİöşü]/g, (c) => map[c] || c).normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 48) || 'metin';
}

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function sendToLibrary(c, { lang, cat, title, content }, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const path = `content-src/reading/inbox/${lang}/${cat}/${slug(title)}-${Date.now().toString(36)}.txt`;
  let res;
  try {
    res = await fetchImpl(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path}`, {
      method: 'PUT',
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${c.token.trim()}`, 'content-type': 'application/json', 'x-github-api-version': '2022-11-28' },
      body: JSON.stringify({ message: `Okuma metni önerisi: ${title}`, content: b64utf8(content), branch: c.branch || 'main' }),
    });
  } catch (e) { return { ok: false, code: 'network', detail: String(e?.message || e) }; }
  if (res.ok) { const j = await res.json().catch(() => ({})); return { ok: true, path, url: j?.content?.html_url || '' }; }
  const j = await res.json().catch(() => ({}));
  const code = res.status === 401 ? 'auth' : res.status === 403 ? 'forbidden' : res.status === 404 ? 'notfound' : res.status === 422 ? 'branch' : 'http';
  return { ok: false, code, detail: j?.message || `HTTP ${res.status}` };
}
