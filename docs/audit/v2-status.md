# v2.0 durum raporu ve kapsam matrisi

**Tarih:** 2026-10-18 · **Sürüm:** 2.0.0 · **Önceki denetim:** [v1-audit.md](v1-audit.md)

Durum etiketleri:

| Etiket | Anlamı |
|---|---|
| ✅ | Mevcut ve çalışıyor (otomatik testle veya tarayıcıda doğrulandı) |
| ⚠️ | Mevcut ama eksik, sınırlı ya da yalnızca kısmen doğrulandı |
| ❌ | Henüz geliştirilmedi |
| 🔬 | Teknik uygulanabilirlik araştırılmalı |
| 🩺 | Uzman değerlendirmesi veya klinik doğrulama gerekiyor |

Birden fazla etiket birlikte kullanılabilir (ör. ✅🩺 = çalışıyor ama içerik uzman onayı bekliyor).

> **Genel uyarı (🩺 tümü için):** Bütün egzersiz içerikleri taslaktır ve bir odyolog/DKT tarafından gözden geçirilmemiştir. Gerçek cihazlarda **telaffuz dinleme testi yapılmamıştır**; tarayıcı testleri sahte (sessiz) seslerle yapıldı. Bu yüzden konuşma içeren hiçbir görevin “ses kalitesi doğrulandı” durumu yoktur.

---

## 1. Ölçek

| | v1.0 | v2.0 (TR / EN) |
|---|---|---|
| Görev türü | 7 | **47** (7 cevap tipi) |
| Kelime | 66 / 61 | **606 / 602**, 30 kategori |
| Minimal çift ailesi | ~11 | **38 / 63** (112 / 116 çift), IPA ile |
| Hece kümesi | – | **21 / 14** |
| Cümle şablonu | 16 sabit cümle | **24 / 24** şablon, 63 değer havuzu |
| Soru–cevap çifti | – | **18 / 18** |
| Paragraf şablonu | – | **16 / 16** (2–7 cümle, 6 çocuk, 9 yetişkin) |
| Senaryo | 10 cümle | **26 / 26** senaryo, **52 / 52** varyant |
| Otomatik test | 23 birim | **33 birim + 38 uçtan uca kontrol** |

İçerik kod içinde değil, `content/<dil>/*.json` paketlerinde; her açılışta doğrulanır, hatalı kayıt kullanılmaz.

---

## 2. Cevap sistemi ve test ekranı

| Gereksinim | Durum | Not |
|---|---|---|
| 2, 3, 4, 5, 6, 8, 10 seçenek | ✅ | Her görev izin verdiği sayıları tanımlar; seçilen sayı sabit tutulur. 10 seçenek uçtan uca testle doğrulandı |
| Serbest/yazılı cevap | ✅ | Kelime yazma (Türkçe karakter hoşgörüsü yalnızca kolay seviyelerde, ayrıca bildirilir) |
| 0–9 rakam tuşları | ✅ | Rakam görevlerinde tuş = rakam; diğerlerinde 1–9 ve 0 = 10. konum. 5 seçenekte 6–9/0 etkisiz (testli) |
| Dokunmatik, fare, klavye | ✅ | Ok tuşlarıyla seçenekler arası gezinme, Boşluk = dinle, Enter = sonraki, Geri tuşu = geri al |
| Alternatif giriş | ⚠️ | Tüm kontroller klavye + ekran okuyucu ile erişilebilir; ses/anahtar kontrolü (switch access) cihazda test edilmedi |
| Soru sayısı, seçenek, tekrar, süre, zorluk ayrı ayrı ayarlanabilir | ✅ | Serbest çalışma ekranı ve Ayarlar → gelişmiş |
| Tekrar dinlemeyi kapatma, varsayılan sınırsız | ✅ | Varsayılan sınırsız; değerlendirme modunda varsayılan 2 dinleme (değiştirilebilir) |
| Test modu ↔ rahat pratik ayrımı | ✅ | Değerlendirme: ayrı içerik havuzu, sonuçlar sonda, doğrulanmış telaffuz zorunlu, ikinci deneme yok |
| Pratikte ikinci deneme | ✅ | Ayarlanabilir; doğruluk ve “ilk denemede doğru” ayrı raporlanır |

### Dinleme test türleri (bölüm 2’deki 20 madde)

