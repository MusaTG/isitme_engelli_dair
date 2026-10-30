# Okuma kütüphanesi — durum ve eksikler

Otomatik üretilir: `node tools/reading-status.mjs` (içe aktarma ve yayın sırasında kendiliğinden çalışır). Makine okunur sürüm: `docs/reading/status.json`.

Hedef: her dil ve kategoride en az 100 metin; bunlardan en az 5 orta ve 1 uzun. **Toplam eksik: 1768 metin.** Bozuk/tekrar sorunu: 0 hata, 3 uyarı.

Nasıl tamamlanır: `docs/reading/istemler/` içindeki istemi bir yapay zekâ sohbetine yapıştırın, yanıtı `content-src/reading/inbox/<dil>/<kategori>/` klasörüne kaydedin (birden çok metin tek dosyada olabilir; .txt, .md, .json, .csv), `npm run reading:import` ile ön izleyip onaylayın. Ayrıntı: `docs/reading-format.md`.

## Sıradaki öncelikler

1. tr/longform: 100 metin, 5 orta, 1 uzun → [istem](istemler/tr-longform.md)
2. tr/letters: 100 metin, 5 orta, 1 uzun → [istem](istemler/tr-letters.md)
3. tr/critical: 100 metin, 5 orta, 1 uzun → [istem](istemler/tr-critical.md)
4. en/daily: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-daily.md)
5. en/stories: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-stories.md)
6. en/novel: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-novel.md)
7. en/news: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-news.md)
8. en/info: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-info.md)
9. en/travel: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-travel.md)
10. en/dialogue: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-dialogue.md)
11. en/work: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-work.md)
12. en/poetry: 100 metin, 5 orta, 1 uzun → [istem](istemler/en-poetry.md)

## Kategori tablosu

| Dil | Kategori | Mevcut | Eksik | Kısa | Orta | Uzun | Seviye 1/2/3 | Seviyesi tahmini | Kaynak bilgisi eksik* | Bozuk | İstem |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---|
| tr | Günlük yaşam hikâyeleri (`daily`) | 101 | 0 | 94 | 6 | 1 | 8/87/6 | 101 | 0 | 0 | tamam |
| tr | Öykü ve kısa hikâye (`stories`) | 100 | 0 | 98 | 1 (+4) | 1 | 14/77/9 | 100 | 0 | 0 | [tr-stories.md](istemler/tr-stories.md) |
| tr | Roman tarzı uzun okumalar (`novel`) | 101 | 0 | 98 | 2 (+3) | 1 | 23/72/6 | 100 | 0 | 0 | [tr-novel.md](istemler/tr-novel.md) |
| tr | Gazete ve dergi tarzı (`news`) | 100 | 0 | 98 | 1 (+4) | 1 | 0/21/79 | 98 | 44 | 0 | [tr-news.md](istemler/tr-news.md) |
| tr | Bilgilendirici ve öğretici (`info`) | 100 | 0 | 98 | 1 (+4) | 1 | 0/18/82 | 97 | 100 | 0 | [tr-info.md](istemler/tr-info.md) |
| tr | Gezi ve seyahat (`travel`) | 90 | **10** | 85 | 5 | 0 (+1) | 10/34/46 | 50 | 79 | 0 | [tr-travel.md](istemler/tr-travel.md) |
| tr | Diyalog ve konuşma (`dialogue`) | 99 | **1** | 93 | 5 | 1 | 27/48/24 | 0 | 0 | 0 | [tr-dialogue.md](istemler/tr-dialogue.md) |
| tr | İş ve mesleki okuma (`work`) | 83 | **17** | 77 | 5 | 1 | 19/41/23 | 0 | 0 | 0 | [tr-work.md](istemler/tr-work.md) |
| tr | Şiir ve edebî metinler (`poetry`) | 98 | **2** | 92 | 5 | 1 | 23/50/25 | 0 | 0 | 0 | [tr-poetry.md](istemler/tr-poetry.md) |
| tr | Dil ve telaffuz odaklı (`language`) | 62 | **38** | 56 | 5 | 1 | 18/29/15 | 0 | 0 | 0 | [tr-language.md](istemler/tr-language.md) |
| tr | Çocuklar için (`kids`) | 100 | 0 | 94 | 5 | 1 | 24/50/26 | 0 | 0 | 0 | tamam |
| tr | Yetişkinler için uzun okumalar (`longform`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [tr-longform.md](istemler/tr-longform.md) |
| tr | Günlük ve mektup (`letters`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [tr-letters.md](istemler/tr-letters.md) |
| tr | Eleştirel düşünme ve karşılaştırma (`critical`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [tr-critical.md](istemler/tr-critical.md) |
| en | Günlük yaşam hikâyeleri (`daily`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-daily.md](istemler/en-daily.md) |
| en | Öykü ve kısa hikâye (`stories`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-stories.md](istemler/en-stories.md) |
| en | Roman tarzı uzun okumalar (`novel`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-novel.md](istemler/en-novel.md) |
| en | Gazete ve dergi tarzı (`news`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-news.md](istemler/en-news.md) |
| en | Bilgilendirici ve öğretici (`info`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-info.md](istemler/en-info.md) |
| en | Gezi ve seyahat (`travel`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-travel.md](istemler/en-travel.md) |
| en | Diyalog ve konuşma (`dialogue`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-dialogue.md](istemler/en-dialogue.md) |
| en | İş ve mesleki okuma (`work`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-work.md](istemler/en-work.md) |
| en | Şiir ve edebî metinler (`poetry`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-poetry.md](istemler/en-poetry.md) |
| en | Dil ve telaffuz odaklı (`language`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-language.md](istemler/en-language.md) |
| en | Çocuklar için (`kids`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-kids.md](istemler/en-kids.md) |
| en | Yetişkinler için uzun okumalar (`longform`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-longform.md](istemler/en-longform.md) |
| en | Günlük ve mektup (`letters`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-letters.md](istemler/en-letters.md) |
| en | Eleştirel düşünme ve karşılaştırma (`critical`) | 0 | **100** | 0 | 0 (+5) | 0 (+1) | 0/0/0 | 0 | 0 | 0 | [en-critical.md](istemler/en-critical.md) |

\* Gerçek bilgiye dayanan türlerde (bilgilendirici, dergi yazısı, gerçek yer tanıtımı) metin başına `source` alanı olmayanlar. Genel bilgi metinlerinde zorunlu değildir; inceleme önceliği için gösterilir.

## Bozuk ve tekrar kayıtlar

- uyarı (tr, duplicate-title): tr-work-070: başlık tr-work-006 ile aynı (içerik farklı; ayrı metin sayıldı)
- uyarı (tr, duplicate-title): tr-work-078: başlık tr-work-022 ile aynı (içerik farklı; ayrı metin sayıldı)
- uyarı (tr, duplicate-title): tr-language-057: başlık tr-language-013 ile aynı (içerik farklı; ayrı metin sayıldı)

