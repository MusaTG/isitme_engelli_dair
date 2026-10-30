# Değerlendirme protokolü

NotebookLM yalnızca yüklenen kaynaklara dayanarak yanıt verir. Bu güçlü bir yöndür ama yanıt, kaynakların kalitesi kadar iyidir. Her konu için şu adımları izleyin.

## 1. Kaynak seçimi

- Her konuya **ayrı defter** açın (kaynaklar karışmasın).
- Konu başına 5–15 kaynak. Öncelik sırası: standart / resmî belge → hakemli çalışma veya derleme → üniversite ya da kurum rehberi → uygulayıcı yazıları. Blog ve forum yalnızca tamamlayıcı olsun.
- Kaynağın tarihini ve yayıncısını not edin. 10 yıldan eski kaynakları ancak hâlâ geçerli standartsa kullanın.
- Telifli kitap metinlerini **okuma metni üretimi** defterine yüklemeyin; araştırma defterinde inceleme için kullanılabilir ama uygulamaya içerik olarak alınmaz.

## 2. Sorgulama

- `konular.md` içindeki istemleri sırayla sorun.
- Her yanıtta atıfların ([1], [2]) **gerçekten** o kaynağın o bölümüne gittiğini tıklayıp kontrol edin.
- Yanıt bir sayı veriyorsa (ör. kelime/dakika), aynı sayıyı en az **iki bağımsız kaynakta** arayın.
- Son olarak her konuda şunu sorun: “Bu kaynaklarda bu soruya karşı çıkan ya da sınırlarını belirten bölümler hangileri?”

## 3. Güven düzeyi

| Düzey | Ölçüt |
|---|---|
| **Yüksek** | Standart/resmî belge ya da ≥2 bağımsız hakemli kaynak aynı şeyi söylüyor |
| **Orta** | Tek iyi kaynak ya da kaynaklar benzer ama farklı bağlamda (ör. İngilizce bulgu, Türkçeye genelleniyor) |
| **Düşük** | Yalnızca uygulayıcı yazısı / kaynaklar çelişiyor |

Düşük güvenli bulgu uygulamada **ayar ya da öneri** olabilir, varsayılan ya da iddia olamaz.

## 4. Karara dönüştürme

`karar-sablonu.md` ile bir kayıt doldurun: bulgu, güven, kaynaklar, uygulamada değişecek yer, değişmeyecek yer. Uygulamada **klinik iddia yazılmaz** (ör. “işitmeyi geliştirir” değil, “düzenli okuma ve dinleme pratiği sunar”).

## 5. Teslim

Kaydı `sonuclar/` klasörüne koyun ya da Claude'a ekleyin. Claude değişikliği uygular, testleri çalıştırır ve kaydın “Uygulandı” bölümünü doldurur.
