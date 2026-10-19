# Kurulum ve yayınlama

Duyum statik bir web uygulamasıdır: **derleme, sunucu, veritabanı, API anahtarı veya ücretli hesap gerekmez.** Tek ihtiyaç ücretsiz bir GitHub hesabıdır.

> **Sıra önemli:** GitHub Pages’i dosyaları yüklemeden **önce** açın. Aksi hâlde ilk yüklemede iş akışı otomatik çalışır, Pages henüz açık olmadığı için yayın adımı `Get Pages site failed … Not Found` hatası verir. (Bu olursa aşağıdaki “Sorun giderme” bölümüne bakın; kodda sorun yoktur.)

## Seçenek A — GitHub web arayüzüyle (kod bilgisi gerekmez)

1. https://github.com adresinde ücretsiz hesap aç (varsa giriş yap).
2. Sağ üstte **+ → New repository** → ad: `duyum` → **Public** → **Create repository**.
   (Ücretsiz planda GitHub Pages yalnızca herkese açık depolarda çalışır.)
3. **Önce Pages’i aç:** Depoda **Settings → Pages → Build and deployment → Source: GitHub Actions** seç. Ayrıca **Settings → Actions → General → Workflow permissions → Read and write permissions** seç (okuma metinlerini aktaran adım sonucu depoya geri yazar).
4. **Code** sekmesine dön → **uploading an existing file** bağlantısına tıkla.
5. `duyum.zip` dosyasını bilgisayarında aç. Klasörün **içindeki** her şeyi seçip tarayıcıya sürükle (91 dosya; web yüklemesi tek seferde 100 dosyaya kadar kabul eder).
   - `.github` klasörü gizli olabilir. macOS’ta Finder’da `Cmd + Shift + .`, Windows’ta Gezgin → Görünüm → **Gizli öğeler** ile görünür yap ve onu da sürükle.
6. **Commit changes**.
7. **Actions** sekmesinde “Test ve yayınla” çalışır (1–2 dk): önce içerik doğrulama ve testler, sonra yayın. Yeşil tik görünce adres **Settings → Pages** sayfasının üstünde yazar: `https://KULLANICI-ADIN.github.io/duyum/`

> `.github` klasörünü yükleyemediysen: 3. adımda **Source: Deploy from a branch → main / (root) → Save** seç. Uygulama derleme gerektirmediği için bu yol da çalışır (yalnızca otomatik testler çalışmaz).

## v2’den v3’e güncelleme (depo zaten varsa)

1. **Code → Add file → Upload files** → yeni zip’in içindeki her şeyi sürükle → **Commit changes**. Aynı adlı dosyaların üzerine yazılır; yeni dosyalar (`js/goals.js`, `js/guide/`, `js/views/goals.js`, `js/views/guide.js`, `js/engine/levels.js`, `js/engine/tasks/advanced.js`, `content/*/matrix.json`, `tests/v3.test.js`, `tests/e2e/run_v3.py`, `docs/audit/v3-status.md`, `docs/research/`) eklenir. v3’te silinmesi gereken dosya yoktur.
2. Actions sekmesinde iş akışının yeşil olmasını bekle (okuma metni aktarma + içerik doğrulama + 67 test).
3. Açık olan uygulama bir sonraki açılışta “Yeni sürüm hazır → Yenile” der. v2 profilleri, oturumları, DKT hedefleri ve notları otomatik olarak v3 biçimine taşınır; eski veriler silinmez.

## v1’den v2’ye güncelleme (depo zaten varsa)

1. **Code → Add file → Upload files** → yeni zip’in içindeki her şeyi sürükle → **Commit changes**. Aynı adlı dosyaların üzerine yazılır; yeni klasörler (`content/`, `js/engine/`, `js/lang/`, `tools/`…) eklenir.
2. İsteğe bağlı temizlik: v2’de artık kullanılmayan şu dosyaları GitHub’da açıp **…→ Delete file** ile silebilirsin. Silmesen de uygulama çalışır; yalnızca gereksiz yer kaplarlar.
   `js/engine.js`, `js/content/tr.js`, `js/content/en.js`, `js/content/index.js`, `js/views/exercise.js`, `js/views/slt.js`
3. Telefonda zaten açık olan uygulama bir sonraki açılışta “Yeni sürüm hazır → Yenile” der. v1 profilleri ve geçmişi otomatik olarak v2 biçimine taşınır.

## Seçenek B — Git komut satırı

```bash
unzip duyum.zip && cd duyum
git init -b main
git add .
git commit -m "Duyum v3.0"
git remote add origin https://github.com/KULLANICI-ADIN/duyum.git
git push -u origin main
```

