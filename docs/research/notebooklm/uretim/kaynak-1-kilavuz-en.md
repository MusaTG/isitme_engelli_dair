# Duyum okuma metni yazım kılavuzu — İngilizce (en)

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

- Kısa: 200–800 kelime
- Orta: 1050–3300 kelime, 5–20 "## Ara başlık" bölümü
- Uzun: 3700–6000 kelime, 5–20 bölüm
- En az: 120 kelime (şiir 40, çocuk 80). Alt sınırın altına düşme.

## 5. Kategoriler, alt kategoriler ve yönergeler

### Kategori `daily` — Everyday life stories

- Tanım: Plain stories set at home, outside, at work and in the family.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `home` (A day at home), `morning` (Morning routine), `errands` (Shopping and errands), `friends` (Meeting friends), `newplace` (Going somewhere new), `family` (Family life), `planning` (Planning the day), `habits` (New habits)
- Yönerge: Sade, gerçekçi günlük yaşam anlatıları (ev, sabah, alışveriş, arkadaş, aile, yeni yer, plan, alışkanlık). Küçük bir olay ve doğal bir kapanış olsun. Gerçek kişi/marka adı yok.

### Kategori `stories` — Short stories

- Tanım: Realistic, friendship, family, journey, nature, curiosity and humour stories.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `realistic` (Realistic), `friendship` (Friendship), `family` (Family and solidarity), `learning` (Learning something new), `journey` (Journeys), `nature` (In nature), `curiosity` (Curiosity and discovery), `humor` (Humour), `literary` (Literary story)
- Yönerge: Bağımsız, başı-ortası-sonu olan özgün öyküler. Türler: gerçekçi, dostluk, aile, öğrenme, yolculuk, doğa, merak, mizah, edebî. Her öykü farklı karakter ve olay örgüsüne sahip olsun.

### Kategori `novel` — Novel-style serials

- Tanım: Original serial novels; each chapter continues the previous one.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `adventure` (Adventure), `scifi` (Science fiction), `fantasy` (Fantasy), `mystery` (Mystery and puzzles), `historical` (Historical fiction), `exploration` (Travel and exploration), `relationships` (Everyday life and relationships)
- Yönerge: Roman tarzı DİZİLER: her dizi 10 bölümden oluşur; her bölüm bir öncekinin devamıdır. Her bölümde "series: <dizi-kimligi> | part: <bölüm no>" ZORUNLU. Başlık biçimi: "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>". Dizi kimliği küçük harf ve tire (ör. ruzgar-adasi). Bir yanıtta tek dizinin bölümlerini sırayla yaz. Tek parça uzun novella da olabilir (series yazma).

### Kategori `news` — Newspaper and magazine style

- Tanım: Fictional news items and magazine explainers based on real knowledge. Fictional news is not real events.
- Varsayılan tür: fictional-news
- Alt kategoriler (sub): `science` (Science and technology), `environment` (Environment and nature), `education` (Education), `culture` (Culture and arts), `history` (History and archaeology), `space` (Space and astronomy), `agriculture` (Farming and sustainability), `city` (City life), `community` (Community projects)
- Yönerge: Gazete/dergi tarzı. İki tür var ve her metinde belirtilmeli: (1) KURGUSAL HABER — "kind: fictional-news"; hayalî yer/kişi/kurum adları kullan, gerçek bir olay gibi sunma. (2) DERGİ YAZISI — "kind: feature"; yalnızca iyi bilinen, doğrulanabilir genel bilgilere dayan (bilim, doğa, tarih, uzay...). Kesin tarih/rakam verirken emin ol; emin değilsen genel ifade kullan. Gerçek kişiler hakkında haber yazma.

### Kategori `info` — Informative and educational

