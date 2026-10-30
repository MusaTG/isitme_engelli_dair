# Karar kaydı — İlk tur (8 konunun tamamı)

- **Tarih:** 2026-10-24
- **Defter:** “İşitme Egzersizi - Duyum App - v4.4”
- **Ham rapor:** `0-ham-notebooklm-raporu-2026-10-24.md`

## Değerlendirme (protokol §2–3)

Defterde **yalnızca bizim dört dosyamız** (`konular.md`, `degerlendirme-protokolu.md`, `karar-sablonu.md`, `README.md`) kaynak olarak vardı. Atıflar bu dosyalara gidiyor. Bu yüzden rapordaki “bulgular” büyük ölçüde **bizim sorularımızın yeniden ifadesi**; Ateşman, CEFR, Brysbaert, WCAG, MDN gibi belgelerin kendisi defterde olmadığı için hiçbiri doğrulanmış değil. Raporun da kendi “Belirsizlikler” bölümünde kabul ettiği gibi eşik değerleri, renk kodları ve sayısal bulgular yok.

Raporun tablosundaki “Yüksek” güven etiketleri protokolü karşılamıyor (standart belge ya da ≥2 hakemli kaynak defterde yok). **Bu turun tüm bulguları: Düşük / kaynaksız.**

Bir düzeltme: Rapor “Safari ITP 7 gün kuralı PWA'ları siler” diyor. Bildiğim kadarıyla WebKit'in 2020 duyurusu, ana ekrana eklenmiş web uygulamalarını bu 7 günlük sınırdan muaf tutuyor; sınır Safari sekmesinde kullanılan sitelere uygulanıyor. Bu, 8. konu için gerçek kaynaklarla **doğrulanmalı**.

## Uygulananlar (v4.5.0) — kanıt gerektirmeyen, uygulamanın kendi ilkeleri ya da düşük riskli seçenekler

| # | Karar | Gerekçe | Uygulama |
|---|---|---|---|
| REQ-07 | Olumlu klinik iddia yasağı test ile korunur | Proje ilkesi | `tests/claims.test.js`: arayüz, rehber, istemlerde “işitmeyi geliştirir / tedavi eder / improves hearing / clinically proven” taraması. Mevcut kodda iddia **bulunmadı**; klinik kelimeler yalnızca feragat cümlelerinde geçiyor. |
| REQ-06 | Lisans denetimi | Proje ilkesi | Aynı test dosyası: genel lisans notu var; kaynak belirtilen her metinde lisans var. |
| REQ-02 | Metin başına yapay zekâ beyanı | Proje ilkesi (dürüst raporlama) | Okuyucuda her kütüphane metni için “Yapay zekâ destekli taslak · insan incelemesi bekliyor / incelemesinden geçti” ya da “İnsan tarafından yazıldı” (`origin`, `reviewed` alanlarından). Genel lisans notu yalnızca lisansı söylüyor. |
| (haber) | Kurgusal haber uyarısı | Proje ilkesi | Zaten vardı (kartta rozet, okuyucuda bilgi kutusu: “Kurgusal haber — gerçek bir olay değildir”). Değişiklik gerekmedi. |
| REQ-05 (kısmi) | Kalıcı depolama isteği | Düşük risk, isteğe bağlı | Ayarlar → Gizlilik: durum (açık/kapalı) ve “Kalıcı depolama iste” düğmesi, açıklama metni. Otomatik çağrılmıyor. |
| REQ-01 (kısmi) | Okunabilirlik puanı | Formül yayımlanmış, eşleme belirsiz | Ateşman (TR) / Flesch (EN) puanı metin başına hesaplanıyor ve okuyucuda **ek bilgi** olarak gösteriliyor. Düzeyi (1/2/3) **değiştirmiyor**. |

**Ölçüm (REQ-01 için):** Ateşman'ın kendi bantlarıyla (≥70 kolay, 50–69 orta, <50 zor) mevcut 552 TR metinde öykü/roman/günlük metinlerin %93–100'ü “kolay”, haber/bilgi/gezi metinlerinin çoğu “orta” çıkıyor. Bu bantlar doğrudan 1/2/3'e eşlenirse kurgu kategorilerinde süzgeç işlevsizleşir. Bu yüzden eşleme, gerçek kaynaklarla eşik araştırması yapılana kadar ertelendi.

## Uygulanmayanlar (kanıt bekliyor)

| Öneri | Neden bekliyor | Faz |
|---|---|---|
| Soft Reading teması **varsayılan** | Protokol: düşük güvenli bulgu varsayılan olamaz. İsteğe bağlı tema olarak eklenecek (kontrast ≥4,5:1 axe testiyle). | 6 |
| IndexedDB geçişi | Gerekçe (ITP) doğrulanmadı; gerçek kota/silme davranışı 8. konu kaynaklarıyla netleşmeli. | 6 |
| “Okundu” için WPM'e bağlı en az süre | 110/140 kelime/dk iki bağımsız kaynakla doğrulanmadı; yanlış eşik kullanıcıyı cezalandırır. | 6 |
| `autoLevel` yerine Ateşman eşikleri | Eşikler bilinmiyor (yukarıdaki ölçüm). | 6 |
| CEFR etiketleri | Rapor da erteliyor. | — |
| Tür yapı şablonları (`GUIDE`) | Raporda somut kural yok. | 4. konu |

## Sonraki tur için (her konuya ayrı defter)

Her defterde bizim dosyalarımız **yerine** gerçek kaynakları yükleyin. NotebookLM'in “Kaynak bul / Discover” özelliği ya da web adresi ekleme bunu hızlandırır. En çok karar etkileyen üçü:

1. **Konu 8 (depolama):** MDN “Storage quotas and eviction criteria”, web.dev “Storage for the web”, WebKit blogundaki depolama ve ITP yazıları.
2. **Konu 6 (tema):** WCAG 2.2 (1.4.3, 1.4.8, 1.4.12) ve “Understanding” sayfaları, British Dyslexia Association Style Guide.
3. **Konu 3 (okuma hızı):** Brysbaert (2019) makalesi ve Türkçe okuma hızı çalışmaları (Google Scholar / DergiPark).

Yanıtları `karar-sablonu.md` biçiminde (kaynak tablosuyla) getirin.

## Uygulandı

- Sürüm: 4.5.0
- Değişen dosyalar: `js/reading/core.js` (`readability`), `tools/build-reading.mjs` (`rs`), `js/views/read-reader.js`, `js/views/settings.js`, `content-src/reading/categories.json`, `locales/*.js`, `css/app.css`, yeni `tests/claims.test.js`
- Testler: birim 83 (82 geçti, 1 TODO); `run_reading` 0 başarısız; `run_v3` 55/55; `run` 38/38; `run_a11y` 0 başarısız
