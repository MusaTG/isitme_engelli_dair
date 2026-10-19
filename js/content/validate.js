// İçerik paketi doğrulayıcı. Hem çalışma anında (hatalı kayıtları dışlamak için) hem testlerde kullanılır.
// Hata: kayıt kullanılmaz. Uyarı: kayıt kullanılır, raporda gösterilir.
import { makeRng } from '../core/rng.js';
import { bindSlots, render, slotsInText, isGenerator, TemplateError, normItem } from './template.js';
import { buildQuestion } from './questions.js';
import { minimalContrast } from './phon.js';

const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9]️?⃣/u;
const AUD = new Set(['both', 'child', 'adult']);
const ENDS = /[.?!…:)”"]$/;

export function validatePack(pack, L, { samples = 12 } = {}) {
  const errors = [];
  const warnings = [];
  const bad = new Set();
  const err = (path, msg) => { errors.push({ path, msg }); bad.add(path.split('#')[0]); };
  const warn = (path, msg) => warnings.push({ path, msg });

  const meta = pack.meta || {};
  if (!meta.license) err('meta', 'Lisans bilgisi yok');
  if (!meta.lang) err('meta', 'Dil kodu yok');
  if (meta.lang && meta.lang !== L.code) err('meta', `Dil uyuşmuyor: ${meta.lang}`);

  // Kelimeler
  const ids = new Set();
  const words = new Map();
  for (const w of pack.words || []) {
    const p = `word:${w.id}`;
    if (!w.id || ids.has(w.id)) err(p, 'Kimlik eksik ya da yinelenmiş');
    ids.add(w.id);
    if (!w.w || !String(w.w).trim()) err(p, 'Boş kelime');
    const key = String(w.w).toLocaleLowerCase(L.code);
    if (words.has(key)) err(p, `Yinelenen kelime: ${w.w}`);
    words.set(key, w);
    if (!meta.categories?.[w.cat]) err(p, `Bilinmeyen kategori: ${w.cat}`);
    if (![1, 2, 3].includes(w.lvl)) err(p, `Geçersiz seviye: ${w.lvl}`);
    if (!AUD.has(w.aud)) err(p, `Geçersiz yaş etiketi: ${w.aud}`);
    if (w.e !== undefined && !PICTO.test(w.e)) err(p, `Bozuk görsel referansı: ${w.e}`);
    if (L.code === 'tr' && w.syl !== L.syllableCount(w.w)) err(p, `Hece sayısı tutarsız: ${w.syl}`);
    if (L.code === 'en' && !(w.syl >= 1)) warn(p, 'Hece bilgisi yok');
    if (w.stress && (w.stress < 1 || w.stress > w.syl)) err(p, 'Vurgu hecesi hece sayısını aşıyor');
    if (w.lvl === 1 && w.aud === 'adult') warn(p, 'Yetişkine özel kelime en kolay seviyede');
    if (w.frame && !meta.frames?.[w.cat]) err(p, 'Taşıyıcı cümle yok');
  }
  for (const [cat, frames] of Object.entries(meta.frames || {})) {
    for (const f of frames) if (!f.includes('{w')) err(`frame:${cat}`, 'Taşıyıcı cümlede {w} yok');
  }

  // Minimal çift aileleri
  for (const f of pack.families || []) {
    const p = `family:${f.id}`;
    if (!f.words || f.words.length < 2) { err(p, 'En az iki kelime gerekli'); continue; }
    const ws = new Set();
    for (const w of f.words) {
      if (!w.w || !w.ipa) err(p, `Kelime veya IPA eksik: ${w.w}`);
      if (ws.has(w.w)) err(p, `Ailede yinelenen kelime: ${w.w}`);
      ws.add(w.w);
      if (w.e !== undefined && !PICTO.test(w.e)) err(p, `Bozuk görsel referansı: ${w.e}`);
    }
    if (f.minimal) {
      for (let i = 0; i < f.words.length; i++) {
        for (let j = i + 1; j < f.words.length; j++) {
          if (!minimalContrast(f.words[i].ipa, f.words[j].ipa)) err(p, `Minimal çift değil: ${f.words[i].w} / ${f.words[j].w}`);
        }
      }
    }
    if (f.frame && !f.frame.includes('{w}')) err(p, 'Taşıyıcı cümlede {w} yok');
    for (const fw of f.frameWords || []) if (!ws.has(fw)) err(p, `frameWords ailede yok: ${fw}`);
  }

  for (const s of pack.syllables?.sets || []) {
    const p = `syllables:${s.id}`;
    if (!s.items || s.items.length < 2) err(p, 'En az iki hece gerekli');
    const set = new Set(s.items.map((x) => x.s));
    if (set.size !== s.items.length) err(p, 'Yinelenen hece');
    for (const x of s.items) if (!x.say || !x.ipa) err(p, `Okunuş/IPA eksik: ${x.s}`);
    if (s.kind && !['vcv', 'cvc'].includes(s.kind)) err(p, `Bilinmeyen logatom türü: ${s.kind}`);
  }

  // Matris cümle tablosu: her sütundan bir kelime → dilbilgisel cümle.
  if (pack.matrix) {
    const m = pack.matrix;
    const cols = m.columns || [];
    if (cols.length < 3) err('matrix', 'Matris en az üç sütun içermeli');
    if (!m.license) err('matrix', 'Matris lisans bilgisi yok');
    const colIds = new Set(cols.map((c) => c.id));
    for (const id of m.pattern || []) if (!colIds.has(id)) err('matrix', `Kalıpta bilinmeyen sütun: ${id}`);
    for (const c of cols) {
      if (!c.words || c.words.length < 4) err('matrix', `Sütunda en az dört kelime olmalı: ${c.id}`);
      if (new Set(c.words).size !== (c.words || []).length) err('matrix', `Sütunda yinelenen kelime: ${c.id}`);
      if (!c.label?.tr || !c.label?.en) err('matrix', `Sütun etiketi eksik: ${c.id}`);
    }
  }

  const pools = pack.pools || {};
  for (const [name, pool] of Object.entries(pools)) {
    const vals = (pool.items || []).map((x) => normItem(x).v);
    if (vals.length < 2) err(`pool:${name}`, 'Havuzda en az iki öğe olmalı');
    if (new Set(vals).size !== vals.length) err(`pool:${name}`, 'Havuzda yinelenen öğe');
  }

  const checkSlots = (p, slots) => {
    for (const [slot, spec] of Object.entries(slots || {})) {
      if (!isGenerator(spec) && !pools[spec]) err(p, `Yuva ${slot}: havuz yok (${spec})`);
    }
  };
  const checkText = (p, t) => {
    if (/\{[^}]*\}/.test(t)) err(p, `Çözümlenmemiş yer tutucu: ${t}`);
    if (!ENDS.test(t)) err(p, `Noktalama eksik: ${t}`);
    if (/\s{2,}/.test(t)) err(p, `Çift boşluk: ${t}`);
  };
  const checkQuestion = (p, q, qctx) => {
    const built = buildQuestion(q, qctx, 10);
    if (!built) {
      if (q.type !== 'speaker') err(p, `Soru üretilemedi: ${q.q}`);
      return;
    }
    const labels = built.options.map((o) => o.label.toLocaleLowerCase());
    if (new Set(labels).size !== labels.length) err(p, `Yinelenen seçenek: ${q.q}`);
    if (built.options.filter((o) => o.id === built.answerId).length !== 1) err(p, `Doğru cevap sayısı 1 değil: ${q.q}`);
    if (/\{[^}]*\}/.test(built.prompt + labels.join())) err(p, `Soruda çözümlenmemiş yer tutucu: ${q.q}`);
  };

  // Cümle şablonları
  const tids = new Set();
  for (const t of pack.templates || []) {
    const p = `template:${t.id}`;
    if (tids.has(t.id)) err(p, 'Yinelenen kimlik');
    tids.add(t.id);
    checkSlots(p, t.slots);
    const declared = Object.keys(t.slots || {}).sort().join();
    for (const text of [...t.text, ...(t.neg || [])]) {
      const used = [...new Set(slotsInText(text))].sort().join();
      if (used !== declared) err(p, `Varyant farklı yuvalar kullanıyor: ${text}`);
    }
    if (t.neg && !t.yn) err(p, 'Olumsuz varyant için evet/hayır sorusu (yn) gerekli');
    if (!t.q?.length) err(p, 'Soru yok');
    if (t.lvl === 1 && t.text.some((x) => x.split(' ').length > 9)) warn(p, 'Seviye 1 için uzun cümle');
    for (let s = 0; s < samples && !bad.has(p); s++) {
      try {
        const rng = makeRng(s + 1);
        const bind = bindSlots(t.slots, pools, L, rng);
        for (const text of [...t.text, ...(t.neg || []), ...(t.yn ? [t.yn] : [])]) checkText(p, render(text, bind, t.slots, pools, L));
        for (const q of t.q) checkQuestion(p, q, { bind, slots: t.slots, pools, L, rng });
      } catch (e) {
        if (e instanceof TemplateError) err(p, e.message); else throw e;
      }
    }
  }

  for (const [i, qa] of (pack.qa || []).entries()) {
    if (!qa.q || !qa.a || !qa.t) err(`qa:${i}`, 'Soru, cevap veya tür eksik');
  }

  // Paragraflar
  for (const pa of pack.paragraphs || []) {
    const p = `paragraph:${pa.id}`;
    checkSlots(p, pa.slots);
    if (!pa.sentences?.length) err(p, 'Cümle yok');
    if (pa.size !== pa.sentences.length) warn(p, `Boyut etiketi (${pa.size}) cümle sayısıyla (${pa.sentences.length}) uyuşmuyor`);
    for (let s = 0; s < samples && !bad.has(p); s++) {
      try {
        const rng = makeRng(100 + s);
        const bind = bindSlots(pa.slots, pools, L, rng);
        for (const alts of pa.sentences) for (const text of alts) checkText(p, render(text, bind, pa.slots, pools, L));
        for (const q of pa.questions) checkQuestion(p, q, { bind, slots: pa.slots, pools, L, rng });
      } catch (e) {
        if (e instanceof TemplateError) err(p, e.message); else throw e;
      }
    }
  }

  // Senaryolar: en az iki farklı varyant zorunlu (yalnızca isim değiştirerek çoğaltmayı önlemek için)
  for (const sc of pack.scenarios || []) {
    const p = `scenario:${sc.id}`;
    checkSlots(p, sc.slots);
    if (!sc.variants || sc.variants.length < 2) err(p, 'En az iki farklı senaryo varyantı gerekli');
    const shapes = new Set((sc.variants || []).map((v) => v.lines.map((l) => l.t || l.sfx).join('|')));
    if (shapes.size !== (sc.variants || []).length) err(p, 'Varyantlar birbirinin aynısı');
    for (const q of sc.questions || []) {
      if (q.tag && !(sc.variants || []).every((v) => v.lines.some((l) => l.tag === q.tag))) err(p, `Etiket her varyantta yok: ${q.tag}`);
    }
    for (let s = 0; s < samples && !bad.has(p); s++) {
      try {
        const rng = makeRng(200 + s);
        const bind = bindSlots(sc.slots, pools, L, rng);
        const variant = sc.variants[s % sc.variants.length];
        for (const l of variant.lines) {
          if (l.sfx) continue;
          if (!sc.roles[l.sp]) err(p, `Rol tanımı yok: ${l.sp}`);
          checkText(p, render(l.t, bind, sc.slots, pools, L));
        }
        for (const q of sc.questions) {
          checkQuestion(p, q, { bind, slots: sc.slots, pools, L, rng, lines: variant.lines, roles: sc.roles, allowSpeaker: true });
        }
      } catch (e) {
        if (e instanceof TemplateError) err(p, e.message); else throw e;
      }
    }
  }

  return { errors, warnings, bad };
}
