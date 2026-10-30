# Okuma metinleri — biçim ve dışarıdan aktarma

Okuma Egzersizi kütüphanesi düz metin dosyalarından derlenir. Metinleri kendiniz yazabilir ya da başka bir yapay zekâ sohbetinde ürettirip **aktarabilirsiniz**. Uygulama derleme gerektirmez; yalnızca kütüphane JSON'ları bir Node betiğiyle üretilir (GitHub'da bunu yayın iş akışı yapar).

## En kısa yol (3 adım)

1. `docs/reading/EKSIKLER.md` dosyasında hangi dil/kategoride kaç metin eksik olduğuna bakın. Her eksik kategori için hazır bir istem vardır: `docs/reading/istemler/<dil>-<kategori>.md`.
2. İstemi bir yapay zekâ sohbetine yapıştırın. Gelen yanıtı olduğu gibi bir `.txt` dosyasına kaydedin ve şuraya koyun:
   `content-src/reading/inbox/<dil>/<kategori>/` → ör. `content-src/reading/inbox/tr/dialogue/parti-01.txt`
3. Aktarın:
   - Bilgisayarda: `npm run reading:import` → **ön izleme** (eklenecek / güncellenecek / tekrar olduğu için atlanacak / hatalı sayıları, dil–kategori dağılımı, kayıt bazında gerekçe) ve onay sorusu. Onaysız uygulamak için `npm run reading:import -- --yes`, yalnızca ön izleme için `-- --dry`. Rapor: `inbox/RAPOR.md` ve makine okunur `inbox/RAPOR.json`.
   - GitHub'da: dosyayı web arayüzünden o klasöre yükleyip `main` dalına kaydedin. "Test ve yayınla" iş akışı aktarır, numaralar verir, değişikliği depoya geri yazar ve siteyi yayınlar.

Tek dosyada istediğin kadar metin olabilir; farklı dil/kategorideki metinler için bloklara `lang:` ve `cat:` yaz. Aynı dosyayı yeniden aktarmak kopya üretmez: içerik özeti aynı olan metin **atlanır**. Başlığı aynı ama içeriği farklı metin ayrı kayıt olarak eklenir (uyarıyla). Var olan bir metni düzeltmek için bloğa `id: tr-daily-012` yaz: o metin yerinde güncellenir ve sürümü artar (okuyucunun konumu ve işaretleri sürüm geçişinde taşınır). Yazma işlemleri önce geçici dosyaya yapılır ve atomik olarak taşınır; hata olursa kütüphane değişmez ve kaynak dosya inbox'ta kalır.

Aktarma aracı numaraları kendisi verir, kalitesiz/eksik blokları reddeder ve gerekçeyi `content-src/reading/inbox/RAPOR.md` dosyasına yazar. Reddedilen bloklar `inbox/_reddedildi/` altında durur; düzeltip yeniden `inbox/` içine koyabilirsiniz. İşlenen dosyalar `inbox/_islendi/` altına taşınır (silebilirsiniz).

## Blok biçimi

```text
### | Metnin Başlığı
sub: restaurant | tags: kafe, sipariş, nezaket | level: 1
---
Gövde paragrafı. Paragraflar arasında boş satır.

## Ara başlık (isteğe bağlı; okuma aşaması olur)

Devam paragrafı.
```

