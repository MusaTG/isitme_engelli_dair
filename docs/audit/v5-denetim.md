# v5 — Faz 1 denetim raporu

Tarih: 2026-10-24 · Denetlenen sürüm: 4.1.0 · Bu fazda uygulama kodu **değiştirilmedi**; yalnızca ölçüm, test ve gözlem yapıldı.

## 0. Ne incelendi, nasıl doğrulandı

| Kontrol | Yöntem | Sonuç |
|---|---|---|
| Derleme / içerik güncelliği | `node tools/build-reading.mjs --check` | Geçti (derlenmiş JSON kaynakla aynı) |
| Kategori başına ≥100 şartı | `node tools/build-reading.mjs --strict` | **Başarısız** (beklenen: 23 dil×kategori eksik) |
| Birim testleri | `npm test` | 72 test: 71 geçti, 0 hata, 1 TODO (100 metin şartı) |
| İçerik istatistiği | Katalog + gövde JSON’larının betikle taranması | Aşağıda §2 |
| İçe aktarma | Kopya depoda gerçek dosyayla iki kez çalıştırma, CSV deneme | Aşağıda §3 |
| Erişilebilirlik | axe-core 4.10 (WCAG 2.0/2.1/2.2 A–AA), 4 uygulama teması × 11 sayfa + 4 okuyucu teması | Aşağıda §4 |
| Taşma / büyütme | 320 px, 390 px ×1,5 yazı, 1280 px ×2 yazı; 11 sayfa | Aşağıda §4 |
| Klavye odağı | Kütüphanede 40 Tab adımı, odak görünürlüğü | Aşağıda §4 |
| Okuma konumu / tema değişimi | Playwright: kaydırma, tema değiştirme, End tuşu | Aşağıda §5 |
| Arama performansı | 2.760 metinlik yapay katalogda 2 kelimelik arama (Node) | ~80 ms/arama |

**Teknoloji:** Derleme gerektirmeyen statik PWA — saf JavaScript (ES modülleri, 59 dosya), el yazımı CSS (tasarım belirteçleri `css/tokens.css`), framework/bağımlılık yok. Veri: tarayıcı `localStorage` (tek anahtar, şema 4). İçerik: `content-src/reading/<dil>/*.txt` → Node betiği → `content/reading/**.json`. Yayın: GitHub Actions → Pages. Testler: `node:test` (birim), Python Playwright (uçtan uca; CI’da **çalışmıyor**).

## 1. Eksiklik tablosu (önem sırasıyla)

