# Test raporu (v3.0.0, 2026-10-19)

## Nasıl çalıştırılır

```bash
npm run validate     # içerik paketlerini doğrular (CI’da da çalışır)
npm test             # 52 birim testi (Node 22+, bağımlılık yok)
npm start            # http://localhost:8080
npm run e2e          # v2 regresyon tarayıcı testi (Python Playwright + Chromium gerekir)
npm run e2e:v3       # v3 tarayıcı testi: hedefler, notlar, kılavuz, matris, tablet, yedek, çevrimdışı
npm run e2e:reading  # v4 Okuma Egzersizi tarayıcı testi (telefon/tablet/masaüstü, mikrofon izni istenmediği)
```

## İçerik doğrulama — hatasız

TR: 606 kelime / 30 kategori, 38 minimal çift ailesi (112 çift), 30 hece kümesi (9’u logatom), 24 cümle şablonu, 18 soru–cevap, 16 paragraf, 33 senaryo (66 varyant), matris 50 kelime.
EN: 602 kelime / 30 kategori, 63 aile (116 çift), 22 hece kümesi (8’i logatom), 24 şablon, 18 soru–cevap, 16 paragraf, 33 senaryo (66 varyant), matris 50 kelime.

## Birim testleri — 52/52 geçti

v2’deki 33 test korunur (motor, ezber önleme, telaffuz güvenliği, uyarlama, cevap denetimi, içerik, dağıtım, TTS, yerelleştirme, depo). Görev testleri artık 51 görevi kapsar.

v3 testleri (`tests/v3.test.js`, 19 test):
- **Hedef modeli:** varsayılanlar ve geçersiz değer düzeltme; v2 uzman hedef/notlarının kayıpsız taşınması (eski alanlar korunur, ikinci geçiş çoğaltmaz); mağazanın v2 durumunu açması (ses düzeyi, mola, konuşmacı çeşitliliği varsayılanları).
- **Hedef istatistikleri:** doğrudan ve ilişkili oturumlar, başlangıçtan önceki oturumun sayılmaması, haftalık dakika/plan, gecikme, haftanın pazartesi başlaması.
- **Süzme:** durum, kaynak, DKT kapalıyken uzman hedeflerinin gizlenmesi, bugünün planı; notlarda tür/hedef/tarih/metin süzgeci, sıralama, boş not.
- **Kılavuz:** TR ve EN aynı 24 konu aynı sırada; her konuda içerik; ilgili bağlantılar geçerli; arama; ekranlardaki tüm yardım bağlantıları var olan konulara gider.
- **Hiyerarşi ve seviyeler:** her görevin etiketi var; seviye adları ve “uzman/klinik” çağrışımı olmaması.
- **Katalog araması:** metin ve hiyerarşi süzgeci, TR/EN.
- **Logatom:** yalnızca logatom kümeleri; klasik hece görevleri logatom kullanmaz; doğrulanmamış logatom değerlendirmeye girmez.
- **Ortadaki ses:** tüm seçenekler hedeften yalnızca iç seste ayrılır (IPA ile denetlenir).
- **Matris:** kalıba uygun cümle, her sütunda tek doğru, sabit sütun sayısı seviyeye uygun, 10 seçenek, cümle = cevap kelimeleri; kelime bazında puanlama.
- **Senaryolar:** 7 yeni senaryo iki dilde var ve doğrulayıcıdan geçer; iş senaryolarıyla oturum oluşur.
- **Soru sayısı:** paragraf ve diyalogda seviyeden bağımsız ayarlanır.
- **Yerelleştirme:** TR/EN anahtar eşliği ve değişken adlarının eşleşmesi.

## Uçtan uca tarayıcı testleri — 38/38 (v2) + 55/55 (v3), konsol hatası yok

Chromium (Playwright), **sahte Web Speech sesleri** (2 Türkçe, 2 İngilizce; ses üretmez).

**v2 regresyon (`tests/e2e/run.py`)** — v3 koduyla yeniden çalıştırıldı: ilk kurulum, hızlı başla, 10 seçenek ve 1–9/0 tuşları, 5 seçenekte fazla tuşların etkisizliği, rakam görevi, yazma/sıralama/tuş takımı, paragraf modları, diyalog sesi, doğrulama kuralları, konuşmacı görevi, kaldığı yerden devam, arka plana geçiş, dil ayrımı, stereo, basma görevi, uyarlama, çocuk profili, İngilizce arayüz, temalar.

