# Duyum okuma metni yazım kılavuzu — Türkçe (tr)

Bu belge NotebookLM defterine KAYNAK olarak yüklenir. Sohbetteki her üretim isteği bu kılavuza göre yanıtlanmalıdır.

## 1. Amaç

Duyum; işitme cihazı ve koklear implant kullanıcılarının da kullandığı ücretsiz bir okuma ve dinleme pratiği uygulamasıdır. Metinler ekranda okunur ve isteğe bağlı olarak cihazın sesiyle sesli okunur. Uygulamada mikrofon, ses kaydı ya da konuşma tanıma yoktur.

## 2. Kesin kurallar

- Tamamen ÖZGÜN yaz. Bu defterdeki kaynaklar dahil hiçbir kitap, şarkı, şiir, makale ya da siteden alıntı yapma, uyarlama yapma; bilinen karakterleri kullanma.
- Gerçek, yaşayan kişiler ve markalar hakkında yazma; kurgudaki kişi, yer, kurum adları hayalî olsun.
- Gerçek bilgi verdiğin yerde doğru ve genel ol; emin olmadığın rakam ya da tarih verme. Tıbbi, hukuki, mali kişisel tavsiye verme.
- Her metin kendi başına anlaşılır ve TAMAMLANMIŞ olsun; yarıda bitirme (dizi bölümleri hariç).
- Metinler birbirinin tekrarı olmasın: farklı konu, karakter, mekân, başlık. "Mevcut başlıklar" kaynağındaki başlıkları kullanma.
- Şiddet, korku, nefret, cinsellik, uyuşturucu yok. Herkesin okuyabileceği dil.
- Yanıtta kaynak numarası / atıf ([1] gibi), giriş cümlesi, açıklama, kapanış notu YAZMA. Yalnızca metin blokları.

## 3. Çıktı biçimi (zorunlu)

Her metin şu blok biçimindedir; bloklar arasında bir boş satır:

```text
### | Metnin Başlığı
sub: <alt kategori kimliği> | tags: <3-5 etiket, virgülle> | level: <1 kolay / 2 orta / 3 ileri>
---
Birinci paragraf. Paragraflar arasında boş satır.

## Ara başlık (yalnızca orta ve uzun metinlerde)

Devam paragrafı.
```

- `###` ile `|` arasına numara YAZMA. `level` ZORUNLU. `sub` yalnızca aşağıdaki listeden.
- Meta satırından sonra tek başına `---` satırı ZORUNLU.
- Diyaloglarda her satır `Ad: söz` biçiminde. Şiirde satır sonları korunur, kıtalar arasında boş satır.
- Roman dizilerinde meta satırına `series: <dizi-kimligi> | part: <bölüm no>` ekle.

## 4. Uzunluk

- Kısa: 150–600 kelime
- Orta: 800–2500 kelime, 5–20 "## Ara başlık" bölümü
- Uzun: 2900–5000 kelime, 5–20 bölüm
- En az: 120 kelime (şiir 40, çocuk 80). Alt sınırın altına düşme.

## 5. Kategoriler, alt kategoriler ve yönergeler

### Kategori `daily` — Günlük yaşam hikâyeleri

- Tanım: Evde, sokakta, işte ve aile içinde geçen sade günlük anlatılar.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `home` (Evde bir gün), `morning` (Sabah rutini), `errands` (Alışveriş ve günlük işler), `friends` (Arkadaşlarla buluşma), `newplace` (Yeni bir yere gitme), `family` (Aile içinde), `planning` (Günü planlama), `habits` (Yeni alışkanlıklar)
- Yönerge: Sade, gerçekçi günlük yaşam anlatıları (ev, sabah, alışveriş, arkadaş, aile, yeni yer, plan, alışkanlık). Küçük bir olay ve doğal bir kapanış olsun. Gerçek kişi/marka adı yok.

### Kategori `stories` — Öykü ve kısa hikâye