| # | Alan | Mevcut durum | Tespit edilen sorun | Öncelik | Çözüm önerisi | Test yöntemi |
|---|---|---|---|---|---|---|
| 1 | Veri bütünlüğü | Tüm kullanıcı verisi tek `localStorage` anahtarında | Kayıtlı veri bozuk okunursa (JSON hatası) uygulama boş durumla açılıyor ve **ilk kayıtta bozuk veri kalıcı olarak üzerine yazılıyor**; yedek kopya yok | **Kritik** | Okuma hatasında ham veriyi ayrı anahtara karantinaya al, kullanıcıya “kurtar / indir / sıfırla” seçeneği göster; kayıttan önce son sağlam kopyayı sakla | Birim: bozuk JSON ile `createStore` → ham veri korunuyor mu |
| 2 | Veri bütünlüğü | Okuma konumu birkaç saniyede bir kaydediliyor | Her kayıtta **tüm durum** (profiller, notlar, kendi metinleri, 1.500’e kadar oturum) yeniden yazılıyor; kota (~5 MB) dolunca kayıt sessizce başarısız olabiliyor (yalnızca bazı ekranlarda uyarı var) | **Yüksek** | Okuma verisini (özellikle kendi metinleri/yapay zekâ metinleri) IndexedDB’ye taşıyan geriye dönük uyumlu geçiş; kota hatasında her ekranda görünür uyarı | Birim: kota hatası taklidi; e2e: 200 uzun metinle kayıt |
| 3 | İçerikler | TR 552 metin, EN 0 | 23 dil×kategori boş/eksik (§2); **2.250 metin eksik** | **Yüksek** | Faz 4: toplu üretim + toplu aktarma | `reading-status` + strict derleme |
| 4 | Okuma deneyimi / tema | Okuyucu teması (açık/sepya/koyu/loş) yalnızca metin sütununu boyuyor | Uygulama teması ile okuyucu teması karışınca düğme/bağlantı renkleri uygulama temasından geliyor: **koyu okuyucu temasında “Kütüphaneye dön” neredeyse görünmüyor**; axe: açık okuyucu + kontrast uygulama temasında kontrast **1,02:1** (beyaz üstüne beyaz). İçindekiler ve bilgi paneli okuyucu temasına uymuyor | **Yüksek** | Okuyucu temasını kendi tam belirteç setine (metin, bağlantı, düğme, kenarlık, odak, vurgu) bağla; panelleri de kapsat | axe: tüm uygulama×okuyucu teması kombinasyonları (20) |
| 5 | İçerik aktarımı | `inbox/` + `reading:import` çalışıyor | Bir dosya işlenince **önce taşınıyor, kabul edilen metinler en sonda yazılıyor**: arada hata olursa metin kütüphaneye girmez (dosya `_islendi/` altında kalır ama kimse bilmez). Yazmalar atomik değil | **Yüksek** | Önce hepsini doğrula → geçici dosyaya yaz → atomik yeniden adlandır → en son kaynak dosyayı taşı | Birim: yazma sırasında hata taklidi → kaynak ve kütüphane bozulmuyor |
| 6 | İçerik aktarımı | Tekrar çalıştırma kopya üretmiyor | Aynı dosya yeniden aktarılınca kayıtlar **“hatalı” (Ret)** sayılıyor, “tekrar olduğu için atlandı” olarak ayrılmıyor; içerik özetiyle (hash) değil başlık/benzerlikle tespit ediliyor | Orta | İçerik özeti + kaynak kimliği ile “eklenecek / güncellenecek / atlanacak / hatalı” ayrımı | Birim: aynı dosyayı 2 kez aktar → 0 eklenen, N atlanan |
| 7 | İçerik aktarımı | `--dry` var | Ön izlemede **dil/kategori dağılımı ve sayısal özet yok**; onay adımı yok; güncelleme (var olan kaydı kimlikle düzeltme) yolu yok | Orta | `--dry` → özet tablo + JSON rapor; `--apply` ile onay; `id:` alanıyla kontrollü güncelleme | Birim + örnek dosya |
| 8 | İçerik aktarımı | .txt/.md/.json kabul | **.csv sessizce yok sayılıyor** (“inbox boş” deniyor); desteklenmeyen dosya bildirilmiyor | Orta | CSV ekle (başlık, gövde, dil, kategori… sütunları) ya da desteklenmeyen dosyayı açıkça raporla | Birim |
| 9 | İçerik aktarımı (uygulama içi) | “Dosyadan içe aktar” | Hatalı kayıtlar yalnızca **tarayıcı konsoluna** yazılıyor; kullanıcı yalnızca “n hatalı” sayısını görüyor; ön izleme/onay yok | Orta | İçe aktarma ön izleme penceresi: kayıt bazında durum ve gerekçe | e2e: hatalı + geçerli karışık dosya |
| 10 | İçerik şeması | Lisans kategori düzeyinde | Metin başına **kaynak / lisans / yazar / üretim bilgisi alanı yok** (kendi metinlerinde var, kütüphanede yok); metin başına özet çoğunda yok | Orta | Şemaya isteğe bağlı `source`, `license`, `author`, `origin` (ör. `ai-draft`, `human`, `cc-by`), `reviewed` alanları; status raporunda eksiklerin listesi | Birim: şema doğrulama |
| 11 | İçerik kalitesi | Seviye yazılmazsa cümle uzunluğundan tahmin | Tahmin sapmalı: haber/bilgi/gezide metinlerin **%72–82’si “ileri”**, öykülerde %77 “orta” — seviye süzgeci güvenilir değil; CEFR karşılığı yok | Orta | Seviye zorunlu alan + açık tanım (TR için ölçüt, EN için CEFR A1–C1); tahmin yalnızca uyarı | Rapor: kategori × seviye dağılımı |
| 12 | İçerik kalitesi | Uzunluk sınıfları | Metinlerin çoğu çok kısa: medyan 150–220 kelime (~1,5–2 dk); özgün istekteki “kısa 2–5 dk” bandının altında. Uzun metinler ~2.750 kelime = ~25 dk; istenen “uzun 30–60 dk” tanımına ulaşmıyor; orta metin her kategoride yalnızca 1–6 | Orta | Uzunluk bantlarını belgelenmiş tanıma bağla, hedef dağılım belirle (ör. kısa %60 / orta %30 / uzun %10) | `reading-status` dağılım raporu |
| 13 | Okuma deneyimi | Bilgi panelinde “Okuma durumu” seçimi | Kaydırınca model “devam ediyor” olduğu hâlde seçim kutusu **“Başlamadım”da kalıyor** (ekran güncellenmiyor) | Orta | Konum kaydında durum alanını yenile | e2e |
| 14 | Okuma deneyimi | İlerleme = konum yüzdesi | End tuşu/hızlı kaydırma ile **%100** görünüyor; “okunan” ile “konum” ayrılmıyor (durum kendiliğinden “tamamlandı” olmuyor, bu doğru) | Orta | Konum % ile “okunan aşama” (aşamada geçirilen süre eşiği) ayrımı | e2e: End tuşu → %100 ama aşamalar okunmadı |
| 15 | Duyarlı tasarım | Okuma alt menüsü | 390 px + yazı ×1,5’te okuma sayfalarında **20 px yatay taşma** (alt menü) | Orta | Menüyü taşma kabına hapset / büyük yazıda iki satır | Taşma testi (3 genişlik × 3 ölçek) |
| 16 | Erişilebilirlik | Hedefler sekme çubuğu | axe kritik: `.tabbar` (role=tablist) içinde izin verilmeyen `select` | Orta | Seçimi tablist dışına al | axe |
| 17 | Tema | 4 uygulama teması (açık, koyu, pastel, yüksek kontrast) + 5 okuyucu teması | “Sistem temasını izle” seçeneği yok; okuyucu ve uygulama temaları iki ayrı sistem (karışık kombinasyonlar test edilmiyor); “yumuşak okuma” teması yalnızca okuyucuda | Düşük–Orta | Tek belirteç sistemi; “sistem” seçeneği; okuyucu temalarını uygulama temalarıyla eşleştir | axe + ekran görüntüsü matrisi |
| 18 | Test altyapısı | Birim testleri CI’da | Uçtan uca (Playwright) ve erişilebilirlik testleri **CI’da çalışmıyor**; lint/biçim denetimi yok | Orta | CI’a Playwright + axe işi ekle | CI |
| 19 | Performans | Arama bellekte, 220 ms gecikmeli | 2.760 metinde ~80 ms/arama (Node; telefonda 3–5 kat olabilir); `search.json` şimdi 0,78 MB, hedef içerikte dil başına ~2 MB tahmini; kataloglar önbelleğe ön yükleniyor | Düşük–Orta | Ön ek dizini / Web Worker’da arama; arama dizinini parçala | Tarayıcıda ölçüm (düşük güçlü profil) |
| 20 | Dış bağımlılık | Yapay zekâ üretimi, GitHub’a öneri | Gerçek servislerle ve gerçek depoda **hiç denenmedi** (anahtar ve ağ yok) | Kullanıcı girdisi | Kullanıcının kendi anahtarıyla bir kez canlı deneme | Elle |

