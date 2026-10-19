# Duyum v3.0 — durum raporu

**Tarih:** 2026-10-19 · **Önceki sürüm:** [v2-status.md](v2-status.md) · **Araştırma:** [docs/research/](../research/)

Durum işaretleri: ✅ çalışıyor ve otomatik testle doğrulandı · 🟡 çalışıyor, sınırlı / kısmen doğrulandı · ❌ yapılmadı · 🔬 uzman veya gerçek cihaz doğrulaması gerekli.

## 0. Talimattaki paylaşım bağlantısı

`https://claude.ai/share/add5f651-…` bağlantısı açılmaya çalışıldı; yalnızca sayfa üst verisi (başlık/açıklama) döndü, **konuşmanın içeriği görülemedi**. Bu nedenle o bağlantıdaki hiçbir bilgi kullanılmadı; çalışma yalnızca talimat metnine ve mevcut koda dayanır.

## 1. Korunan mevcut özellikler (v2)

v2’deki 47 görev, 7 cevap tipi, ezber önleme, uyarlama, ses kalite testi, yarım oturumu sürdürme, profiller, temalar, yedekleme ve çevrimdışı çalışma korunmuştur. v2 uçtan uca testinin tamamı (38/38) v3 kodunda yeniden çalıştırıldı ve geçti. v2 verileri (DKT hedefleri ve notları) **kayıpsız** taşınır; eski alanlar silinmez.

## 2. v3’te eklenenler

