// Metni cihazın sesiyle okutma (TTS). Kullanıcının kendi sesli okumasından ayrı bir işlevdir:
// mikrofon kullanılmaz, ses kaydedilmez, okuma doğrulanmaz.
//
// Kelime takibi: konuşma motorunun "boundary" (kelime sınırı) olayları kullanılır. Bazı sesler bu olayı hiç
// göndermez; o durumda konuşma hızından tahmini zamanlama ile ilerlenir (yaklaşık; her parça başında yeniden eşitlenir).
// Konum { pid, off } biçimindedir: paragraf kimliği + paragraf metnindeki karakter konumu. Durdurunca konum
// korunur; sonraki başlatma oradan (ya da verilen konumdan) devam eder.
import { sentences } from './core.js';

// Uzun paragrafları tarayıcıların kesmeyeceği parçalara böler (~220 karakter, cümle sınırında).
export function chunkText(text, max = 220) {
  const out = [];
  let cur = '';
  for (const s of sentences(text)) {
    if (s.length > max) {
      if (cur) { out.push(cur); cur = ''; }
      let rest = s;
      while (rest.length > max) {
        const cut = rest.lastIndexOf(',', max) > max * 0.4 ? rest.lastIndexOf(',', max) + 1 : (rest.lastIndexOf(' ', max) > 0 ? rest.lastIndexOf(' ', max) : max);
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) cur = rest;
      continue;
    }
    if ((`${cur} ${s}`).trim().length > max && cur) { out.push(cur); cur = s; } else cur = `${cur} ${s}`.trim();
  }
  if (cur) out.push(cur);
  return out;
}

// Metindeki kelimeler: [{ a, b }] karakter aralıkları.
export function wordSpans(text) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) out.push({ a: m.index, b: m.index + m[0].length });
  return out;
}

// Konumu kelime başına çeker (kelimenin ortasından ya da boşluktan başlanmasın).
export function snapToWord(text, off) {
  const ws = wordSpans(text);
  if (!ws.length) return 0;
  for (const w of ws) if (off < w.b) return w.a;
  return ws[ws.length - 1].a;
}

// Kelimeleri konuşma parçalarına böler (aralıklar paragraf metnine göre). Cümle sonunda, yoksa virgülde, yoksa
// kelime arasında keser; böylece her parça içindeki kelimelerin paragraf konumu bilinir.
export function chunkRanges(text, from = 0, max = 220) {
  const ws = wordSpans(text).filter((w) => w.b > from);
  const out = [];
  let i = 0;
  while (i < ws.length) {
    const start = Math.max(ws[i].a, from);
    let sent = -1;
    let comma = -1;
    let j = i;
    while (j < ws.length && (j === i || ws[j].b - start <= max)) {
      const end = text[ws[j].b - 1];
      if (/[.!?…:;]/.test(end)) sent = j; else if (end === ',') comma = j;
      j += 1;
    }
    let end = j - 1;
    if (j < ws.length) {
      // Parça dolmuşsa en yakın cümle sonunda, yoksa virgülde kes (çok kısa parça bırakmadan).
      const ok = (k) => k >= i && ws[k].b - start >= max * 0.4;
      if (ok(sent)) end = sent; else if (ok(comma)) end = comma;
    }
    out.push({ a: start, b: ws[end].b, words: ws.slice(i, end + 1) });
    i = end + 1;
  }
  return out;
}

const CPS = 14; // tahmini karakter/saniye (hız 1); yalnızca kelime sınırı olayı gelmeyen seslerde

export function createReadAloud({ tts, getQueue, speakOpts, onPara, onWord, onState, onError }) {
  let run = 0;
  let playing = false;
  let pos = null; // { pid, off } — en son okunan kelime
  const set = (v, pid) => { playing = v; onState?.(v, pid); };

  return {
    get playing() { return playing; },
    get position() { return pos; },
    set position(p) { pos = p; },
    // from: { pid, off } ya da yalnızca pid (paragraf başı)
    async start(from) {
      const my = ++run;
      tts.cancel();
      const f = typeof from === 'string' ? { pid: from, off: 0 } : from;
      const queue = getQueue(f.pid, f.off || 0);
      if (!queue.length) return;
      set(true, f.pid);
      try {
        for (const { pid, text, speaker, startOff: so = 0 } of queue) {
          if (my !== run) return;
          const startOff = so ? snapToWord(text, so) : 0;
          onPara?.(pid);
          const chunks = chunkRanges(text, startOff);
          for (const [ci, ch] of chunks.entries()) {
            if (my !== run) return;
            // Konuşmacı adı yalnızca paragrafın başından okunurken söylenir.
            const prefix = speaker && ci === 0 && startOff === 0 ? `${speaker}. ` : '';
            const spoken = prefix + text.slice(ch.a, ch.b);
            const starts = ch.words.map((w) => prefix.length + (w.a - ch.a));
            let last = -1;
            const emit = (k) => {
              if (my !== run || k <= last || k >= ch.words.length) return;
              last = k;
              pos = { pid, off: ch.words[k].a };
              onWord?.(pid, ch.words[k].a, ch.words[k].b, k);
            };
            emit(0);
            // Tahmini zamanlama (sınır olayı gelmezse devreye girer)
            let gotBoundary = false;
            let timer = null;
            const rate = Math.max(0.5, Math.min(1.3, speakOpts().rate || 1));
            const startTicker = () => {
              if (gotBoundary || timer) return;
              const t0 = Date.now();
              timer = setInterval(() => {
                if (gotBoundary || my !== run) { clearInterval(timer); return; }
                const c = ((Date.now() - t0) / 1000) * CPS * rate;
                let k = 0;
                while (k + 1 < starts.length && starts[k + 1] <= c) k += 1;
                emit(k);
              }, 90);
            };
            let fallback = setTimeout(startTicker, 700);
            try {
              await tts.speak(spoken, {
                ...speakOpts(),
                onStart: () => { clearTimeout(fallback); fallback = setTimeout(startTicker, 450); },
                onBoundary: (charIndex) => {
                  if (!gotBoundary) { gotBoundary = true; clearTimeout(fallback); if (timer) clearInterval(timer); }
                  let k = 0;
                  while (k + 1 < starts.length && starts[k + 1] <= charIndex) k += 1;
                  if (charIndex >= prefix.length) emit(k);
                },
              });
            } finally {
              clearTimeout(fallback);
              if (timer) clearInterval(timer);
            }
          }
        }
        if (my === run) { pos = null; set(false, null); }
      } catch (err) {
        if (my === run) { set(false, null); onError?.(err); }
      }
    },
    // Durdurur; konum korunur (sonraki başlatma kaldığı yerden).
    stop() {
      run += 1;
      tts.cancel();
      if (playing) set(false, null);
    },
  };
}
