# Duyum — dinleme pratiği

İşitme cihazı, koklear implant (CI) veya bimodal sistem kullanan **çocuk ve yetişkinler** için Türkçe ve İngilizce işitsel algı ve dinleme pratiği. **Tamamen ücretsiz**, kurulum gerektirmeyen bir web uygulaması (PWA); veriler yalnızca cihazda kalır.

> **Önemli:** Duyum bir pratik aracıdır. Odyolojik değerlendirmenin, cihaz ayarının veya Dil ve Konuşma Terapisti (DKT) hizmetinin yerine geçmez. Sonuçlar işitme düzeyinin, cihazın başarısının veya gerçek hayattaki anlama düzeyinin ölçümü değildir.

## v4.1 — Yapay zekâ ile okuma metni

- Okuma → **Yapay zekâ ile oluştur**: konu/başlık/anahtar kelime gir, dil-kategori-uzunluk-zorluk seç; metin üretilir, düzenlenir ve **Kendi metinlerim**’e kaydedilir. Kendi ücretsiz anahtarınla (ör. Google Gemini ücretsiz katmanı, Groq, OpenRouter) ya da yerel Ollama ile çalışır; anahtar yalnızca cihazda kalır.
- Kendi metinlerini **Kütüphaneye öner**: GitHub ayarlıysa doğrudan depoya (inbox) gönderilir, yayın iş akışı ortak kütüphaneye ekler.
- Form denetimleri (tarih, onay kutusu, açılır liste, kaydırıcı) Windows’ta da uygulama stiliyle görünür.

## v4.0 — Okuma Egzersizi

- Ana menüde **Okuma Egzersizi**: kütüphane, katlanmış Türkçe arama (ı/i, ş/s…), süzgeç ve sıralama, kalınan yerden devam (paragraf bazlı, sürüm değişince taşınır), aşama ilerlemesi (“Aşama 3 / 8 — %37”), içindekiler, ayraç/vurgu/not, okuma listeleri, 30–120 dk süreli oturumlar ve molalar, görünüm ayarları (boyut, satır/paragraf aralığı, sütun, yazı tipi, hizalama, temalar, odak modu).
- **Sesli okuma (dinle) düğmesi:** telefonda kaydırırken gizlenir; Ayarlar → Erişilebilirlik’ten tamamen kapatılabilir. Uygulamada **mikrofon, ses kaydı veya konuşma tanıma yoktur**.
- **Kütüphane durumu:** Türkçe 552 metin (günlük 101, öykü 100, roman 101, haber/dergi 100, bilgi 100, gezi 50). Diğer TR kategorileri ve İngilizce kütüphane henüz boş — eksikler ve hazır istemler: **[docs/reading/EKSIKLER.md](docs/reading/EKSIKLER.md)**.
- **Dışarıdan metin ekleme:** başka bir yapay zekâ sohbetinde üretilen metni `content-src/reading/inbox/<dil>/<kategori>/` içine `.txt` olarak koyun → `npm run reading:import` (GitHub’da yayın iş akışı kendisi aktarır). Biçim: **[docs/reading-format.md](docs/reading-format.md)**. Uygulama içinden de (Kendi metinlerim → Dosyadan içe aktar) yalnızca o cihaza eklenebilir.

## v3.0’da neler var?

