# İçerik paketi biçimi

İçerik kod içinde değil, JSON dosyalarındadır. Yeni kelime, minimal çift, cümle şablonu, paragraf veya senaryo eklemek için **kod değiştirmek gerekmez**.

İki yol vardır:

1. **Yerleşik paket** (depoda): `content/tr/*.json`, `content/en/*.json` dosyalarını düzenleyin, `npm run validate` ve `npm run sw` çalıştırın.
2. **Ek paket** (uygulamada): Ayarlar → Gelişmiş → İçerik paketleri → “İçerik paketi ekle (JSON)”. Paket bu tarayıcıda saklanır.

Her iki yolda da içerik her açılışta doğrulanır; hatalı kayıt **kullanılmaz** ve Ayarlar’da raporlanır.

## Yerleşik paket dosyaları

| Dosya | İçerik |
|---|---|
| `meta.json` | `lang`, `license`, `source`, `review`, kategoriler (`{ "tr": "...", "en": "..." }`), taşıyıcı cümleler (`frames`), bilgi cümleleri (`infoFrames`) |
| `words.json` | `{ "words": [...] }` |
| `pairs.json` | `{ "families": [...] }` minimal çiftler / benzer kelimeler |
| `syllables.json` | `{ "sets": [...] }` hece kümeleri |
| `pools.json` | `{ "pools": { "ad": { "items": [...] } } }` şablon değer havuzları |
| `sentences.json` | `{ "templates": [...], "qa": [...] }` |
| `paragraphs.json` | `{ "paragraphs": [...] }` |
| `scenarios.json` | `{ "scenarios": [...] }` |
| `matrix.json` | Matris cümle tablosu (v3): `license`, `pattern`, `columns` |

## Kayıt örnekleri

### Kelime

```json
{ "id": "tr.w.ev", "w": "ev", "cat": "home", "lvl": 1, "aud": "both", "e": "🏠", "syl": 1, "frame": true }
```

- `lvl` 1–3: sıklık/tanıdıklık (1 = en tanıdık). `aud`: `both` | `child` | `adult`.
- `e`: isteğe bağlı resim (emoji). `syl`: hece sayısı — Türkçede otomatik denetlenir.
- İngilizce: isteğe bağlı `ipa`, `stress` (vurgulu hecenin sırası).
- `frame: true`: kelime, kategorinin taşıyıcı cümlelerinde kullanılabilir.
- İsteğe bağlı ve şimdilik arayüzde gösterilmeyen alanlar: `ex` (örnek cümle), `src` (kaynak). Doğrulayıcı bunları reddetmez; ileride kullanılmak üzere eklenebilir.

### Minimal çift ailesi

```json
{ "id": "tr.p.bal-dal-sal", "minimal": true, "lvl": 1, "aud": "both", "note": "İlk ünsüz",
  "words": [ { "w": "bal", "ipa": "bal", "e": "🍯" }, { "w": "dal", "ipa": "dal", "e": "🌿" }, { "w": "şal", "ipa": "ʃal" } ],
  "frame": "Resimde {w} var.", "frameWords": ["bal", "dal", "şal"] }
```

`minimal: true` ise doğrulayıcı her kelime çiftinin IPA’da **tek sesbirim** farklı olduğunu denetler. Benzer ama minimal olmayan kelimeler için `minimal` yazmayın. Türkçede sözcük sonu ötümsüzleşmesi nedeniyle aynı okunan çiftleri (ad/at) eklemeyin.

### Hece ve logatom kümesi

```json
{ "id": "tr.log.vcv-voicing", "label": "VCV ünsüz: ötümlülük", "kind": "vcv", "lvl": 2,
  "items": [ { "s": "aba", "say": "aba", "ipa": "aba" }, { "s": "apa", "say": "apa", "ipa": "apa" } ] }
```