| # | Tür | Durum | Görev |
|---|---|---|---|
| 1 | Kelimeyi seçeneklerden bulma | ✅🩺 | `word-pick` (2–10, rastgele → kategori → sesçe benzer çeldirici) |
| 2 | Rakam | ✅🩺 | `digit-pick` (10 seçenek, tuş = rakam) |
| 3 | Harf | ✅🔬 | `letter-pick` — motorlar tek harfi farklı okuyabilir; değerlendirmede doğrulama zorunlu |
| 4 | Hece | ✅🔬🩺 | `syl-pick`, `syl-same`, `syl-seq` — anlamsız heceler ayrı etiketli; doğrulama zorunlu |
| 5 | Resim | ✅ | `picture-pick` (yazı cevaptan sonra görünür) |
| 6 | Kelimeyi yazma | ✅ | `word-type` |
| 7 | Heceleme | ✅ TR / ❌ EN | `syl-order` (hece kartlarını sıralama). İngilizce için güvenilir heceleme verisi yok |
| 8 | Aynı/farklı | ✅ | `pair-same`, `syl-same` |
| 9 | Benzer iki kelime | ✅🩺 | `pair-pick`, `pair-noise` |
| 10 | Kelimeyi cümle içinde | ✅ | `word-in-sentence` (taşıyıcı cümleler) |
| 11 | Cümleyi seçeneklerden bulma | ✅ | `sent-pick` (bir/iki ayrıntısı farklı çeldiriciler, 2–10) |
| 12 | Cümle/paragraf soruları | ✅🩺 | `sent-question`, `paragraph` (17 soru türü) |
| 13 | Birden fazla talimatı sırayla uygulama | ✅ | `instructions` (renkli şekiller, 1–3 adım) |
| 14 | Konuşmacının ne istediği | ✅ | `dialogue` (amaç/strateji soruları) |
| 15 | Konuşmacı ayırt etme | ✅🔬 | `speaker-id` — yalnızca kullanıcı en az iki sesin farklı duyulduğunu onaylarsa açılır |
| 16 | Sayı, tarih, saat, adres, miktar, telefon | ✅🩺 | `info` — metin sözcüklerle üretilir (TTS’nin rakam okumasına bırakılmaz) |
| 17 | Gürültüde konuşma | ⚠️ | Kelime, minimal çift, cümle; gürültü **göreli**, SNR ölçülemez |
| 18 | Farklı hız ve konuşmacı | ⚠️🔬 | Hız seviyeyle %90–110 (isteğe bağlı); konuşmacı sayısı cihazdaki seslere bağlı |
| 19 | Ses yönü | ⚠️ | Yalnızca **tonlarla** ve stereo kalibrasyonu geçilirse. Konuşma sesi yönlendirilemez (OS TTS Web Audio’ya alınamıyor) |
| 20 | Öğrenilmiş/yeni kelime | ✅ | `word-seen` + değerlendirme havuzunda yeni örneklerle aktarım |

---

## 3. Egzersiz kataloğu

### A. Temel ses farkındalığı — ✅ (12 görev, Web Audio, dil bağımsız)

Var/yok, başlangıç (basma), bitiş (basma), aynı/farklı, kısa/uzun, ince/kalın, şiddet değişimi, sayma (10’a kadar), ritim örüntüsü, farklı olanı bulma, hedef sesi bulma, yön.
Her ekranda “işitme eşiği ölçümü veya tanı testi değildir; cihaz ayarları sonucu etkiler” notu var. ⚠️ Başlangıç/bitiş görevlerinde cihaz ses gecikmesi kalibre edilmez (tolerans geniş tutuldu).

### B. Hece ve fonem — ✅⚠️🩺

| Gereksinim | Durum |
|---|---|
| Ayrı TR/EN ses envanteri | ✅ TR 21 küme (ötümlülük, boğumlanma yeri/biçimi, ıslıklı, akıcı, ünlüler, hece sonu); EN 14 küme (EN’ye özgü: /θ/, /w–j/, ünlü uzunluğu ayrı ailelerde) |
| Anlamsız heceler ayrı | ✅ `nonword` etiketiyle raporlanır |
| Aynı sesle başlayan/biten | ✅ Seçenekler yalnızca sesli (yazı gizli) |
| Sesin konumu | ✅ |
| Hece sayısı | ✅ TR otomatik hesaplanır ve doğrulanır; EN veri alanından |
| İlk/son/orta sesi farklı olan | ⚠️ İlk/son ses eşleştirme var; “orta ses farklı olan” ayrı görev olarak yok (minimal çift ailelerinde orta ses karşıtlıkları var: kutu/kuzu, deve/dere, kapak/kayak) |
| Vurgu | ⚠️🔬 Yalnızca İngilizce, doğrulama zorunlu; Türkçe vurgu görevi bilinçli olarak eklenmedi (TTS ile güvenilir değil) |
| Benzer hece dizileri | ✅ `syl-seq` |

