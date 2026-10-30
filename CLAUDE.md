# Duyum — Claude Code için proje notları

Derleme gerektirmeyen statik PWA (TR/EN): işitsel dinleme egzersizleri + Okuma Egzersizi modülü. Ücretsiz, veri yalnızca cihazda, hesap/analitik yok. Sürüm: `package.json` (şu an 4.7.3). Değişiklik geçmişi: `CHANGELOG.md`. Denetim ve faz raporları: `docs/audit/v5-denetim.md`.

## Değişmez kurallar

- **Mikrofon, ses algılama, konuşma tanıma veya ses kaydı YOK.** Sesli okuma yalnızca cihazın TTS'i (Web Speech API).
- **Klinik iddia yok** (“işitmeyi geliştirir”, “tedavi eder” …). `tests/claims.test.js` olumlu iddiaları tarar; feragat cümleleri serbest.
- **Telifli metin yok**; içerik özgün ya da açık lisanslı. Sahte/yer tutucu içerik eklenmez; tamamlanmamış iş tamamlanmış gibi raporlanmaz.
- Gereksiz bağımlılık ekleme; framework yok (ES modülleri, el yazımı CSS: `css/tokens.css`, `css/app.css`).
- Sahte ya da yalnızca görsel düğme olmasın. `window.confirm/alert/prompt` KULLANMA → `confirmAsk()` (`js/ui.js`); bazı ortamlar tarayıcı onayını engelliyor.

## Komutlar

```bash
npm install                 # yalnızca axe-core (a11y testi için)
npm start                   # python3 -m http.server 8080  → http://localhost:8080/?nosw
npm test                    # birim testleri (node:test) — 84 test, 1 TODO (her kategoride 100 metin şartı)
npm run sw                  # sw.js önbellek listesi + sürüm özeti — JS/CSS/içerik değişince ÇALIŞTIR
# Tarayıcı testleri (Python Playwright; önce npm start):
npm run e2e        # v2 regresyon (38)
npm run e2e:v3     # v3 (55)
npm run e2e:reading
npm run e2e:a11y   # axe: 4 tema × sayfalar, okuyucu temaları, taşma
npm run e2e:tts    # sesli dinleme: kelime vurgusu, başlıklar, devam noktası
npm run e2e:skills # 7 gruptaki 47 görev akışı + takılan ses motoru
npm run e2e:marks  # ayraç / burada kaldım silme (tarayıcı onayı engelliyken)
```

Değişiklikten sonra: `npm run sw` → `npm test` → ilgili e2e. Testler sahte ses motoru kullanır (`tests/e2e/fake_voices.js`) ve uygulama içi onayı `AUTO_CONFIRM` ile kabul eder (`tests/e2e/run.py`).

## Mimari özeti

- `index.html` → `js/app.js` (hash yönlendirme `#/…`, kabuk, kayıt bildirimleri, SW kaydı).
- Depolama: `js/store.js` — localStorage `duyum.v1` (şema 4), yedek `duyum.v1.bak`, bozuk veri karantinası `duyum.v1.corrupt.<ts>`. Yapay zekâ anahtarı `duyum.ai.v1`, GitHub `duyum.github.v1` (yedeğe girmez).
- TTS: `js/tts.js` (Web Speech; boundary olayı, başlamazsa `no-start` + bir kez yeniden deneme, Chrome için periyodik `resume`).
- Egzersizler: `js/engine/**`, ekran `js/views/run.js` (cevaplar ses GERÇEKTEN başlayınca açılır).
- Okuma: `js/reading/*` (core, rules, importer, readaloud, state, data, search, ai, github), ekranlar `js/views/read-*.js`.
  - Okuyucu `read-reader.js`: CSS Custom Highlight API ile kelime vurgusu (`tts-w0/w1/w2`, `tts-resume`), başlıklar da okunur, elle kaydırınca takip durur (“Okunan yere git”), devam noktası `R.progress[id].ttsAt`.
