**İşitme Egzersizi - Duyum App - v4.4** araştırması kapsamında defterde yer alan kaynaklar (`konular.md`, `degerlendirme-protokolu.md`, `karar-sablonu.md` ve `README.md`) detaylı bir şekilde incelenmiştir. 

Aşağıda, mevcut okuma ve dinleme platformunuzun geliştirilmesi amacıyla kaynaklardaki somut metodolojilere, kod mimarisi etkilerine ve araştırma standartlarına dayalı kapsamlı rapor sunulmuştur:

---

### 1. Araştırmanın Kapsamı
Defterdeki kaynaklar, **Duyum App (v4.4)** uygulamasının araştırma altyapısını, kalite değerlendirme standartlarını ve 8 temel alandaki teknik/içerik gereksinimlerini açıklamaktadır:

1. **Türkçe metinlerde seviye ölçütü:** Cümle uzunluğuna dayalı mevcut `autoLevel` mantığının yetersizliği ve Türkçe okunabilirlik formüllerinin (Ateşman, Bezirci-Yılmaz) kullanımı.
2. **CEFR ile eşleme:** 1/2/3 düzey ölçeğinin CEFR (A1–C2) okuma tanımlayıcıları ile ilişkisi ve resmî doğrulama olmaksızın etiketleme riskleri.
3. **Okuma hızı ve "okundu" ölçütü:** Sesli/sessiz okuma hızı varsayılanları (TR 110, EN 140 kelime/dk) ve kaydırma hareketinden bağımsız "okundu" kabul mekanizması.
4. **Metin türlerinin yapısı:** Diyalog, mektup/günlük, eleştirel karşılaştırma, haber ve bilgilendirici metinlerin zorunlu yapısal öğeleri.
5. **Telif, lisans ve yapay zekâ beyanı:** YZ destekli metinlerin lisanslanması (CC BY 4.0, CC0) ve okura şeffaf insan incelemesi beyanı.
6. **Okuma konforu ve tema:** W3C WCAG 2.2, Dyslexia Style Guide ve "Soft Reading" (yumuşak okuma) teması varsayılanları.
7. **Benzer uygulamalar:** İşitme kaybı olan yetişkinlere yönelik rehabilitasyon uygulamalarının pazarlama iddialarından arındırılmış analizi.
8. **Tarayıcı depolaması:** `localStorage` sınırları, Safari ITP 7 gün kuralı, IndexedDB geçişi ve `navigator.storage.persist()` kalıcı depolama izni.

---

### 2. Temel Bulgular
Kaynakların desteklediği önemli bulgular iki ana başlıkta toplanmıştır:

#### A. Metodolojik ve Operasyonel Bulgular (Kesin Kaynak Kuralları)
* **Klinik İddia Yasağı:** Uygulama içerisinde veya kullanıcı arayüzünde "işitmeyi geliştirir" gibi klinik/tıbbi iddialar **kesinlikle kullanılamaz**. Bunun yerine "düzenli okuma ve dinleme pratiği sunar" ifadesi tercih edilmelidir.
* **Güven Düzeyi Hiyerarşisi:** Araştırma bulguları Yüksek (resmî belge veya ≥2 bağımsız hakemli kaynak), Orta (tek iyi kaynak veya farklı bağlam) ve Düşük (uygulayıcı yazısı veya çelişkili kaynaklar) olarak sınıflandırılmalıdır. Düşük güvenli bulgular varsayılan ayar veya iddia olarak kullanılamaz, yalnızca isteğe bağlı ayar/öneri olabilir.
* **Telifli İçerik Kısıtı:** Telifli kitap metinleri araştırma defterlerinde incelenebilir ancak doğrudan uygulama içerisine metin olarak aktarılamaz.
* **Sayısal Doğrulama Kuralı:** Kelime/dakika gibi sayısal bir değer uygulamaya aktarılmadan önce en az 2 bağımsız kaynakta doğrulanmalıdır.

#### B. Konu Bazlı Parametre ve Sistem Bulguları
* **Seviyelendirme:** Sadece ortalama cümle uzunluğu metin seviyesini belirlemede yetersizdir; Türkçe gibi eklemeli dillerde kelime uzunluğu, sözcük sıklığı ve yan cümle sayısı dikkate alınmalıdır.
* **Veri Kaybı Riski:** PWA ve tarayıcı depolamasında Safari ITP'nin 7 günlük veri silme politikası, yalnızca `localStorage` kullanan sistemlerde kullanıcı ilerlemesinin ve özel metinlerinin silinme riskini doğurmaktadır.
* **İçerik Şeffaflığı:** Yapay zekâ tarafından üretilen metinlerin insan incelemesinden geçip geçmediği okuyucu panelinde açıkça beyan edilmelidir.

