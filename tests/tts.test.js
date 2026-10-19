import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voiceMatches, rankVoices, accentsFor, createWebSpeechEngine, createTTS, TTSError } from '../js/tts.js';

const VOICES = [
  { name: 'Yelda', lang: 'tr-TR', localService: true, default: false, voiceURI: 'yelda' },
  { name: 'Google Türkçe', lang: 'tr-TR', localService: false, default: false, voiceURI: 'g-tr' },
  { name: 'Samantha', lang: 'en-US', localService: true, default: true, voiceURI: 'sam' },
  { name: 'Daniel', lang: 'en_GB', localService: true, default: false, voiceURI: 'dan' },
  { name: 'Amélie', lang: 'fr-CA', localService: true, default: false, voiceURI: 'ame' },
];

function fakeWindow(voices) {
  const spoken = [];
  class Utterance { constructor(text) { this.text = text; } }
  const synth = {
    getVoices: () => voices,
    speak(u) { spoken.push({ text: u.text, lang: u.lang, voice: u.voice.name, rate: u.rate }); setTimeout(() => u.onend?.(), 1); },
    cancel() {},
    addEventListener() {},
    removeEventListener() {},
  };
  return { win: { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance }, spoken };
}

test('dil eşleştirme katıdır', () => {
  assert.ok(voiceMatches({ lang: 'tr-TR' }, 'tr'));
  assert.ok(voiceMatches({ lang: 'en_GB' }, 'en'));
  assert.ok(!voiceMatches({ lang: 'fr-CA' }, 'en'));
  assert.ok(!voiceMatches({ lang: 'tr-TR' }, 'en'));
  assert.ok(!voiceMatches({ lang: 'tk-TM' }, 'tr'), 'Türkmence Türkçe sayılmaz');
});

test('ses sıralaması: aksan, sonra cihazda çalışan ses', () => {
  assert.deepEqual(rankVoices(VOICES, 'tr').map((v) => v.name), ['Yelda', 'Google Türkçe']);
  assert.equal(rankVoices(VOICES, 'en', 'en-GB')[0].name, 'Daniel');
  assert.equal(rankVoices(VOICES, 'en', 'en-US')[0].name, 'Samantha');
  assert.deepEqual(accentsFor(VOICES, 'en'), ['en-GB', 'en-US']);
});

test('Türkçe metin Türkçe sesle, İngilizce metin İngilizce sesle okunur', async () => {
  const { win, spoken } = fakeWindow(VOICES);
  const tts = createTTS([createWebSpeechEngine(win)]);
  await tts.speak('çiçek', { lang: 'tr', rate: 0.9 });
  await tts.speak('sheep', { lang: 'en', accent: 'en-GB' });
  assert.deepEqual(spoken.map((s) => [s.text, s.lang, s.voice]), [['çiçek', 'tr-TR', 'Yelda'], ['sheep', 'en_GB', 'Daniel']]);
  assert.equal(spoken[0].rate, 0.9);
});

test('dil sesi yoksa başka dile düşmez, no-voice hatası verir', async () => {
  const { win, spoken } = fakeWindow(VOICES.filter((v) => !v.lang.startsWith('tr')));
  const tts = createTTS([createWebSpeechEngine(win)]);
  await assert.rejects(() => tts.speak('merhaba', { lang: 'tr' }), (e) => e instanceof TTSError && e.code === 'no-voice');
  assert.equal(spoken.length, 0, 'hiçbir şey okunmamalı');
  const st = await tts.status('tr');
  assert.equal(st.ok, false);
  assert.equal(st.code, 'no-voice');
});

test('Web Speech desteklenmiyorsa unsupported döner', async () => {
  const tts = createTTS([createWebSpeechEngine({})]);
  const st = await tts.status('en');
  assert.deepEqual([st.ok, st.code], [false, 'unsupported']);
});

test('seçili ses kullanılır; sıra halinde okuma', async () => {
  const { win, spoken } = fakeWindow(VOICES);
  const tts = createTTS([createWebSpeechEngine(win)]);
  await tts.speak('kedi', { lang: 'tr', voiceURI: 'g-tr' });
  await tts.speakSequence(['elma', 'top'], { lang: 'tr' }, 1);
  assert.deepEqual(spoken.map((s) => s.voice), ['Google Türkçe', 'Yelda', 'Yelda']);
});
