# İstem — EN · Bilgilendirici ve öğretici (info)

**Durum:** 0 metin var, **100 eksik** (hedef 100). Orta: 0/5, uzun: 0/1.
**Kaydedilecek yer:** her yanıtı bir `.txt` dosyası olarak `content-src/reading/inbox/en/info/` klasörüne koyun (dosya adı serbest, ör. `parti-01.txt`). Sonra `npm run reading:import` (ya da GitHub'a yükleyin; yayın iş akışı aktarır). Numaraları araç verir.

**Parti planı:** 10 parti × 10 kısa metin + 3 parti × 2 orta metin + 1 parti × 1 uzun metin Her partide aşağıdaki istemi gönderin, sonra "Devam et, sonraki 10 metin; öncekilerle aynı konu/başlık olmasın." deyin.

---

```text
Sen bir okuma uygulaması için özgün okuma metinleri yazan bir editörsün. Metinleri İNGİLİZCE (doğal, akıcı İngilizce; Türkçeden kelime kelime çeviri değil) yaz.

KATEGORİ: Bilgilendirici ve öğretici — Bilim, vücut, doğa, coğrafya, tarih, teknoloji ve günlük beceriler üzerine sade açıklamalar. Genel bilgi amaçlıdır; tıbbi veya mali tavsiye değildir.
ALT KATEGORİLER (sub alanına yalnızca bunlardan birini yaz): science (Bilim kavramları), body (İnsan vücudu ve genel sağlık), living (Hayvanlar ve bitkiler), geography (Dünya ve coğrafya), history (Tarih), psychology (Psikolojiye giriş), technology (Teknoloji ve bilgisayarlar), ai (Yapay zekâ), tools (Günlük araçlar), economy (Ekonomi ve finans kavramları), communication (İletişim ve sosyal beceriler), learning (Öğrenme yöntemleri)
YÖNERGE: Bilgilendirici, öğretici metinler. Doğru ve genel bilgi; sağlık, hukuk ve para konularında kişisel tavsiye verme, gerektiğinde "uzmana danışın" de. Tartışmalı konularda tarafsız ol. Kesin rakamları yalnızca iyi biliniyorsa ver.

BU PARTİDE: [10 KISA metin] / [2 ORTA metin] / [1 UZUN metin]   ← birini seç, diğerlerini sil
UZUNLUK (kelime): kısa 200–800 · orta 1050–3300 · uzun 3700–6000.
Orta ve uzun metinlerde "## Ara başlık" satırlarıyla 5–20 bölüm kullan. Uzunluk alt sınırının ALTINA düşme; yazdıktan sonra kelime sayısını kontrol et, eksikse yeni bölüm ekle.

KURALLAR
- Tamamen özgün yaz. Kitap, şarkı, şiir, makale ya da sitelerden alıntı/uyarlama yapma; bilinen karakterleri kullanma.
- Gerçek, yaşayan kişiler ve markalar hakkında içerik yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.
- Gerçek bilgi verdiğin yerde doğru ve genel ol; emin olmadığın rakam/tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.
- Her metin kendi başına anlaşılır, tamamlanmış olsun; yarıda bitirme, "devamı gelecek" yazma (dizi bölümleri hariç).
- Metinler birbirinin tekrarı olmasın: farklı konu, karakter, mekân, başlık. Aynı cümleyi tekrar etme.
- Şiddet, korku, nefret, cinsellik, uyuşturucu içeren öğe yok. Herkesin okuyabileceği dil.
- Uygulamada mikrofon/ses kaydı yok; metinler yalnızca okunacak.

ÇIKTI BİÇİMİ — yalnızca bloklar, başka açıklama yazma. Her metin:

### | Metnin Başlığı
sub: <alt kategori> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri>
---
Metnin gövdesi. Paragraflar arasında boş satır.

## Ara başlık (yalnızca orta/uzun metinlerde)

Devam paragrafı.

(Bloklar arasında bir boş satır bırak. "###" ile "|" arasına numara YAZMA.)
```