- **51 görev türü**, 8 cevap tipi: 2–10 seçenek (1–9 ve 0 tuşları; rakam görevlerinde tuş = rakam), yazma, kart sıralama, rakam tuş takımı, “ses başlayınca/bitince bas”, öğrenme kartları, paragraf ve diyalogda çoklu soru, **matris cümlesi ızgarası** (kelime bazında puan).
- **Beceri grupları ve hiyerarşi:** ses farkındalığı · hece ve ses (fonem) · **anlamsız heceler (aba–apa, mam–mem, heed–hid)** · minimal çiftler (**ortadaki ses** dâhil) · kelime · cümle · paragraf · işitsel hafıza · günlük yaşam. Her görevde Farkındalık / Ayırt etme / Tanıma / Anlama etiketi; katalogda arama ve süzgeç.
- **Adlandırılmış seviyeler:** Başlangıç, Temel, Orta, Orta-ileri, İleri (+ kişisel hedef ayarı, serbest çalışma). Seviye adları klinik düzey değildir.
- **İçerik (TR / EN):** ~600 kelime ve 30 kategori, IPA’lı minimal çift aileleri, hece ve logatom kümeleri, 5×10 matris kelime tablosu, 24 cümle şablonu, 16 paragraf, **33 senaryo (66 varyant)** — iş görüşmesi, iş yerinde telefon, toplantıda soru-cevap, kısa sunum, arkadaş grubu, sesli mesaj ve aile sofrası dâhil.
- **Kişisel ve DKT hedefleri:** durum, öncelik, tarihler, uzman notu, bağlı egzersizler, haftalık plan, zorluk ayarı, ilerleme geçmişi, hızlı işlemler (Çalışmaya başla · Not ekle · Düzenle · Tamamlandı), ana sayfada **Bugünün planı**. **Seans notları:** yapılandırılmış alanlar, arama ve süzgeç, otomatik taslak, silmede geri al.
- **Kullanım kılavuzu ve yardım:** 24 konu (TR/EN), arama, kategoriler, adım adım yönergeler; Ayarlar’da ve ekranlardaki “Bu ekranla ilgili yardım” bağlantılarında.
- **Güvenli dinleme:** egzersiz içinde “Gürültüyü azalt / kapat”, uygulama ses düzeyi, mola hatırlatıcısı, istediğin an durma.
- Ezber önleme, rahat pratik / değerlendirme modları, yavaş uyarlama, ses kalite testi ekranı, yarım oturumu sürdürme, çocuk ve yetişkin profilleri, 4 tema, çevrimdışı açılma.
- Ödeme, abonelik, reklam, analiz aracı, hesap veya sunucu **yok**.

Her özelliğin gerçek durumu (çalışıyor / eksik / uzman onayı gerekli): **[docs/audit/v3-status.md](docs/audit/v3-status.md)** · Araştırma ve kaynaklar: **[docs/research/](docs/research/)**

## Bilinen sınırlar

- **Telaffuz gerçek cihazlarda henüz dinlenerek doğrulanmadı.** Konuşma, cihazın kendi seslendirme seslerini (Web Speech API) kullanır; kalite cihaza göre değişir. Doğrulama için Ayarlar → Ses kalite testi.
- İçerik **taslaktır**; DKT/odyolog gözden geçirmesi gerekir ([docs/content-sources.md](docs/content-sources.md)).
- Gürültü göreli; gerçek sinyal/gürültü oranı ölçülmez. Konuşma sesi stereo yönlendirilemez, oda/telefon akustiği taklit edilemez.
- Matris görevi klinik Matris Testi değildir; hedeflerdeki “uzmanın önerdiği” bilgisi kullanıcı beyanıdır. Duygu/tonlama ve müzik görevleri yoktur.

## Hızlı başlangıç

Kurulum ve GitHub Pages yayını: **[docs/setup.md](docs/setup.md)**
Kısaca: depoyu oluştur → **Settings → Pages → Source: GitHub Actions** (önce bu) → dosyaları yükle.

```bash
npm start            # http://localhost:8080 — derleme ve bağımlılık yok
npm test             # 72 birim testi (Node 22+)
npm run reading      # okuma kütüphanesini derle
npm run reading:import  # inbox'taki dış metinleri aktar
npm run reading:status  # eksik listesi ve hazır istemler
npm run validate     # içerik paketlerini doğrula
```

## Proje yapısı

```
index.html, manifest.webmanifest, sw.js   Uygulama kabuğu ve çevrimdışı önbellek
content/tr, content/en                     JSON içerik paketleri (kod değiştirmeden genişletilebilir)
js/engine/                                 Görevler, oturum oluşturucu, gösterim geçmişi, uyarlama, istatistik
js/content/                                Paket yükleyici, doğrulayıcı, şablon motoru, soru üretici
js/lang/                                   Türkçe/İngilizce dil kuralları (heceleme, sayı okunuşu, ekler)
js/tts.js, js/audio.js                     TTS adaptörü, tonlar, gürültü, ses efektleri
js/views/                                  Ekranlar
locales/                                   Arayüz metinleri (TR/EN)
tests/, tests/e2e/                         Birim ve uçtan uca testler
tools/                                     İçerik doğrulama, service worker dosya listesi
js/goals.js, js/guide/                      Hedef/not veri modeli; kılavuz metinleri (TR/EN)
docs/                                      Durum raporu, araştırma, içerik biçimi, mimari, gizlilik, erişilebilirlik, test
```

Lisans: MIT. Tüm özellikler ücretsizdir.
