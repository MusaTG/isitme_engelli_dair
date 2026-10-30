# NotebookLM üretim istemleri — Türkçe (tr)

Bu dosya `node tools/notebooklm-pack.mjs` ile eksik listesinden üretilir; içerik ekledikçe sayılar güncellenir.

| Kategori | Eksik | Kısa istek | Orta istek | Uzun istek | Kaydedilecek dosya adı |
|---|---:|---:|---:|---:|---|
| Öykü ve kısa hikâye (`stories`) | 0 | 0 × 5 | 4 × 1 | 0 × 1 (parça parça) | `tr-stories-01.txt`, `-02`… |
| Roman tarzı uzun okumalar (`novel`) | 0 | 0 × 5 bölüm | 3 × 1 | 0 × 1 (parça parça) | `tr-novel-01.txt`, `-02`… |
| Gazete ve dergi tarzı (`news`) | 0 | 0 × 5 | 4 × 1 | 0 × 1 (parça parça) | `tr-news-01.txt`, `-02`… |
| Bilgilendirici ve öğretici (`info`) | 0 | 0 × 5 | 4 × 1 | 0 × 1 (parça parça) | `tr-info-01.txt`, `-02`… |
| Gezi ve seyahat (`travel`) | 10 | 2 × 5 | 0 × 1 | 1 × 1 (parça parça) | `tr-travel-01.txt`, `-02`… |
| Diyalog ve konuşma (`dialogue`) | 1 | 1 × 5 | 0 × 1 | 0 × 1 (parça parça) | `tr-dialogue-01.txt`, `-02`… |
| İş ve mesleki okuma (`work`) | 17 | 4 × 5 | 0 × 1 | 0 × 1 (parça parça) | `tr-work-01.txt`, `-02`… |
| Şiir ve edebî metinler (`poetry`) | 2 | 1 × 5 | 0 × 1 | 0 × 1 (parça parça) | `tr-poetry-01.txt`, `-02`… |
| Dil ve telaffuz odaklı (`language`) | 38 | 8 × 5 | 0 × 1 | 0 × 1 (parça parça) | `tr-language-01.txt`, `-02`… |
| Yetişkinler için uzun okumalar (`longform`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `tr-longform-01.txt`, `-02`… |
| Günlük ve mektup (`letters`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `tr-letters-01.txt`, `-02`… |
| Eleştirel düşünme ve karşılaştırma (`critical`) | 100 | 19 × 5 | 5 × 1 | 1 × 1 (parça parça) | `tr-critical-01.txt`, `-02`… |

---

## tr-stories — Öykü ve kısa hikâye

Eksik **0** (kısa 0, orta 4, uzun 0). Yanıtları `tr-stories-NN.txt` dosyalarına kaydedin.

**Orta metinler** — 4 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "stories" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-novel — Roman tarzı uzun okumalar

Eksik **0** (kısa 0, orta 3, uzun 0). Yanıtları `tr-novel-NN.txt` dosyalarına kaydedin.

**Orta metinler** — 3 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "novel" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-news — Gazete ve dergi tarzı

Eksik **0** (kısa 0, orta 4, uzun 0). Yanıtları `tr-news-NN.txt` dosyalarına kaydedin.

**Orta metinler** — 4 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "news" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-info — Bilgilendirici ve öğretici

Eksik **0** (kısa 0, orta 4, uzun 0). Yanıtları `tr-info-NN.txt` dosyalarına kaydedin.

**Orta metinler** — 4 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "info" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-travel — Gezi ve seyahat

Eksik **10** (kısa 9, orta 0, uzun 1). Yanıtları `tr-travel-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 2 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "travel" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (cities, nature, culture, museums, journal, planning); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "travel" kategorisi için 1 UZUN metin yazacağız (toplam 2900–5000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## tr-dialogue — Diyalog ve konuşma

Eksik **1** (kısa 1, orta 0, uzun 0). Yanıtları `tr-dialogue-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 1 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "dialogue" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (everyday, restaurant, shopping, interview, meeting, phone, school, directions, intro, problem); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-work — İş ve mesleki okuma

Eksik **17** (kısa 17, orta 0, uzun 0). Yanıtları `tr-work-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 4 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "work" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (email, minutes, report, project, workplace, presentation, instructions, customer, tech, growth); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-poetry — Şiir ve edebî metinler

Eksik **2** (kısa 2, orta 0, uzun 0). Yanıtları `tr-poetry-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 1 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "poetry" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (poem, prose, description, nature, feeling, style); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-language — Dil ve telaffuz odaklı

Eksik **38** (kısa 38, orta 0, uzun 0). Yanıtları `tr-language-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 8 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "language" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (clear, long, punctuation, questions, sounds, syllables, numbers, twisters, diction); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

## tr-longform — Yetişkinler için uzun okumalar

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `tr-longform-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "longform" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (essay, travel, science, growth, culture, story, interview, article); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "longform" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "longform" kategorisi için 1 UZUN metin yazacağız (toplam 2900–5000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## tr-letters — Günlük ve mektup

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `tr-letters-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "letters" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (diary, travel, event, letter, memoir, reflection); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "letters" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "letters" kategorisi için 1 UZUN metin yazacağız (toplam 2900–5000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

## tr-critical — Eleştirel düşünme ve karşılaştırma

Eksik **100** (kısa 94, orta 5, uzun 1). Yanıtları `tr-critical-NN.txt` dosyalarına kaydedin.

**Kısa metinler** — bu istemi 19 kez gönderin (her seferinde "parti" numarasını artırın):

```text
Kılavuzdaki "critical" kategorisi için parti 1: 5 KISA metin yaz (her biri 150–600 kelime). Alt kategorileri dağıt (views, problem, proscons, angles, claims); seviye 1, 2 ve 3'ü karıştır. "Mevcut başlıklar" kaynağındaki ve bu sohbette daha önce yazdığın başlık ve konuları tekrar etme. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Orta metinler** — 5 kez, her yanıtta 1 metin:

```text
Kılavuzdaki "critical" kategorisi için 1 ORTA metin yaz: 800–2500 kelime, 6–10 "## Ara başlık" bölümü. Önceki metinlerden farklı alt kategori ve konu seç. Yalnızca blok biçiminde yaz; atıf ekleme.
```

**Uzun metin** — NotebookLM tek yanıtta bu uzunluğu yazamaz; parça parça isteyin ve tüm parçaları AYNI dosyaya alt alta yapıştırın:

```text
Kılavuzdaki "critical" kategorisi için 1 UZUN metin yazacağız (toplam 2900–5000 kelime, 10–16 "## Ara başlık" bölümü). Önce başlık bloğunu (### | Başlık, meta satırı, ---) ve ilk 3 bölümü yaz.
```

Sonraki her istek:

```text
Aynı metne kaldığın yerden devam et: sonraki 3 bölümü yaz. Başlık ve meta satırını TEKRAR YAZMA; yalnızca "## Ara başlık" ve paragraflar. Son bölümdeysen metni doğal biçimde bitir.
```