### C. Minimal çiftler — ✅🩺

- Her ailede: kelimeler, **IPA**, karşıtlık notu, seviye, yaş uygunluğu, isteğe bağlı taşıyıcı cümle. Karşıtlık konumu ve özelliği IPA’dan otomatik çıkarılır.
- `minimal: true` olan ailelerde her kelime çiftinin **tek sesbirim** farklı olduğu doğrulayıcı tarafından IPA üzerinden kontrol edilir; tutmayan aile kullanılmaz (testli).
- Önerilen örnekler doğrulandı: bal–dal, taş–yaş, kol–yol, saç–taç, kedi–dedi, masa–kasa, kal–kar, gül–kül hepsi tek ünsüz farkı. Türkçede sözcük sonu ötümsüzleşmesi nedeniyle **ad/at, kod/kot** gibi çiftler eklenmedi (aynı okunurlar).
- **Telaffuz doğrulama durumu ses başına tutulur** (Ses kalite testi ekranı). “Hatalı” işaretli aile hiçbir modda kullanılmaz; değerlendirmede yalnızca “Doğru” işaretli aileler kullanılır (uçtan uca testli).
- ❌ Ayrı “hece sayısı farklı” ve “benzer ritim/vurgu” aileleri yok; ⚠️ “benzer cümleler” `pair-sentence` ile var.

### D. Kelime dağarcığı — ✅🩺

30 kategorinin tamamı (aile, vücut, ev, mutfak, yiyecek, hayvanlar, doğa, tarım/bitkiler, renk/şekil, giysi, okul, meslekler, ofis/toplantı, teknoloji, ulaşım, şehir/yön, market, restoran, sağlık, sayılar, saat/takvim, hava, duygular/sosyal ifadeler, fiiller, sıfat/zıt anlam, soru kelimeleri, zamir/edat/bağlaç, günlük ifadeler, telefon/görüntülü görüşme, acil durum ifadeleri). Her kelimede kategori, seviye (sıklık/tanıdıklık), yaş etiketi, hece sayısı, varsa resim (emoji), varsa taşıyıcı cümle.
⚠️ Kelime başına ayrı “anlam” ve “örnek cümle” alanı yok; örnek cümleler kategori taşıyıcı cümlelerinden üretiliyor.

### E. Cümle anlama — ✅🩺

12 yapı: kısa (2–3 kelime), miktar, yer/yön, emir/yönerge, geçmiş, şimdiki/geniş, gelecek, saat/zaman, kişi–nesne ilişkisi, olumlu–olumsuz, yan cümleli, iş ortamı. Görevler: cümleyi bulma (4–10 anlamlı çeldirici), soru yanıtlama, değişen kelimeyi bulma, evet/hayır, uygun cevap. Türkçe ekler veride açıkça yazılır veya kurallı durumlarda (bulunma eki, özel isim kesme işareti) kodla üretilir.
⚠️ “İngilizce başlangıç seviyesi” ayrı bir seviye etiketi olarak yok; İngilizce paketin 1. seviyesi bu amaçla kullanılabilir.

### F. Paragraf ve uzun dinleme — ✅🩺

16 şablon/dil, 2–7 cümle, çocuk hikâyeleri, duyuru, bilgilendirme, olay anlatımı. Her cümlenin 1–2 alternatif ifadesi + değer havuzları → her açılışta farklı kişi, yer, zaman, sayı. 17 soru türü (kim, ne, nerede, ne zaman, neden, nasıl, kaç, sıralama, ana fikir, ayrıntı, söylenmeyen bilgi, çıkarım, amaç, ilişki, duygu, konuşmacı, iletişim stratejisi).
Metin modları: önce oku · birlikte dinle (cümle vurgulamalı) · yalnızca ses · dinledikten sonra gör ✅.
Uzun metin yarıda kesilirse kaldığı cümleden devam eder; metin cümle cümle okunduğu için Chrome’un uzun metin kesme hatasından etkilenmez ✅.
⚠️ 8 cümleden uzun hikâye ve çok paragraflı sunum yok.

### G. İşitsel hafıza — ✅