## 2. Gerçek içerik sayıları (derlenmiş kütüphaneden, 2026-10-24)

Türkçe: **552 metin, 552 benzersiz**, 128.902 kelime. İngilizce: **0**. Hedef her dil × kategori 100 → **2.250 eksik**. Yer tutucu yok.

| Kategori | TR | Eksik | Kısa / Orta / Uzun | Seviye 1/2/3 | Medyan kelime | Alt kategori kapsamı | Not | EN |
|---|---:|---:|---|---|---:|---|---|---:|
| Günlük yaşam | 101 | 0 | 94 / 6 / 1 | 8 / 87 / 6 | 220 | 8/8 | | 0 |
| Öykü | 100 | 0 | 98 / 1 / 1 | 14 / 77 / 9 | 210 | 9/9 | | 0 |
| Roman tarzı | 101 | 0 | 98 / 2 / 1 | 23 / 72 / 6 | 204 | 7/7 | 10 dizi × 10 bölüm + 1 uzun | 0 |
| Haber / dergi | 100 | 0 | 98 / 1 / 1 | 0 / 21 / 79 | 152 | 9/9 | 56 kurgusal haber, 44 dergi yazısı (etiketli) | 0 |
| Bilgilendirici | 100 | 0 | 98 / 1 / 1 | 0 / 18 / 82 | 160 | 12/12 | | 0 |
| Gezi | 50 | **50** | 50 / 0 / 0 | 1 / 13 / 36 | 151 | 6/6 | 11 kurgusal günlük; orta/uzun yok | 0 |
| Diyalog | 0 | **100** | — | — | — | — | | 0 |
| İş | 0 | **100** | — | — | — | — | | 0 |
| Şiir | 0 | **100** | — | — | — | — | | 0 |
| Dil / telaffuz | 0 | **100** | — | — | — | — | | 0 |
| Çocuk | 0 | **100** | — | — | — | — | | 0 |
| Uzun okuma | 0 | **100** | — | — | — | — | | 0 |
| Günlük / mektup | 0 | **100** | — | — | — | — | | 0 |
| Eleştirel düşünme | 0 | **100** | — | — | — | — | | 0 |
| **Toplam** | **552** | **850** | | | | | | **0 (1.400 eksik)** |