---

### 3. Kaynaklar
Aşağıdaki tabloda, bu araştırmayı şekillendiren temel kaynak dosyaları ve onların referans gösterdiği standartlar özetlenmiştir:

| Kaynak Dosya | Bağlantılı Standart / Çalışma | Doğrudan İlgili Konu / Bölüm |
| :--- | :--- | :--- |
| **`konular.md`** | Ateşman (1997), Bezirci-Yılmaz (2010)<br>Council of Europe CEFR Companion Volume (2020)<br>Brysbaert (2019) *How many words do we read per minute?*<br>W3C WCAG 2.2 (1.4.3, 1.4.8, 1.4.12) & Dyslexia Style Guide<br>Creative Commons (CC BY 4.0, CC0)<br>MDN Storage Quotas & web.dev | 8 temel araştırma konusunun teknik soruları, istemleri ve etkilediği kod dosyaları. |
| **`degerlendirme-protokolu.md`** | NotebookLM Değerlendirme Standardı | 5-15 kaynaklı defter yapısı, 3 kademeli güven hiyerarşisi, çift kaynak kuralı ve klinik iddia kısıtları. |
| **`karar-sablonu.md`** | Karar Kaydı Şablonu | Araştırma bulgularının Claude ve geliştirici ekibine aktarılma formatı. |
| **`README.md`** | Dosya Depo Mimarisi | Doldurulan karar kayıtlarının `sonuclar/` klasörüne aktarım kuralı. |

---

### 4. Uygulamaya Etkisi
Kaynaklarda açıkça tanımlanan bulguların mevcut okuma platformunun mimarisinde etkileyeceği modüller ve dosyalar şunlardır:

* **`js/reading/core.js` (`autoLevel`):** Cümle uzunluğu odaklı basit tahmin algoritması yerine Türkçe okunabilirlik formüllerini (Ateşman/Bezirci-Yılmaz) içeren dinamik seviye skorlama mantığı eklenecektir.
* **Okuma Kartları ve Süzgeçler:** CEFR etiketleme mantığı güncellenecek; istem dosyalarındaki seviye tanımları yenilenecektir.
* **`DEFAULT_WPM` ve Süre Sınıfları:** Türkçe (110 kelime/dk) ve İngilizce (140 kelime/dk) sesli okuma varsayılanları ile kaydırmadan bağımsız "okundu" işaretleme mantığı (`§1 #14`) güncellenecektir.
* **`js/reading/rules.js` (`GUIDE`):** Diyalog, mektup, haber ve bilgilendirici metin türlerine ait zorunlu yapısal kurallar ve istem rehberleri entegre edilecektir.
* **`categories.json` ve Okuyucu Görünümü:** Metin bazında `origin` (üretim kaynağı) ve `reviewed` (insan incelemesi durumu) alanları ile lisans bilgileri arayüzde gösterilecektir.
* **Faz 6 Tema Çalışması:** WCAG 2.2 uyumlu "Soft Reading" (yumuşak okuma) teması, sistem teması geçişi ve okuyucu görünüm paneli ayarları eklenecektir.
* **`js/store.js` (Depolama Mimarisi - Faz 6):** `localStorage` üzerindeki kritik veriler IndexedDB mimarisine taşınacak ve `navigator.storage.persist()` izni için kullanıcı bilgilendirmesi eklenecektir.
* **Ana Sayfa ve İlerleme Ekranı:** Bütün klinik/tıbbi iddialar kaldırılacak, pazarlama dili temizlenerek dürüst egzersiz dili kullanılacaktır.

---

### 5. İçerik Gereksinimleri
Kaynaklardaki doğrudan kurallar ve kaynaklara dayalı çıkarımlar ayrıştırılmıştır:

#### Kaynaklardaki Doğrudan Kurallar (Kesin)
* **Telif İhlali Yasağı:** Telif hakkı bulunan kitap veya yayın metinleri doğrudan okuma içeriği olarak sisteme yüklenemez.
* **Yapay Zekâ Şeffaflığı:** Üretilen her metinde "Yapay zekâ destekli taslak, insan incelemesinden geçti / geçmedi" beyanı bulunmalıdır.
* **Haber Metni Uyarısı:** Okuma pratiği için yazılan kurgusal haber metinlerinin gerçek haber sanılmaması için özel yapısal veya görsel önlemler alınmalıdır.

#### Kaynaklara Dayalı Çıkarımlar ve Öneriler
* **Metin Seviyelendirmesi:** Türkçe metinlerde seviye (1/2/3 veya Kolay/Orta/İleri) belirlenirken sadece kelime sayısı değil; hece/kelime oranı, sözcük sıklığı ve yan cümle bağıntıları ölçülmelidir.
* **Tür Yapısı:** Diyalog, mektup, haber ve karşılaştırma metinlerinin her biri için zorunlu yapı bileşenleri (şablona uygunluk) doğrulanmalıdır.

---

### 6. Kullanıcı Deneyimi (UX)
Okuma konforu, erişilebilirlik ve kullanım kolaylığı için kaynaklar ışığında sunulan iyileştirmeler:

* **WCAG 2.2 Uyumlu Görünüm:** Metin okuyucuda kontrast oranı en az 4.5:1 (WCAG 1.4.3) seviyesinde tutulmalı; satır uzunluğu, satır aralığı ve harf aralığı kullanıcının değiştirebileceği esneklikte sunulmalıdır.
* **Soft Reading (Yumuşak Okuma) Teması:** Uzun süreli okumalarda göz yorgunluğunu ve parlamayı azaltan renk paleti varsayılan seçenek olarak eklenmelidir.
* **Erişilebilir Okuma Kuralları:** British Dyslexia Association rehberi doğrultusunda disleksi dostu yazı tipi ve biçimlendirme alternatifleri sağlanmalıdır.
* **Veri Güvenliği UX Bildirimi:** Safari ve mobil tarayıcılarda veri silinmesini önlemek için kullanıcıya kalıcı depolama izninin (`persist`) nedeni açık ve güven verici bir dille açıklanmalıdır.
* **Dürüst Etkileşim Dili:** Kullanıcıya yanıltıcı klinik vaatler yerine şeffaf ve gerçekçi ilerleme raporları sunulmalıdır.

---

### 7. Somut Gereksinimler (Test Edilebilir)

* **REQ-01 (Seviye Hesabı):** `js/reading/core.js` içerisindeki `autoLevel` fonksiyonu, metnin ortalama cümle ve kelime uzunluğunu Türkçe okunabilirlik formüllerine göre skorlamalı ve unit testlerle doğrulanabilmelidir.
* **REQ-02 (Metin Beyanı):** Okuma arayüzünde her metin için `origin` (ör. `ai-generated`) ve `reviewed` (ör. `true/false`) parametrelerine bağlı olarak "YZ Taslak - İnsan İncelemesinden Geçti/Geçmedi" etiketi görünür şekilde basılmalıdır.
* **REQ-03 (Okuma Hızı ve Okundu Kabulü):** Okuma süresi hesabı Türkçe için `DEFAULT_WPM = 110` kabul etmeli; metnin "okundu" işaretlenmesi için ekranın sadece kaydırılması değil, WPM değerine oranlı minimum sürenin geçmesi şartı aranmalıdır.
* **REQ-04 (Soft Reading Teması):** Tasarlanan Soft Reading teması WCAG 2.2 1.4.3 kontrast standardını (≥ 4.5:1) sağlamalı ve otomatik linter/test aracıyla doğrulanmalıdır.
* **REQ-05 (Depolama Geçişi):** `js/store.js`, `localStorage` kotasını kontrol etmeli; veri büyüklüğü veya Safari ITP tespiti durumunda verileri IndexedDB'ye aktarmalı ve `navigator.storage.persist()` çağrısı yapmalıdır.
* **REQ-06 (Lisans Denetimi):** `categories.json` içindeki her kategori ve metin için geçerli bir lisans notu (CC BY 4.0, CC0 vb.) tanımlanmış olmalıdır.
* **REQ-07 (Metin/Pazarlama Filtresi):** Kullanıcı arayüzü ve rehber metinlerinde "tedavi eder", "işitmeyi geliştirir" gibi klinik ifadelerin bulunmadığı statik kod analizi/string taraması ile test edilmelidir.

---

### 8. Öncelik Sınıflandırması

