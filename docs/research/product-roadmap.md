# Ürün yol haritası

**Tarih:** 2026-10-19

## v3.0 (bu geliştirme)

Öncelik sırası talimattaki 10.2 maddesine göre belirlendi.

1. **Hata düzeltmeleri** — v2 tarayıcı testlerinde bulunanlar zaten düzeltildi; v3 boyunca bulunanlar `docs/audit/v3-status.md` içinde.
2. **Motor ve veri modeli**
   - Adlandırılmış seviyeler
   - Hiyerarşi etiketleri
   - Matris cevap tipi
   - Hedef ve not veri modeli (v2’den kayıpsız taşıma)
3. **Cevap ve tekrar sistemi** — mevcut testler korunur, matris görevi için yeni testler eklenir.
4. **İçerik**
   - VCV/CVC logatomlar
   - Ortadaki ses görevi
   - Matris kelime tabloları (TR/EN)
   - 7 yeni senaryo türü
5. **İleri dinleme**
   - Konuşmacı değişkenliği seçeneği
   - Gürültü rahatlık kontrolleri
   - Mola hatırlatıcısı
   - Uygulama ses düzeyi
6. **DKT** — hedefler, haftalık plan, hızlı işlemler, notlar (filtre, düzenleme, geri al), hedefe özel oturum.
7. **Arayüz** — ortalanmış ve genişliği ayarlanmış düzen, katalog arama/filtre, yeni navigasyon.
8. **Kılavuz** — 24 başlık, arama, ekranlara göre yardım bağlantıları.
9. **Testler** — birim ve uçtan uca testler (hedef, not, kılavuz, tablet, matris, yeniden açılış, yedekleme).
10. **Belgeler**

## v3.x — sonraki adımlar

| Öncelik | İş | Bağımlılık |
|---|---|---|
| Yüksek | Gerçek cihazlarda seslendirme doğrulaması (minimal çiftler, heceler, logatomlar, matris kelimeleri); doğrulanmış kayıtların paylaşılabilir biçimi | Kullanıcı / uzman |
| Yüksek | İçeriğin DKT ve odyolog tarafından gözden geçirilmesi | Uzman |
| Orta | Kelime kayıtlarına örnek cümle, anlam ve kaynak alanları | İçerik |
| Orta | Beceri bazında zaman içindeki doğruluk grafiği | — |
| Orta | Piper (WASM) seslendirme motoru — cihazdan bağımsız, tutarlı ses | Lisans incelemesi |
| Düşük | Kayıtlı ses paketleri (lisanslı): duygu ve tonlama, doğal konuşma, telefon hattı | Kayıt ve lisans |
| Düşük | Müzik takdiri modülü | Lisanslı müzik |

## Kapsam dışı

Tanı veya eşik ölçümü, cihaz programlama, uzman hesabı ve uzaktan terapi, ücretli servisler.
