# v4.0 durum raporu — Okuma Egzersizi

Tarih: 2026-10-19. Yalnızca gerçekten çalıştırılıp denetlenen şeyler "çalışıyor" olarak yazılmıştır.

## Kütüphane — gerçek sayılar

| Dil | Kategori | Metin | Durum |
|---|---|---:|---|
| TR | Günlük yaşam | 101 | tamam (6 orta, 1 uzun) |
| TR | Öykü | 100 | tamam (1 orta, 1 uzun) |
| TR | Roman tarzı | 101 | tamam (10 dizi × 10 bölüm + 1 uzun anlatı) |
| TR | Gazete/dergi | 100 | tamam (kurgusal haber / dergi yazısı ayrımı işaretli) |
| TR | Bilgilendirici | 100 | tamam |
| TR | Gezi | 50 | **50 eksik** |
| TR | Diyalog, İş, Şiir, Dil, Çocuk, Uzun okuma, Günlük/mektup, Eleştirel | 0 | **her biri 100 eksik** |
| EN | 14 kategori | 0 | **her biri 100 eksik** |

Toplam: 552 metin (552 benzersiz, 128.902 kelime). Hedefe göre **2.250 metin eksik**. Yer tutucu metin sayılmamıştır; kütüphanede yer tutucu yoktur. Güncel tablo her derlemede `docs/reading/EKSIKLER.md` ve `docs/reading/inventory.md` dosyalarına yazılır.

Eksikler bu oturumda üretilmedi (kullanıcı kararı: metinler dışarıda üretilecek). Bunun için:
- `docs/reading/istemler/<dil>-<kategori>.md` — her eksik kategori için kopyala-yapıştır istem (alt kategoriler, uzunluk aralıkları, kategoriye özel kurallar, var olan başlıklar).
- `content-src/reading/inbox/<dil>/<kategori>/` — üretilen yanıtın konacağı yer; `npm run reading:import` ya da GitHub iş akışı numaralar, denetler, raporlar.
- Uygulama içinden (Kendi metinlerim → Dosyadan içe aktar) aynı biçim yalnızca o cihaza eklenebilir.

## Çalışıyor (test edildi)

- Okuma ana sayfası, kütüphane, katlanmış arama ve vurgu, süzgeçler, boş kategori/dil durumu.
- Okuyucu: aşama ilerlemesi, kalınan yere dönüş (yeniden yüklemede doğrulandı), ayraç, iki yana hizalama, içindekilerde etkin bölüm, okuma listesi sayfası.
- Sesli okuma düğmesi telefonda kaydırırken gizlenip geri geliyor; Ayarlar → Erişilebilirlik’te kapatılınca görünmüyor.
- Mikrofon: uygulama kodunda `getUserMedia`, `MediaRecorder`, konuşma tanıma API’si yok (birim testi); tarayıcı testinde hiçbir mikrofon/izin çağrısı yapılmadı.
- `.txt` blok dosyasından içe aktarma (uygulama içi ve araç), reddetme gerekçeleri, numaralama, konuşmacılı diyalog ayrıştırma.
- Birim testleri: 67 geçti, 1 TODO (“her kategoride 100 metin” — kütüphane tamamlanınca kendiliğinden geçer). Tarayıcı testi `run_reading.py`: 17/17. v3 regresyon testi yeniden çalıştırıldı.

## Doğrulanmadı / sınırlar

- Metinler yapay zekâ destekli taslaktır; insan editör incelemesi yapılmadı. Gerçek yer/bilgi içeren metinler (haber-dergi yazıları, bilgi, gezi) genel bilgiye dayanır ve dikkatle yazıldı, ancak bağımsız olarak kaynakla doğrulanmadı.
- Dışarıda üretilecek metinlerin kalitesi aktarma aracının denetimleriyle (uzunluk, alt kategori, kopya, yarım kalma) sınırlıdır; içerik doğruluğunu araç denetleyemez.
- Sesli okuma cihazın seslendirmesini kullanır; gerçek cihazlarda dinlenerek doğrulanmadı.
- GitHub iş akışının depoya geri yazma adımı yerelde çalıştırılamadı (GitHub ortamı gerekir); komutlar yerelde ayrı ayrı denendi.

## v4.1 eklemeleri

- **Çalışıyor (test edildi, servis yanıtı taklit edilerek):** Yapay zekâ ile oluşturma ekranı, bağlantı testi ve model listesi, eksik ayarda uyarı, üretim → önizleme → kaydet ve oku, kısa metnin otomatik uzatılması (birim testi), servis adresleri/başlıkları (Gemini, Groq, Anthropic), hata kodlarının Türkçe mesajları, anahtarın uygulama verisine/yedeğe girmemesi; elle eklenen metnin kaydı ve yeniden yüklemede kalıcılığı; GitHub’a öneri isteğinin biçimi (birim testi); yeni form denetimi stilleri (telefon/masaüstü ekran görüntüsüyle bakıldı).
- **Doğrulanmadı:** Gerçek servislerle canlı üretim (anahtar gerektirir; burada ağ erişimi de yok). Servislerin tarayıcıdan doğrudan çağrı (CORS) desteği zamanla değişebilir; Gemini, Groq, OpenRouter ve Anthropic (özel başlıkla) bilinen davranışa göre yazıldı. Varsayılan model adları zamanla eskiyebilir; “Bağlantıyı dene” güncel listeyi getirir. GitHub’a gönderme gerçek bir depoda denenmedi.
- **Not:** Yapay zekâ metinleri “doğruluğu kontrol edilmedi” notuyla kaydedilir; ortak kütüphaneye önerilen metinler de aktarma aracının biçim/kopya denetiminden geçer, içerik doğruluğu insan incelemesi gerektirir.
