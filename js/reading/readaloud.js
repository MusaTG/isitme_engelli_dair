// Metni cihazın sesiyle okutma (TTS). Kullanıcının kendi sesli okumasından ayrı bir işlevdir:
// mikrofon kullanılmaz, ses kaydedilmez, okuma doğrulanmaz.
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

export function createReadAloud({ tts, getQueue, speakOpts, onPara, onState, onError }) {
  let run = 0;
  let playing = false;
  const set = (v, pid) => { playing = v; onState?.(v, pid); };
  return {
    get playing() { return playing; },
    async start(fromPid) {
      const my = ++run;
      tts.cancel();
      const queue = getQueue(fromPid);
      if (!queue.length) return;
      set(true, fromPid);
      try {
        for (const { pid, text, speaker } of queue) {
          if (my !== run) return;
          onPara?.(pid);
          const parts = chunkText(speaker ? `${speaker}. ${text}` : text);
          for (const part of parts) {
            if (my !== run) return;
            await tts.speak(part, speakOpts());
          }
        }
        if (my === run) set(false, null);
      } catch (err) {
        if (my === run) { set(false, null); onError?.(err); }
      }
    },
    stop() {
      run += 1;
      tts.cancel();
      if (playing) set(false, null);
    },
  };
}