Ek gözlemler: başlıksız metinlerin %88–100’ü otomatik aşamalara bölünüyor (“Kısım n”); hiçbir paragraf 140 kelimeyi aşmıyor; tüm metinlerde etiket var; özet yalnızca 3 metinde; metin başına kaynak/lisans/inceleme bilgisi yok; tamamı “yapay zekâ destekli taslak, insan incelemesi bekliyor” notuyla.

## 3. İçerik ekleme altyapısı — doğrulanan durum

| Bileşen | Var mı | Çalışıyor mu (denendi) | Sorun |
|---|---|---|---|
| `content-src/reading/inbox/<dil>/<kategori>/` | Evet | Evet | — |
| `npm run reading:import` (+ `--dry`) | Evet | Evet: numaralama, denetim, rapor, ret klasörü | §1 #5–8: atomik değil; tekrar = hata sayılıyor; özet/dağılım yok; güncelleme yok; CSV sessiz |
| `node tools/reading-status.mjs` | Evet | Evet | Yalnızca Markdown çıktı; makine okunur (JSON) rapor yok; bozuk/tekrar/kaynak eksik listesi yok; seviye dağılımı yok |
| `docs/reading/istemler/` (26 dosya) | Evet | Üretiliyor | Çok-metinli tek yanıtın kalite kontrolü kullanıcıya kalmış |
| `docs/reading-format.md` | Evet | — | CSV ve güncelleme anlatılmıyor |
| Yayın iş akışında otomatik aktarma | Evet | **GitHub’da denenmedi** | Depoya geri yazma için izin gerekir; aynı anda iki gönderimde `git push` çakışabilir (yeniden deneme yok) |
| Uygulama içi “Dosyadan içe aktar” | Evet | Evet (e2e) | Hatalar konsolda; ön izleme yok; yalnızca o cihaza ekler |
| Yapay zekâ ile oluştur | Evet | Taklit servisle evet | Gerçek servisle denenmedi; tek tek üretim (toplu üretim yok) |

## 4. Tema ve erişilebilirlik bulguları

axe-core taraması (WCAG 2.0/2.1/2.2 A–AA), açık/koyu/pastel/yüksek kontrast temalarında 11 sayfa + 4 okuyucu teması:

| Bulgu | Etki | Nerede | Durum |
|---|---|---|---|
| Kontrast 1,02:1 (beyaz yazı, açık zemin) | Ciddi | Okuyucu açık/sepya teması + uygulama yüksek kontrast/koyu teması; “Kütüphaneye dön” | Doğrulandı (ekran görüntüsü: koyu okuyucu + açık uygulama temasında da neredeyse görünmez) |
| `aria-required-children` | Kritik | Hedefler sekme çubuğu (tüm temalar) | Doğrulandı |
| Yatay taşma 20 px | — | Okuma ana sayfası ve kütüphane, 390 px + yazı ×1,5 | Doğrulandı; 320 px ×1 ve 1280 px ×2’de taşma yok |
| Klavye odağı | — | 40 Tab adımında görünmeyen odak yok (arama kutusunun odağı kapsayıcıda gösteriliyor — bilinçli) | Geçti |
| Hareket azaltma | — | Sistem/elle ayar; kaydırma ve geçişlerde uygulanıyor | Kod incelemesi + mevcut testler |
| Dil etiketi | — | Okuyucu metne `lang` veriyor | Geçti |
| Konsol hataları | — | Tarama boyunca 0 | Geçti |

Tasarım sistemi gözlemleri (görsel inceleme): belirteçli 4 tema tutarlı; v4.1’de yerel form denetimleri temaya bağlandı. Kalan sorunlar: okuyucu teması ile uygulama teması iki ayrı sistem; “sistem temasını izle” yok; okuyucu yan panelleri (içindekiler, bilgi) metin sütunu koyuyken açık kalıyor; boş/yükleme durumları ve hata kutuları tüm temalarda ekran görüntüsüyle karşılaştırılmadı (axe kontrast dışında).

## 5. Okuma deneyimi — doğrulananlar

Çalışıyor (Playwright ile): yazı boyutu, satır/paragraf aralığı, sola/ortaya/iki yana hizalama, sütun genişliği, okuyucu temaları, içindekiler (masaüstünde yerleşik, telefonda çekmece, etkin bölüm işaretli, tıklayınca gidiyor), ayraç/vurgu/not, kalınan yere dönüş (yeniden yüklemede), arama (Türkçe harf katlama, vurgu, boş sonuç + süzgeç temizleme), **tema değişiminde konum ve yazı boyutu korunuyor**. Sorunlu: §1 #13 (durum kutusu), #14 (End ile %100).

## 6. NotebookLM ile araştırılması gereken konular (eksiklere göre önceliklendirilmiş)

Zaten çözülmüş olanlar (okuyucu ayarları, içindekiler, Türkçe arama) yeniden araştırılmıyor.