| # | Özellik | Durum | Not |
|---|---|---|---|
| 1 | Hedef modeli: ad, açıklama, kaynak (kişisel / uzmanın önerdiği), beceri alanı, alan, dil, başlangıç ve bitiş tarihi, öncelik, uzman notu, kendi notu, bağlı egzersizler, hedef oturum sayısı, durum (etkin / duraklatıldı / tamamlandı / arşiv), haftalık plan (gün + dakika), zorluk ayarı | ✅ | `js/goals.js`, `js/views/goals.js` |
| 2 | Hedef hızlı işlemleri: Çalışmaya başla · Not ekle · Düzenle · Tamamlandı olarak işaretle (geri alınabilir) · Duraklat · Arşivle · Sil (onay + geri al) | ✅ | |
| 3 | Hedef ilerlemesi: oturum sayısı, doğruluk, dakika, bu haftaki dakika / plan, son çalışma, gecikme uyarısı, ilerleme geçmişi (hedeften başlatılan ve ilgili oturumlar ayrı gösterilir) | ✅ | Oturum kaydına `goalId` eklendi |
| 4 | Hedef listesi: Süren / Tamamlanan / Arşiv / Tümü sekmeleri, kaynak süzgeci, öncelik ve tarihe göre sıralama | ✅ | |
| 5 | Ana sayfada “Bugünün planı” (o gün çalışma günü seçilmiş etkin hedefler) | ✅ | |
| 6 | Serbest çalışmadaki ayarı bir hedefe kaydetme | ✅ | |
| 7 | Seans notları: tarih, tür, bağlı hedefler, önerilenler, deneyim, zorlanılanlar, sonraki adım, ek not | ✅ | |
| 8 | Not araması ve süzgeçleri: metin, tür, hedef, tarih aralığı | ✅ | |
| 9 | Yeni not taslağının otomatik kaydı ve durum göstergesi (“Taslak kaydedildi 14:05”); sayfa kapanıp açılınca taslağa devam; düzenlemede “Kaydedilmemiş değişiklikler var” ve sayfadan çıkarken uyarı | ✅ | Bu turda bulunan iki taslak hatası düzeltildi (bkz. §5) |
| 10 | Not silmede onay ve geri al | ✅ | |
| 11 | DKT güvenli sınırları: DKT bölümü kapatılabilir; kapalıyken uzman kaynaklı hedef ve notlar gizlenir (silinmez); veriler yalnızca cihazda; rapor yalnızca açık onayla indirilir; “reçete / tanı / klinik doğrulama değildir” uyarısı | ✅ | Gerçek uzman hesabı yok (bilinçli) |
| 12 | Uygulama içi **Kullanım kılavuzu ve yardım**: 24 konu (TR + EN), arama, 6 kategori, adım adım yönergeler, tuş şeması, SSS, ilgili konular, önceki/sonraki | ✅ | Ayarlar’ın en üstünde bölüm; masaüstü yan menüde; telefonda üst çubukta “Yardım” |
| 13 | Ekranlardan ilgili kılavuz konusuna bağlantı (katalog, günlük yaşam, serbest çalışma, plan, hedefler, notlar, ilerleme, ayarlar) | ✅ | Test, tüm bağlantıların var olan konulara gittiğini denetler |
| 14 | Adlandırılmış seviyeler: Başlangıç · Temel · Orta · Orta-ileri · İleri; ayrıca “Kişisel hedef ayarı” ve “Serbest çalışma” | ✅ | “Uzman seviyesi” adı **kullanılmadı**; seviye adlarının klinik düzey olmadığı arayüzde yazılı |
| 15 | Beceri hiyerarşisi etiketi (Farkındalık / Ayırt etme / Tanıma / Anlama) her görevde; katalogda süzgeç ve arama | ✅ | Erber (1982) çerçevesi; sıralı ilerleme zorunlu değildir |
| 16 | **Matris cümleleri** görevi: özgün 5 sütun × 10 kelime (TR: ad–sayı–sıfat–nesne–fiil; EN: ad–fiil–sayı–sıfat–nesne), kapalı cevap ızgarası, kelime bazında puan; düşük seviyelerde bazı sütunlar sabit | ✅ | Klinik Matris Testi **değildir**; lisanslı test kelimeleri kullanılmadı |
| 17 | **Logatom** görevleri: VCV ünsüz (aba–apa…) ve CVC ünlü (TR mam–mem…, EN heed–hid…) | ✅ / 🔬 | Telaffuz doğrulaması zorunlu (`qa: required`); değerlendirme modunda yalnızca doğrulanmış kümeler |
| 18 | **Ortadaki ses** görevi: yalnızca iç seste farklı minimal çiftler (kış–kuş, kutu–kuzu, ship–sheep…) | ✅ / 🔬 | Mevcut IPA’lı ailelerden otomatik seçilir (TR 37, EN 27 iç ses çifti) |
| 19 | 7 yeni günlük yaşam senaryosu × 2 dil × 2 ifade biçimi: aile sofrası, sesli mesajdan not alma, iş yerinde telefon, iş görüşmesi, toplantıda soru-cevap, kısa sunum, arkadaş grubunda sohbet | ✅ | Senaryo sayısı 26 → 33 (dil başına) |
| 20 | Paragraf ve diyalogda metin başına soru sayısı seviyeden bağımsız seçilebilir (1–6) | ✅ | Serbest çalışma |
| 21 | Egzersiz sırasında **Gürültüyü azalt** / **Gürültüyü kapat**; seçim oturumun geri kalanında geçerli | ✅ | |
| 22 | **Uygulama ses düzeyi** (Ayarlar → Görünüm ve dil): konuşma, ton, gürültü ve efektleri birlikte ayarlar; varsayılan %70 | ✅ / 🟡 | Seslendirme düzeyi `utterance.volume` ile verilir; bazı tarayıcılar bu değeri yok sayabilir |
| 23 | **Mola hatırlatıcısı** (kapalı / 5–30 dk; varsayılan 10) | ✅ | Öğeler arasında önerilir, zorunlu değildir |
| 24 | **Konuşmacı çeşitliliği** (kullanıcının “gerçekten farklı” onayladığı en az iki ses varsa öğeden öğeye ses değişir) | 🟡 | Sahte seslerle test edildi; gerçek seslerin farklılığı cihaza bağlı 🔬 |
| 25 | Yerleşim: içerik ortalanır; sayfa türüne göre en fazla genişlik (liste/pano 1040 px, kılavuz 900 px, egzersiz 760 px); tablet ara düzeni; masaüstü yan menü 7 öğe, telefon alt çubuk 5 öğe | ✅ | 390 / 820 / 1366 px’te yatay taşma yok (otomatik) |
| 26 | Hedef formunda alan düzeyinde hata, hata özeti (bağlantı alana odaklanır), zorunlu alan işareti | ✅ | |

## 3. Gerçek içerik sayıları (yalnızca eklenenler)

`npm run validate` çıktısından; tamamı bu geliştirmede elle yazıldı, otomatik doğrulayıcıdan geçti.