Kelimeleri sırayla seçme (2–5, çeldirici kartlarla), rakam dizisi (3–7, tuş takımı), listede olmayanı bulma, yönerge dizisi, diyalog ayrıntılarını hatırlama. Her görevde hedef beceri ayrı raporlanır; sonuçlar klinik hafıza testi olarak sunulmaz.
⚠️ “Önceki/sonraki olayları sıralama” paragraf sıralama sorusu olarak var; ayrı görev değil.

### H. Günlük yaşam simülasyonları — ✅⚠️🩺

26 senaryo × 2 varyant/dil: ev (5), sosyal (8), ulaşım (2), telefon/görüntülü (2), eğitim/iş (4), sağlık (3), kamu (2). Kapı zili, telefon zili, anons sesi, alarm Web Audio ile sentezlenir (lisans gerektirmez).
⚠️ Yalnızca **içerik düzeyinde** simülasyon: “başka odadan seslenme”, “telefon hattı sesi”, “televizyon sesi”, “mutfak gürültüsü” akustik olarak taklit edilemez (OS TTS çıktısı filtrelenemez). Bu açıkça belirtilir.
Acil durum içeriklerinde “gerçek acil durumda uygulamanın sesine güvenmeyin” uyarısı ✅; sağlık senaryolarında “ilaç/tedavi önerisi değildir” uyarısı ✅.
❌ Toplantıda soru-cevap ve kısa sunum ayrı senaryo değil (paragraf şablonu olarak kısmen var).

---

## 4. Eğitim yolları — ✅

15 yolun tamamı (Kişisel plan). Hiçbiri zorunlu değil, “tıbbi rehabilitasyon protokolü değildir” notu var. Seçilen yollar Hızlı başla’yı besler. Uzman hedefleri isteğe bağlı DKT bölümünde, görevlere bağlanabilir ve ilerlemesi izlenir.
Profilde işitme sistemi, taraf, kişisel hedef ve **deneyim notu** alanları var; bunlardan cihaz başarısı veya klinik sonuç tahmini yapılmaz ✅.

## 5. Zorluk — ✅⚠️

Her görevin 5 seviyesi ve görev başına parametreleri var: seçenek sayısı, sesçe/anlamca benzerlik, kelime seviyesi, hece sayısı, cümle/paragraf uzunluğu, hafıza uzunluğu, gürültü, perde/şiddet/süre farkı, soru sayısı, adım sayısı, tekrar dinleme hakkı, süre, yazılı/görsel destek, hız (isteğe bağlı).
Uyarlama: en az 8 yeni cevap + son 10 cevabın başarısı + ortalama tekrar dinleme; oturum başına en fazla **bir** seviye; değerlendirme oturumları seviyeyi değiştirmez; rahat/dengeli/zorlayıcı eşikleri (testli).
⚠️ Kullanıcının oturum sonu “rahatlık” geri bildirimi kaydedilir ama uyarlamaya katılmaz (bilinçli; yorgunluğu cezalandırmamak için). 🔬 Hız parametresi, TTS kalitesi o hızda doğrulanmadan varsayılan olarak kapalıdır.

## 6. Ezber önleme — ✅

| Kontrol | Durum |
|---|---|
| Soru sırası, seçenek sırası değişir | ✅ |
| Aynı beceri farklı kelimelerle, aynı kelime farklı cümlelerle | ✅ |
| Paragraf/senaryo ayrıntıları değişir | ✅ Değer havuzları + ifade varyantları |
| Öğrenme / alıştırma / değerlendirme ayrımı | ✅ İçerik kimliğinin özetine göre ~%20 değerlendirme havuzu; alıştırmada kullanılmaz (testli). Öğrenme kartları ayrı görev |
| Aralıklı tekrar (Leitner) | ✅ Gösterim sayısı, doğru sayısı, son gösterim, kutu, sonraki tekrar — yerelde |
| Görülen içerik oranı ayarı | ✅ %0 / 25 / 50 / 75 |
| Art arda aynı soru yok, oturumda tekrar yok | ✅ testli |
| Doğru cevap konumu dengeli, aynı cevap 3’ten fazla art arda gelmez | ✅ testli |
| Tek doğru cevap, yinelenen seçenek yok | ✅ her üretilen öğe ve doğrulayıcıda |
| Benzersiz kimlik | ✅ içerik ve soru örneği başına |
| Hatalı telaffuzu dışlama | ✅ “Hatalı” işaretli içerik hiçbir modda yok |
| ⚠️ | Değerlendirme havuzu küçük kümelerde (ör. minimal çiftler) yetersiz kalabilir. Bu durumda alıştırma havuzundan soru alınır ve sonuç ekranında **açıkça uyarılır**; doğrulanmış telaffuz şartı ise hiç gevşetilmez — yeterli doğrulanmış içerik yoksa “istenen x sorudan y tanesi oluşturulabildi” uyarısı çıkar |