- Dil dosyaları: `locales/{tr,en}.js`, `locales/reading.{tr,en}.js`.

## Okuma içeriği akışı

1. Kaynak: `content-src/reading/<dil>/<kategori>*.txt` blok biçimi (`### N | Başlık`, meta satırı, `---`, gövde). Biçim: `docs/reading-format.md`.
2. Gelen metinler `content-src/reading/inbox/` → `npm run reading:import` (ön izleme + onay; `-- --yes` onaysız). Sohbet/NotebookLM çıktısı kendiliğinden temizlenir (`normalizeChatText`): atıf `[1]`, `**`, kod çiti, `## sub:` meta, tek paragrafa yığılmış diyalog, “Kontrol Özeti”. Dil/kategori: bloktaki `lang:`/`cat:` > klasör > dosya adı (`tr-dialogue-01.txt`).
3. Aktarma sonrası otomatik: `tools/build-reading.mjs` → `content/reading/**`, `tools/reading-status.mjs` → `docs/reading/{EKSIKLER.md,status.json}`, `tools/notebooklm-pack.mjs` → `docs/research/notebooklm/uretim/` (istek dosyaları `istekler/`, sıra `SIRA.md`).
4. CI (`.github/workflows/deploy.yml`): inbox aktarımı → derleme → durum → sw → depoya geri yazma → doğrulama → test → GitHub Pages.

Aktarmadan önce içeriği gözden geçir: yanlış bilgi, sağlık iddiası, yazım/sayı hataları (NotebookLM “ten”, “sıfır dokuz” gibi İngilizce karışımlar), güvensiz davranışı olağan gösteren senaryolar (ör. telefonda arayana güvenlik bilgisi verme). Gerçek yer anlatan metinler `reviewed: yes` ile işaretlenmeden “inceleme bekliyor” görünür.

## Mevcut durum (2026-10-24)

- İçerik: TR 646 metin, EN 0; toplam eksik 2.156 (`docs/reading/EKSIKLER.md`). Gezi 90/100, diyalog 54/100.
- Bekleyen: `content-src/reading/inbox/_bekleyen/`
  - `tr-travel-istanbul-arkeoloji-parca1.txt` — 4 parçalık uzun metnin 1. parçası; 2–4 gelince aynı dosyaya eklenip aktarılacak.
  - `reddedildi-banka-dolandiricilik-kalibi.txt` — aktarılmadı (telefon dolandırıcılığı kalıbı); yerine güvenli bir telefon diyaloğu üretilmeli.
- Araştırma (NotebookLM): `docs/research/notebooklm/arastirma/`. İlk tur kaynaksızdı (yalnız proje dosyaları) → bulgular “düşük güven”; karar kaydı `sonuclar/1-ilk-tur-degerlendirme.md`.
- İçerik kalitesi notu: NotebookLM kelime sayısını tutturmak için kısa dolgu cümleleri ekliyor; istemlere “dolgu cümlesi yazma” kuralı eklenmesi önerildi (henüz eklenmedi).

## Sıradaki işler (görev planından)

- **Faz 4**: kalan içerik (dış üretim + toplu aktarma).
- **Faz 6** (kanıt bekleyenler dahil): sistem teması, isteğe bağlı Soft Reading teması (varsayılan değil; kontrast ≥4,5:1 axe ile), konum ile “okundu” ayrımı (§1 #14), IndexedDB geçişi (§1 #2), seviye eşikleri (Ateşman puanı şu an yalnızca ek bilgi).
- **Faz 7**: e2e/a11y testlerini CI'a ekleme, performans.
- **Faz 8**: son rapor (içerik sayıları tablosu; tamamlandı-test edildi / test edilemedi / kısmen / başlanmadı / dış girdi bekliyor).

Her faz sonu raporu: incelenenler, bulunan eksikler, değişen dosyalar, tamamlananlar, çalıştırılan testler ve sonuçları, kalan sorunlar, NotebookLM konuları, sonraki adım.
