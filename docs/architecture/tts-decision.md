# TTS kararı (ADR-001)

**Tarih:** 2026-10-17 · **Durum:** Kabul edildi (MVP), gözden geçirme planlandı

## Karar

MVP, konuşma egzersizlerinde **tarayıcı/işletim sistemi Web Speech API** seslerini kullanır; dil başına katı eşleştirme uygulanır (Türkçe → yalnızca `tr-*`, İngilizce → yalnızca `en-*`). Dil sesi yoksa başka dile **düşülmez**. Ton egzersizleri Web Audio ile sesten bağımsız üretilir.

İkinci aşamada, adaptör katmanına tarayıcıda çalışan **Piper (ONNX/WASM)** motoru eklenmesi ve gerçek dinleme testleriyle karşılaştırılması planlanır.

## Değerlendirilen seçenekler

| Seçenek | Türkçe | İngilizce | Çevrimdışı | Maliyet | Web’de | Not |
|---|---|---|---|---|---|---|
| Web Speech API (OS sesleri) | Cihaza bağlı (Android/iOS/Windows/macOS’ta indirilebilir Türkçe sesler var) | Var, çoklu aksan | Yerel seslerde evet | 0 | Yerleşik | Kalite cihaza göre değişir; ses listesi tarayıcıya göre farklı |
| Piper (rhasspy) | Var: `tr_TR` dfki, fahrettin, fettah (medium) | Çok sayıda en_US / en_GB ses | Evet (model indirildikten sonra) | 0 | WASM paketleri mevcut (ör. piper-tts-web) | Ses başına ~60 MB model; ses başına veri seti lisansı ayrı kontrol edilmeli |
| Kokoro-82M | **Yok** (8 dil; Türkçe dahil değil) | Var (US/GB) | Evet | 0 (Apache-2.0) | Mümkün ama ağır | Türkçe için uygun değil |
| Coqui XTTS-v2 | Var | Var | Evet | Model lisansı ticari kullanımı kısıtlıyor (CPML) | GPU gerekir, tarayıcıda pratik değil | Şirket kapandı; bakım topluluk çatallarında |
| Ücretli bulut TTS | Yüksek kalite | Yüksek kalite | Hayır | Ücretli | API | Proje kuralı gereği zorunlu bağımlılık yapılamaz |

Doğrulanan kaynaklar:
- Piper ses listesi: https://github.com/rhasspy/piper/blob/master/VOICES.md (tr_TR: dfki, fahrettin, fettah — medium)
- Piper en_US/lessac model kartı: veri seti Lessac Blizzard 2013; depo etiketi MIT olsa da **veri setinin kendi lisansı** ayrıca geçerlidir: https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD
- Kokoro dil desteği ve Apache-2.0: https://huggingface.co/simonfxr/kokoro.cpp-GGUF
- Tarayıcıda Piper: https://github.com/Mintplex-Labs/piper-tts-web (ONNX Runtime Web, modeller OPFS’te saklanır; ilk indirme internet ister)

Doğrulanmamış / yapılacaklar:
- Türkçe Piper seslerinin (dfki, fahrettin, fettah) veri seti lisansları tek tek okunmalı.
- XTTS lisans durumu güncel kaynakla yeniden kontrol edilmeli.

## Gerekçe

1. **Ücretsiz ve kurulumsuz:** Web Speech API ek indirme, sunucu veya anahtar gerektirmez; GitHub Pages’te doğrudan çalışır.
2. **Telaffuz güvenliği:** OS sesleri dile özgüdür (Türkçe ses Türkçe fonetiğiyle eğitilmiş). Katı eşleştirme ile yabancı aksanlı okuma engellenir; bu kural birim testleriyle doğrulanmıştır (`tests/tts.test.js`).
3. **Boyut:** Piper her ses için onlarca MB indirme gerektirir; düşük bant genişliğinde ilk deneyimi ağırlaştırır. Bu yüzden ikinci aşamada “isteğe bağlı indirilebilir yüksek tutarlılık sesi” olarak eklenmesi daha uygundur.

## Bilinen riskler

- Bazı cihazlarda Türkçe ses kurulu değildir → uygulama açık uyarı + kurulum yönergesi gösterir.
- Chrome masaüstündeki “Google …” sesleri internet gerektirir → arayüzde “internet gerekir” olarak etiketlenir; cihazdaki sesler önceliklidir.
- Hız (`rate`) desteği motor ve sese göre farklı; 0.6–1.2 aralığı ile sınırlandırıldı. Uç değerlerde anlaşılırlık gerçek cihazda dinlenerek doğrulanmalı.
- Cihazlar arası ses farkı egzersiz zorluğunu etkiler; sonuçlar cihazlar arasında karşılaştırılmamalı.

## Sonraki adım (v1.1 hedefi)

1. `js/tts.js` içine `createPiperEngine()` ekle (aynı arayüz: `isSupported`, `listVoices`, `resolveVoice`, `speak`, `speakSequence`, `cancel`).
2. Ayarlar’da “Yüksek tutarlılık sesi indir (~60 MB, isteğe bağlı)” seçeneği.
3. `docs/research/tts-benchmarks.md` için iki dilde test seti ile en az 5 dinleyicili dinleme değerlendirmesi (anlaşılırlık + doğallık, 1–5 ölçek).