| İçerik | TR | EN | Nasıl üretildi |
|---|---|---|---|
| Logatom kümesi (v3’te yeni) | 9 küme, 28 farklı logatom | 8 küme, 23 farklı logatom | Elle yazıldı; ünsüz/ünlü karşıtlığına göre gruplandı; her öğede okunuş + IPA |
| Matris kelimesi (v3’te yeni) | 50 (5 × 10) | 50 (5 × 10) | Özgün kelimeler; her kombinasyon dilbilgisel (sayı + tekil isim TR; sayı + çoğul isim EN) → dil başına 100.000 farklı cümle |
| Yeni senaryo | 7 (14 varyant) | 7 (14 varyant) | Şablon + değer havuzları; 3 yeni havuz (buluşma yeri, getirilecek eşya, şirket adı) |
| Senaryo toplamı | 33 (66 varyant) | 33 (66 varyant) | v2: 26 (52 varyant) |
| Kılavuz konusu | 24 | 24 | Elle yazıldı |
| Kelime, minimal çift, cümle şablonu, paragraf | **değişmedi** (606 / 38 aile / 24 / 16) | **değişmedi** (602 / 63 aile / 24 / 16) | — |

Hiçbir dilin “tüm kelimeleri” eklenmiş değildir. Minimal çiftler kontrolsüz üretilmez; ortadaki ses görevi yalnızca doğrulayıcının minimal olarak kabul ettiği mevcut ailelerden seçer.

## 4. Görev ve yol sayısı

Görev: 47 → **51** (logatom-ünsüz, logatom-ünlü, ortadaki ses, matris). Eğitim yolu: 15 → **16** (“Anlamsız heceler”). Kılavuz: 0 → 24 konu.

## 5. Bu turda bulunan ve düzeltilen hatalar

- Hedef formundaki hata özetinde bağlantıya tıklamak adres çubuğundaki rotayı değiştirip sayfayı kaybettiriyordu → bağlantı artık alana odaklanır.
- Yeni not kaydedildikten sonra ekrandan çıkınca not içeriği yeniden taslak olarak yazılıyordu → düzeltildi (e2e testi var).
- “Taslağı sil”den sonra ekrandan çıkınca taslak geri geliyordu → düzeltildi.
- Hedefler listesinde “Tümü” sekmesi arşivlenmiş hedefleri göstermiyordu → artık tümünü gösterir.
- Hedef ayrıntısında “Bu hafta” etiketi iki kez yazılıyordu; telefon alt çubuğunda uzun etiket iki satıra kayıyordu → kısa etiket.

## 6. Bilinçli olarak yapılmayanlar / eksikler

| Konu | Durum | Neden |
|---|---|---|
| Gerçek cihazlarda seslendirme kalitesi (özellikle logatomlar, minimal çiftler, matris kelimeleri) | ❌ 🔬 | Bu ortamda gerçek ses dinlenemez. Uygulamadaki Ses kalite testi ekranı bu iş için hazır |
| Duygu/tonlama ve müzik algısı görevleri | ❌ | Cihaz seslendirmesi duygu tonlamasını güvenilir üretemez; kayıtlı ses paketi gerekir |
| Gürültüye karışmış konuşmanın anlaşılabilirlik denetimi / gerçek SNR | ❌ | Seslendirme ve gürültü ayrı çalınır; ölçülemez |
| Kelimelere örnek cümle, anlam ve kaynak alanı | ❌ (ertelendi) | Biçimde isteğe bağlı `ex`, `src` alanları belgelendi; içerik yazılmadı |
| Gerçek uzman hesabı, uzaktan paylaşım | ❌ (bilinçli) | Sunucu yok; gizlilik ilkesi |
| Ekran okuyucu (VoiceOver/TalkBack/NVDA) ile gerçek cihaz testi | ❌ | Otomatik test yalnızca yapı ve odak sırasını denetler |
| İçeriğin DKT/odyolog gözden geçirmesi | ❌ 🔬 | Uzman işi |

## 7. Bilinen sınırlar

- Seviye adları uygulama içi zorluğu anlatır; klinik düzey veya yeterlilik değildir.
- Matris görevi klinik Matris Testi değildir; sonuçlar eşik veya SRT değildir.
- Hedeflerdeki “uzmanın önerdiği” bilgisi kullanıcının beyanıdır; uygulama doğrulamaz.
- Uygulama ses düzeyi cihaz ses düzeyiyle çarpılır; işitme cihazı/işlemci ayarlarını değiştirmez ve değiştiremez.
- Uygulama performansı gerçek yaşamdaki anlama düzeyiyle eşdeğer değildir; acil durum senaryoları bir alarm sistemi değildir.

## 8. Testler

Ayrıntı: [docs/testing.md](../testing.md). Özet: 52/52 birim testi, içerik doğrulama hatasız, uçtan uca 38/38 (v2 regresyon) + 55/55 (v3).
