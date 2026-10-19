# v1.0 denetimi — eksik envanteri ve geliştirme planı

**Tarih:** 2026-10-18 · **Kapsam:** v1.0.0 kod tabanı (3 051 satır), içerik, testler, ses sistemi.

Durum etiketleri: ✅ Mevcut ve çalışıyor · ⚠️ Mevcut ama eksik/hatalı · ❌ Yok · 🔬 Teknik uygulanabilirlik araştırılmalı · 🩺 Uzman/klinik doğrulama gerekli

## 1. v1.0’da bulunan sorunlar

| # | Bulgu | Etki |
|---|---|---|
| 1 | Cevap sistemi yalnızca 2–4 seçenek; klavyede yalnızca 1–4 tuşları | 5–10 seçenekli ve sayısal mod yok |
| 2 | İçerik sabit ve küçük: TR 66 / EN 61 kelime, ~11 minimal küme, 16 cümle, 10 günlük ifade | Kısa sürede ezberleniyor |
| 3 | Cümle soruları sabit metin; aynı cümle hep aynı soruyla geliyor | Ezber |
| 4 | Gösterim geçmişi tutulmuyor; önceki oturumda görülen içerik yeniden seçilebiliyor | Tekrar kontrolü yok |
| 5 | Doğru cevabın konumu yalnızca karıştırmaya bağlı; dengeleme yok | Ardışık aynı konum olabilir |
| 6 | Öğrenme / alıştırma / değerlendirme ayrımı yok | Aktarım ölçülemiyor |
| 7 | Zorluk 3 seviye, tek oturumluk eşik; parametreler sınırlı | Kaba uyarlama |
| 8 | Minimal çift telaffuzları hiç doğrulanmadı; TTS test ekranı yok | Yanlış telaffuz değerlendirmeye girebilir |
| 9 | Boş/çok kısa TTS çıktısı algılanmıyor | Sessiz hata |
| 10 | Paragraf, hece, harf, rakam, yönerge, bilgi (saat/tarih), konuşmacı, yön modülleri yok | Kapsam dar |
| 11 | Egzersizden çıkınca oturum kayboluyor; uygulama arka plana geçince ses kesiliyor ve durum yönetilmiyor | Veri kaybı |
| 12 | Uzun cümlelerde Chrome’un ~15 sn kesme hatasına karşı önlem yok | Paragraflarda kesilme riski |
| 13 | İçerik kod içinde (JS); kod değiştirmeden ekleme yapılamıyor; doğrulayıcı yok | Bakım zor |
| 14 | “baş” kelimesi için uygunsuz emoji (🙂), “tavus” seyrek kelime | İçerik hatası |
| 15 | İlerleme: ilk deneme başarısı, tekrar dinleme sayısı, hata türü yok | Sınırlı geri bildirim |
| 16 | DKT hedefleri egzersizlerle ilişkilendirilemiyor, ilerleme izlenmiyor | Sınırlı |
| 17 | Ana ekran tek liste; hızlı başla / serbest çalışma / plan yok | Kapsam büyüyünce kaybolma riski |

## 2. Egzersiz kapsam matrisi (v1 → hedef)

