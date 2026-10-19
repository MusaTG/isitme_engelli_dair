# Değişiklik günlüğü

## 4.1.0 — 2026-10-19

**Yapay zekâ ile okuma metni (yeni, isteğe bağlı)**
- Okuma → “Yapay zekâ ile oluştur”: konu, başlık ya da anahtar kelime + dil, kategori, alt kategori, uzunluk (kısa/orta/uzun), zorluk, okur, ek istekler → metin üretilir, önizlenir, düzenlenir, “Kaydet ve oku” ile Kendi metinlerim’e kaydedilir. Kısa kalan metin otomatik uzatılır; “Uzat”, “Yeniden oluştur”, kalite uyarıları (uzunluk, biçim, aynı başlık).
- Servisler: Google Gemini (ücretsiz katman), Groq, OpenRouter, Ollama (yerel), Anthropic, OpenAI, OpenAI uyumlu özel adres. Kullanıcının kendi anahtarı; yalnızca cihazda, uygulama verisinden ve yedeklerden ayrı saklanır. Bağlantı testi model listesini getirir. Ayarlar’da da “Yapay zekâ” bölümü.
- Kütüphane ile aynı kurallar: üretim istemi kategori yönergeleri ve kelime aralıklarını `js/reading/rules.js`’ten alır (dış istem dosyalarıyla ortak).

**Kendi metinlerin**
- Kaydetmede tarayıcıdan kalıcı depolama istenir (yer darlığında silinmesin); sayfada nerede saklandığı açıklanır.
- “Kütüphaneye öner”: GitHub ayarı varsa metin doğrudan deponun `content-src/reading/inbox/` klasörüne yazılır ve yayın iş akışı onu ortak kütüphaneye ekler; ayar yoksa inbox’a yüklenecek .txt indirilir.

**Görünüm**
- Yerel form denetimleri uygulama stiline uyarlandı (Windows’ta eski görünen tarih alanları, onay kutuları, seçenek düğmeleri, açılır listeler, kaydırıcılar, dosya düğmesi); koyu temada yerel takvim koyu açılır. Okuma alt menüsü geniş ekranda alta geçer, telefonda etkin sekme görünür alana kayar.
- Service worker önbellek adı artık içerik özetiyle otomatik değişir (aktarılan metinler kullanıcılara kendiliğinden ulaşır).

**Testler:** 72 birim testi (yapay zekâ istemi/ayrıştırma/uzatma/hata kodları, GitHub önerisi); okuma tarayıcı testi 24 kontrol (elle metin kaydı ve kalıcılık, taklit edilen servisle yapay zekâ üretimi ve kaydı, anahtarın yedeğe girmemesi).

## 4.0.0 — 2026-10-19

**Okuma Egzersizi (yeni ana menü öğesi)**
- Kütüphane, arama (başlık, tam metin, etiket, kategori; Türkçe harf katlama; vurgulu eşleşme, özet kartları, sayfalama), süzgeç ve sıralama, boş durumlar.
- Okuyucu: aşama/bölüm ilerlemesi, kelime ve kalan süre, içindekiler (masaüstünde yerleşik, telefonda çekmece), görünüm ayarları ve temalar, odak modu, ayraç/“burada kaldım”/vurgu/not, konumun kalıcı kaydı ve sürüm değişiminde taşınması, yeniden başlatma (geçmiş korunur).
- Geçmiş, favoriler, ayraçlar, okuma listeleri, süreli oturumlar (30/60/90/120 dk) ve mola uyarıları; kendi metinlerim (sürümlü), JSON paketi ve **.txt/.md blok dosyasından içe aktarma**.
- Sesli okuma düğmesi (cihazın seslendirmesi): telefonda kaydırırken gizlenir; Ayarlar → Erişilebilirlik’te açma/kapama ve otomatik gizleme anahtarları. Mikrofon/ses kaydı/konuşma tanıma yok (testle güvence altında).

**İçerik altyapısı**
- Kaynak biçimi → derleyici (`tools/build-reading.mjs`): kategori/alt kategori/tür denetimi, en az kelime, yarıda kesilme, aynı başlık/içerik, yakın kopya (5-gram Jaccard), dizi bölümleri; otomatik envanter.
- Dışarıdan aktarma (`tools/import-reading.mjs`): `content-src/reading/inbox/` → numaralama, denetim, rapor, reddedilenler ayrı klasörde. Yayın iş akışı aktarmayı kendisi yapar ve sonucu depoya geri yazar.
- Eksik listesi ve kopyala-yapıştır istemler (`tools/reading-status.mjs` → `docs/reading/EKSIKLER.md`, `docs/reading/istemler/`).
- Türkçe kütüphane: 552 özgün metin (6 kategori). Kalan 8 TR kategorisi ve İngilizce kütüphane dışarıda üretilip aktarılacak.

**Testler**
- `tests/reading.test.js` (15 test: ayrıştırma, arama, konum, listeler, süreli oturum, kalite denetimi, içe aktarma, kütüphane bütünlüğü, mikrofon API’si yokluğu); `tests/e2e/run_reading.py` (17 kontrol; telefon/tablet/masaüstü).

## 3.0.0 — 2026-10-19

Ayrıntılı durum: [docs/audit/v3-status.md](docs/audit/v3-status.md) · Araştırma: [docs/research/](docs/research/)

**Araştırma**
- Türkiye, Avustralya, Danimarka, ABD, Almanya, Birleşik Krallık, Hollanda ve Kanada kaynaklı literatür taraması, kaynak kaydı, egzersiz–kanıt matrisi, boşluk analizi ve yol haritası (`docs/research/`). Yalnızca açılıp okunan kaynaklar kaydedildi.