- Tanım: Plain explanations of science, the body, nature, geography, history, technology and everyday skills. General information only; not medical or financial advice.
- Varsayılan tür: nonfiction
- Alt kategoriler (sub): `science` (Science concepts), `body` (The human body and general health), `living` (Animals and plants), `geography` (Earth and geography), `history` (History), `psychology` (Introductory psychology), `technology` (Technology and computers), `ai` (Artificial intelligence), `tools` (Everyday tools), `economy` (Economics and finance concepts), `communication` (Communication and social skills), `learning` (Learning methods)
- Yönerge: Bilgilendirici, öğretici metinler. Doğru ve genel bilgi; sağlık, hukuk ve para konularında kişisel tavsiye verme, gerektiğinde "uzmana danışın" de. Tartışmalı konularda tarafsız ol. Kesin rakamları yalnızca iyi biliniyorsa ver.

### Kategori `travel` — Travel writing

- Tanım: Cities, nature, culture, museums and travel journals. Fictional journals are labelled.
- Varsayılan tür: nonfiction
- Alt kategoriler (sub): `cities` (City portraits), `nature` (Nature trips), `culture` (Cultural discoveries), `museums` (Museums and historic sites), `journal` (Travel journals), `planning` (Trip planning)
- Yönerge: Gezi ve seyahat: gerçek yer tanıtımları (yalnızca uzun süre değişmeyen, iyi bilinen bilgiler; fiyat/saat/telefon YOK), seyahat planlama ipuçları ve kurgusal gezi günlükleri. Kurgusal günlüklerde "sub: journal | kind: fictional-journal" yaz. Gerçek yer metinlerinde kind yazma (varsayılan: genel bilgi).

### Kategori `dialogue` — Dialogues and conversations

- Tanım: Everyday conversations with named speakers. You can hide speaker names for a harder read.
- Varsayılan tür: dialogue
- Alt kategoriler (sub): `everyday` (Everyday talk), `restaurant` (Restaurant and café), `shopping` (Shopping), `interview` (Job interview), `meeting` (Meeting), `phone` (Phone call), `school` (School and classes), `directions` (Directions), `intro` (Meeting someone new), `problem` (Solving a problem politely)
- Yönerge: Konuşmacısı belli diyaloglar. HER SATIR "Ad: söz" biçiminde olsun (ör. "Elif: Günaydın!"). Anlatıcı cümlesi gerekiyorsa ayrı paragraf yaz. Bağlam: günlük konuşma, restoran, alışveriş, iş görüşmesi, toplantı, telefon, okul, yol tarifi, tanışma, sorun çözme. Doğal, nazik, gerçekçi dil.

### Kategori `work` — Work and professional reading

- Tanım: Emails, meeting notes, short reports, instructions and professional development pieces. People and companies are fictional.
- Varsayılan tür: workdoc
- Alt kategoriler (sub): `email` (Email), `minutes` (Meeting notes), `report` (Short report), `project` (Project description), `workplace` (At the workplace), `presentation` (Presentation script), `instructions` (Instructions), `customer` (Customer communication), `tech` (Technology and software), `growth` (Professional growth)
- Yönerge: İş ve mesleki okuma: e-posta, toplantı notu, kısa rapor, proje açıklaması, sunum metni, talimat, müşteri iletişimi, teknoloji, mesleki gelişim. Kişi ve şirket adları HAYALÎ olsun. Gerçek bir belge gibi biçimlendir (konu satırı, maddeler, imza) ama gerçek iletişim bilgisi verme.

### Kategori `poetry` — Poetry and literary prose

- Tanım: Original poems, short prose pieces and descriptions.
- Varsayılan tür: poem
- Alt kategoriler (sub): `poem` (Poem), `prose` (Short prose), `description` (Description), `nature` (Nature writing), `feeling` (Feelings), `style` (Style exercise)
- Yönerge: Özgün şiirler ve kısa edebî düzyazılar. Şiirlerde dize sonlarında satır atla; kıtalar arasında boş satır bırak. Düzyazı/betimlemelerde "kind: fiction" yaz (şiirlerde kind yazma). Bilinen şiirleri taklit etme, alıntı yapma.

### Kategori `language` — Language and pronunciation

