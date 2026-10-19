# Mimari (v3)

Derlemesiz statik PWA (GitHub Pages’te ücretsiz). Seçim gerekçesi ve alternatif (React/Capacitor) karşılaştırması v1’den geçerlidir: sıfır maliyet, sıfır bağımlılık, “ana ekrana ekle” ile uygulama gibi çalışma.

## Modüller

```
app.js                       Yönlendirici, kabuk, tema, oturum başlatma (ctx)
├─ store.js                  Profil, ayar, oturumlar, gösterim geçmişi, uyarlama, telaffuz doğrulamaları → localStorage (şema 3)
├─ goals.js                  Hedef ve not veri modeli, v2 → v3 geçişi, hedef istatistikleri, süzgeçler (saf modül, DOM yok)
├─ guide/tr.js, guide/en.js  Kılavuz metinleri (24 konu)
├─ i18n.js + locales/        Arayüz metinleri
├─ tts.js                    TTS adaptör kayıt defteri (Web Speech motoru), boş çıktı algılama
├─ audio.js                  Tonlar (kazanç, stereo), gürültü, sentezlenmiş ses efektleri
├─ lang/tr.js, lang/en.js    Dil kuralları: heceleme, sesbirim, sayı/saat/tarih okunuşu, ekler, normalleştirme
├─ content/
│   ├─ loader.js             JSON paketlerini yükler, özel paketlerle birleştirir, doğrular, hatalıları dışlar
│   ├─ validate.js           İçerik doğrulayıcı (çalışma anı + CI)
│   ├─ template.js           Yuva bağlama, çekimli biçimler, üreteçler (@time, @date, @money…), tek yuva değiştirme
│   ├─ questions.js          Paragraf/senaryo soruları (17 tür)
│   └─ phon.js               IPA belirteçleme, minimal karşıtlık tespiti
├─ engine/
│   ├─ registry.js           51 görev, beceri grupları, hiyerarşi etiketleri, 16 eğitim yolu, seviye → parametre
│   ├─ levels.js             Adlandırılmış seviyeler (Başlangıç … İleri)
│   ├─ tasks/*.js            Görev üreteçleri (ses, fonem, çift, kelime, cümle, paragraf, hafıza; advanced.js: logatom, ortadaki ses, matris)
│   ├─ session.js            Oturum oluşturucu: tekrar önleme, konum dengeleme, havuz ve doğrulama kuralları
│   ├─ exposure.js           Gösterim geçmişi, Leitner kutuları, A/P havuz ayrımı
│   ├─ adaptive.js           Uyarlanabilir zorluk
│   └─ stats.js              İlerleme özetleri
└─ views/                    home, catalog (beceriler + arama, günlük yaşam), study (serbest), plan (yollar), goals (hedefler, notlar, rapor), guide (kılavuz), run (oynatıcı), progress, settings, qa
```

## Oturum akışı

1. Ekran bir **yapılandırma** üretir: `{ mode, blocks: [{ task, count, overrides, filter }], replayLimit, timeLimit, textMode, … }`.
2. `buildSession` her blok için görev üretecini çağırır. Üreteç içerik seçerken `choose()` kullanır: aynı oturumda tekrar yok, mod `test` ise değerlendirme havuzu (A), değilse alıştırma havuzu (P); görülmemiş / tekrar zamanı gelmiş / görülmüş dengesi `seenRatio` ile.
3. `finalize` doğru cevabın konumunu dengeler, telaffuz doğrulama durumunu işaretler; `qa: 'required'` görevlerde değerlendirme modunda doğrulanmamış öğe atılır.
4. Oturum profilde `activeSession` olarak saklanır → kaldığı yerden devam.
5. Bitişte: gösterim geçmişi güncellenir, (değerlendirme değilse) görev başına uyarlama yapılır, oturum kaydı yazılır.

## Uyarlanabilir zorluk

Görev × egzersiz dili başına seviye (1–5; ses görevleri dil bağımsız). Karar için en az 8 yeni cevap ve son 10 cevabın başarısı + ortalama tekrar dinleme kullanılır; eşikler rahat (%90/%60), dengeli (%80/%50), zorlayıcı (%75/%45). Oturum başına en fazla bir kademe; değerlendirme oturumları seviyeyi değiştirmez; elle sabitlenen seviye otomatik değişmez. Bu kurallar ürün varsayımıdır, klinik protokol değildir.

## Veri modeli (profil, özet)

```js
{
  id, name, type: 'child'|'adult', ageRange, hearing, side, goals, experience,
  exerciseLang, dailyGoalMin, subtitles, voice: { tr, en, rotate },
  prefs: { mode, options, replayLimit, timeLimit, seenRatio, comfort, rateVary, noise, sessionLength, retry, pictures, passageText, breakEvery, speakerVary },
  adapt: { 'görev|dil': { level, hist, since } }, manualLevel: { görev: 1..5 },
  exposure: { içerikAnahtarı: [gösterim, doğru, sonZaman, kutu, sonrakiTekrar] },
  plan: { paths: [], tasks: [] },
  slt: { enabled, goals, notes },            // v2 alanları; silinmez (geri dönüş güvenliği)
  goalsV3: [{ id, title, desc, source: 'self'|'specialist', domain, group, lang, start, due, priority, specialistNote, ownNote,
              tasks, target, plan: { days: [0..6], minutes }, preset: { level, options, noise }|null,
              status: 'active'|'paused'|'done'|'archived', createdAt, updatedAt, completedAt }],
  notesV3: [{ id, date, type: 'specialist'|'practice'|'self'|'other', goals, recommendations, experience, difficulties, next, text, createdAt, updatedAt }],
  noteDraft,                                 // yeni notun otomatik taslağı
  sessions: [{ v: 2, id, date, mode, lang, source, label, goalId?, durationSec, total, correct, comfort?, items: [{ task, key, ok, first, rep, to, label, m, pick, right }] }],
  activeSession
}
```

Genel ayarlar: `settings.volume` (uygulama ses düzeyi, 0–1). Etkin oturumda `activeSession.noiseCap` gürültü sınırını, `breaksShown` mola hatırlatıcısını tutar.

Telaffuz doğrulamaları profilden bağımsızdır (cihaz + ses): `state.qa['dil|sesURI'][içerikAnahtarı] = 'ok'|'bad'|'unsure'`.