## 7. TTS — ⚠️🔬

| Gereksinim | Durum |
|---|---|
| Dil başına katı ses eşleştirme, başka dile düşmeme | ✅ testli |
| Sayı/tarih/saat sözcükle üretilir | ✅ TTS normalleştirmesine bırakılmaz |
| Boş/çok kısa çıktı algılama | ✅ 60 ms altı “boş çıktı” hatası |
| Ses kalite testi ekranı (beklenen metin, IPA, dinle, doğru/hatalı/emin değilim, otomatik boş çıktı kontrolü) | ✅ minimal çiftler, heceler, harfler, rakamlar, sayı/saat/tarih, vurgu, konuşmacılar |
| Farklı konuşmacılar | ✅ yalnızca kullanıcı onaylı sesler |
| Uzun metin kesilmesi | ✅ cümle bazlı okuma |
| Arka plana geçince | ✅ ses ve süre durur, mola penceresi açılır (testli) |
| **Gerçek cihazda telaffuz doğrulaması** | ❌🩺 Yapılmadı |
| Piper/WASM gibi tutarlı ikinci motor | ❌🔬 Adaptör hazır, motor eklenmedi |

## 8. Çocuk / yetişkin — ✅⚠️

Aynı motor; içerik `aud` etiketiyle ayrılır (çocuğa yetişkin içeriği gelmez, testli). Çocuk: kısa oturum, büyük dokunma alanı, sıcak renk, resimli seçenekler, hikâyeler, utandırmayan sonuç mesajları. Yetişkin: iş/sağlık/kamu senaryoları, çıkarım soruları, uzun paragraflar.
⚠️ Kalıcı hikâye karakterleri (tekrar eden kahramanlar) ve rozet/ödül sistemi yok.

## 9. Dil ve içerik paketleri — ✅

Arayüz ve egzersiz dili bağımsız (testli). Paket: kelimeler, IPA’lı minimal çiftler, hece kümeleri, cümle şablonları, havuzlar, paragraflar, senaryolar, soru–cevap, lisans ve kaynak. **Kod değiştirmeden** JSON paketi eklenebilir (Ayarlar → İçerik paketi ekle); lisanssız paket reddedilir (testli). Biçim: [content-format.md](../content-format.md).
⚠️ Telaffuz doğrulama kayıtları cihazda tutulur; paylaşılabilir/birleştirilebilir bir “doğrulanmış paket” biçimi yok.

## 10. Kullanılabilirlik — ✅

Ana sayfa: Hızlı başla (5/10/15 dk) · Beceriler · Günlük yaşam · Kişisel plan · Serbest çalışma (yalnızca gelişmiş modda) · İlerleme · Ayarlar. Basit/gelişmiş mod ilk kurulumda seçilir. Yarım kalan oturum kaldığı yerden sürer (testli).

## 11. DKT — ✅

İsteğe bağlı; hedef ekleme, **alan** (işitsel algı / dil anlama / konuşma üretimi / diğer — uygulamada yalnızca işitsel algı çalışılabildiği belirtilir), görevlere bağlama, hedef oturum sayısı ve ilerleme, tamamlandı işareti, notlar, onaylı rapor indirme. Uzman paneli yok (bilinçli).

## 12. İlerleme — ✅

Oturum, dakika, doğruluk, ilk denemede doğru, ortalama tekrar dinleme, pratik/değerlendirme sayısı, beceri grubuna ve görev türüne göre tablo, zayıf alanlar (ses karşıtlığı, kategori, soru türü), sık karıştırılanlar, süre aşımları, isteğe bağlı rahatlık değerlendirmesi, 14 günlük grafik. Klinik çıkarım yapılmaz.
⚠️ Beceri başına zaman içindeki doğruluk grafiği yok (yalnızca dakika grafiği).

## 13. Teknik kalite ve doğrulama — ✅