- Tanım: Texts written for reading aloud and diction practice. This is a separate skill from listening exercises.
- Varsayılan tür: practice
- Alt kategoriler (sub): `clear` (Short, clear sentences), `long` (Long sentences), `punctuation` (Punctuation and pauses), `questions` (Questions and exclamations), `sounds` (Similar sounds), `syllables` (Syllable length), `numbers` (Numbers, dates and times), `twisters` (Tongue twisters), `diction` (Diction)
- Yönerge: Sesli okuma ve diksiyon pratiği: kısa açık cümleler, uzun cümleler, noktalama ve duraklama, soru/ünlem, benzer sesler, hece uzunlukları, sayı-tarih-saat okuma, tekerleme, diksiyon. Her metnin başında bir cümlelik "Bu metinde ... çalışıyoruz." açıklaması olsun. Tekerlemeler özgün olsun.

### Kategori `kids` — For children

- Tanım: Age-appropriate short stories, animal tales, simple dialogues and curious facts.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `story` (Short story), `animals` (Animal tales), `dialogue` (Simple dialogue), `daily` (Everyday life), `nature` (Nature and discovery), `lesson` (Stories that teach), `facts` (Curious facts)
- Yönerge: Çocuklar için (yaklaşık 6–10 yaş): kısa, sıcak, yaşa uygun hikâyeler, hayvan öyküleri, basit diyaloglar ("Ad: söz"), günlük yaşam, doğa, eğitici hikâye, merak edilen bilgiler. Korkutucu/şiddet içeren öğe yok. Basit cümleler. En az 90 kelime.

### Kategori `longform` — Long reads for adults

- Tanım: Essays, long articles, original interview-style pieces and longer narratives.
- Varsayılan tür: essay
- Alt kategoriler (sub): `essay` (Essay), `travel` (Travel piece), `science` (Science and technology), `growth` (Personal growth), `culture` (History and culture), `story` (Long story), `interview` (Interview), `article` (Long explainer)
- Yönerge: Yetişkinler için uzun okumalar: deneme, uzun gezi yazısı, bilim, kişisel gelişim, tarih-kültür, uzun hikâye, HAYALÎ kişilerle söyleşi (söyleşide "Ad: söz" biçimi), uzun makale. Bu kategoride ORTA ve UZUN metin ağırlıklı olsun; "## Ara başlık" kullan.

### Kategori `letters` — Diaries and letters

- Tanım: Personal diaries, letters, memoirs and reflections. All original and fictional.
- Varsayılan tür: fiction
- Alt kategoriler (sub): `diary` (Personal diary), `travel` (Travel diary), `event` (After an event), `letter` (Letter), `memoir` (Memoir), `reflection` (Reflection)
- Yönerge: Kişisel günlükler, mektuplar, anılar, düşünce yazıları — tümü özgün ve kurgusal; gerçek kişilere mektup yazma. Günlüklerde tarih başlıkları ("## 3 Mart") kullanılabilir.

### Kategori `critical` — Critical thinking and comparison

- Tanım: Pieces that compare two views, explain a problem, weigh pros and cons, and separate claims from evidence.
- Varsayılan tür: essay
- Alt kategoriler (sub): `views` (Two views), `problem` (Explaining a problem), `proscons` (Pros and cons), `angles` (Different angles), `claims` (Claims and evidence)
- Yönerge: Eleştirel düşünme: iki görüşü adil biçimde karşılaştırma, bir sorunu açıklama, artılar-eksiler, farklı açılardan bakma, iddia ile kanıtı ayırma. Güncel siyasi tartışmalarda taraf tutma; konuları gündelik ve genel tut (ör. ev ödevi, uzaktan çalışma, şehirde bisiklet). Sonunda okura bir soru bırak.

## 6. Örnek blok

```text
### | The Tomato on the Balcony
sub: home | tags: home, plants, patience | level: 1
---
Nell planted her first tomato seedling in the balcony pot…

Every morning she tested the soil with a finger…
```