**Hedefler ve notlar (DKT)**
- Yeni hedef modeli (kişisel / uzmanın önerdiği, durum, öncelik, tarihler, uzman notu, bağlı egzersizler, haftalık plan, zorluk ayarı); v2 hedef ve notları kayıpsız taşınır.
- Hedef ilerlemesi ve geçmişi, hedefe özel oturum (`goalId`), ana sayfada “Bugünün planı”, serbest çalışma ayarını hedefe kaydetme.
- Yapılandırılmış seans notları, arama ve süzgeçler, otomatik taslak ve kayıt durumu, silme/tamamlama/arşivde geri al.

**Kılavuz**
- 24 konulu uygulama içi kullanım kılavuzu (TR/EN): arama, kategoriler, adım adım yönergeler, tuş şeması, SSS; Ayarlar’da bölüm; ekranlardan bağlamsal yardım.

**Egzersizler (47 → 51 görev)**
- Matris cümleleri (özgün 5×10 kelime, kelime bazında puan), VCV/CVC logatomlar (ünsüz ve ünlü), ortadaki ses farkı; yeni “Anlamsız heceler” yolu.
- 7 yeni senaryo × 2 dil × 2 varyant (iş görüşmesi, iş yerinde telefon, toplantıda soru-cevap, kısa sunum, arkadaş grubu, sesli mesaj, aile sofrası).
- Paragraf/diyalogda soru sayısı ayrı seçilebilir; adlandırılmış seviyeler; beceri hiyerarşisi etiketleri; katalog araması ve süzgeci.

**Dinleme güvenliği**
- Egzersiz içinde gürültüyü azalt/kapat, uygulama ses düzeyi, mola hatırlatıcısı, isteğe bağlı konuşmacı çeşitliliği.

**Arayüz**
- Ortalanmış ve sayfa türüne göre sınırlı genişlik, tablet ara düzeni, yeni navigasyon (masaüstü 7 öğe, telefon 5 öğe + Yardım).

**Düzeltmeler**
- Hedef formu hata bağlantısı rotayı değiştiriyordu; kaydedilen/silinen not taslağı geri geliyordu; “Tümü” sekmesi arşivi göstermiyordu.

**Test**
- 52 birim testi; uçtan uca 38/38 (v2 regresyon) + 55/55 (v3: hedef, not, kılavuz, matris, gürültü, yedek, tablet/masaüstü, çevrimdışı).

## 2.0.0 — 2026-10-18

Ayrıntılı durum: [docs/audit/v2-status.md](docs/audit/v2-status.md)

**Cevap sistemi**
- 2, 3, 4, 5, 6, 8, 10 seçenek; yazılı cevap; kart sıralama; rakam tuş takımı; “ses başladığında/bittiğinde bas”.
- 1–9 ve 0 tuşları (10. seçenek); rakam görevlerinde tuş = rakam; ok tuşlarıyla gezinme.
- Rahat pratik ve değerlendirme modu ayrı; pratikte isteğe bağlı ikinci deneme; dinleme hakkı ve cevap süresi ayarlanabilir.

**Egzersizler (7 → 47 görev)**
- Ses farkındalığı (12), hece/fonem (11), minimal çiftler (4), kelime (7), cümle (7), paragraf (1), hafıza (3), günlük yaşam ve konuşmacılar (2).
- 15 isteğe bağlı eğitim yolu, kişisel görev listesi, DKT hedeflerinin görevlere bağlanması.

**İçerik**
- JSON içerik paketleri (kod değiştirmeden genişletilebilir), otomatik doğrulayıcı, lisanslı ek paket içe aktarma.
- TR/EN: ~600 kelime / 30 kategori, IPA’lı minimal çift aileleri, hece kümeleri, 24 cümle şablonu, 16 paragraf, 26 senaryo (52 varyant).

**Ezber önleme**
- Görülme geçmişi ve aralıklı tekrar, alıştırma/değerlendirme havuzu ayrımı, cevap konumu dengeleme, art arda tekrar önleme, görülen içerik oranı ayarı.

**Ses**
- Ses kalite testi ekranı; doğrulanmamış telaffuz değerlendirmeye girmez, “hatalı” işaretli içerik hiç kullanılmaz.
- Boş TTS çıktısı algılama; cümle bazlı okuma (uzun metin kesilmesi); kullanıcı onaylı farklı konuşmacılar; stereo kalibrasyonlu yön görevi; sentezlenmiş kapı zili/telefon/anons sesleri.

**Kullanım**
- Yeni ana sayfa (hızlı başla 5/10/15 dk, beceriler, günlük yaşam, plan, serbest çalışma); basit/gelişmiş mod; yarım kalan oturumu sürdürme; arka plana geçişte durma.
- İlerleme: ilk denemede doğru, tekrar dinleme, zayıf alanlar (ses karşıtlığı/kategori/soru türü), görev bazlı tablo, rahatlık değerlendirmesi.

**Düzeltmeler**
- “Sonraki” düğmesi cevaptan önce görünüyordu (v1’den beri).
- Yayın iş akışına `content/` klasörü ve içerik doğrulama adımı eklendi.

**Test**
- 33 birim testi, içerik doğrulama, 38 kontrollü uçtan uca tarayıcı testi (`tests/e2e/run.py`).

## 1.0.0 — 2026-10-17
- İlk sürüm: derlemesiz PWA, 7 egzersiz türü, TR/EN, çocuk/yetişkin profilleri, Web Speech TTS adaptörü, 4 tema, isteğe bağlı DKT notları, GitHub Pages iş akışı.