| Öncelik | Konu | Hangi eksiğe bağlı | Cevaplanması gereken çekirdek sorular | Öncelikli kaynak türü |
|---|---|---|---|---|
| 1 | **Türkçe metin zorluk seviyelendirmesi** | #11, #12 | Türkçe için geçerli okunabilirlik formülleri (ör. Ateşman, Bezirci–Yılmaz, Çetinkaya–Uzun) neyi ölçer, sınırları ne? Yetişkin okuma metinleri için kaç seviye ve hangi ölçütler? Kelime sıklığı listesi var mı? | Hakemli Türkçe dil bilimi/eğitim makaleleri, MEB/TÖMER öğretim programları |
| 2 | **İngilizce CEFR seviyesine uygun metin** | #3 (EN), #11 | A1–C1 için metin uzunluğu, kelime sıklığı, cümle yapısı ölçütleri; CEFR tanımlayıcıları okuma metnine nasıl uygulanır; otomatik seviye kestiriminin güvenilirliği | Council of Europe CEFR Companion Volume, Cambridge/British Council belgeleri, hakemli çalışmalar |
| 3 | **Okuma oturumu süresi ve metin uzunluğu** | #12, #14 | Yetişkinlerde sessiz/sesli okuma hızları (TR/EN), kısa/orta/uzun bant tanımları; “okundu” saymak için dwell-time/konum yöntemleri | Okuma hızı meta-analizleri, göz izleme çalışmaları |
| 4 | **Metin türlerinin yapı ölçütleri** (diyalog, mektup, haber, şiir, eleştirel metin, iş yazışması) | #3, içerik kalitesi | Her tür için öğretici örnek metnin asgari öğeleri; kurgusal haberin etik etiketleme önerileri; eleştirel okuma metninde iddia–kanıt yapısı | Metin dilbilimi, gazetecilik etiği kılavuzları, okuma eğitimi literatürü |
| 5 | **Telif, açık lisans ve yapay zekâ ile üretilmiş içerik beyanı** | #10 | Yapay zekâ destekli metinlerin lisanslanması ve beyanı (TR/AB); CC BY ile yayınlamanın koşulları; metin başına hangi kaynak/lisans alanları gerekli | Creative Commons belgeleri, AB yapay zekâ mevzuatı özetleri, FSEK |
| 6 | **Uzun okumada okuma konforu ve tema** | #4, #17 | Koyu/sepya temaların okuma performansına etkisi; satır uzunluğu ve aralığı için kanıt; disleksi dostu ayarlar | WCAG 2.2 + Understanding belgeleri, BDA Style Guide, hakemli HCI çalışmaları |
| 7 | **Benzer okuma uygulamaları** | ürün kararları | İlerleme, yer imi, seviye, içerik keşfi nasıl tasarlanmış; kullanıcı şikâyetleri | Ürün belgeleri, bağımsız incelemeler, kullanıcı araştırmaları |
| 8 | **Tarayıcıda kalıcı depolama güvenilirliği** | #1, #2 | localStorage/IndexedDB kota ve tahliye politikaları (Safari/Chrome/Firefox), `storage.persist()` etkisi | MDN, WHATWG Storage Standard, tarayıcı belgeleri |

Her konu için ayrıntılı NotebookLM istemleri ve `docs/research/notebooklm/` paket şablonu Faz 5’te hazırlanacak.

## 7. Sonraki adım (önerilen sıra)

