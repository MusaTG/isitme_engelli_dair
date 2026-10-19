# İstem — TR · Gazete ve dergi tarzı (news)

**Durum:** 100 metin var, **0 eksik** (hedef 100). Orta: 1/5, uzun: 1/1.
**Kaydedilecek yer:** her yanıtı bir `.txt` dosyası olarak `content-src/reading/inbox/tr/news/` klasörüne koyun (dosya adı serbest, ör. `parti-01.txt`). Sonra `npm run reading:import` (ya da GitHub'a yükleyin; yayın iş akışı aktarır). Numaraları araç verir.

**Parti planı:** Eksik yok. Her partide aşağıdaki istemi gönderin, sonra "Devam et, sonraki 10 metin; öncekilerle aynı konu/başlık olmasın." deyin.

---

```text
Sen bir okuma uygulaması için özgün okuma metinleri yazan bir editörsün. Metinleri TÜRKÇE yaz.

KATEGORİ: Gazete ve dergi tarzı — Kurgusal haberler ve gerçek bilgiye dayanan dergi yazıları. Kurgusal haberler gerçek olay değildir.
ALT KATEGORİLER (sub alanına yalnızca bunlardan birini yaz): science (Bilim ve teknoloji), environment (Çevre ve doğa), education (Eğitim), culture (Kültür ve sanat), history (Tarih ve arkeoloji), space (Uzay ve astronomi), agriculture (Tarım ve sürdürülebilirlik), city (Şehir yaşamı), community (Toplum yararına projeler)
YÖNERGE: Gazete/dergi tarzı. İki tür var ve her metinde belirtilmeli: (1) KURGUSAL HABER — "kind: fictional-news"; hayalî yer/kişi/kurum adları kullan, gerçek bir olay gibi sunma. (2) DERGİ YAZISI — "kind: feature"; yalnızca iyi bilinen, doğrulanabilir genel bilgilere dayan (bilim, doğa, tarih, uzay...). Kesin tarih/rakam verirken emin ol; emin değilsen genel ifade kullan. Gerçek kişiler hakkında haber yazma.

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
- Şu başlıklar ZATEN VAR, tekrar etme: Ilgınköy'de Okul Bahçesi Sebze Bahçesine Dönüştü · Sahil Kasabasında Gönüllüler Bir Günde 2 Ton Atık Topladı · Mahalle Kütüphanesi Gece Açık Kalmaya Başladı · Ay Neden Her Gece Farklı Görünür? · Kasabanın Eski Sineması Yeniden Perdelerini Açtı · Bahçelerde Kompost Nasıl Yapılır? · Köy Okulunun Öğrencileri Kendi Hava İstasyonlarını Kurdu · Matbaanın Hikâyesi: Kitaplar Nasıl Çoğaldı? · Mahallede İlk Takas Pazarı Kuruldu · Yapraklar Sonbaharda Neden Renk Değiştirir? · Mahalle Bakkalı Sipariş Defterini Dijitale Taşıdı · Kemiklerimiz Hakkında İlginç Bilgiler · Köy Kadınları Kendi Pazarlarını Kurdu · Neden Aynada Sağ ve Sol Yer Değiştirir? · Yaşlı Bakım Evinde Kuşaklar Arası Bahçe · Mısırın Uzun Yolculuğu · Gençlik Merkezinde Ücretsiz Kod Kulübü · Arı Sokması Hakkında Bilinmesi Gerekenler · Kasabanın Yüz Yaşındaki Çınarına Doğum Günü · Bir Nehrin Hayatı: Kaynaktan Denize Uzun Bir Yolculuk (Dergi Dosyası) · Belediye Otobüslerine Bisiklet Askısı Takıldı · Ormanda Kaybolan Köpek Dört Gün Sonra Bulundu · Kırk Yıllık Terzi Mesleğini Gençlere Öğretiyor · Neden Gökyüzü Mavidir? · Lise Öğrencileri Kasabanın Sözlü Tarihini Kayda Geçirdi · Arılar Neden Önemlidir? · Mahalle Fırını Ekmek İsrafına Karşı Askıda Ekmek Başlattı · Gece Gökyüzünde Yıldız Kaymasını İzlemek · Engelli Bireyler İçin Dokunsal Harita Hazırlandı · Küçük Kasabada Büyük Satranç Turnuvası · Eski Tren İstasyonu Kültür Merkezine Dönüştürüldü · Su Döngüsü: Yağmur Nereden Gelir? · Okulda Telefonsuz Teneffüs Denemesi · Kaybolan Bir Yemeğin Peşinde: Ninelerin Tarif Defteri · Uyku Neden Önemlidir? Uzmanlar Ne Diyor? · Belediye Parkına Ücretsiz Kitap Kutuları Yerleştirildi · Dağ Köyünde Güneş Enerjisiyle Çalışan Su Pompası · İnsan Beyni Hakkında Beş Şaşırtıcı Bilgi · Kadınlar Kooperatifi Hasır Örgü Sanatını Yaşatıyor · Uluslararası Uzay İstasyonu Nedir? · Emekli Öğretmenler Köy Çocuklarına Çevrim İçi Ders Veriyor · Şehirde Sokak Ağaçlarına Kimlik Kartı · Kâğıt Nasıl Geri Dönüştürülür? · Kasabanın İlk Kadın Futbol Takımı Kuruldu · Gelgit Nedir ve Neden Olur? · Hayvan Barınağına Gönüllü Okuma Saatleri · Antik Kentte Yeni Bir Mozaik Gün Yüzüne Çıktı · Fermente Gıdalar: Turşudan Yoğurda · Akıllı Telefonla Çekilen Fotoğraflar Sergiye Dönüştü · Volkanlar Nasıl Oluşur? · Belediye Bahçe Sahibi Olmayanlara Hobi Bahçesi Ayırdı · Rüzgâr Enerjisi Nasıl Elektriğe Dönüşür? · Çocuklar Mahallelerinin Haritasını Çizdi · Göçmen Kuşlar Nasıl Yön Bulur? · Mahallenin Tamirci Kafesi: Atmak Yerine Onar · Kasabada Yeni Açılan Yüzme Havuzu Okullara Ücretsiz · Kahvenin Kısa Tarihi · Tarlada Robot Değil, Eşek: Organik Çiftlikte Eski Yöntemler · Mahalle Meclisi Parkın Yeni Tasarımına Karar Verdi · Gökkuşağı Nasıl Oluşur? · Liseli Gençler Yaşlılara Teknoloji Desteği Veriyor · Kar Taneleri Neden Altı Köşelidir? · Köy Okulu Kapanmaktan Kurtuldu · İnsanlık Ateşi Nasıl Kullanmaya Başladı? · Kasabada Yaşlılar İçin Ücretsiz Servis Başladı · Plastik Doğada Neden Bu Kadar Uzun Kalır? · Yerel Radyo Elli Yaşında · Türkiye'nin Gölleri Hakkında · Kampüste Bisiklet Paylaşımı Rekor Kırdı · Neden Esneriz? · Eski Değirmen Yeniden Un Öğütüyor · Okulda Yapay Zekâ Dersi: Öğrenciler Soruyor, Öğretmen Yönlendiriyor · Mantarlar Bitki mi, Hayvan mı? · Mahalle Korosu Hastane Bahçesinde Konser Verdi · Deniz Suyu Neden Tuzludur? · Kasaba Pazarında Plastik Poşet Kullanımı Yarıya İndi · Yıldızlar Neden Göz Kırpar? · Tiyatro Grubu Köy Köy Dolaşıyor · Gündüz Neden Ay'ı Görebiliriz? · Bir Gazetenin Yirmi Dört Saati · Kasabada Sessiz Saat Uygulaması: Market Işıkları Kısılıyor · Köprüler Nasıl Ayakta Durur? · Gençler Kasabanın İlk Podcast'ini Başlattı · Çay Bitkisinin Yolculuğu: Yapraktan Bardağa · Belediye Sokak Hayvanları İçin Su Kapları Yerleştirdi · Pusula Nasıl Çalışır? · Mahallede Herkes İçin Ücretsiz Yoga · İnsanlar Neden Ağlar? · Kasabanın Eski Hamamı Müzeye Dönüştü · Neden Hapşırırız? · Belediye Kütüphanesine Oyun Odası Açıldı · Bulutların Türleri ve Hava Durumu · Yetişkinler İçin Okuma Yazma Kursu Mezunlarını Verdi · Termometre Nasıl Çalışır? · Gönüllü İtfaiyeciler Köy Halkına Yangın Eğitimi Verdi · Kalemin Hikâyesi · Kasaba Okulunda Ortak Kahvaltı Günü · Deprem Çantasında Neler Olmalı? · Sokak Müzisyenleri İçin Belirlenen Alanlar Hayata Geçti · Kum Saatinden Atom Saatine: Zamanı Ölçmek

ÇIKTI BİÇİMİ — yalnızca bloklar, başka açıklama yazma. Her metin:

### | Metnin Başlığı
sub: <alt kategori> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri> | kind: <gerekirse, yukarıya bak>
---
Metnin gövdesi. Paragraflar arasında boş satır.

## Ara başlık (yalnızca orta/uzun metinlerde)

Devam paragrafı.

(Bloklar arasında bir boş satır bırak. "###" ile "|" arasına numara YAZMA.)
```
