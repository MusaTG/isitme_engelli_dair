# Egzersiz–kanıt matrisi

**Tarih:** 2026-10-19. Kaynak kodları için [source-registry.md](source-registry.md).

## Etiketler

**Kanıt durumu**

| Etiket | Anlamı |
|---|---|
| **D** | Doğrudan destek: aynı tür eğitimle yapılmış CI veya işitme kaybı çalışması var (kanıt düzeyi düşük olsa bile) |
| **K** | Kavramsal destek: meslek kuruluşu çerçevesi, test tasarım ilkesi veya ilgili alan bulgusu var; eğitim etkisi doğrudan gösterilmedi |
| **G** | Genel eğitim amaçlı: makul pratik, özel kanıt bulunamadı |
| **A** | Araştırma gerektiriyor veya teknik olarak sınırlı |
| **U** | Uzman incelemesi gerekli (içerik veya klinik uygunluk) |

**Hiyerarşi** (Erber / ASHA [C1, C4]): **F** farkındalık · **AY** ayırt etme · **T** tanıma · **AN** anlama.

**Uygun kullanıcı:** CI · İC (işitme cihazı) · BM (bimodal) · Ç (çocuk) · Y (yetişkin).

Hiçbir satır “kanıtlanmış etkinlik” anlamına gelmez. Bütün içerik taslaktır (**U**).

## Ses farkındalığı (Web Audio tonları)

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Ses var mı? | Sesin varlığını fark etme | F | C1, C4 | Tümü, özellikle Ç ve yeni CI | İşitme eşiği testi **değildir**; cihaz ses seviyesi sonucu etkiler | K |
| Başladığında / bittiğinde bas | Başlangıç ve bitişi fark etme | F | C4 | Tümü | Cihazın ses gecikmesi kalibre edilmez; tolerans geniştir | K, A |
| Aynı/farklı, kısa/uzun, ince/kalın, şiddet, sayma, ritim, farklı olan, hedef ses | Ses özelliklerini ayırt etme | AY | C1 | Tümü | Ton algısı konuşma algısı değildir; müzik eğitimi değildir [B13] | K |
| Yön (sol/sağ) | Yanallaşma | AY | — | Yalnızca iki taraflı işitme ve stereo kulaklık | Kalibrasyon gerekir; konuşma sesi yönlendirilemez | G, A |

## Hece, fonem, minimal çift

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Hece seçme / aynı-farklı / hece dizisi (CV) | Ünsüz ve ünlü ayrımı (anlamsız) | AY–T | A1, B2 | Y CI, BM, İC | Seslendirme motorunun hece okuması doğrulanmalıdır (QA zorunlu) | D, U |
| **VCV / CVC logatomlar** (aba–apa, mem–mım) | Ünsüz ve ünlü tanıma | T | B2 | Y CI, BM | Pilot kanıt (n=8, kontrolsüz); okunuş doğrulanmalı | D (zayıf), U |
| İlk ses / son ses eşleştirme | Fonem farkındalığı | AY–T | C1 | Y, büyük Ç | Seçenekler yalnızca sesli; bilişsel yük yüksek olabilir | K |
| **Ortadaki ses** (kutu–kuzu, deve–dere) | Kelime ortasındaki ünsüz ayrımı | AY | C1, A1 (dolaylı) | Y | Aile sayısı sınırlı | K, U |
| Sesin yeri, hece sayısı, heceleme (TR) | Fonolojik farkındalık | T | C14 (Türkçe hece yapısı) | Ç, Y | İşitsel eğitimden çok fonolojik farkındalık; okuma becerisi gerektirir | G |
| Vurgu (EN) | Prozodi | AY | B14 (dolaylı) | Y | Seslendirmede vurgu kontrol edilemez; QA zorunlu | A |
| Harf, rakam | Kapalı küme tanıma | T | C3 (kapalı küme) | Ç, Y | Harf adları motorlar arasında değişir; QA zorunlu | G, U |
| Minimal çift seçme / aynı-farklı / gürültüde / cümlede | Anlamlı kelimelerde fonem ayrımı | AY–T | A1, B2, B15 | Tümü | “Minimal çift eğitimi” için doğrudan çalışma açılamadı; seslendirme doğrulaması zorunlu | K, U |