Otomatik kontroller (her açılışta ve CI’da): boş içerik, yinelenen kimlik/kelime, eksik doğru cevap, birden fazla doğru cevap, yinelenen seçenek, çözülmemiş şablon yer tutucusu, noktalama, bilinmeyen havuz, varyantlar arası yuva tutarsızlığı, bozuk görsel referansı, Türkçe hece sayısı tutarlılığı, vurgu–hece çelişkisi, minimal çiftin gerçekten minimal olması, lisans bilgisi. Bozuk paket dosyası → o bölüm boş kalır, uygulama çalışır (testli).
⚠️ Dilbilgisi denetimi yalnızca yapısaldır (ek uyumu insan gözden geçirmesi ister 🩺).

## 14. Test senaryoları

| Senaryo | Durum |
|---|---|
| 5 → 10 seçenek geçişi | ✅ e2e |
| 0–9 tuşları | ✅ e2e |
| Klavye ve dokunma | ✅ e2e (dokunma = tıklama simülasyonu) |
| Yanlış sayıda seçenek | ✅ birim (tüm görevler × diller × seviyeler) |
| Art arda aynı soru / aynı konum | ✅ birim |
| Minimal çiftin yanlış telaffuzu | ✅ “hatalı” işaretli aile dışlanır (e2e); ❌ gerçek ses dinlenmedi |
| TTS çevrimdışı | ⚠️ Uygulama çevrimdışı açılıyor (e2e, service worker); sesin çevrimdışı çalışması cihaza bağlı, gerçek cihazda test edilmedi |
| Uzun paragraf kesilmesi | ✅ cümle bazlı okuma, kaldığı cümleden devam |
| Arka plana geçiş | ✅ e2e |
| Egzersizden çıkıp dönme | ✅ e2e |
| Çocuk/yetişkin profil değişimi | ✅ e2e |
| Türkçe arayüz + İngilizce egzersiz | ✅ e2e |
| Veri kaybı / yeniden başlatma | ✅ birim (bozuk veri, kota hatası) + e2e (devam) |
| Eksik/bozuk içerik paketi | ✅ birim |
| Aşırı tekrar | ✅ birim (yeniden açılan egzersiz farklı içerik) |
| Uyarlamanın hızlı artması | ✅ birim + e2e |
| Metinle çalışma | ✅ e2e (paragraf metin modları) |
| Uzman modülünü kapatma | ✅ |
| **Gerçek cihazlar, farklı ekranlar** | ⚠️ Chromium’da 390 px ve 1280 px; gerçek telefon/tablet testi yapılmadı |

---

## Kabul kriterleri

| Kriter | Durum |
|---|---|
| Cevap sistemi 2–10 seçenekle çalışıyor | ✅ |
| 10 seçenekli sayısal modda 0–9 doğru işleniyor | ✅ |
| Görev türleri gerçekten farklı | ✅ 47 görev, 7 cevap tipi |
| Kelime, minimal çift, cümle, paragraf modları çalışıyor | ✅ |
| İçerik tekrarları kontrol ediliyor | ✅ |
| Aynı beceri yeni örneklerle çalışılabiliyor | ✅ |
| TTS sesleri Türkçe ve İngilizce için **test edilmiş** | ❌ **Karşılanmadı** — gerçek cihazda dinleme testi yapılmadı. Doğrulama ekranı hazır; sonuçlar kullanıcı/uzman tarafından girilmeli |
| Doğrulanmamış telaffuz değerlendirmeye kontrolsüz girmiyor | ✅ |
| Senaryolar yalnızca isim değişikliğiyle çoğaltılmıyor | ✅ ifade varyantları + farklı soru türleri |
| Temel modda kolay egzersiz seçimi | ✅ |
| Uzman modülü isteğe bağlı | ✅ |
| Ücretli özellik/servis yok | ✅ |
| Gerçekleşmeyen işlevler belirtiliyor | ✅ bu belge |
| Testler çalıştırılıyor ve belgeleniyor | ✅ [testing.md](../testing.md) |

## Sonraki adımlar (öncelik sırasıyla)

1. Gerçek Android/iOS/Windows cihazlarda Ses kalite testi ekranıyla minimal çiftleri, heceleri, harfleri ve rakamları dinleyip işaretlemek (bir DKT/odyolog ile).
2. İçeriğin uzman gözden geçirmesi (`docs/content-sources.md` kontrol listesi).
3. Doğrulama kayıtlarını dışa/içe aktarılabilir paket biçimine çevirmek (bir kez doğrulanan ses + içerik başka cihazlarda kullanılabilsin).
4. Piper (WASM) motoru: cihazdan bağımsız, tutarlı ses.
5. Beceri bazlı zaman grafiği; ayrı “orta ses farklı” görevi; uzun hikâyeler.