- Tanım: Gerçekçi, dostluk, aile, yolculuk, doğa, merak ve mizah öyküleri.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `realistic` (Gerçekçi), `friendship` (Dostluk), `family` (Aile ve dayanışma), `learning` (Yeni bir şey öğrenme), `journey` (Yolculuk), `nature` (Doğada), `curiosity` (Merak ve keşif), `humor` (Mizahi), `literary` (Edebî öykü)
- Yönerge: Bağımsız, başı-ortası-sonu olan özgün öyküler. Türler: gerçekçi, dostluk, aile, öğrenme, yolculuk, doğa, merak, mizah, edebî. Her öykü farklı karakter ve olay örgüsüne sahip olsun.

### Kategori `novel` — Roman tarzı uzun okumalar

- Tanım: Bölüm bölüm ilerleyen özgün romanlar; her bölüm bir öncekinin devamıdır.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `adventure` (Macera), `scifi` (Bilim kurgu), `fantasy` (Fantastik), `mystery` (Gizem ve bulmaca), `historical` (Tarihî kurgu), `exploration` (Gezi ve keşif), `relationships` (Günlük yaşam ve ilişkiler)
- Yönerge: Roman tarzı DİZİLER: her dizi 10 bölümden oluşur; her bölüm bir öncekinin devamıdır. Her bölümde "series: <dizi-kimligi> | part: <bölüm no>" ZORUNLU. Başlık biçimi: "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>". Dizi kimliği küçük harf ve tire (ör. ruzgar-adasi). Bir yanıtta tek dizinin bölümlerini sırayla yaz. Tek parça uzun novella da olabilir (series yazma).

### Kategori `news` — Gazete ve dergi tarzı

- Tanım: Kurgusal haberler ve gerçek bilgiye dayanan dergi yazıları. Kurgusal haberler gerçek olay değildir.
- Varsayılan tür: fictional-news
- Alt kategoriler (sub): `science` (Bilim ve teknoloji), `environment` (Çevre ve doğa), `education` (Eğitim), `culture` (Kültür ve sanat), `history` (Tarih ve arkeoloji), `space` (Uzay ve astronomi), `agriculture` (Tarım ve sürdürülebilirlik), `city` (Şehir yaşamı), `community` (Toplum yararına projeler)
- Yönerge: Gazete/dergi tarzı. İki tür var ve her metinde belirtilmeli: (1) KURGUSAL HABER — "kind: fictional-news"; hayalî yer/kişi/kurum adları kullan, gerçek bir olay gibi sunma. (2) DERGİ YAZISI — "kind: feature"; yalnızca iyi bilinen, doğrulanabilir genel bilgilere dayan (bilim, doğa, tarih, uzay...). Kesin tarih/rakam verirken emin ol; emin değilsen genel ifade kullan. Gerçek kişiler hakkında haber yazma.

### Kategori `info` — Bilgilendirici ve öğretici

- Tanım: Bilim, vücut, doğa, coğrafya, tarih, teknoloji ve günlük beceriler üzerine sade açıklamalar. Genel bilgi amaçlıdır; tıbbi veya mali tavsiye değildir.
- Varsayılan tür: nonfiction
- Alt kategoriler (sub): `science` (Bilim kavramları), `body` (İnsan vücudu ve genel sağlık), `living` (Hayvanlar ve bitkiler), `geography` (Dünya ve coğrafya), `history` (Tarih), `psychology` (Psikolojiye giriş), `technology` (Teknoloji ve bilgisayarlar), `ai` (Yapay zekâ), `tools` (Günlük araçlar), `economy` (Ekonomi ve finans kavramları), `communication` (İletişim ve sosyal beceriler), `learning` (Öğrenme yöntemleri)
- Yönerge: Bilgilendirici, öğretici metinler. Doğru ve genel bilgi; sağlık, hukuk ve para konularında kişisel tavsiye verme, gerektiğinde "uzmana danışın" de. Tartışmalı konularda tarafsız ol. Kesin rakamları yalnızca iyi biliniyorsa ver.

### Kategori `travel` — Gezi ve seyahat

