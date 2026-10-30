# Değişiklik günlüğü

## 4.7.2 — 2026-10-24 (hata düzeltmesi: silme onayları)

- **Ayraç ve “burada kaldım” silinmiyordu:** silme onayı tarayıcının `confirm()` penceresiyle soruluyordu; bazı ortamlar (gömülü sayfalar, bazı uygulama içi tarayıcılar, Claude deneme sayfası) bu pencereyi engelleyip her zaman “hayır” döndürür. Tüm onaylar uygulama içi pencereye taşındı (`confirmAsk`, Esc/Vazgeç = hayır). Etkilenen 14 işlem: ayraç/burada kaldım/not silme (okuyucu ve Ayraçlar), liste silme, kendi metnini silme ve sürüm geri yükleme, metni baştan okuma, süreli oturumu bitirme/değiştirme, egzersizi erken bitirme, hedef ve not silme, profil kaldırma, tüm verileri silme.
- **Test:** `npm run e2e:marks` (tarayıcı onayı engellenmiş ortamda ekleme, Vazgeç, silme — okuyucu ve Ayraçlar sayfası).

## 4.7.1 — 2026-10-24 (hata düzeltmesi: beceriler)

- **Takılma giderildi:** Kelime tanımadaki “Kelime öğren” kartında Dinle'ye basınca oluşan hata, Sonraki/Bitir düğmelerini ve sayfadan çıkışı durduruyordu (ekran donmuş görünüyordu). Düzeltildi; ayrıca bu kartta ses iki kez başlatılmıyor.
- **Ses gelmeden cevap verilemez:** Cevaplar ses gerçekten başlayınca açılır. Ses motoru hiç başlamazsa (Chrome'da bilinen takılma) bir kez sıfırlanıp yeniden denenir; yine başlamazsa “Ses başlamadı” uyarısı çıkar, cevaplar kilitli kalır ve bu dinleme hakkından düşmez. Önceden ses çıkmasa da süre dolunca “okundu” sayılıp cevaplar açılıyordu.
- **Uzun konuşmalar:** Chrome'un uzun konuşmayı kendiliğinden duraklatmasına karşı konuşurken düzenli “resume”.
- **Öğrenme kartında ses hataları** artık görünür (önceden sessizce yutuluyordu).
- **Test:** `npm run e2e:skills` — 7 gruptaki 47 görevin her biri: Dinle → cevap → Sonraki → sayfadan çıkış; ses motoru takılması senaryosu.

## 4.7.0 — 2026-10-24

- **Yumuşak kelime vurgusu:** sesli dinlemede o an okunan kelime en belirgin, yanındaki yardımcı kelimeler uzaklaştıkça soluklaşarak vurgulanır (1–5 kelimelik pencere, kelime kelime kayar; öbek öbek atlamaz).
- **Başlıklar okunur:** metin başlığı ve bölüm başlıkları da sesli okunur ve vurgulanır; bir bölümün başından dinlemeye başlanınca önce o bölümün başlığı okunur.
- **İçerik:** 40 TR gezi + 34 TR diyalog metni (gezi 90, diyalog 54); 1 diyalog telefon dolandırıcılığı kalıbı içerdiği için aktarılmadı. Aktarım öncesi düzeltmeler: sayı/yazım hataları, doğrulanamayan ya da yanlış bilgi içeren 4 cümle, sağlık iddiası içeren 1 cümle.

## 4.6.0 — 2026-10-24 (sesli dinlemede kelime takibi)

- **Kelime öbeği vurgusu:** sesli dinlemede paragraf yerine okunan 1–5 kelime vurgulanır (görünüm ayarlarında “Sesli dinlemede vurgu”, varsayılan 3). Ses motorunun kelime sınırı olayları kullanılır; bu olayı göndermeyen seslerde konuşma hızından tahmini ilerleme. CSS Custom Highlight API ile (metne ve işaretlere dokunmaz); desteklemeyen tarayıcıda paragraf vurgusu.
- **Elle kaydırma:** dinlerken sayfa elle kaydırılırsa vurgu ortalanmaz ama ilerlemeye devam eder; “Okunan yere git” düğmesi takibi geri açar. Uygulamanın kendi kaydırması elle kaydırma sayılmaz.
- **Kaldığı yerden devam:** “Durdur” başa sarmaz; devam noktası kesik çizgiyle işaretlenir ve kaydedilir (sayfa yeniden açılınca da). “Dinle” sırasıyla: seçili metin → durdurduktan sonra dokunulan kelime → kaldığı kelime → görünen paragraf.
- **Test:** `npm run e2e:tts` (15 kontrol).

## 4.5.2 — 2026-10-24

- **Hazır istek dosyaları:** `docs/research/notebooklm/uretim/istekler/` — eksiklerin tamamı için 646 ayrı istek (kısa 5'li, orta tekli, uzun 4 parça, roman dizileri 2 parça); her istekte alt kategori, seviye ve kelime aralığı belirli; sıra listesi `SIRA.md`. Her aktarmada yeniden üretilir.
- **Yanıt içinde dil/kategori:** isteklerin meta satırında `lang:` / `cat:` var; yanıtlar tek dosyada toplanabilir. Kütüphane dosyalarına bu iki alan yazılmaz.
- **İçerik:** 5 TR diyalog daha (toplam 20).

## 4.5.1 — 2026-10-24 (ilk NotebookLM partisi)

- **İlk içerik:** NotebookLM'den gelen 15 TR diyalog metni kütüphaneye aktarıldı (`tr/dialogue-import-01.txt`).
- **Sohbet çıktısı temizleme genişletildi:** başlık ya da madde imiyle gelen meta satırı (`## sub: …`), tek paragrafa yığılmış diyalog (her konuşma ayrı satıra bölünür), sondaki “Kontrol Özeti” bölümü.

## 4.5.0 — 2026-10-24 (araştırma ilk turu: uygulanabilir kararlar)

- **Metin başına üretim beyanı:** okuyucuda “Yapay zekâ destekli taslak · insan incelemesi bekliyor / incelemesinden geçti” ya da “İnsan tarafından yazıldı” (`origin`, `reviewed`). Genel lisans notu yalnızca lisansı söylüyor.
- **Okunabilirlik puanı:** Ateşman (TR) / Flesch (EN), okuyucuda ek bilgi olarak; metin düzeyini değiştirmez (eşleme araştırması bekliyor). Katalogda `rs`.
- **Kalıcı depolama:** Ayarlar → Gizlilik'te durum ve “Kalıcı depolama iste” düğmesi.
- **Denetim testleri:** olumlu klinik iddia taraması (arayüz, rehber, istemler) ve lisans denetimi.
- **Araştırma kaydı:** `docs/research/notebooklm/arastirma/sonuclar/1-ilk-tur-degerlendirme.md` — ilk tur yalnızca proje dosyalarına dayandığı için bulgular “düşük/kaynaksız” sayıldı; kanıt gerektiren öneriler Faz 6'ya ertelendi.

## 4.4.0 — 2026-10-24 (Faz 4–5: NotebookLM ile içerik üretimi ve araştırma paketi)

- **NotebookLM üretim paketi** (`docs/research/notebooklm/uretim/`, `npm run reading:notebooklm`): dil başına yazım kılavuzu ve mevcut başlıklar (deftere kaynak olarak), sohbet ayarı, kategori başına parti parti istemler (kısa 5'li, orta tekli, uzun ve roman dizileri parça parça). Eksik listesinden üretilir; her içe aktarmada ve yayında güncellenir.
- **Sohbet çıktısı temizleme:** `.txt`/`.md` aktarımında kaynak işaretleri, kalın yazı, kod çitleri, kaçışlar, numaralı/çizgisiz başlıklar, büyük harfli anahtarlar ve kaybolan `---` satırı düzeltilir (kütüphane aracı ve uygulama içi aktarma).
- **Dosya adından dil/kategori:** `tr-dialogue-01.txt` doğrudan `inbox/` içine konabilir; uygulama içi aktarmada da geçerli.
- **Araştırma paketi** (`docs/research/notebooklm/arastirma/`): değerlendirme protokolü, 8 konu (soru, kaynaklar, istemler, etkilenen yer), karar kaydı şablonu.

## 4.3.0 — 2026-10-24 (Faz 3: içerik altyapısı)

- **Toplu içe aktarma (kütüphane aracı):** `npm run reading:import` artık önce ön izleme gösterir (eklenecek / güncellenecek / tekrar olduğu için atlanacak / hatalı, dil–kategori dağılımı, kayıt bazında gerekçe) ve onay ister; `--yes` onaysız uygular, `--dry` yalnızca rapor üretir. Rapor `inbox/RAPOR.md` + makine okunur `inbox/RAPOR.json`.
- **Biçimler:** .txt/.md blok biçimi, JSON ve CSV (virgül ya da noktalı virgül, tırnaklı alanlar, Türkçe sütun adları). Desteklenmeyen dosyalar açık hatayla raporlanır ve yerinde bırakılır.
- **Güvenli tekrar çalıştırma:** İçerik özeti (`contentHash`, başlıktan bağımsız) aynı metin atlanır; aynı başlık farklı içerik uyarıyla eklenir; `id:` ile var olan metin yerinde güncellenir ve sürümü artar. Mevcut metinler hiçbir durumda silinmez.
- **Şema:** Metin başına `level` (kütüphaneye aktarmada zorunlu; yoksa tahmin edilir ve ayrıca sayılır), `source` / `license` / `author` (kaynak varsa lisans zorunlu), `origin`, `reviewed`.
- **Durum raporu:** `docs/reading/status.json` (makine okunur) ve genişletilmiş `EKSIKLER.md`: dil × kategori mevcut/hedef/eksik, uzunluk ve seviye dağılımı, tahmini seviye, kaynak bilgisi eksik metinler, bozuk/tekrar kayıtlar, öncelik sırası.
- **Uygulama içinden:** Kendi metinlerim → çoklu dosya seçimi ve “Metni yapıştırarak aktar”; aynı kurallarla ön izleme diyaloğu, onaydan sonra kayıt (kayıt başarısızsa geri alınır) ve JSON rapor.
- **Kurallar tek yerde:** `js/reading/rules.js` (derleyici, durum raporu, içe aktarma ve yapay zekâ üretimi ortak kullanır).

## 4.2.0 — 2026-10-24 (Faz 2: kritik düzeltmeler)

- **Veri kaybı önleme:** Kayıtlı veri bozuk okunursa artık silinmiyor ve üzerine yazılmıyor: ham veri `duyum.v1.corrupt.<zaman>` anahtarına karantinaya alınıyor, her açılışta alınan son sağlam yedekten (`duyum.v1.bak`) devam ediliyor, ekranda “Bozuk veriyi indir / Anladım” bildirimi çıkıyor. Karantina yazılamazsa kayıt durduruluyor (bozuk veri ezilmesin).
- **Kayıt alanı doldu uyarısı:** Kota hatasında her ekranda görünen kalıcı uyarı (önceden yalnızca bazı ekranlarda).
- **Güvenli içe aktarma:** Kabul edilen metinler önce geçici dosyaya yazılıyor, hepsi yazılınca atomik olarak yerine taşınıyor; ancak bundan sonra kaynak dosya `_islendi/` altına alınıyor. Hata olursa hiçbir şey değişmiyor, kaynak inbox'ta kalıyor.
- **Okuyucu temaları:** Açık, sepya, koyu ve loş okuyucu temaları artık tam renk setiyle tüm okuma ekranını (üst çubuk, içindekiler, paneller, düğmeler, form alanları, odak) kapsıyor; uygulama teması ne olursa olsun görünmez öğe kalmıyor (16 kombinasyon axe ile 0 ihlal).
- **Erişilebilirlik:** Hedefler, okuma geçmişi, ayraçlar ve kendi metinlerim süzgeç çubukları geçersiz `tablist` rolünden düğme grubu + `aria-pressed` / bağlantılarda `aria-current` yapısına geçirildi.
- **Okuma durumu:** Bilgi panelindeki durum seçimi konum kaydıyla eşitleniyor.
- **Taşma:** Büyük yazıda okuma sayfalarındaki dil seçiminin yarattığı yatay taşma giderildi.
- **Testler:** Bozuk veri/kota/yedek için 3 birim testi, içe aktarmada hata taklidiyle atomiklik testi; tarayıcı testlerine durum eşitleme ve kurtarma senaryoları; yeni `npm run e2e:a11y` (axe-core, tema × sayfa × okuyucu teması, taşma).

## 4.1.0 — 2026-10-19

**Yapay zekâ ile okuma metni (yeni, isteğe bağlı)**
- Okuma → “Yapay zekâ ile oluştur”: konu, başlık ya da anahtar kelime + dil, kategori, alt kategori, uzunluk (kısa/orta/uzun), zorluk, okur, ek istekler → metin üretilir, önizlenir, düzenlenir, “Kaydet ve oku” ile Kendi metinlerim’e kaydedilir. Kısa kalan metin otomatik uzatılır; “Uzat”, “Yeniden oluştur”, kalite uyarıları (uzunluk, biçim, aynı başlık).
- Servisler: Google Gemini (ücretsiz katman), Groq, OpenRouter, Ollama (yerel), Anthropic, OpenAI, OpenAI uyumlu özel adres. Kullanıcının kendi anahtarı; yalnızca cihazda, uygulama verisinden ve yedeklerden ayrı saklanır. Bağlantı testi model listesini getirir. Ayarlar’da da “Yapay zekâ” bölümü.
- Kütüphane ile aynı kurallar: üretim istemi kategori yönergeleri ve kelime aralıklarını `js/reading/rules.js`’ten alır (dış istem dosyalarıyla ortak).

**Kendi metinlerin**
- Kaydetmede tarayıcıdan kalıcı depolama istenir (yer darlığında silinmesin); sayfada nerede saklandığı açıklanır.
- “Kütüphaneye öner”: GitHub ayarı varsa metin doğrudan deponun `content-src/reading/inbox/` klasörüne yazılır ve yayın iş akışı onu ortak kütüphaneye ekler; ayar yoksa inbox’a yüklenecek .txt indirilir.

**Görünüm**
- Yerel form denetimleri uygulama stiline uyarlandı (Windows’ta eski görünen tarih alanları, onay kutuları, seçenek düğmeleri, açılır listeler, kaydırıcılar, dosya düğmesi); koyu temada yerel takvim koyu açılır. Okuma alt menüsü geniş ekranda alta geçer, telefonda etkin sekme görünür alana kayar.
- Service worker önbellek adı artık içerik özetiyle otomatik değişir (aktarılan metinler kullanıcılara kendiliğinden ulaşır).

**Testler:** 72 birim testi (yapay zekâ istemi/ayrıştırma/uzatma/hata kodları, GitHub önerisi); okuma tarayıcı testi 24 kontrol (elle metin kaydı ve kalıcılık, taklit edilen servisle yapay zekâ üretimi ve kaydı, anahtarın yedeğe girmemesi).

## 4.0.0 — 2026-10-19

**Okuma Egzersizi (yeni ana menü öğesi)**
- Kütüphane, arama (başlık, tam metin, etiket, kategori; Türkçe harf katlama; vurgulu eşleşme, özet kartları, sayfalama), süzgeç ve sıralama, boş durumlar.
- Okuyucu: aşama/bölüm ilerlemesi, kelime ve kalan süre, içindekiler (masaüstünde yerleşik, telefonda çekmece), görünüm ayarları ve temalar, odak modu, ayraç/“burada kaldım”/vurgu/not, konumun kalıcı kaydı ve sürüm değişiminde taşınması, yeniden başlatma (geçmiş korunur).
- Geçmiş, favoriler, ayraçlar, okuma listeleri, süreli oturumlar (30/60/90/120 dk) ve mola uyarıları; kendi metinlerim (sürümlü), JSON paketi ve **.txt/.md blok dosyasından içe aktarma**.
- Sesli okuma düğmesi (cihazın seslendirmesi): telefonda kaydırırken gizlenir; Ayarlar → Erişilebilirlik’te açma/kapama ve otomatik gizleme anahtarları. Mikrofon/ses kaydı/konuşma tanıma yok (testle güvence altında).

**İçerik altyapısı**
- Kaynak biçimi → derleyici (`tools/build-reading.mjs`): kategori/alt kategori/tür denetimi, en az kelime, yarıda kesilme, aynı başlık/içerik, yakın kopya (5-gram Jaccard), dizi bölümleri; otomatik envanter.
- Dışarıdan aktarma (`tools/import-reading.mjs`): `content-src/reading/inbox/` → numaralama, denetim, rapor, reddedilenler ayrı klasörde. Yayın iş akışı aktarmayı kendisi yapar ve sonucu depoya geri yazar.
- Eksik listesi ve kopyala-yapıştır istemler (`tools/reading-status.mjs` → `docs/reading/EKSIKLER.md`, `docs/reading/istemler/`).
- Türkçe kütüphane: 552 özgün metin (6 kategori). Kalan 8 TR kategorisi ve İngilizce kütüphane dışarıda üretilip aktarılacak.

**Testler**
- `tests/reading.test.js` (15 test: ayrıştırma, arama, konum, listeler, süreli oturum, kalite denetimi, içe aktarma, kütüphane bütünlüğü, mikrofon API’si yokluğu); `tests/e2e/run_reading.py` (17 kontrol; telefon/tablet/masaüstü).

## 3.0.0 — 2026-10-19

Ayrıntılı durum: [docs/audit/v3-status.md](docs/audit/v3-status.md) · Araştırma: [docs/research/](docs/research/)

**Araştırma**
- Türkiye, Avustralya, Danimarka, ABD, Almanya, Birleşik Krallık, Hollanda ve Kanada kaynaklı literatür taraması, kaynak kaydı, egzersiz–kanıt matrisi, boşluk analizi ve yol haritası (`docs/research/`). Yalnızca açılıp okunan kaynaklar kaydedildi.

**Hedefler ve notlar (DKT)**
- Yeni hedef modeli (kişisel / uzmanın önerdiği, durum, öncelik, tarihler, uzman notu, bağlı egzersizler, haftalık plan, zorluk ayarı); v2 hedef ve notları kayıpsız taşınır.
- Hedef ilerlemesi ve geçmişi, hedefe özel oturum (`goalId`), ana sayfada “Bugünün planı”, serbest çalışma ayarını hedefe kaydetme.
- Yapılandırılmış seans notları, arama ve süzgeçler, otomatik taslak ve kayıt durumu, silme/tamamlama/arşivde geri al.

**Kılavuz**
- 24 konulu uygulama içi kullanım kılavuzu (TR/EN): arama, kategoriler, adım adım yönergeler, tuş şeması, SSS; Ayarlar’da bölüm; ekranlardan bağlamsal yardım.

**Egzersizler (47 → 51 görev)**
- Matris cümleleri (özgün 5×10 kelime, kelime bazında puan), VCV/CVC logatomlar (ünsüz ve ünlü), ortadaki ses farkı; yeni “Anlamsız heceler” yolu.
- 7 yeni senaryo × 2 dil × 2 varyant (iş görüşmesi, iş yerinde telefon, toplantıda soru-cevap, kısa sunum, arkadaş grubu, sesli mesaj, aile sofrası).
- Paragraf/diyalogda soru sayısı ayrı seçilebilir; adlandırılmış seviyeler; beceri hiyerarşisi etiketleri; katalog araması ve süzgeci.

**Dinleme güvenliği**
- Egzersiz içinde gürültüyü azalt/kapat, uygulama ses düzeyi, mola hatırlatıcısı, isteğe bağlı konuşmacı çeşitliliği.

**Arayüz**
- Ortalanmış ve sayfa türüne göre sınırlı genişlik, tablet ara düzeni, yeni navigasyon (masaüstü 7 öğe, telefon 5 öğe + Yardım).

**Düzeltmeler**
- Hedef formu hata bağlantısı rotayı değiştiriyordu; kaydedilen/silinen not taslağı geri geliyordu; “Tümü” sekmesi arşivi göstermiyordu.

**Test**
- 52 birim testi; uçtan uca 38/38 (v2 regresyon) + 55/55 (v3: hedef, not, kılavuz, matris, gürültü, yedek, tablet/masaüstü, çevrimdışı).

## 2.0.0 — 2026-10-18

Ayrıntılı durum: [docs/audit/v2-status.md](docs/audit/v2-status.md)

**Cevap sistemi**
- 2, 3, 4, 5, 6, 8, 10 seçenek; yazılı cevap; kart sıralama; rakam tuş takımı; “ses başladığında/bittiğinde bas”.
- 1–9 ve 0 tuşları (10. seçenek); rakam görevlerinde tuş = rakam; ok tuşlarıyla gezinme.
- Rahat pratik ve değerlendirme modu ayrı; pratikte isteğe bağlı ikinci deneme; dinleme hakkı ve cevap süresi ayarlanabilir.

**Egzersizler (7 → 47 görev)**
- Ses farkındalığı (12), hece/fonem (11), minimal çiftler (4), kelime (7), cümle (7), paragraf (1), hafıza (3), günlük yaşam ve konuşmacılar (2).
- 15 isteğe bağlı eğitim yolu, kişisel görev listesi, DKT hedeflerinin görevlere bağlanması.

**İçerik**
- JSON içerik paketleri (kod değiştirmeden genişletilebilir), otomatik doğrulayıcı, lisanslı ek paket içe aktarma.
- TR/EN: ~600 kelime / 30 kategori, IPA’lı minimal çift aileleri, hece kümeleri, 24 cümle şablonu, 16 paragraf, 26 senaryo (52 varyant).

**Ezber önleme**
- Görülme geçmişi ve aralıklı tekrar, alıştırma/değerlendirme havuzu ayrımı, cevap konumu dengeleme, art arda tekrar önleme, görülen içerik oranı ayarı.

**Ses**
- Ses kalite testi ekranı; doğrulanmamış telaffuz değerlendirmeye girmez, “hatalı” işaretli içerik hiç kullanılmaz.
- Boş TTS çıktısı algılama; cümle bazlı okuma (uzun metin kesilmesi); kullanıcı onaylı farklı konuşmacılar; stereo kalibrasyonlu yön görevi; sentezlenmiş kapı zili/telefon/anons sesleri.

**Kullanım**
- Yeni ana sayfa (hızlı başla 5/10/15 dk, beceriler, günlük yaşam, plan, serbest çalışma); basit/gelişmiş mod; yarım kalan oturumu sürdürme; arka plana geçişte durma.
- İlerleme: ilk denemede doğru, tekrar dinleme, zayıf alanlar (ses karşıtlığı/kategori/soru türü), görev bazlı tablo, rahatlık değerlendirmesi.

**Düzeltmeler**
- “Sonraki” düğmesi cevaptan önce görünüyordu (v1’den beri).
- Yayın iş akışına `content/` klasörü ve içerik doğrulama adımı eklendi.

**Test**
- 33 birim testi, içerik doğrulama, 38 kontrollü uçtan uca tarayıcı testi (`tests/e2e/run.py`).

## 1.0.0 — 2026-10-17
- İlk sürüm: derlemesiz PWA, 7 egzersiz türü, TR/EN, çocuk/yetişkin profilleri, Web Speech TTS adaptörü, 4 tema, isteğe bağlı DKT notları, GitHub Pages iş akışı.
