# İstem — TR · Öykü ve kısa hikâye (stories)

**Durum:** 100 metin var, **0 eksik** (hedef 100). Orta: 1/5, uzun: 1/1.
**Kaydedilecek yer:** her yanıtı bir `.txt` dosyası olarak `content-src/reading/inbox/tr/stories/` klasörüne koyun (dosya adı serbest, ör. `parti-01.txt`). Sonra `npm run reading:import` (ya da GitHub'a yükleyin; yayın iş akışı aktarır). Numaraları araç verir.

**Parti planı:** Eksik yok. Her partide aşağıdaki istemi gönderin, sonra "Devam et, sonraki 10 metin; öncekilerle aynı konu/başlık olmasın." deyin.

---

```text
Sen bir okuma uygulaması için özgün okuma metinleri yazan bir editörsün. Metinleri TÜRKÇE yaz.

KATEGORİ: Öykü ve kısa hikâye — Gerçekçi, dostluk, aile, yolculuk, doğa, merak ve mizah öyküleri.
ALT KATEGORİLER (sub alanına yalnızca bunlardan birini yaz): realistic (Gerçekçi), friendship (Dostluk), family (Aile ve dayanışma), learning (Yeni bir şey öğrenme), journey (Yolculuk), nature (Doğada), curiosity (Merak ve keşif), humor (Mizahi), literary (Edebî öykü)
YÖNERGE: Bağımsız, başı-ortası-sonu olan özgün öyküler. Türler: gerçekçi, dostluk, aile, öğrenme, yolculuk, doğa, merak, mizah, edebî. Her öykü farklı karakter ve olay örgüsüne sahip olsun.

BU PARTİDE: [10 KISA metin] / [2 ORTA metin] / [1 UZUN metin]   ← birini seç, diğerlerini sil
UZUNLUK (kelime): kısa 150–600 · orta 800–2500 · uzun 2900–5000.
Orta ve uzun metinlerde "## Ara başlık" satırlarıyla 5–20 bölüm kullan. Uzunluk alt sınırının ALTINA düşme; yazdıktan sonra kelime sayısını kontrol et, eksikse yeni bölüm ekle.

KURALLAR
- Tamamen özgün yaz. Kitap, şarkı, şiir, makale ya da sitelerden alıntı/uyarlama yapma; bilinen karakterleri kullanma.
- Gerçek, yaşayan kişiler ve markalar hakkında içerik yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.
- Gerçek bilgi verdiğin yerde doğru ve genel ol; emin olmadığın rakam/tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.
- Her metin kendi başına anlaşılır, tamamlanmış olsun; yarıda bitirme, "devamı gelecek" yazma (dizi bölümleri hariç).
- Metinler birbirinin tekrarı olmasın: farklı konu, karakter, mekân, başlık. Aynı cümleyi tekrar etme.
- Şiddet, korku, nefret, cinsellik, uyuşturucu içeren öğe yok. Herkesin okuyabileceği dil.
- Uygulamada mikrofon/ses kaydı yok; metinler yalnızca okunacak.
- Şu başlıklar ZATEN VAR, tekrar etme: Kayıp Cüzdan · Son Otobüs · Gece Vardiyası · Kiracı · Yağmurda Taksi · İkinci El Bisiklet · Bekleme Odası · Asansörde Mahsur · Pazar Tezgâhı · Saat Tamircisinin Çırağı · Beklemek · Pencere · Ayna · Kumsalda İz · Eski Fotoğraf · Köprü · Fener · Sessizlik · Saat Yediden Sonra · Yolun Sonu · Kar Tanesi · Sonbahar Bahçesi · Gölge Oyunu · Son Sayfa · Bank Arkadaşları · İki Bisiklet · Ödünç Kitap · Yeni Sınıf · Uzaktaki Arkadaş · Kavga ve Barış · Aynı Şarkı · Kayıp Köpeği Bulmak · Komşu Kızı · Yaşlı ile Genç · Deniz Fenerindeki Dostluk · Dedemin Saati · Annemin Dikiş Makinesi · Babamın Tamir Kutusu · Kardeş Kavgası · Kayıp Tarif · Yeni Ev · Ninemin Sandığı · İkizler · Hasta Baba · Köydeki Ev · Bisiklete Binmeyi Öğrenmek · Keman Dersi · Ekmek Yapmak · Yüzmeyi Öğrenen Dede · Satranç Hocası · Okuma Yazma Kursu · İlk Kod · Örgü · Resim Kursu · Ateş Yakmayı Öğrenmek · Seksen Yaşında Öğrenci · Tren Kompartımanı · Gemi Güvertesi · Otostop · Yanlış Otobüs · Dağ Köyü · Gece Treni · Havaalanında Mahsur · Bisikletle Sahil · Kervansaray · Kayık · Uzun Yol · Fırtına Gecesi · Ormanda Kaybolan Çocuk · Kuş Yuvası · Kaplumbağa · Dağda Sis · Tilki · Göl Kenarında · Yaşlı Çınar · Arıcı · Ateş Böcekleri · Bekçinin Kulübesi · Çatıdaki Teleskop · Eski Harita · Kilitli Sandık · Taşın Altındaki · Kuyunun Sesi · Mikroskop · Bilinmeyen Bitki · Radyo Sinyali · Kapalı Kapı · Fosil · Kayıp Kütüphane · Yanlış Pasta · Konuşan Papağan · Unutulan Şemsiye · Ters Giyilen Kazak · İki Aynı Ceket · Navigasyon · Mutfakta Felaket · Kedinin Hediyesi · Yanlış Toplantı · Kar Lastiği · Düğün Fotoğrafçısı

ÇIKTI BİÇİMİ — yalnızca bloklar, başka açıklama yazma. Her metin:

### | Metnin Başlığı
sub: <alt kategori> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri>
---
Metnin gövdesi. Paragraflar arasında boş satır.

## Ara başlık (yalnızca orta/uzun metinlerde)

Devam paragrafı.

(Bloklar arasında bir boş satır bırak. "###" ile "|" arasına numara YAZMA.)
```