**v3 (`tests/e2e/run_v3.py`)** — 390 px telefon, 820 px tablet, 1366 px masaüstü:
- Kılavuz Ayarlar’dan açılır; 24 konu; arama (odak kutuda kalır); kategori süzgeci; tuş şeması; katalogdaki bağlamsal yardım doğru konuyu açar.
- Katalog araması; hiyerarşi süzgeci; seviye adları.
- Hedef: boş ad reddedilir, hata bağlantısı alana odaklanır ve rota değişmez; kaynak, uzman notu, çalışma günü, görev arama ile egzersiz bağlama, zorluk ayarı kaydedilir; düzenleme.
- Ana sayfadaki “Bugünün planı”ndan hedef oturumu: yalnızca bağlı görevler, hedefin seviyesi uygulanır, oturum `goalId` ile kaydedilir, hedef geçmişinde görünür.
- Tamamlandı → geri al; arşivleme ve arşiv sekmesi; yeniden etkinleştirme.
- Not: taslak otomatik kaydı ve durum metni; sayfa yeniden açılınca taslağa devam; kayıttan sonra taslağın geri gelmemesi; arama ve tür süzgeci; düzenlemede “kaydedilmemiş” göstergesi; silme onayı + geri al.
- Sayfa yeniden açılınca hedef ve notlar korunur.
- Matris: 5 sütun × 10 seçenek; bir yanlış sütunda “5 kelimeden 4 doğru”; oturum tamamlanır. Logatom (ünsüz, ünlü) ve ortadaki ses oturumları tamamlanır.
- Uygulama ses düzeyi kaydedilir; egzersizde gürültü azaltılır ve kapatılır, sonraki öğede de kapalı kalır.
- Yedek: dışa aktarılan dosya hedef ve notları içerir; silinen hedef içe aktarmayla geri gelir.
- Tablet ve masaüstünde hedefler, hedef ayrıntısı, kılavuz ve notlar ekranları; yatay taşma yok; masaüstünde içerik ortalı ve en fazla 1040 px; telefonda alt çubuk 5 öğe ve üstte “Yardım”.
- İngilizce arayüzde hedef ekranı ve kılavuz araması.
- **Çevrimdışı:** service worker açık yeni bir bağlamda uygulama yüklenir, ağ kesilir, sayfa yeniden açılır ve çalışır; `content/tr/matrix.json` önbellekten gelir.

**v4 Okuma (`tests/e2e/run_reading.py`)** — ana sayfa, katlanmış arama ve vurgu, sesli okuma düğmesinin kaydırırken gizlenip geri gelmesi, konum kaydı ve yeniden açınca kalınan aşamaya dönüş, ayraç, iki yana hizalama, ayarlardan düğmeyi kapatma, masaüstünde içindekiler etkin bölümü, tablette uzun-roman süzgeci, boş kategori, okuma listesi, .txt dosyasından içe aktarma, `getUserMedia`/mikrofon izni çağrısı olmaması, konsol hatası olmaması. Birim: `tests/reading.test.js` (15 test; “her kategoride 100 metin” şartı kütüphane tamamlanana kadar TODO olarak raporlanır).

Ekran görüntüleri testin verdiği klasöre yazılır (`e2e-shots/`, `e2e-shots-v3/`).

## Yapılmadı — doğrulanmış sayılmamalı

- **Gerçek ses kalitesi:** Türkçe ve İngilizce seslerin gerçek Android/iOS/Windows/macOS cihazlarda dinlenmesi; özellikle minimal çiftler, **logatomlar** (aba/apa, mam/mem, heed/hid), heceler, harfler ve **matris kelimeleri**. Uygulamadaki **Ses kalite testi** ekranı bu iş için hazır.
- Uygulama ses düzeyinin (`utterance.volume`) her tarayıcıda uygulandığı.
- Gerçek telefon/tablet, VoiceOver/TalkBack/NVDA ile ekran okuyucu testi.
- Ses gecikmesi ve CPU/bellek ölçümü.
- Gerçek cihazda uçak modunda seslendirmenin çevrimdışı çalışması (uygulama kabuğu ve içerik çevrimdışı test edildi).

### Önerilen manuel telaffuz test seti

Türkçe: “çiçek, ağaç, ışık, iğne, gözlük, şemsiye, üzüm” · minimal aileler (bal/dal/şal, kol/yol, saç/taç, gül/kül/göl, kış/kuş, kutu/kuzu) · heceler (pa/ba, sa/şa, ça/ca) · logatomlar (aba/apa, ada/ata, aça/aca, mam/mem/mım/mim/mom/möm/mum/müm) · “Saat on dört otuzda gelecek.” · bir matris cümlesi (“Ayşe üç büyük kalem aldı.”).
İngilizce: ship/sheep, pin/bin, thin/tin, light/right, bus/buzz · logatomlar (ahbah/ahpah, heed/hid/head/had/hud/hod/hood/who’d) · harf adları (B/D/E/G/P/T/V/Z) · “record” vurgusu · bir matris cümlesi (“Anna bought two big pens.”).
