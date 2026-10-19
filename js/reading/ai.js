// Okuma metni üretimi için yapay zekâ bağlantısı. Kullanıcı kendi servisini ve anahtarını seçer;
// istek doğrudan tarayıcıdan o servise gider (Duyum'un sunucusu yoktur). Anahtar yalnızca bu cihazda,
// ayrı bir anahtar altında saklanır ve yedeklere dahil edilmez.
import { parseSourceFile, wordCount } from './core.js';
import { GUIDE, WORDS } from './rules.js';

const STORE_KEY = 'duyum.ai.v1';

export const PROVIDERS = {
  gemini: { name: 'Google Gemini', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey', free: true, needsKey: true },
  groq: { name: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', keyUrl: 'https://console.groq.com/keys', free: true, needsKey: true, openai: true },
  openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: '', keyUrl: 'https://openrouter.ai/keys', free: true, needsKey: true, openai: true },
  ollama: { name: 'Ollama (bu bilgisayarda, yerel)', base: 'http://localhost:11434/v1', model: 'llama3.1', free: true, needsKey: false, openai: true },
  anthropic: { name: 'Anthropic Claude', model: 'claude-haiku-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', free: false, needsKey: true },
  openai: { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyUrl: 'https://platform.openai.com/api-keys', free: false, needsKey: true, openai: true },
  custom: { name: 'OpenAI uyumlu (özel adres)', base: '', model: '', free: false, needsKey: false, openai: true },
};

export function defaultAIConfig() {
  return { provider: 'gemini', key: '', model: '', base: '', temperature: 0.8 };
}

export function loadAIConfig(storage = globalThis.localStorage) {
  try { return { ...defaultAIConfig(), ...(JSON.parse(storage.getItem(STORE_KEY) || '{}')) }; } catch { return defaultAIConfig(); }
}

export function saveAIConfig(cfg, storage = globalThis.localStorage) {
  try { storage.setItem(STORE_KEY, JSON.stringify(cfg)); return true; } catch { return false; }
}

export function clearAIConfig(storage = globalThis.localStorage) {
  try { storage.removeItem(STORE_KEY); } catch { /* yok */ }
}

export function effective(cfg) {
  const p = PROVIDERS[cfg.provider] || PROVIDERS.gemini;
  return { ...p, id: cfg.provider in PROVIDERS ? cfg.provider : 'gemini', key: (cfg.key || '').trim(), model: (cfg.model || '').trim() || p.model, base: ((cfg.base || '').trim() || p.base || '').replace(/\/+$/, ''), temperature: Number.isFinite(+cfg.temperature) ? +cfg.temperature : 0.8 };
}

export function isConfigured(cfg) {
  const e = effective(cfg);
  if (e.needsKey && !e.key) return false;
  if (e.openai && !e.base) return false;
  return Boolean(e.model);
}

export class AIError extends Error {
  constructor(code, detail = '') { super(detail || code); this.code = code; this.detail = detail; }
}

async function call(url, init, fetchImpl) {
  let res;
  try { res = await fetchImpl(url, init); } catch (e) {
    if (e?.name === 'AbortError') throw new AIError('aborted');
    throw new AIError('network', String(e?.message || e));
  }
  let body = null;
  const raw = await res.text();
  try { body = JSON.parse(raw); } catch { body = { raw }; }
  if (!res.ok) {
    const msg = body?.error?.message || body?.error?.type || body?.message || body?.raw || `HTTP ${res.status}`;
    const code = res.status === 401 || res.status === 403 ? 'auth' : res.status === 429 ? 'quota' : res.status === 404 ? 'model' : 'http';
    throw new AIError(code, String(msg).slice(0, 300));
  }
  return body;
}

// Tek istek: sistem + kullanıcı mesajı → düz metin.
export async function complete(cfg, { system, prompt, maxTokens = 4096, signal } = {}, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const e = effective(cfg);
  if (!isConfigured(cfg)) throw new AIError('config');
  if (e.id === 'gemini') {
    const body = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(e.model)}:generateContent`, {
      method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': e.key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: e.temperature, maxOutputTokens: maxTokens } }),
    }, fetchImpl);
    const text = (body?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    if (!text) throw new AIError(body?.promptFeedback?.blockReason ? 'blocked' : 'empty', body?.promptFeedback?.blockReason || body?.candidates?.[0]?.finishReason || '');
    return text;
  }
  if (e.id === 'anthropic') {
    const body = await call('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-api-key': e.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: e.model, max_tokens: maxTokens, temperature: Math.min(1, e.temperature), system, messages: [{ role: 'user', content: prompt }] }),
    }, fetchImpl);
    const text = (body?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    if (!text) throw new AIError('empty');
    return text;
  }
  const headers = { 'content-type': 'application/json' };
  if (e.key) headers.authorization = `Bearer ${e.key}`;
  if (e.id === 'openrouter') headers['X-Title'] = 'Duyum';
  const body = await call(`${e.base}/chat/completions`, {
    method: 'POST', signal, headers,
    body: JSON.stringify({ model: e.model, temperature: e.temperature, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
  }, fetchImpl);
  const text = body?.choices?.[0]?.message?.content || '';
  if (!text) throw new AIError('empty');
  return text;
}

// Servisin sunduğu model adları (bağlantı testi olarak da kullanılır).
export async function listModels(cfg, { signal } = {}, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const e = effective(cfg);
  if (e.needsKey && !e.key) throw new AIError('config');
  if (e.id === 'gemini') {
    const b = await call('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { signal, headers: { 'x-goog-api-key': e.key } }, fetchImpl);
    return (b.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace(/^models\//, ''));
  }
  if (e.id === 'anthropic') {
    const b = await call('https://api.anthropic.com/v1/models?limit=100', { signal, headers: { 'x-api-key': e.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } }, fetchImpl);
    return (b.data || []).map((m) => m.id);
  }
  if (!e.base) throw new AIError('config');
  const b = await call(`${e.base}/models`, { signal, headers: e.key ? { authorization: `Bearer ${e.key}` } : {} }, fetchImpl);
  const ids = (b.data || b.models || []).map((m) => m.id || m.name).filter(Boolean);
  return e.id === 'openrouter' ? ids.sort((a, b2) => Number(b2.endsWith(':free')) - Number(a.endsWith(':free'))) : ids;
}

// ---------- İstem oluşturma ----------
const LEVEL = { tr: { 1: 'kolay (kısa cümleler, sık kullanılan kelimeler)', 2: 'orta', 3: 'ileri (zengin kelime, uzun cümleler)' }, en: { 1: 'easy (short sentences, common words)', 2: 'intermediate', 3: 'advanced (rich vocabulary, longer sentences)' } };
const AUD = { tr: { all: 'genel okur', child: '6–10 yaş çocuklar', adult: 'yetişkinler' }, en: { all: 'general readers', child: 'children aged 6–10', adult: 'adults' } };

export function targetWords(lang, len) {
  const r = (WORDS[lang] || WORDS.tr)[len] || WORDS.tr.short;
  return { min: r[0], max: len === 'long' ? r[0] + 900 : len === 'medium' ? Math.min(r[1], r[0] + 600) : Math.min(r[1], 450) };
}

export function buildPrompt({ lang = 'tr', cat, sub, topic, len = 'short', level = 2, aud = 'all', notes = '', avoidTitles = [] }) {
  const L = lang === 'en' ? 'English (natural, idiomatic; not a translation)' : 'Türkçe';
  const tw = targetWords(lang, len);
  const subs = Object.entries(cat.subs).map(([k, v]) => `${k} (${v.tr})`).join(', ');
  const sections = len === 'short' ? 'Ara başlık kullanma.' : `Metni "## Ara başlık" satırlarıyla ${len === 'long' ? '12–20' : '5–9'} bölüme ayır.`;
  const system = `Sen bir okuma uygulaması için özgün okuma metinleri yazan dikkatli bir editörsün. Kurallar:
- Tamamen özgün yaz; kitap, şarkı, şiir, makale ya da sitelerden alıntı/uyarlama yapma, bilinen karakterleri kullanma.
- Gerçek, yaşayan kişiler ve markalar hakkında yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.
- Gerçek bilgi verirken doğru ve genel ol; emin olmadığın rakam/tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.
- Şiddet, korku, nefret, cinsellik, uyuşturucu içeren öğe yok. Metin tamamlanmış olsun, yarıda bitme.
- Yalnızca istenen biçimde çıktı ver; açıklama, giriş veya kapanış cümlesi ekleme.`;
  const prompt = `Metni ${L} yaz.
KATEGORİ: ${cat.name.tr} — ${cat.desc.tr}
YÖNERGE: ${GUIDE[cat.id] || ''}
ALT KATEGORİ: ${sub ? `${sub} (${cat.subs[sub]?.tr || ''})` : `şunlardan en uygun olanı: ${subs}`}
KONU / BAŞLIK / ANAHTAR KELİMELER: ${topic}
SEVİYE: ${(LEVEL[lang] || LEVEL.tr)[level] || LEVEL.tr[2]} · OKUR: ${(AUD[lang] || AUD.tr)[aud] || AUD.tr.all}
UZUNLUK: ${tw.min}–${tw.max} kelime. Alt sınırın altına düşme. ${sections}
${notes ? `EK İSTEKLER: ${notes}\n` : ''}${avoidTitles.length ? `Şu başlıkları kullanma: ${avoidTitles.slice(0, 40).join(' · ')}\n` : ''}
ÇIKTI BİÇİMİ (tam olarak):
### | Metnin Başlığı
sub: <alt kategori kimliği> | tags: <3-5 etiket, virgülle> | level: ${level}${cat.id === 'news' ? ' | kind: <fictional-news ya da feature>' : ''}
---
Metnin gövdesi. Paragraflar arasında boş satır.${cat.id === 'dialogue' ? '\nHer konuşma satırı "Ad: söz" biçiminde.' : ''}`;
  return { system, prompt };
}

export function continuePrompt({ lang = 'tr', soFar, need }) {
  const tail = soFar.split(/\s+/).slice(-450).join(' ');
  return {
    system: 'Sen bir okuma metnini sürdüren editörsün. Yalnızca devam metnini yaz; başlık bloğu, açıklama veya tekrar ekleme.',
    prompt: `${lang === 'en' ? 'Write in English.' : 'Türkçe yaz.'} Aşağıdaki metin yarım kaldı ya da kısa. Aynı üslupla, yeni "## Ara başlık" bölümleri ekleyerek yaklaşık ${need} kelime daha yaz ve metni doğal bir sonla bitir. Önceki cümleleri tekrar etme.\n\nMETNİN SON KISMI:\n${tail}`,
  };
}

// Model yanıtından başlık, meta ve gövdeyi çıkarır (kod bloğu çitlerini ve fazlalıkları temizler).
export function parseGenerated(raw, fallbackTitle = '') {
  let s = String(raw || '').replace(/\r\n?/g, '\n').trim();
  s = s.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  if (!/^###/m.test(s)) {
    const lines = s.split('\n');
    const first = lines[0].replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
    s = `### | ${first || fallbackTitle || 'Metin'}\n---\n${lines.slice(1).join('\n').trim()}`;
  }
  const b = parseSourceFile(s.slice(s.search(/^###/m)))[0];
  if (!b) return null;
  const body = b.body.replace(/^\*\*(.+)\*\*$/gm, '## $1').replace(/\n{3,}/g, '\n\n').trim();
  return { title: b.title.replace(/^["“]|["”]$/g, '').trim() || fallbackTitle, meta: b.meta, body, words: wordCount(body) };
}

// Tam üretim: ilk metin + gerekirse en çok 4 "devam" isteği (uzun metinler parça parça yazılır).
export async function generateText(cfg, opts, { signal, onProgress, fetchImpl } = {}) {
  const f = fetchImpl || globalThis.fetch.bind(globalThis);
  const tw = targetWords(opts.lang, opts.len);
  const p = buildPrompt(opts);
  onProgress?.({ step: 1, words: 0, target: tw.min });
  const first = await complete(cfg, { ...p, maxTokens: opts.len === 'short' ? 2048 : 8192, signal }, f);
  const out = parseGenerated(first, opts.topic);
  if (!out || out.words < 20) throw new AIError('format', String(first).slice(0, 200));
  let rounds = 0;
  while (out.words < tw.min && rounds < 4) {
    rounds += 1;
    onProgress?.({ step: rounds + 1, words: out.words, target: tw.min });
    const c = continuePrompt({ lang: opts.lang, soFar: out.body, need: Math.min(1500, tw.min - out.words + 150) });
    const more = (await complete(cfg, { ...c, maxTokens: 8192, signal }, f)).replace(/^```[a-z]*\n?|```\s*$/gi, '').replace(/^###.*\n(.*\n)?---\n/m, '').trim();
    if (!more) break;
    out.body = `${out.body}\n\n${more}`;
    out.words = wordCount(out.body);
  }
  return out;
}

// Kütüphane kaynak biçiminde (.txt) blok — inbox'a konabilir.
export function toSourceBlock({ title, sub, tags = [], level, kind, body }) {
  const meta = [sub && `sub: ${sub}`, tags.length && `tags: ${tags.join(', ')}`, level && `level: ${level}`, kind && kind !== 'user' && `kind: ${kind}`].filter(Boolean).join(' | ');
  return `### | ${title}\n${meta}\n---\n${String(body).trim()}\n`;
}
