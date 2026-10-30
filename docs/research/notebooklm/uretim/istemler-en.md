# NotebookLM üretim istemleri — İngilizce (en)

Bu dosya `node tools/notebooklm-pack.mjs` ile eksik listesinden üretilir; içerik ekledikçe sayılar güncellenir.

| Kategori | Eksik | Kısa istek | Orta istek | Uzun istek | Kaydedilecek dosya adı |
|---|---:|---:|---:|---:|---|
| Günlük yaşam hikâyeleri (`daily`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-daily-01.txt`, `-02`… |
| Öykü ve kısa hikâye (`stories`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-stories-01.txt`, `-02`… |
| Roman tarzı uzun okumalar (`novel`) | 100 | 19 × 5 bölüm | 5 × 1 | 1 × 1 (parça parça) | `en-novel-01.txt`, `-02`… |
| Gazete ve dergi tarzı (`news`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-news-01.txt`, `-02`… |
| Bilgilendirici ve öğretici (`info`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-info-01.txt`, `-02`… |
| Gezi ve seyahat (`travel`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-travel-01.txt`, `-02`… |
| Diyalog ve konuşma (`dialogue`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-dialogue-01.txt`, `-02`… |
| İş ve mesleki okuma (`work`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-work-01.txt`, `-02`… |
| Şiir ve edebî metinler (`poetry`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-poetry-01.txt`, `-02`… |
| Dil ve telaffuz odaklı (`language`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-language-01.txt`, `-02`… |
| Çocuklar için (`kids`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-kids-01.txt`, `-02`… |
| Yetişkinler için uzun okumalar (`longform`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-longform-01.txt`, `-02`… |
| Günlük ve mektup (`letters`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-letters-01.txt`, `-02`… |
| Eleştirel düşünme ve karşılaştırma (`critical`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `en-critical-01.txt`, `-02`… |

---

## en-daily — Günlük yaşam hikâyeleri

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-daily-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "daily" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (home, morning, errands, friends, newplace, family, planning, habits); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "daily" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "daily" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-stories — Öykü ve kısa hikâye

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-stories-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "stories" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (realistic, friendship, family, learning, journey, nature, curiosity, humor, literary); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "stories" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "stories" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-novel — Roman tarzı uzun okumalar

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-novel-NN.txt` dosyalarına kaydedin.

**Dizi bölümleri** — her dizi 10 bölüm; her dizi için 2 istek (bölüm 1–5, sonra 6–10), toplam 10 dizi:

```text
Kılavuzdaki "novel" kategorisi için YENİ bir roman dizisi başlat: dizinin 1–5. bölümlerini yaz (her bölüm 200–800 kelime). Her bölümün meta satırında aynı "series: <dizi-kimligi>" ve "part: <n>" olsun; başlık biçimi "<Dizi Adı> — <n>. Bölüm: <Bölüm adı>". Önceki dizilerden farklı karakter, mekân ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

Ardından:

```text
Aynı dizinin 6–10. bölümlerini yaz; 10. bölümde hikâyeyi doğal biçimde bitir.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "novel" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "novel" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-news — Gazete ve dergi tarzı

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-news-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "news" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (science, environment, education, culture, history, space, agriculture, city, community); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "news" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "news" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-info — Bilgilendirici ve öğretici

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-info-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "info" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (science, body, living, geography, history, psychology, technology, ai, tools, economy, communication, learning); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "info" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "info" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-travel — Gezi ve seyahat

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-travel-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "travel" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (cities, nature, culture, museums, journal, planning); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "travel" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "travel" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-dialogue — Diyalog ve konuşma

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-dialogue-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "dialogue" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (everyday, restaurant, shopping, interview, meeting, phone, school, directions, intro, problem); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "dialogue" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "dialogue" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-work — İş ve mesleki okuma

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-work-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "work" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (email, minutes, report, project, workplace, presentation, instructions, customer, tech, growth); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "work" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "work" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-poetry — Şiir ve edebî metinler

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-poetry-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "poetry" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (poem, prose, description, nature, feeling, style); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "poetry" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "poetry" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-language — Dil ve telaffuz odaklı

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-language-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "language" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (clear, long, punctuation, questions, sounds, syllables, numbers, twisters, diction); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "language" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "language" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-kids — Çocuklar için

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-kids-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "kids" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (story, animals, dialogue, daily, nature, lesson, facts); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "kids" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "kids" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-longform — Yetişkinler için uzun okumalar

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-longform-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "longform" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (essay, travel, science, growth, culture, story, interview, article); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "longform" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "longform" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-letters — Günlük ve mektup

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-letters-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "letters" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (diary, travel, event, letter, memoir, reflection); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "letters" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "letters" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## en-critical — Eleştirel düşünme ve karşılaştırma

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `en-critical-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "critical" kategorisi için parti 1: 5 KISA metin yaz (her biri 200–800 kelime). Alt kategorileri dağıt (views, problem, proscons, angles, claims); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "critical" kategorisi için 1 ORTA metin yaz: 1050–3300 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "critical" kategorisi için 1 UZUN metin yazacağız (toplam 3700–6000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