- `kind` yoksa küme klasik hece görevlerinde (hece seçme, aynı mı farklı mı, hece dizisi) kullanılır.
- `kind: "vcv"` → “Anlamsız hecelerde ünsüz” görevi; `kind: "cvc"` → “Anlamsız hecelerde ünlü” görevi.
- `say`, seslendirmeye gönderilen yazımdır (İngilizcede “ahbah” gibi); `s` ekranda görünen etikettir. Her küme Ses kalite testinde ayrı doğrulanır; değerlendirme modunda yalnızca doğrulanmış kümeler kullanılır.

### Matris cümle tablosu

```json
{ "license": "MIT", "note": "Özgün kelimeler",
  "pattern": ["name", "number", "adj", "object", "verb"],
  "columns": [ { "id": "name", "label": { "tr": "Kim?", "en": "Who?" }, "words": ["Ayşe", "Can", "…"] }, … ] }
```

- Her sütundan bir kelime seçilerek `pattern` sırasıyla cümle kurulur; **her kombinasyon dilbilgisel olmalıdır** (Türkçede sayıdan sonra tekil isim, İngilizcede çoğul isim).
- Sütun başına en az 4, en fazla 10 kelime önerilir (10 seçenekli ızgara için 10). Lisanslı klinik test listelerini (ör. ticari Matris Testi kelimeleri) kullanmayın.

### Cümle şablonu

```json
{ "id": "tr.s.count", "lvl": 1, "aud": "both", "struct": "quantity",
  "slots": { "n": "numbers", "ct": "countables" },
  "text": ["Masada {n} {ct} var.", "Sepette {n} {ct} var."],
  "q": [ { "type": "howmany", "q": "Kaç tane var?", "ask": "n", "show": "show" }, { "type": "what", "q": "Ne var?", "ask": "ct" } ] }
```

- `{yuva}` veya `{yuva.biçim}`: havuz öğesinin çekimli biçimi (ör. `{r.loc}` → “mutfakta”). Biçimler havuz öğesinde açıkça yazılır.
- Tüm `text` varyantları aynı yuvaları kullanmalıdır.
- Hazır üreteçler: `@number:min:max`, `@time:saat1:saat2`, `@date`, `@money:min:max`, `@address` (okunuş sözcüklerle üretilir).

### Paragraf / senaryo

Paragraf: `sentences` (her cümle için alternatif ifadeler dizisi), `questions`.
Senaryo: `group` (`home`, `social`, `transport`, `phone`, `work`, `health`, `public`), `roles`, `variants[].lines[]` (`{ "sp": "A", "t": "..." }` veya `{ "sfx": "doorbell" }`), `questions`.

Soru türleri: `who`, `what`, `where`, `when`, `why`, `how`, `howmany`, `order`, `main`, `detail`, `notsaid`, `inference`, `purpose`, `relation`, `feeling`, `speaker`, `strategy`.
Cevap kaynağı: `ask` (bir yuvanın değeri; çeldiriciler aynı havuzdan) veya `opts` (ilk seçenek doğru; en az 3 anlamlı çeldirici yazın).

## Ek paket (uygulamada içe aktarma)

```json
{
  "app": "duyum-pack", "lang": "tr", "id": "okul-kelimeleri-1",
  "license": "CC BY 4.0", "source": "Okul DKT ekibi, 2026",
  "categories": { "lab": { "tr": "Laboratuvar", "en": "Laboratory" } },
  "words": [ { "id": "okul1.w.tüp", "w": "tüp", "cat": "lab", "lvl": 2, "aud": "both", "syl": 1 } ]
}
```

`license` zorunludur; lisansı belirsiz paket kabul edilmez. `words`, `families`, `templates`, `qa`, `pools`, `paragraphs`, `scenarios` alanları yerleşik paketle birleştirilir.

## Doğrulama listesi

Boş içerik · yinelenen kimlik/kelime · bilinmeyen kategori/havuz · geçersiz seviye/yaş etiketi · bozuk resim referansı · Türkçe hece sayısı · vurgu > hece · minimal olmayan “minimal” çift · varyantlar arası yuva tutarsızlığı · çözülmemiş `{yer tutucu}` · eksik noktalama · çift boşluk · üretilemeyen soru · birden fazla doğru cevap · yinelenen seçenek · lisans bilgisi.
