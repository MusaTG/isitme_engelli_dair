# Boşluk analizi — v2.0 → v3.0

**Tarih:** 2026-10-19. Girdi: v2.0 kod denetimi ([../audit/v2-status.md](../audit/v2-status.md)), yeni talimat ve literatür incelemesi.

## 1. Mevcut durum (v2.0 denetimi)

| Alan | v2.0 |
|---|---|
| Teknoloji | Derlemesiz statik PWA (ES modülleri), localStorage, service worker, Web Speech API, Web Audio; GitHub Pages |
| Sayfalar | Ana sayfa, beceriler, beceri grubu, günlük yaşam, serbest çalışma, kişisel plan (+DKT), oynatıcı, ilerleme, ayarlar, ses kalite testi, ilk kurulum |
| Veri modeli | Profil, tercihler, uyarlama, gösterim geçmişi, plan, `slt { enabled, goals, notes }`, oturumlar, yarım oturum |
| Egzersiz motoru | 47 görev, 7 cevap tipi, oturum oluşturucu, havuzlar, Leitner, konum dengeleme |
| TTS | Dil başına katı eşleştirme, boş çıktı algılama, cümle bazlı okuma, onaylı farklı sesler |
| DKT | Hedef: metin, alan, görevler, hedef oturum sayısı, tamamlandı. Not: tarih ve metin. Rapor |
| Kılavuz | **Yok** (yalnızca README ve docs) |
| Testler | 33 birim, 38 uçtan uca |
| Dışa aktarma | JSON yedek, geri yükleme, silme, DKT raporu |

## 2. Boşluklar ve kararlar

| # | Boşluk | Kaynak | Karar (v3.0) |
|---|---|---|---|
| 1 | DKT hedefleri yalnızca metin, alan ve görevlerden oluşuyor; durum, öncelik, tarih, uzman notu, plan, geçmiş yok | Talimat 5.1–5.2 | **Yeni hedef modeli:** ad, açıklama, beceri grubu, dil, başlangıç/hedef tarihi, öncelik, uzman notu, kendi notu, görevler, durum (aktif/duraklatıldı/tamamlandı/arşiv), haftalık plan (gün ve dakika), son çalışma ve ilerleme geçmişi (oturumlardan hesaplanır), hızlı işlemler, beceriye göre görev önerisi, hedefe özel oturum |
| 2 | Seans notları yalnızca tarih ve metin; filtre, düzenleme ve geri alma yok | 5.3 | **Yapılandırılmış not:** tür, bağlı hedefler, öneriler, deneyim, zorlanılan alanlar, sonraki adım, ek metin; tarih/hedef/tür filtresi; düzenleme; silmede onay ve geri al; taslak otomatik kaydı ve kayıt durumu göstergesi |
| 3 | Kişisel hedef ile DKT hedefi ayrımı yok | 5, 6.3 | Hedefin kaynağı **kişisel** veya **uzmanın verdiği** (kullanıcı elle girer). DKT kapalıyken yalnızca kişisel hedefler ve kişisel notlar görünür |
| 4 | Uygulama içi kullanım kılavuzu yok | Bölüm 7 | **24 başlıklı kılavuz** (TR/EN): arama, kategoriler, adım adım yönergeler, tuş şeması; Ayarlar’da görünür bölüm; ekranlardan konuya bağlantı |
| 5 | Masaüstünde içerik sol sütuna sıkışıyor, sağda boşluk kalıyor | 6.1 | Ana içerik ortalanır; sayfa türüne göre en fazla genişlik (okuma ~760 px, katalog ~1040 px); tablet ara düzeni |
| 6 | Katalogda arama ve filtre yok | 6.1 | Beceriler sayfasında arama ve hiyerarşi/grup filtresi |
| 7 | Navigasyonda kılavuz ve hedefler eksik | 6.3 | Masaüstü kenar menüsü: ana sayfa, egzersizler, günlük yaşam, hedefler ve notlar, ilerleme, kılavuz, ayarlar. Mobil alt menü 5 öğe; kılavuz başlık çubuğunda |
| 8 | Seviyeler yalnızca sayı (1–5) | 3 | Adlandırılmış seviyeler: Başlangıç, Temel, Orta, Orta-ileri, İleri + “Hedef ayarı” (bir hedefe kaydedilen serbest çalışma profili) + Serbest çalışma. Klinik yeterlilik çağrışımı yapan “uzman seviyesi” adı kullanılmaz |
| 9 | Hiyerarşi düzeyi görünmüyor | C1, C4 | Her görevde F/AY/T/AN etiketi, katalogda filtre |
| 10 | Orta ses görevi yok | 2.2 | **Ortadaki ses** görevi (minimal çiftlerin orta konum karşıtlığından) |
| 11 | VCV/CVC logatom kümeleri yok | B2, A1 | TR ve EN için VCV ünsüz ve CVC ünlü logatom kümeleri (QA zorunlu) |
| 12 | Matris tarzı cümle görevi yok | B10, C12 | **Matris tarzı alıştırma:** özgün 5×10 kelime matrisi (TR/EN), kapalı yanıt ızgarası, kelime bazında puan, isteğe bağlı gürültü; “klinik test değildir” uyarısı |
| 13 | Konuşmacı değişkenliği yalnızca diyaloglarda | B1 | Kelime ve çift görevlerinde isteğe bağlı “her soruda farklı onaylı ses” |
| 14 | Gürültü sırasında rahatsızlık kontrolü yok | 2.5, 9 | Egzersiz içinde “Gürültüyü azalt” ve “Gürültüyü kapat”; gürültü düzeyi 1’den başlar |
| 15 | Uygulama ses seviyesi kontrolü yok | 9 | Uygulama içi ses düzeyi (ton, gürültü, efekt ve seslendirme), varsayılan %70 |
| 16 | Yorgunluk yönetimi yalnızca mola düğmesi | A7, B9 | Ayarlanabilir mola hatırlatıcısı (varsayılan 10 dk) |
| 17 | Eksik senaryolar: iş görüşmesi, iş yerinde telefon, toplantıda soru-cevap, kısa sunum, arkadaş grubu, sesli mesaj, aile diyaloğu | 2.6, B4 | 7 yeni senaryo × 2 dil × 2 varyant |
| 18 | Duygu ve tonlama, müzik | 2.5, B13, B14 | **Eklenmedi** — seslendirme sınırı; yol haritasında kayıtlı ses paketiyle |
| 19 | Seslendirme kalitesi gerçek cihazda doğrulanmadı | Bölüm 8 | Doğrulama ekranı var; ek olarak hedef, not ve kılavuzda yönlendirme. Gerçek doğrulama yine kullanıcı/uzman işidir (❌) |
| 20 | Kelimelerde ayrı örnek cümle, anlam ve kaynak alanı yok | 2.3 | Ertelendi; içerik biçimi isteğe bağlı `ex` ve `src` alanlarını destekleyecek şekilde belgelendi |
| 21 | Gürültüye karışmış sesin anlaşılabilirlik kontrolü | 2.5, 8 | Teknik olarak yapılamıyor (seslendirme ve gürültü ayrı çalınıyor); belgelendi |

## 3. Bilinçli olarak yapılmayanlar

Gerçek uzman paneli, uzaktan danışmanlık, bulut eşitleme, cihaz programlama, klinik test ve eşik ölçümü, yapay zekâ ile çalışma anında içerik üretimi (çevrimdışı ve ücretsiz hedefiyle çelişir; doğrulanamaz).