```
[ KRİTİK ] ──► Klinik İddia Temizliği & Yasal Uyum / Depolama Güvenliği (IndexedDB)
[ YÜKSEK  ] ──► YZ & Lisans Şeffaflığı / WCAG 2.2 & Soft Reading Okuma Konforu
[ ORTA    ] ──► Türkçe autoLevel Okunabilirlik Algoritması / Okuma Hızı (WPM)
[ DÜŞÜK   ] ──► CEFR Resmî Eşleme Etiketleri
```

* **Kritik Öncelik:**
  * **Klinik İddiaların Kaldırılması:** Yasal ve tıbbi sorumluluk risklerini önlemek için.
  * **Telifli Metin Yasağı:** Yasal hak ihlallerini engellemek için.
  * **IndexedDB ve Kalıcı Depolama Mimarisi:** Safari ITP 7 gün kuralı nedeniyle kullanıcı verilerinin silinmesini engellemek için.
* **Yüksek Öncelik:**
  * **YZ Beyanı ve Lisans Notları (`origin`, `reviewed`):** Kullanıcı güveni ve şeffaflık için.
  * **WCAG 2.2 ve Soft Reading Erişilebilirliği:** Okuma konforunu ve disleksi/göz yorgunluğu desteğini doğrudan etkilediği için.
* **Orta Öncelik:**
  * **Türkçe Okunabilirlik Formülleri ile `autoLevel` Güncellemesi:** İçerik kalitesini ve doğru hedef kitle eşlemesini iyileştirdiği için.
  * **WPM ve "Okundu" Mantığı:** İlerleme raporlarının doğruluğunu artırdığı için.
* **Düşük Öncelik:**
  * **CEFR Düzey Eşlemesi:** Resmî kurum doğrulaması olmadan etiket kullanmak risk taşıdığından, detaylı araştırmalar tamamlanana kadar ertelenebilir.

---

### 9. Belirsizlikler (Kaynakların Cevaplamadığı Hususlar)
Defterde yer alan 4 ana dosya genel araştırma çerçevesini çizmekte olup aşağıdaki özel detaylar henüz bu kaynaklarda **sayısal/kesin olarak yanıtlanmamıştır**:

1. **Ateşman ve Bezirci-Yılmaz Eşik Değerleri:** Formüllerin Türkçe metinlerde 1/2/3 (Kolay/Orta/İleri) düzeylerine karşılık gelen kesin sayısal kesim noktaları (eşik skorları) bu metinlerde sunulmamıştır (ilgili alt defterlerde araştırılması öngörülmüştür).
2. **Eklemeli Dil Katsayıları:** Brysbaert (2019) çalışmasının İngilizce odaklı verilerinin Türkçe gibi eklemeli dillerdeki hece/kelime bazlı net düzeltme katsayısı verilmemiştir.
3. **Soft Reading Renk Kodları:** Soft Reading teması için WCAG 2.2'yi sağlayan spesifik Hex/RGB renk kodları ve doygunluk değerleri yer almamaktadır.
4. **Safari ITP Persist Kabul Oranları:** `navigator.storage.persist()` fonksiyonunun iOS Safari PWA modunda yüzde kaç oranında onaylandığına dair ampirik veri bulunmamaktadır.

---

### 10. Ek Araştırma İhtiyaçları
Aşağıdaki soruların yanıtlanması için `degerlendirme-protokolu.md` standartlarına uygun olarak 8 ayrı araştırma defterinin çalıştırılması gerekmektedir:

1. **Türkçe Okunabilirlik:** Ateşman (1997) ve Bezirci-Yılmaz (2010) formüllerinin dijital okuma metinlerindeki doğruluk oranları ve 3 seviyeli eşik değerleri ne olmalıdır?
2. **CEFR Uyumu:** CEFR Companion Volume (2020) okuma tanımlayıcıları, resmî akreditasyon olmaksızın Türkçe metinlere nasıl esnetilmeden uygulanabilir?
3. **Türkçe Okuma Hızı:** Yetişkinlerde Türkçe sesli ve sessiz okuma hızı (kelime/dk ve hece/dk) dağılımı nedir?
4. **Metin Türü Şablonları:** Diyalog, mektup ve kurgusal haber metinleri yazımı için YZ istemlerine eklenecek kesin sınır kuralları nelerdir?
5. **Telif ve YZ Mevzuatı:** CC BY 4.0 ve CC0 lisanslarının YZ tarafından üretilip insan tarafından düzenlenen metinlerdeki güncel hukuki karşılığı nedir?
6. **Erişilebilirlik Parametreleri:** WCAG 2.2 (1.4.3, 1.4.8, 1.4.12) uyarınca optimum satır uzunluğu (ch), satır yüksekliği (line-height) ve harf aralığı (letter-spacing) değerleri nelerdir?
7. **Pazar Rakipleri:** İşitsel rehabilitasyon ve dinleme pratiği sunan uygulamaların kullandığı akademik dayanaklar ve kaçınılması gereken pazarlama ifadeleri nelerdir?
8. **PWA Depolama:** Tarayıcıların (özellikle Safari ITP) IndexedDB veri saklama süreleri ve `persist()` izin koşulları güncel olarak nasıl davranmaktadır?