Görsel bir araç tercih edersen ücretsiz **GitHub Desktop** (https://desktop.github.com) ile klasörü “Add local repository” olarak ekleyip **Publish repository** diyebilirsin.

## Sorun giderme

| Belirti | Neden | Çözüm |
|---|---|---|
| Yayın adımında `Get Pages site failed … HttpError: Not Found` | Pages açık değil veya kaynak “GitHub Actions” değil | **Settings → Pages → Source: GitHub Actions**. Sonra **Actions → başarısız çalıştırma → Re-run jobs → Re-run failed jobs** |
| Settings → Pages’te “GitHub Actions” seçeneği yok / Pages kullanılamıyor | Depo özel (private) | **Settings → General → Danger Zone → Change visibility → Public** |
| `Branch "main" is not allowed to deploy to github-pages` | Ortam koruma kuralı | **Settings → Environments → github-pages → Deployment branches** listesine `main` ekle |
| “Aktarılan metinleri … geri yaz” adımında `Permission denied` / 403 | İş akışının yazma izni yok | **Settings → Actions → General → Workflow permissions → Read and write permissions** → Re-run |
| Actions sekmesinde iş akışı hiç yok | `.github/workflows/deploy.yml` yüklenmemiş | Dosyayı yükle ya da Pages kaynağını **Deploy from a branch** yap |
| “İçerik paketlerini doğrula” adımı kırmızı | Bir JSON içerik dosyasında hata var | Adımın çıktısında hangi kaydın neden hatalı olduğu yazar; düzeltip yeniden yükle |
| Site açılıyor ama egzersiz yok / “bu sayfa açılırken sorun oluştu” | `content/` klasörü yüklenmemiş | Zip’teki `content` klasörünü de yükle |
| Konuşma egzersizleri kapalı, “ses bulunamadı” | Cihazda o dilde TTS sesi yok | Aşağıdaki “Ses yoksa” bölümü |

## Telefona uygulama gibi yükleme

- **Android (Chrome):** sayfayı aç → ⋮ menü → **Ana ekrana ekle / Uygulamayı yükle**.
- **iPhone/iPad (Safari):** Paylaş → **Ana Ekrana Ekle**.

İlk açılıştan sonra uygulama internetsiz de açılır. Konuşma sesinin internetsiz çalışması cihazdaki sese bağlıdır (Ayarlar’da “cihazda” etiketli sesler çevrimdışı çalışır).

## Ses yoksa

- **Android:** Ayarlar → Sistem → Diller ve giriş → Metin okuma çıkışı → Google Konuşma Hizmetleri → dil verilerini yükle
- **iOS:** Ayarlar → Erişilebilirlik → Sesli İçerik → Sesler
- **Windows:** Ayarlar → Saat ve dil → Konuşma → Ses ekle
- **macOS:** Sistem Ayarları → Erişilebilirlik → Sesli İçerik → Sistem Sesi → Sesleri Yönet

Sonra tarayıcıyı tamamen kapatıp aç. Ardından **Ayarlar → Ses ve seslendirme → Ses kalite testi** ekranında minimal çiftleri ve heceleri dinleyip “Doğru/Hatalı” işaretle; değerlendirme modu yalnızca “Doğru” işaretli içerikleri kullanır.

## Yerelde geliştirme

```bash
npm start                 # http://localhost:8080 (python3 gerekir) — veya: npx serve .
npm test                  # 52 birim testi, Node 22+, bağımlılık kurulumu yok
npm run validate          # içerik paketlerini doğrula
npm run sw                # içerik/kod dosyası ekledikten sonra service worker listesini güncelle
npm run e2e               # v2 regresyon tarayıcı testi (pip install playwright && playwright install chromium)
npm run e2e:v3            # v3 tarayıcı testi (hedefler, notlar, kılavuz, matris, tablet, yedek, çevrimdışı)
```

Yeni sürüm yayınlarken `sw.js` içindeki `CACHE = 'duyum-v3.0.0'` sürümünü artır; kullanıcılara “Yeni sürüm hazır” bildirimi çıkar.

## İsteğe bağlı ücretsiz alternatif barındırma

GitHub Pages yeterlidir. İstersen **Cloudflare Pages** veya **Netlify**’ın ücretsiz planı da kullanılabilir: depoyu bağla, “build command” boş, “output/publish directory” `/` olsun. Kredi kartı gerektirmeyen ücretsiz planlar yeterlidir; kayıt olurken güncel ücretsiz plan sınırlarını kontrol et.

## Maliyet

| Kalem | Maliyet |
|---|---|
| GitHub hesabı, herkese açık depo, Actions, Pages | 0 ₺ |
| TTS (cihazın kendi sesleri) | 0 ₺ |
| Sunucu, veritabanı, API anahtarı | Yok |

## Okuma metni eklemek (GitHub web arayüzüyle)

1. `docs/reading/EKSIKLER.md` → eksik kategoriyi seç → `docs/reading/istemler/<dil>-<kategori>.md` içindeki istemi bir yapay zekâ sohbetine yapıştır.
2. Yanıtı kopyala. Depoda **Add file → Create new file**; ad olarak `content-src/reading/inbox/tr/dialogue/parti-01.txt` gibi bir yol yaz (klasörler kendiliğinden oluşur), yapıştır, **Commit changes**.
3. Actions’ta “Test ve yayınla” çalışır: metinleri numaralar, denetler, `content-src/reading/inbox/RAPOR.md` raporunu yazar, sonucu depoya geri kaydeder ve siteyi yayınlar. Reddedilen bloklar `inbox/_reddedildi/` altındadır.
