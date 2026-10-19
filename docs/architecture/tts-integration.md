# TTS entegrasyonu

## Motor arayüzü

```js
{
  id: 'web-speech',
  isSupported(): boolean,
  loadVoices(): Promise<Voice[]>,
  listVoices(lang, accent?): Promise<Voice[]>,      // yalnızca o dildeki sesler, sıralı
  resolveVoice(lang, { voiceURI, accent }): Promise<Voice>,  // yoksa TTSError('no-voice')
  speak(text, { lang, voiceURI, accent, rate, voice? }): Promise<Voice>,
  speakSequence(texts, opts, gapMs): Promise<Voice>,
  cancel(): void,
}
```

`createTTS([motorlar])` dil başına motor sırasını tutar. İlk uygun ve o dilde sesi olan motor kullanılır. Hiçbiri yoksa hata kodu kullanıcıya gösterilir:

| Kod | Anlam | Arayüz davranışı |
|---|---|---|
| `unsupported` | Tarayıcı Web Speech desteklemiyor | Tarayıcı önerisi |
| `no-voice` | Bu dilde ses yok | “Başka dilde okunmadı” açıklaması + ses ekleme yönergesi |
| `synthesis-failed` | Ses üretilemedi | Tekrar dene / başka ses seç |

## Yeni motor eklemek

1. `js/tts.js` içinde aynı arayüzü uygulayan `createXEngine()` yaz.
2. `js/app.js` içinde `createTTS([createXEngine(), createWebSpeechEngine(window)])` sırasını güncelle.
3. `tests/tts.test.js` içine dil eşleştirme testlerini ekle.
4. `sw.js` önbellek listesine yeni dosyaları ekle; model dosyaları büyükse önbelleğe değil kullanıcı onayıyla OPFS’e indir.

## Gürültü

Gürültü Web Audio ile ayrı oynatılır; konuşma sesi işletim sistemi tarafından üretildiği için ikisi aynı ses grafiğinde karışmaz ve gerçek SNR ölçülemez. Seviye göreli tutulur ve arayüzde bu açıkça belirtilir.
