// TTS adaptör katmanı.
// Her motor aynı arayüzü uygular: { id, isSupported(), listVoices(lang), speak(text, opts), cancel() }.
// Kural: Bir dil için o dilde ses bulunamazsa başka dilde sese ASLA sessizce düşülmez;
// TTSError('no-voice') fırlatılır ve arayüz kullanıcıya açıkça bildirir.

export class TTSError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code; // 'unsupported' | 'no-voice' | 'synthesis-failed' | 'empty-output'
    this.detail = detail;
  }
}

export function normLang(tag) {
  return String(tag || '').replace('_', '-').toLowerCase();
}

// Sesin dili istenen dille eşleşiyor mu? ('tr' ↔ 'tr-TR', 'en' ↔ 'en-GB' vb.)
export function voiceMatches(voice, lang) {
  const v = normLang(voice.lang);
  const want = normLang(lang);
  return v === want || v.startsWith(`${want}-`);
}

// Sesleri sıralar: tercih edilen aksan → cihazda (çevrimdışı) çalışan → varsayılan → ada göre.
export function rankVoices(voices, lang, accent) {
  const acc = normLang(accent);
  return voices
    .filter((v) => voiceMatches(v, lang))
    .sort((a, b) => {
      const score = (v) =>
        (acc && normLang(v.lang) === acc ? 8 : 0) + (v.localService ? 4 : 0) + (v.default ? 1 : 0);
      return score(b) - score(a) || String(a.name).localeCompare(String(b.name));
    });
}

export function accentsFor(voices, lang) {
  return [...new Set(voices.filter((v) => voiceMatches(v, lang)).map((v) => v.lang.replace('_', '-')))].sort();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Motor: tarayıcı / işletim sistemi Web Speech API ----------
export function createWebSpeechEngine(win = globalThis) {
  const synth = win.speechSynthesis;
  const Utterance = win.SpeechSynthesisUtterance;
  let cached = [];

  async function loadVoices(timeoutMs = 2500) {
    if (!synth) return [];
    cached = synth.getVoices();
    if (cached.length) return cached;
    await new Promise((resolve) => {
      const done = () => { synth.removeEventListener?.('voiceschanged', done); resolve(); };
      synth.addEventListener?.('voiceschanged', done);
      setTimeout(done, timeoutMs);
    });
    cached = synth.getVoices();
    return cached;
  }

  // Boş/çok kısa çıktı algılama: ses motoru hiçbir şey okumadan "bitti" derse sessizce geçilmez.
  const MIN_MS = 60;
  let cancelled = false;
  function speakOnce(text, voice, rate, volume = 1) {
    cancelled = false;
    return new Promise((resolve, reject) => {
      const u = new Utterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Math.min(1.3, Math.max(0.5, rate));
      u.pitch = 1;
      u.volume = Math.min(1, Math.max(0, volume));
      let started = 0;
      u.onstart = () => { started = (globalThis.performance || Date).now(); };
      // Bazı tarayıcılar "end" olayını kaçırabilir; metin uzunluğuna göre güvenlik zaman aşımı.
      const safety = setTimeout(resolve, Math.max(4000, (text.length * 180) / rate));
      u.onend = () => {
        clearTimeout(safety);
        const now = (globalThis.performance || Date).now();
        if (!cancelled && started && now - started < MIN_MS && text.trim().length > 1) reject(new TTSError('empty-output', text));
        else resolve();
      };
      u.onerror = (e) => {
        clearTimeout(safety);
        if (e.error === 'interrupted' || e.error === 'canceled') resolve();
        else reject(new TTSError('synthesis-failed', e.error));
      };
      synth.speak(u);
    });
  }

  return {
    id: 'web-speech',
    isSupported: () => Boolean(synth && Utterance),
    loadVoices,
    async listVoices(lang, accent) {
      return rankVoices(await loadVoices(), lang, accent);
    },
    async resolveVoice(lang, { voiceURI, accent } = {}) {
      const voices = rankVoices(await loadVoices(), lang, accent);
      if (!voices.length) throw new TTSError('no-voice', lang);
      return voices.find((v) => v.voiceURI === voiceURI) || voices[0];
    },
    async speak(text, { lang, voiceURI, accent, rate = 1, voice, volume = 1 } = {}) {
      if (!this.isSupported()) throw new TTSError('unsupported');
      const v = voice || (await this.resolveVoice(lang, { voiceURI, accent }));
      synth.cancel();
      await speakOnce(text, v, rate, volume);
      return v;
    },
    async speakSequence(texts, opts = {}, gapMs = 700) {
      const v = await this.resolveVoice(opts.lang, opts);
      synth.cancel();
      for (let i = 0; i < texts.length; i++) {
        if (opts.signal?.aborted) return v;
        await speakOnce(texts[i], v, opts.rate || 1, opts.volume ?? 1);
        if (i < texts.length - 1) await sleep(gapMs);
      }
      return v;
    },
    cancel() { cancelled = true; synth?.cancel(); },
  };
}

// ---------- Kayıt defteri ----------
// Dil başına motor sırası. İleride Piper (WASM) gibi bir motor eklendiğinde buraya eklenir;
// uygulamanın geri kalanı değişmez. Bkz. docs/architecture/tts-integration.md
export function createTTS(engines) {
  const order = { tr: engines.map((e) => e.id), en: engines.map((e) => e.id) };
  const byId = Object.fromEntries(engines.map((e) => [e.id, e]));

  async function engineFor(lang, opts) {
    let lastError = new TTSError('unsupported');
    for (const id of order[lang] || []) {
      const eng = byId[id];
      if (!eng?.isSupported()) continue;
      try {
        await eng.resolveVoice(lang, opts);
        return eng;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  return {
    engines: byId,
    async status(lang, accent) {
      for (const id of order[lang] || []) {
        const eng = byId[id];
        if (!eng?.isSupported()) continue;
        const voices = await eng.listVoices(lang, accent);
        if (voices.length) return { ok: true, engine: id, voices, offline: voices.some((v) => v.localService) };
      }
      const anySupported = engines.some((e) => e.isSupported());
      return { ok: false, code: anySupported ? 'no-voice' : 'unsupported', voices: [] };
    },
    async speak(text, opts) {
      const eng = await engineFor(opts.lang, opts);
      return eng.speak(text, opts);
    },
    async speakSequence(texts, opts, gapMs) {
      const eng = await engineFor(opts.lang, opts);
      return eng.speakSequence(texts, opts, gapMs);
    },
    cancel() {
      engines.forEach((e) => e.cancel());
    },
  };
}