- Tanım: Şehirler, doğa, kültür, müzeler ve yolculuk günlükleri. Kurgusal gezi günlükleri ayrıca işaretlidir.
- Varsayılan tür: nonfiction
- Alt kategoriler (sub): `cities` (Şehir tanıtımları), `nature` (Doğa gezileri), `culture` (Kültürel keşifler), `museums` (Müze ve tarihî mekânlar), `journal` (Yolculuk günlükleri), `planning` (Seyahat planlama)
- Yönerge: Gezi ve seyahat: gerçek yer tanıtımları (yalnızca uzun süre değişmeyen, iyi bilinen bilgiler; fiyat/saat/telefon YOK), seyahat planlama ipuçları ve kurgusal gezi günlükleri. Kurgusal günlüklerde "sub: journal | kind: fictional-journal" yaz. Gerçek yer metinlerinde kind yazma (varsayılan: genel bilgi).

### Kategori `dialogue` — Diyalog ve konuşma

- Tanım: Konuşmacıları belli günlük konuşmalar. İstersen konuşmacı adlarını gizleyebilirsin.
- Varsayılan tür: dialogue
- Alt kategoriler (sub): `everyday` (Günlük konuşma), `restaurant` (Restoran ve kafe), `shopping` (Market ve alışveriş), `interview` (İş görüşmesi), `meeting` (Toplantı), `phone` (Telefon konuşması), `school` (Eğitim ortamı), `directions` (Yol tarifi), `intro` (Yeni biriyle tanışma), `problem` (Sorunu nazikçe çözme)
- Yönerge: Konuşmacısı belli diyaloglar. HER SATIR "Ad: söz" biçiminde olsun (ör. "Elif: Günaydın!"). Anlatıcı cümlesi gerekiyorsa ayrı paragraf yaz. Bağlam: günlük konuşma, restoran, alışveriş, iş görüşmesi, toplantı, telefon, okul, yol tarifi, tanışma, sorun çözme. Doğal, nazik, gerçekçi dil.

### Kategori `work` — İş ve mesleki okuma

- Tanım: E-postalar, toplantı notları, kısa raporlar, talimatlar ve mesleki gelişim yazıları. Kişi ve şirket adları hayalîdir.
- Varsayılan tür: workdoc
- Alt kategoriler (sub): `email` (E-posta), `minutes` (Toplantı notları), `report` (Kısa rapor), `project` (Proje açıklaması), `workplace` (İş yerinden), `presentation` (Sunum metni), `instructions` (Talimatlar), `customer` (Müşteri iletişimi), `tech` (Teknoloji ve yazılım), `growth` (Mesleki gelişim)
- Yönerge: İş ve mesleki okuma: e-posta, toplantı notu, kısa rapor, proje açıklaması, sunum metni, talimat, müşteri iletişimi, teknoloji, mesleki gelişim. Kişi ve şirket adları HAYALÎ olsun. Gerçek bir belge gibi biçimlendir (konu satırı, maddeler, imza) ama gerçek iletişim bilgisi verme.

### Kategori `poetry` — Şiir ve edebî metinler

- Tanım: Özgün şiirler, kısa düzyazılar ve betimlemeler.
- Varsayılan tür: poem
- Alt kategoriler (sub): `poem` (Şiir), `prose` (Kısa düzyazı), `description` (Betimleme), `nature` (Doğa tasviri), `feeling` (Duygu), `style` (Dil ve anlatım çalışması)
- Yönerge: Özgün şiirler ve kısa edebî düzyazılar. Şiirlerde dize sonlarında satır atla; kıtalar arasında boş satır bırak. Düzyazı/betimlemelerde "kind: fiction" yaz (şiirlerde kind yazma). Bilinen şiirleri taklit etme, alıntı yapma.

### Kategori `language` — Dil ve telaffuz odaklı