- `###` satırı yeni metin başlatır. Numara isteğe bağlıdır (`### | Başlık`); aktarma aracı sıradaki boş numarayı verir. Kütüphanedeki dosyalarda numara zorunludur (`### 12 | Başlık`) ve **değiştirilmemelidir** — metnin kimliği (`tr-dialogue-012`) ve okuyucunun kaydettiği konum buna bağlıdır.
- Meta satırı (`---` çizgisinden önce) `anahtar: değer` çiftlerinden oluşur, `|` ile ayrılır:

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `sub` | evet | Alt kategori kimliği (her kategorinin listesi `content-src/reading/categories.json` ve istem dosyalarında) |
| `tags` | hayır | Virgülle ayrılmış 3–5 etiket (aramada kullanılır) |
| `level` | **kütüphaneye aktarmada evet** | 1 kolay, 2 orta, 3 ileri. Kendi metinlerinde yazılmazsa cümle uzunluğundan tahmin edilir (tahmin `status.json`'da ayrıca sayılır) |
| `kind` | hayır | İçerik türü. Varsayılan kategoriye göre (haber: `fictional-news`, bilgi/gezi: `nonfiction`, diyalog: `dialogue`, iş: `workdoc`, dil: `practice`, eleştirel/uzun: `essay`, şiir: `poem`, diğerleri: `fiction`). Haberde gerçek bilgiye dayanan dergi yazısı için `feature`, kurgusal gezi günlüğü için `fictional-journal` |
| `aud` | hayır | `all` (varsayılan), `child` (çocuk kategorisinde varsayılan), `adult` |
| `series`, `part` | dizi bölümlerinde | Roman tarzı dizide dizi kimliği ve bölüm numarası; bölümler 1'den başlayıp ardışık olmalı |
| `summary` | hayır | Kart ve bilgi panelinde gösterilen kısa özet |
| `version` | hayır | Metni ciddi biçimde değiştirdiğinizde artırın (`id:` ile güncellemede otomatik artar) |
| `id` | güncellemede | Var olan metnin kimliği (`tr-daily-012`); yalnızca o metni güncellemek için |
| `source`, `license`, `author` | kaynak kullanıldıysa | Metin başına kaynak, lisans ve yazar. `source` varsa `license` zorunludur (özgün metinde ikisi de yazılmaz) |
| `origin`, `reviewed` | hayır | Üretim bilgisi (`original`, `ai-draft`, `cc-by` …) ve insan incelemesinden geçtiyse `reviewed: yes` |
| `similar` | hayır | `similar: ok` → başka bir metne çok benzese de bilinçli olarak eklendi; aktarma ve derleme bu metin için yakın kopya hatası vermez (birebir aynı içerik yine reddedilir). Toplu işaretlemek için: `npm run reading:import -- --yes --allow-similar` |
| `lang`, `cat` | yalnızca inbox'ta | Dosyayı klasöre değil doğrudan `inbox/` içine koyuyorsanız dil ve kategoriyi bunlarla verin |

- Gövde: boş satır paragrafı bitirir. `## Başlık` yeni bölüm (okuma aşaması) açar. Başlık yoksa uygulama metni ~200 kelimelik otomatik aşamalara böler ve bunları "Kısım n" olarak gösterir (özgün başlık gibi sunmaz).
- Diyalog (`kind: dialogue`; diyalog kategorisi, çocuk diyaloğu ve söyleşide varsayılan): her `Ad: söz` satırı konuşmacılı ayrı paragraftır; okurken konuşmacı adları gizlenebilir.
- Şiir (`kind: poem`): satır sonları korunur, kıtalar arasında boş satır.

### CSV

İlk satır başlık satırıdır; en az `title` ve `body` sütunları gerekir (Türkçe adlar da olur: `başlık`, `metin`, `dil`, `kategori`, `alt kategori`, `seviye`, `etiketler`, `kaynak`, `lisans`, `yazar`, `özet`, `kimlik`). Ayırıcı virgül ya da noktalı virgül (Türkçe Excel) olabilir; tırnak içinde virgül ve satır sonu desteklenir. Örnek:

```csv
title,body,lang,cat,sub,level,tags
"Kahvaltı, çay ve sohbet","Birinci paragraf...",tr,daily,home,1,"kahvaltı, aile"
```

### JSON

JSON da kabul edilir: `[{ "lang":"tr", "cat":"dialogue", "title":"…", "sub":"…", "tags":["…"], "body":"…" }]` ya da `{ "texts": [ … ] }`.

## NotebookLM ve sohbet çıktıları

Eksik metinleri NotebookLM'de ürettirmek için hazır paket: `docs/research/notebooklm/` (kurulum, kaynak dosyaları, sohbet ayarı, kategori başına istemler). Yanıtları `tr-dialogue-01.txt` gibi adlandırılmış dosyalara kaydedin; dil ve kategori dosya adından okunur, alt klasör gerekmez. `.txt`/`.md` aktarımında sohbet çıktısı kendiliğinden temizlenir: kaynak işaretleri (`[1]`, `[2, 3]`), `**kalın**`, kod çitleri, markdown kaçışları (`\-`), `### 3. Başlık` gibi numaralı/çizgisiz başlıklar (ardından meta satırı geliyorsa), büyük harfli anahtarlar (`Level:`) ve kopyalamada kaybolan `---` satırı.

## Durum raporu

`node tools/reading-status.mjs` (içe aktarma ve yayın sırasında kendiliğinden çalışır): `docs/reading/EKSIKLER.md` (okunur) ve `docs/reading/status.json` (makine okunur) — dil × kategori mevcut/hedef/eksik, kısa/orta/uzun, seviye dağılımı ve tahmini seviye sayısı, kaynak bilgisi eksik metinler, bozuk ve tekrar kayıtlar, sıradaki öncelikler.

## Kalite denetimi

Hem aktarma aracı hem derleyici (`npm run reading`) şunları denetler: geçerli alt kategori ve tür; en az 120 kelime (şiir 40, çocuk 80); yarıda kesilmiş görünen son; aynı başlık; birebir aynı içerik; yakın kopya (5 kelimelik parçalarda Jaccard ≥ 0,30 ya da kapsama ≥ 0,50); dizi bölümlerinin ardışıklığı; 3+ kez tekrarlanan cümle (uyarı). `npm run reading:check` ayrıca her kategoride en az 100 metin şartını uygular.

## Süre sınıfları

Tahmini süre, ayarlardan değiştirilebilen sesli okuma hızına göre hesaplanır (varsayılan TR 110, EN 140 kelime/dk): kısa < 7 dk, orta 7–25 dk, uzun ≥ 25 dk. Kabaca: TR orta ≥ 800, uzun ≥ 2.800 kelime; EN orta ≥ 1.000, uzun ≥ 3.600 kelime.

## Uygulama içinden aktarma (yalnızca bu cihaz)

Okuma → Kendi metinlerim → **Dosyadan içe aktar** (birden çok dosya seçilebilir) ya da **Metni yapıştırarak aktar**: .txt/.md blok biçimi, JSON ve CSV kabul edilir; önce aynı kurallarla ön izleme gösterilir (sayılar, dağılım, kayıt bazında gerekçe), onaydan sonra kaydedilir ve rapor indirilebilir. Bu yol metni kütüphaneye değil, yalnızca o cihazdaki "Kendi metinlerim" bölümüne ekler (herkese yayınlanmaz).

## Telif

Kütüphaneye yalnızca özgün ya da açık lisanslı metin ekleyin. Hazır istemler özgün yazmayı, gerçek kişiler hakkında yazmamayı ve kesin olmayan bilgi vermemeyi şart koşar; yine de yayınlamadan önce metinleri gözden geçirmeniz önerilir. Kütüphanedeki metinler `categories.json` içindeki lisans notuyla (CC BY 4.0, yapay zekâ destekli taslak) gösterilir.
