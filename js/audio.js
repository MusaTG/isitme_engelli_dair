// Web Audio: tonlar (kazanç, stereo konum, gecikme), ses efektleri ve arka plan gürültüsü.
// Not: Gürültü seviyesi GÖRELİDİR. TTS sesi işletim sistemi tarafından ayrı oynatıldığı için
// gerçek sinyal/gürültü oranı (SNR) ölçülemez ve konuşma sesi stereo olarak konumlandırılamaz.

let ctx = null;
let noiseNode = null;
let noiseGain = null;
const active = new Set();
let master = null;
let masterVol = 0.7;

// Uygulama ses düzeyi (0–1). Cihazın kendi ses düzeyinin yerine geçmez; onunla çarpılır.
export function setMasterVolume(v) {
  masterVol = Math.min(1, Math.max(0, Number(v)));
  if (master && ctx) master.gain.setValueAtTime(masterVol, ctx.currentTime);
}
export const getMasterVolume = () => masterVol;
function out(ac) {
  if (!master) { master = ac.createGain(); master.gain.value = masterVol; master.connect(ac.destination); }
  return master;
}

export function audioSupported() {
  return Boolean(globalThis.AudioContext || globalThis.webkitAudioContext);
}

export function context() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(ac, t, { f, d, gain = 0.2, pan = 0, type = 'sine' }) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.setValueAtTime(gain, Math.max(t + 0.02, t + d - 0.03));
  g.gain.linearRampToValueAtTime(0, t + d);
  let node = osc.connect(g);
  if (pan && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    node = node.connect(p);
  }
  node.connect(out(ac));
  osc.start(t);
  osc.stop(t + d + 0.02);
  active.add(osc);
  osc.onended = () => active.delete(osc);
  return osc;
}

// play: { tones:[{f,d,gain,pan,at}], groups:[[...],[...]], gap, groupGap, window }
// Dönüş: { done: Promise, stop(), schedule: [{start,end}] }  — zamanlar saniye (oynatma başlangıcına göre).
export function playTones(play) {
  const ac = context();
  const t0 = ac.currentTime + 0.08;
  const schedule = [];
  const nodes = [];
  let t = t0;
  const groups = play.groups || [play.tones || []];
  groups.forEach((group, gi) => {
    for (const tn of group) {
      const start = tn.at !== undefined ? t0 + tn.at : t;
      nodes.push(tone(ac, start, tn));
      schedule.push({ start: start - t0, end: start - t0 + tn.d });
      t = start + tn.d + (play.gap ?? 0.4);
    }
    if (gi < groups.length - 1) t += play.groupGap ?? 1;
  });
  const total = Math.max(t - t0, play.window || 0);
  let timer;
  const done = new Promise((r) => { timer = setTimeout(r, total * 1000 + 80); });
  return {
    done, schedule, startedAt: performance.now() + 80,
    stop: () => { clearTimeout(timer); nodes.forEach((n) => { try { n.stop(); } catch { /* bitti */ } }); },
  };
}

// Kısa, sentezlenmiş ses efektleri (kayıt dosyası kullanılmaz; lisans sorunu yoktur).
export function playSfx(kind) {
  const ac = context();
  const t = ac.currentTime + 0.05;
  let len = 1;
  if (kind === 'doorbell') { tone(ac, t, { f: 659, d: 0.45, gain: 0.18, type: 'triangle' }); tone(ac, t + 0.5, { f: 523, d: 0.7, gain: 0.18, type: 'triangle' }); len = 1.3; }
  else if (kind === 'phone') { for (let i = 0; i < 2; i++) for (let k = 0; k < 8; k++) tone(ac, t + i * 0.9 + k * 0.05, { f: k % 2 ? 480 : 440, d: 0.05, gain: 0.12 }); len = 1.9; }
  else if (kind === 'chime') { tone(ac, t, { f: 784, d: 0.35, gain: 0.15, type: 'triangle' }); tone(ac, t + 0.35, { f: 988, d: 0.35, gain: 0.15, type: 'triangle' }); tone(ac, t + 0.7, { f: 1175, d: 0.5, gain: 0.15, type: 'triangle' }); len = 1.3; }
  else if (kind === 'alarm') { for (let k = 0; k < 4; k++) tone(ac, t + k * 0.35, { f: k % 2 ? 700 : 900, d: 0.3, gain: 0.08, type: 'square' }); len = 1.5; }
  return new Promise((r) => setTimeout(r, len * 1000));
}

export function stopAllTones() {
  for (const n of active) { try { n.stop(); } catch { /* bitti */ } }
  active.clear();
}

function noiseBuffer(ac, seconds = 2) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

export const NOISE_LEVELS = { 0: 0, 1: 0.18, 2: 0.32, 3: 0.48 };

export function startNoise(level) {
  stopNoise();
  const vol = NOISE_LEVELS[level] || 0;
  if (!vol) return;
  const ac = context();
  noiseNode = ac.createBufferSource();
  noiseNode.buffer = noiseBuffer(ac);
  noiseNode.loop = true;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1000;
  band.Q.value = 0.5;
  noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0, ac.currentTime);
  noiseGain.gain.linearRampToValueAtTime(vol, ac.currentTime + 0.3);
  noiseNode.connect(band).connect(noiseGain).connect(out(ac));
  noiseNode.start();
}

// Çalarken gürültüyü azaltmak için (gürültü yeniden başlatılmadan).
export function setNoiseLevel(level) {
  if (!noiseGain || !ctx) return;
  noiseGain.gain.linearRampToValueAtTime(NOISE_LEVELS[level] || 0, ctx.currentTime + 0.2);
}

export function stopNoise() {
  if (noiseNode && ctx) {
    const node = noiseNode;
    noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    setTimeout(() => { try { node.stop(); } catch { /* bitti */ } }, 300);
  }
  noiseNode = null;
}

// Stereo kalibrasyonu için tek taraflı test tonu.
export function playSide(side) {
  return playTones({ tones: [{ f: 600, d: 0.8, gain: 0.2, pan: side === 'left' ? -1 : 1 }] }).done;
}
