// Uçtan uca testler için sahte Web Speech API: gerçek ses üretmez, yalnızca olayları taklit eder.
(() => {
  const voices = [
    { name: 'Test Türkçe A', lang: 'tr-TR', localService: true, default: false, voiceURI: 't-tr-a' },
    { name: 'Test Türkçe B', lang: 'tr-TR', localService: true, default: false, voiceURI: 't-tr-b' },
    { name: 'Test English US', lang: 'en-US', localService: true, default: true, voiceURI: 't-en-us' },
    { name: 'Test English GB', lang: 'en-GB', localService: true, default: false, voiceURI: 't-en-gb' },
  ];
  window.__spoken = [];
  let timers = [];
  const synth = {
    getVoices: () => voices,
    speak(u) {
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.name, rate: u.rate });
      timers.push(setTimeout(() => u.onstart && u.onstart(), 10));
      timers.push(setTimeout(() => u.onend && u.onend(), 10 + Math.min(400, 80 + u.text.length * 4)));
    },
    cancel() { timers.forEach(clearTimeout); timers = []; },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
})();