| Gereksinim | v1 | v2 hedefi |
|---|---|---|
| 2/3/4 seçenek | ✅ | ✅ |
| 5/6/8/10 seçenek | ❌ | Görev türüne göre izin verilen sayılar |
| 0–9 tuşları (sayısal mod) | ❌ | Rakam görevlerinde tuş = rakam; diğerlerinde 1–9,0 = konum |
| Serbest / yazılı cevap | ❌ | Kelime yazma, rakam dizisi girişi |
| 1 Kelimeyi seçeneklerden bulma | ✅ (2–4) | 2–10 seçenek, benzerlik derecesi |
| 2 Rakam seçme | ❌ | Uygulanacak |
| 3 Harf seçme | ❌ | Uygulanacak (🔬 TTS harf okunuşu doğrulama ister) |
| 4 Hece seçme | ❌ | Uygulanacak (anlamsız hece ayrı etiketli, 🔬) |
| 5 Resim seçme | ⚠️ (emoji + yazı birlikte) | Ayrı görev: yalnızca resim |
| 6 Kelime yazma | ❌ | Uygulanacak |
| 7 Heceleme | ❌ | TR: hece kartlarını sıralama; EN: 🔬 güvenilir heceleme verisi yok |
| 8 Aynı/farklı kelime | ❌ | Uygulanacak |
| 9 Benzer sesli iki kelime | ⚠️ | Doğrulamalı minimal çift görevi |
| 10 Kelimeyi cümle içinde | ❌ | Taşıyıcı cümleler |
| 11 Cümleyi seçeneklerden bulma | ❌ | Tek ayrıntısı farklı çeldiriciler |
| 12 Cümle/paragraf soruları | ⚠️ (sabit cümle) | Şablonlu paragraflar, 14 soru türü |
| 13 Çoklu talimat sırası | ❌ | Renk–şekil yönergeleri |
| 14 Konuşmacının ne istediği | ⚠️ (yalnızca “nerede”) | Senaryo soruları |
| 15 Konuşmacı ayırt etme | ❌ | Yalnızca ≥2 farklı ses doğrulanmışsa |
| 16 Sayı/tarih/saat/adres/miktar | ❌ | Sözcükle okunan üretilmiş bilgiler |
| 17 Gürültüde konuşma | ✅ (kelime) | Kelime + minimal çift + cümle |
| 18 Hız ve konuşmacı | ⚠️ (yalnızca ayar) | Seviye parametresi, sınırlı aralık |
| 19 Yön (sol/sağ) | ❌ | 🔬 Yalnızca stereo kalibrasyonu geçilirse, yalnızca tonlarla |
| 20 Öğrenilmiş/yeni kelime ayrımı | ❌ | Gösterim geçmişinden |
| A Ses farkındalığı (9 alt görev) | ⚠️ (3 alt görev) | Var/yok, başlangıç/bitiş, perde, şiddet, örüntü, farklı ses, hedef ses |
| B Hece/fonem (9 alt görev) | ❌ | İlk/son ses, konum, hece sayısı, vurgu (EN), hece dizileri |
| C Minimal çiftler | ⚠️ (doğrulanmamış) | IPA, karşıtlık türü, konum, doğrulama durumu |
| D Kelime dağarcığı (30 kategori) | ⚠️ (tek liste) | Kategorili, genişletilebilir paket |
| E Cümle yapıları | ⚠️ | Olumlu/olumsuz, soru, yönerge, zaman, yer, miktar, iş… |
| F Paragraf ve uzun dinleme | ❌ | Zorunlu modül |
| G Hafıza ve sıralama | ⚠️ (eksik kelime) | Sıralı hatırlama, rakam dizisi, yönerge dizisi |
| H Günlük yaşam simülasyonları | ⚠️ (10 cümle) | Ev, sosyal, eğitim/iş, sağlık/kamu, ulaşım, telefon |
| 15 eğitim yolu | ❌ | İsteğe bağlı kişisel plan |
| Test modu / rahat pratik modu | ❌ | Ayrı modlar |
| TTS kalite test ekranı | ❌ | Uygulanacak |

## 3. Teknik riskler

| Risk | Değerlendirme |
|---|---|
| OS TTS’nin minimal çiftleri ayırt edilebilir okuması | 🔬 Cihaz ve sese göre değişir; otomatik doğrulanamaz. Kullanıcı/uzman dinleme doğrulaması zorunlu; doğrulanmamış çiftler değerlendirme modunda kullanılmaz |
| İzole hece ve harf okunuşu | 🔬 Motorlar “pa”yı “P.A.” gibi okuyabilir; doğrulama şart |
| İngilizce vurgu | 🔬 Yalnızca bağlam cümlesiyle (isim/fiil) dolaylı; doğrulama şart. Türkçe vurgu görevi uygulanmayacak |
| Telefon/oda akustiği simülasyonu | ❌ OS TTS sesi Web Audio grafiğine alınamadığı için filtrelenemez; yalnızca içerik düzeyinde simülasyon |
| Konuşma için yön | ❌ Aynı nedenle; yalnızca tonlar stereo kanaldan verilebilir |
| Farklı konuşmacı | ⚠️ Cihazdaki ses sayısına bağlı; aynı motorun varyantları benzer duyulabilir → kullanıcı doğrulaması |
| Gerçek SNR | ❌ Ölçülemez; göreli kalmalı |
| Türkçe şablon dilbilgisi | Çekim eklerinin otomatik üretimi hataya açık → ekler yalnızca kurallı durumlarda kodla (bulunma/ayrılma, özel isimler), diğerleri veride açık yazılır, doğrulayıcı test eder |

## 4. Aşamalı plan

1. Denetim (bu belge)
2. Dil modülleri + modüler JSON içerik paketleri + doğrulayıcı
3. Görev motoru (2–10 seçenek, 0–9, yazma/sıralama/basma), oturum oluşturucu, tekrar önleme, havuzlar, çok parametreli uyarlama
4. TTS kalite ekranı ve doğrulama kayıtlarının oturum seçimine bağlanması
5. Egzersiz modüllerinin genişletilmesi
6. Yeni ana ekran, serbest çalışma, kişisel plan, basit/gelişmiş ayarlar, oturum kaldığı yerden devam
7. Test ve belgeleme → `docs/audit/v2-status.md`
