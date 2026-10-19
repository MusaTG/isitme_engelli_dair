# İçerik kaynakları ve doğrulama durumu

| İçerik | Kaynak | Lisans | Durum |
|---|---|---|---|
| Türkçe paket (`content/tr/*.json`): kelimeler, minimal çiftler, heceler, şablonlar, paragraflar, senaryolar | Proje için özgün olarak yazıldı | MIT | **Taslak — DKT/odyolog doğrulaması bekliyor** |
| İngilizce paket (`content/en/*.json`) | Proje için özgün olarak yazıldı | MIT | **Taslak — DKT/odyolog doğrulaması bekliyor** |
| IPA gösterimleri | Proje ekibi; Türkçe için standart Türkçe sesletim, İngilizce için genel Amerikan/İngiliz ortak biçim | MIT | Doğrulayıcı yalnızca “tek sesbirim farkı” yapısını denetler; transkripsiyon doğruluğu 🩺 |
| Tonlar, gürültü, kapı zili/telefon/anons sesleri | Çalışma anında Web Audio ile sentezlenir | — | Ses dosyası yok |
| Konuşma sesi | Kullanıcının cihazındaki TTS sesleri | Cihaz/OS koşulları | Dağıtılmaz; telaffuz kullanıcı tarafından doğrulanır |
| Resimler | Sistem emoji yazı tipi | — | Dosya dağıtılmaz |

Hiçbir standart klinik test listesi (ör. lisanslı konuşma odyometrisi kelime listeleri) kopyalanmamıştır. Uygulama bir değerlendirme veya tanı aracı değildir.

## Dilbilimsel notlar

- Türkçe minimal çiftlerde sözcük sonu ötümsüzleşmesi nedeniyle aynı okunan çiftler (ad/at, kod/kot) kullanılmadı.
- Türkçe ekler (bulunma, yönelme, belirtme vb.) havuz öğelerinde açıkça yazılır; kodla yalnızca kurallı durumlar üretilir (sayıların bulunma eki, özel isimlerde kesme işareti).
- Gün adları cümle içinde küçük harfle yazılır (TDK); belirli tarih bildiren kullanımlarda büyük harf.
- Anlamsız heceler (pa/ba…) “anlamsız hece” olarak etiketlenir ve anlamlı kelime sonuçlarıyla karıştırılmaz.
- İngilizce ses envanteri Türkçeden ayrıdır (/θ/–/t/, /ɪ/–/iː/, /w/–/v/, /ʃ/–/tʃ/ vb.).

## Uzman doğrulaması kontrol listesi

- [ ] Kelimelerin yaş grubuna ve sıklık seviyesine uygunluğu (özellikle 0–5 yaş)
- [ ] Minimal çift ailelerinin karşıtlık türü ve IPA transkripsiyonları
- [ ] Hece kümelerinin hedeflediği ses özellikleri
- [ ] Cümle şablonlarında ek uyumu ve doğallık (her havuz değeriyle)
- [ ] Paragraf/senaryo sorularının tek doğru cevaplı ve anlamlı çeldiricili olması
- [ ] Seviye (1–5) sıralamasının zorluk artışıyla uyumu
- [ ] Gürültü düzeylerinin ve oturum uzunluklarının uygunluğu
- [ ] Sağlık/acil durum senaryolarının uyarı metinleri
- [ ] Logatom kümelerinin (VCV ünsüz, CVC ünlü) seçimi ve seslendirmede doğru okunması (v3)
- [ ] Matris kelime tablolarının sıklık ve görsel/işitsel ayırt edilebilirlik açısından dengesi (v3)
- [ ] Yeni iş ve sosyal yaşam senaryolarının doğallığı (v3)

## v3’te eklenen içeriğin kaynağı

- **Logatomlar:** Bu geliştirmede elle yazıldı. VCV/CVC yapısı, Erlangen pilot çalışmasında ve klasik fonetik çerçevelerde (İngilizce hVd: heed/hid/head…) kullanılan ilkeden esinlenmiştir; herhangi bir lisanslı test listesi kopyalanmamıştır. Bkz. `docs/research/source-registry.md`.
- **Matris kelimeleri:** Özgün; ticari/klinik Matris Testi (OLSA, Türkçe Matris Testi vb.) kelime listeleri **kullanılmamıştır**. Yalnızca 5 sütunlu yapı genel bir ilkedir.
- **Yeni senaryolar:** Bu geliştirmede elle yazıldı; isimler, şirketler ve yerler kurgusaldır.