1. Faz 2 — kritik: #1 (bozuk veride kayıp), #5 (atomik aktarma), #4 (okuyucu teması kontrastı), #16, #13.
2. Faz 3 — aktarma: #6, #7, #8, #9, #10 + JSON durum raporu.
3. Faz 4 — içerik: dış üretim + toplu aktarma (2.250 metin).
4. Faz 5 — NotebookLM paket yapısı + istemler (§6).
5. Faz 6–7 — tema birleştirme (#17), ilerleme ayrımı (#14), taşma (#15), CI’a e2e/axe (#18), performans (#19).

---

# Faz 2 raporu — kritik düzeltmeler (2026-10-24, sürüm 4.2.0)

| # (Faz 1 tablosu) | Sorun | Durum | Değişen dosyalar | Doğrulama |
|---|---|---|---|---|
| 1 | Bozuk veride kayıp | **Tamamlandı, test edildi** | `js/store.js`, `js/app.js`, `css/app.css`, `locales/*.js`, `docs/privacy.md` | 3 birim testi (karantina + yedekten devam; yedek yoksa boş başlama ama karantina; karantina yazılamazsa kayıt durması) + tarayıcıda bozulma taklidi (sayfa yüklenmeden önce) |
| 2 | Kota dolunca sessiz kayıp | **Kısmen**: her ekranda görünen uyarı eklendi; IndexedDB'ye geçiş (yazma yükünü azaltma) Faz 6–7'ye bırakıldı | `js/store.js`, `js/app.js` | Birim testi (kota → dinleyiciye bildirim) |
| 4 | Okuyucu teması kontrastı | **Tamamlandı, test edildi** | `css/app.css` | axe: 4 uygulama × 4 okuyucu teması + görünüm paneli = 16/16 ihlalsiz; ekran görüntüsü |
| 5 | İçe aktarmada atomik olmayan yazma | **Tamamlandı, test edildi** | `tools/import-reading.mjs` | Birim testi: yazma sonrası hata taklidi → kütüphane değişmedi, geçici dosya kalmadı, kaynak inbox'ta; ardından başarılı aktarım |
| 13 | Okuma durumu kutusu güncellenmiyor | **Tamamlandı, test edildi** | `js/views/read-reader.js` | Tarayıcı testi |
| 15 | 390 px + yazı ×1,5'te taşma | **Tamamlandı, test edildi** (kök neden: okuma dil seçimi, alt menü değil) | `css/app.css` | `run_a11y.py`: 3 genişlik × 11 sayfa, taşma yok |
| 16 | `tablist` içinde `select` | **Tamamlandı, test edildi** | `js/views/goals.js`, `read-records.js`, `read-mine.js` | axe: 4 tema × 11 sayfa ihlalsiz |

Faz 1 denetiminde not: ilk tarama betiği okuyucu temalarını tek bir uygulama temasıyla ölçmüştü; düzeltme sonrası betik her kombinasyonu ayrı yükleyerek ölçüyor (`tests/e2e/run_a11y.py`). Faz 1'deki kontrast bulgusu ekran görüntüsüyle ayrıca doğrulanmıştı.

**Test sonuçları (Faz 2 sonu):** birim 76 test: 75 geçti, 0 hata, 1 TODO (100 metin şartı). `run_a11y.py`: 0 başarısız (44 sayfa taraması, 16 okuyucu kombinasyonu, 33 taşma kontrolü, konsol). `run_reading.py` 27/27, `run_v3.py` 55/55, `run.py` (v2 regresyon) 38/38 — hepsi geçti.

**Bilinen sınır:** Yedek, bir önceki açılışın verisidir; bozulma olursa o oturumda yapılan değişiklikler yedekte yoktur (bozuk ham veri yine indirilebilir).

**Devam eden sorunlar:** §1 #2 (depolama mimarisi), #3 (içerik), #6–12 (aktarma ve şema iyileştirmeleri → Faz 3), #14 (konum/okunan ayrımı), #17–19.


---

## Faz 3 raporu — içerik altyapısı (v4.3.0)

**İncelenenler:** `tools/import-reading.mjs`, `tools/build-reading.mjs`, `tools/reading-status.mjs`, `js/reading/core.js`, Kendi metinlerim içe aktarma yolu, CI iş akışı.

**Bulunan eksikler:** ön izleme/onay yoktu; CSV desteklenmiyordu; yeniden çalıştırmada aynı başlık hata veriyor, içerik özeti kullanılmıyordu; güncelleme yolu yoktu; seviye ve kaynak/lisans metin başına tutulmuyordu; durum raporu yalnızca okunur Markdown'dı; uygulama içi aktarma tek dosya ve ön izlemesizdi; kurallar iki araçta kopyaydı.

**Değişen dosyalar:** yeni `js/reading/importer.js`, `js/reading/rules.js`, `js/views/read-import.js`; değişen `tools/import-reading.mjs`, `tools/build-reading.mjs`, `tools/reading-status.mjs`, `js/reading/core.js`, `js/views/read-mine.js`, `css/app.css`, `locales/reading.{tr,en}.js`, `.github/workflows/deploy.yml`, `docs/reading-format.md`, `tests/reading.test.js`, `tests/e2e/run_reading.py`, `package.json`, `CHANGELOG.md`.

**Tamamlananlar:** ön izleme + onay + rapor (MD/JSON); TXT/MD/JSON/CSV; contentHash ile tekrar atlama; `id:` ile güncelleme ve sürüm artışı; atomik yazma korunarak; `level`, `source/license/author`, `origin`, `reviewed`; `status.json`; uygulama içi çoklu dosya / yapıştırma ön izlemesi; uygulamanın denenebilir artifact yayını.

**Testler:** birim 79 test: 78 geçti, 0 hata, 1 TODO (100 metin şartı). `run_reading.py` 0 başarısız (çoklu dosya ön izlemesi [3,0,0,1] ve yeniden aktarmada [0,0,1,0] dahil), `run_v3.py` 55/55, `run.py` 38/38, `run_a11y.py` 0 başarısız.

**Kalan sorunlar:** İçerik eksiği değişmedi (EN 0 metin; toplam ~2.250 eksik) — bu Faz 4'ün dış girdisidir. Artifact deneme sürümünde yapay zekâ servisleri, GitHub'a gönderme, dosya indirme, `confirm` gerektiren işlemler ve çevrimdışı önbellek çalışmaz (barındırma ortamı sınırı; GitHub Pages sürümünde çalışır). Depolama mimarisi (#2) ve konum/okunan ayrımı (#14) Faz 6'da.

**NotebookLM konuları:** Türkçe metinler için seviye ölçütü (cümle uzunluğu tahmininin doğrulanması); açık lisanslı Türkçe okuma kaynakları ve lisans uyumluluğu; yapay zekâ taslağı beyanının nasıl gösterileceği.

**Sonraki adım:** Faz 4 (dış üretim + toplu aktarma ile içerik) ve Faz 5 (NotebookLM paketi) — onay bekliyor.


---

## Faz 4–5 raporu — NotebookLM ile içerik üretimi ve araştırma paketi (v4.4.0)

**İncelenenler:** mevcut istem dosyaları (`docs/reading/istemler/`), içe aktarma ayrıştırıcısı, NotebookLM'in tipik çıktı biçimi (atıf işaretleri, markdown, kopyalamada kaybolan yatay çizgi, yanıt uzunluğu sınırı).

**Bulunan eksikler:** istemler tek parça sohbet için yazılmıştı (NotebookLM'de kaynak ve sohbet ayarı yapısı yoktu); uzun metinler tek yanıtta istenemiyordu; NotebookLM çıktısı doğrudan aktarılınca `[1]` işaretleri ve `**` metne giriyor, `---` kaybolursa blok okunamıyordu; dil/kategori yalnızca klasörden okunuyordu; Faz 5 araştırma klasörü yoktu.

**Değişen dosyalar:** yeni `tools/notebooklm-pack.mjs`, `docs/research/notebooklm/` (README, `uretim/` 8 dosya, `arastirma/` protokol, konular, şablon, `sonuclar/`); değişen `js/reading/importer.js` (`normalizeChatText`), `tools/import-reading.mjs`, `js/views/read-import.js`, `.github/workflows/deploy.yml`, `docs/reading-format.md`, `tests/reading.test.js`, `package.json`, `CHANGELOG.md`.

**Tamamlananlar:** NotebookLM defter kurulumu ve üretim akışı; eksik listesinden kendini güncelleyen istemler (TR 11 kategori, EN 14 kategori; 2.250 metin); çıktı temizleme; dosya adından dil/kategori; araştırma protokolü ve 8 konu.

**Testler:** birim 80 test: 79 geçti, 0 hata, 1 TODO. Yeni test: NotebookLM tarzı çıktı (atıf, kalın, kod çiti, kaçış, eksik `---`, numaralı başlık). Elle uçtan uca deneme: alt klasörsüz `inbox/tr-dialogue-01.txt` → 1 eklendi, yakın kopya 1 reddedildi. `run_reading.py` 0 başarısız.

**Başlanmadı / dış girdi bekliyor:** 2.250 metnin kendisi (NotebookLM'de kullanıcı üretecek; sahte ya da yer tutucu kayıt eklenmedi). Araştırma sonuçları (`arastirma/sonuclar/` boş).

**Sonraki adım:** Üretilen `.txt` dosyaları geldikçe aktarım ve inceleme; paralelde Faz 6 (sistem teması, Soft Reading, okundu ölçütü, IndexedDB) — araştırma 3, 6 ve 8 sonuçları bu fazı doğrudan besler.


---

## Araştırma ilk turu (v4.5.0)

Ayrıntı: `docs/research/notebooklm/arastirma/sonuclar/1-ilk-tur-degerlendirme.md`. Uygulanan: metin başına yapay zekâ beyanı, okunabilirlik puanı (ek bilgi), kalıcı depolama isteği, klinik iddia ve lisans testleri. Ertelenen (kanıt bekliyor): Soft Reading varsayılanı, IndexedDB, süreye bağlı “okundu”, seviye eşikleri, CEFR. Testler: birim 83 (82 geçti, 1 TODO), `run_reading` 0 başarısız, `run_v3` 55/55, `run` 38/38, `run_a11y` 0 başarısız.