## Kelime

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Kelime bulma (2–10 seçenek), resim bulma | Kapalı kümede kelime tanıma | T | A2, C3 | Tümü (resim: Ç) | Kapalı küme açık kümeden kolaydır | D |
| Kelime yazma | Açık kümede tanıma | T | C3 | Y, büyük Ç | Yazım becerisi gerektirir | K |
| Cümlede kelime | Bağlam içinde tanıma | T–AN | C1 (sentetik) | Tümü | — | K |
| Kategori bulma | Anlama | AN | C1 | Tümü | — | G |
| Öğrenme kartları | Tanışıklık (öğrenme) | — | B6 (yazı ve görsel isteğe bağlı) | Tümü | Görsel destek yalnızca işitsel öğrenmeyi gölgeleyebilir | G |
| **Konuşmacı değişkenliği** (onaylı farklı sesler) | Konuşmacılar arası genelleme | T | B1 | Y | Cihazda en az iki gerçekten farklı ses gerekir | D (vokoder), A |

## Cümle

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Cümle bulma (bir ayrıntısı farklı), soru yanıtlama, değişen kelime, evet/hayır, uygun cevap | Cümle tanıma ve anlama | T–AN | A1, A2, C3 | Tümü | Şablon dilbilgisi uzmanca gözden geçirilmeli | D (gürültüde cümle), U |
| **Matris tarzı cümle** (5 kategoriden kapalı yanıt) | Kelime düzeyinde puanlanan cümle tanıma | T | B10, B12, C12 | Y CI, BM, İC | Klinik Matris testi **değildir**, SRT ölçmez; kelimeler özgündür; lisanslı test listeleri kopyalanmamıştır | K |
| Gürültüde kelime ve cümle | Gürültüde konuşma | T | A1, A2, B11, C3, A6 | Tümü, özellikle BM | Gürültü göreli, SNR ölçülemez; kullanıcı denetiminde | D, A |
| Yönergeleri uygula | Çok adımlı yönerge, çalışan bellek | AN | B5 | Ç, Y | Renk ayrımı gerektirir; etiketler isteğe bağlı | K |
| Sayı, saat, tarih, adres, telefon | Bilgi algılama | T | B4 (not alma) | Y | — | K |
| Hız değişimi | Hızlı konuşma | T | B8 | Y | İsteğe bağlı, %90–110; seslendirme kalitesi o hızda doğrulanmalı | D (dolaylı), A |

## Paragraf ve günlük yaşam

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Paragraf (17 soru türü, 4 metin modu) | Söylem anlama, ana fikir, çıkarım | AN | C1 (sentetik), B5, B7 | Tümü | Anlama okuma ve dil becerisine de dayanır | K, U |
| Diyaloglar (ev, sosyal, ulaşım, iş, sağlık, kamu) | Gerçek hayata yakın dinleme | AN | C1, C11 | Tümü | Akustik ortam taklit edilmez; acil durum içeriği yalnızca eğitimdir | G, U |
| Kim söyledi? | Konuşmacı ayırt etme | AY–AN | B1, B3 | Y | En az iki onaylı ses gerekir | K, A |
| **Telefon / sesli mesaj ve not alma** | Telefonda bilgi yakalama | AN | B4 | Y | Telefon hattı akustiği yok | D (zayıf), A |
| **İletişim stratejileri** (tekrar isteme, netleştirme) | Onarım stratejisi | AN | C1, C11 | Y | — | K |

## Bellek

| Görev | Hedef beceri | Hiy. | Kaynak | Kullanıcı | Sınırlamalar | Durum |
|---|---|---|---|---|---|---|
| Sırayla hatırla, rakam dizisi, listede olmayan | Konuşma materyaliyle işitsel çalışan bellek | T–AN | B5, A4 | Tümü | Klinik bellek testi değildir; tek başına bellek eğitimi aktarılmadı [B5] | K |

## Bilinçli olarak eklenmeyen veya ertelenen modüller

| Modül | Neden |
|---|---|
| Seste duygu ve tonlama tanıma | İşletim sistemi seslendirmesi duyguyu kontrollü üretemez [B14]; lisanslı kayıt gerekir |
| Müzik eğitimi | Eğitim etkisi beğeni düzeyinde [B13]; lisanslı müzik materyali gerekir |
| Gerçek SNR, akustik ortam ve telefon hattı simülasyonu | Seslendirme çıktısı Web Audio işleme zincirine alınamıyor |
| Klinik test (SRT, eşik) | Uygulama bir tanı aracı değildir; lisanslı klinik materyal kullanılmaz |