---

### 11. Claude'a Aktarılacak Sonuç (Uygulama Spesifikasyon Raporu)

Aşağıdaki blok, kaynak referansları korunarak geliştirici yapay zekânın (Claude vb.) doğrudan sistem güncellemelerine dönüştürebileceği **Karar Kaydı** formatında hazırlanmıştır:

```markdown
# Uygulama Spesifikasyon Raporu — Duyum App v4.4 Araştırma Çerçevesi

## 1. Temel İlkeler ve Klinik İletişim Sınırları
- **Klinik İddia Yasağı:** Arayüz, rehber ve pazarlama metinlerinde "işitmeyi geliştirir/tedavi eder" ifadeleri kesinlikle kullanılmayacak. Yalnızca "düzenli okuma ve dinleme pratiği sunar" ifadesi yer alacak.
- **Güven Standardı:** Yüksek güvenli (resmî belge / ≥2 hakemli kaynak) bulunmayan özellikler varsayılan ayar olarak sisteme gömülmeyecek.
- **Telif Kısıtı:** Telifli kitap metinleri uygulama veritabanına eklenmeyecek.

## 2. Kod ve Mimari Değişiklik Tablosu

| Modül / Dosya | Mevcut Durum | Önerilen Değişiklik | Güven Düzeyi |
| :--- | :--- | :--- | :--- |
| `js/reading/core.js` | Basit cümle uzunluğu tahmini (`autoLevel`) | Türkçe okunabilirlik formülleri (Ateşman / Bezirci-Yılmaz) entegrasyonu | Orta |
| `js/reading/rules.js` | Genel kılavuz kuralları | Tür bazlı (diyalog, mektup, haber) zorunlu yapı şablonları (`GUIDE`) | Yüksek |
| `js/store.js` | `localStorage` odaklı depolama | IndexedDB geçişi + `navigator.storage.persist()` yönetimi | Yüksek |
| `categories.json` | Standart kategori yapısı | `origin` (YZ/İnsan), `reviewed` (boolean) ve `license` alanları | Yüksek |
| `DEFAULT_WPM` | Sabit okuma hızı | TR: 110 WPM, EN: 140 WPM sesli okuma varsayılanları + Süre bazlı okundu kabulü | Orta |
| UI / Temalar | Klasik temalar | WCAG 2.2 uyumlu "Soft Reading" teması & Harf/Satır esnekliği | Yüksek |

## 3. Doğrulama ve Test Kriterleri
1. **[Test-01]** UI üzerinde "tedavi/klinik iyileşme" terimleri içermediği linter/string arama ile doğrulanmalıdır.
2. **[Test-02]** `autoLevel` birimleri Türkçe metin skorlamasında cümle + kelime uzunluğunu girdi olarak almalıdır.
3. **[Test-03]** YZ üretimi metinlerde "YZ Taslak - İnsan İncelemesinden Geçti/Geçmedi" etiketi görünür olmalıdır.
4. **[Test-04]** Soft Reading teması kontrast oranı ≥ 4.5:1 (WCAG 2.2 AA) sağlamalıdır.
5. **[Test-05]** Depolama katmanı IndexedDB fallback mekanizmasını çalıştırmalıdır.
```

---

💡 **Sonraki Adım:** Bu araştırmada tespit edilen 8 temel konudan biri için (örneğin **Türkçe Okunabilirlik Formülleri** veya **WCAG 2.2 Soft Reading Teması**) detaylı alt araştırma yürütmek veya ilgili karar kaydı dosyasını oluşturmak ister misiniz?