- Tanım: Sesli okuma ve diksiyon pratiği için hazırlanmış metinler. İşitsel algı egzersizlerinden ayrı bir beceridir.
- Varsayılan tür: practice
- Alt kategoriler (sub): `clear` (Kısa ve açık cümleler), `long` (Uzun cümleler), `punctuation` (Noktalama ve duraklama), `questions` (Soru ve ünlem), `sounds` (Benzer sesler), `syllables` (Hece uzunlukları), `numbers` (Sayı, tarih ve saat), `twisters` (Tekerleme), `diction` (Diksiyon)
- Yönerge: Sesli okuma ve diksiyon pratiği: kısa açık cümleler, uzun cümleler, noktalama ve duraklama, soru/ünlem, benzer sesler, hece uzunlukları, sayı-tarih-saat okuma, tekerleme, diksiyon. Her metnin başında bir cümlelik "Bu metinde ... çalışıyoruz." açıklaması olsun. Tekerlemeler özgün olsun.

### Kategori `kids` — Çocuklar için

- Tanım: Yaşa uygun kısa hikâyeler, hayvan öyküleri, basit diyaloglar ve merak uyandıran bilgiler.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `story` (Kısa hikâye), `animals` (Hayvan öyküleri), `dialogue` (Basit diyalog), `daily` (Günlük yaşam), `nature` (Doğa ve keşif), `lesson` (Eğitici hikâye), `facts` (Merak ettiklerimiz)
- Yönerge: Çocuklar için (yaklaşık 6–10 yaş): kısa, sıcak, yaşa uygun hikâyeler, hayvan öyküleri, basit diyaloglar ("Ad: söz"), günlük yaşam, doğa, eğitici hikâye, merak edilen bilgiler. Korkutucu/şiddet içeren öğe yok. Basit cümleler. En az 90 kelime.

### Kategori `longform` — Yetişkinler için uzun okumalar

- Tanım: Deneme, uzun makale, röportaj biçiminde özgün söyleşiler ve uzun anlatılar.
- Varsayılan tür: essay
- Alt kategoriler (sub): `essay` (Deneme), `travel` (Gezi yazısı), `science` (Bilim ve teknoloji), `growth` (Kişisel gelişim), `culture` (Tarih ve kültür), `story` (Uzun hikâye), `interview` (Söyleşi), `article` (Uzun bilgilendirici makale)
- Yönerge: Yetişkinler için uzun okumalar: deneme, uzun gezi yazısı, bilim, kişisel gelişim, tarih-kültür, uzun hikâye, HAYALÎ kişilerle söyleşi (söyleşide "Ad: söz" biçimi), uzun makale. Bu kategoride ORTA ve UZUN metin ağırlıklı olsun; "## Ara başlık" kullan.

### Kategori `letters` — Günlük ve mektup

- Tanım: Kişisel günlükler, mektuplar, anılar ve düşünce yazıları. Tümü özgün ve kurgusaldır.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `diary` (Kişisel günlük), `travel` (Seyahat günlüğü), `event` (Bir olayın ardından), `letter` (Mektup), `memoir` (Anı), `reflection` (Düşünce yazısı)
- Yönerge: Kişisel günlükler, mektuplar, anılar, düşünce yazıları — tümü özgün ve kurgusal; gerçek kişilere mektup yazma. Günlüklerde tarih başlıkları ("## 3 Mart") kullanılabilir.

### Kategori `critical` — Eleştirel düşünme ve karşılaştırma

- Tanım: İki görüşü karşılaştıran, bir sorunu açıklayan, artı ve eksileri tartan, iddia ile kanıtı ayıran yazılar.
- Varsayılan tür: essay
- Alt kategoriler (sub): `views` (İki görüş), `problem` (Bir sorunu açıklama), `proscons` (Artılar ve eksiler), `angles` (Farklı açılardan), `claims` (İddia ve kanıt)
- Yönerge: Eleştirel düşünme: iki görüşü adil biçimde karşılaştırma, bir sorunu açıklama, artılar-eksiler, farklı açılardan bakma, iddia ile kanıtı ayırma. Güncel siyasi tartışmalarda taraf tutma; konuları gündelik ve genel tut (ör. ev ödevi, uzaktan çalışma, şehirde bisiklet). Sonunda okura bir soru bırak.

## 6. Örnek blok

```text
### | Balkondaki Domates
sub: home | tags: ev, bitki, sabır | level: 1
---
Neslihan balkondaki saksıya ilk domates fidesini dikti…

Her sabah toprağı parmağıyla yokladı…
```

