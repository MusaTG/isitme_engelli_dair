# NotebookLM paketi

İki iş için kullanılır:

1. **`uretim/`** — eksik okuma metinlerini NotebookLM'de ürettirmek (Faz 4).
2. **`arastirma/`** — uygulama kararlarını kaynaklı araştırmayla doğrulamak (Faz 5).

`uretim/` klasörü `node tools/notebooklm-pack.mjs` ile eksik listesinden üretilir ve her içe aktarmada güncellenir; elle düzenlemeyin.

---

## A. Eksik metinleri NotebookLM'de üretme

### 1. Defteri kurun (dil başına bir kez)

1. notebooklm.google.com → **Yeni defter**: “Duyum – Okuma metinleri (TR)”.
2. **Kaynak ekle** → şu iki dosyayı yükleyin:
   - `uretim/kaynak-1-kilavuz-tr.md` (kurallar, biçim, kategoriler, uzunluklar)
   - `uretim/kaynak-2-mevcut-basliklar-tr.md` (tekrar edilmemesi gereken başlıklar)
3. Sohbet ayarları (Sohbeti yapılandır / Configure chat) → **Özel** hedef → `uretim/sohbet-ayari-tr.txt` içeriğini yapıştırın; yanıt uzunluğu **Daha uzun**.
4. İngilizce için aynısını `-en` dosyalarıyla ayrı bir defterde yapın.

### 2. Üretin — hazır istek dosyalarıyla (önerilen)

`uretim/istekler/` klasöründe **her istek ayrı bir dosya**: klasörler dil–kategori sırasıyla (`01-tr-travel`, `02-tr-dialogue` …), içindeki dosyalar numara sırasıyla (`01-kisa.txt` … `20-orta.txt`, `21-uzun-parca1.txt` …). Kontrol listesi: `uretim/istekler/SIRA.md`.

1. Sıradaki dosyayı açın, içeriğini olduğu gibi NotebookLM'e yapıştırın.
2. Yanıtı kopyalayıp **tek bir yanıt dosyasının sonuna** ekleyin (ör. `yanitlar.txt`). Dil ve kategori yanıtın içinde (`lang:` / `cat:`) yazdığı için dosya adı önemli değil; her şey tek dosyada olabilir.
3. Uzun metin parçalarını (`uzun-parca1` … `4`) aynı sohbette sırayla gönderin ve yanıtları araya başka şey koymadan alt alta ekleyin.
4. Yanıt dosyasını Claude'a gönderin. Aktarımdan sonra istek dosyaları kalan eksiklere göre yeniden üretilir; yeni paketi kullanın.

Her istekte alt kategoriler (eksik olanlar önce), seviyeler ve kelime aralığı tek tek yazılıdır. “Kontrol Özeti” satırları ve NotebookLM biçim kaymaları aktarımda kendiliğinden temizlenir.

### 2b. Üretin — kendi isteminizle

`uretim/istemler-tr.md` dosyasında her kategori için kaç istek gerektiği ve hazır istemler var. İstemi sohbete yapıştırın, yanıtın altındaki **kopyala** düğmesiyle kopyalayın.

- Kısa metinler: yanıt başına 5 metin.
- Orta metinler: yanıt başına 1 metin.
- Uzun metinler ve roman dizileri: parça parça istenir; **tüm parçaları aynı dosyaya alt alta** yapıştırın.

### 3. Kaydedin

Yanıtları düz metin dosyalarına yapıştırın. Dosya adı dili ve kategoriyi söyler:

```
tr-dialogue-01.txt   tr-dialogue-02.txt   en-kids-01.txt …
```

Bir dosyaya birden çok yanıt eklenebilir. NotebookLM'in eklediği şeyler (kaynak işaretleri `[1]`, **kalın** yazı, kod çitleri, `\-` gibi kaçışlar, kopyalamada kaybolan `---` satırı, numaralı başlık `### 3. Başlık`) içe aktarmada **kendiliğinden temizlenir**.

### 4. Uygulamaya aktarın (üç yol)

| Yol | Nasıl | Sonuç |
|---|---|---|
| **Claude'a verin** | `.txt` dosyalarını sohbete ekleyin, “aktar” deyin | Ön izleme raporu + aktarılmış ve derlenmiş yeni sürüm |
| **GitHub** | Dosyaları `content-src/reading/inbox/` klasörüne yükleyin (alt klasör gerekmez, dil/kategori dosya adından okunur) | Yayın iş akışı aktarır, derler, siteyi günceller |
| **Bilgisayarda** | Dosyaları `content-src/reading/inbox/` içine koyup `npm run reading:import` | Ön izleme → onay → aktarım |
| (yalnızca o cihaz) | Uygulama → Okuma → Kendi metinlerim → Dosyadan içe aktar | Kendi metinlerime eklenir, kütüphaneye değil |

Her yolda aynı denetim çalışır: eksik `level` / `sub`, kısa ya da yarım kalmış metin, aynı ya da yakın kopya metin **hatalı** sayılır ve gerekçesiyle `inbox/_reddedildi/` altına konur. Aynı dosyayı ikinci kez aktarmak kopya üretmez (atlanır).

### 5. Gözden geçirme

Yapay zekâ taslakları `origin: ai-draft` olarak işaretlenebilir. Okuyup onayladığınız metinlere meta satırında `reviewed: yes` ekleyin; durum raporu (`docs/reading/status.json`) incelenmiş metin sayısını gösterir.

---

## B. Araştırma (Faz 5)

`arastirma/` klasöründe:

- `degerlendirme-protokolu.md` — NotebookLM yanıtlarının nasıl değerlendirileceği ve karara dönüştürüleceği.
- `konular.md` — 8 araştırma konusu: her birinde soru, eklenecek kaynak türleri, hazır istemler ve uygulamada etkilenen yer.
- `karar-sablonu.md` — her konu için doldurulacak karar kaydı.

Sonuçları `arastirma/sonuclar/<konu-no>-<kisa-ad>.md` olarak kaydedin (NotebookLM notunu kopyalayıp şablona yapıştırın). Claude bu dosyaları okuyup uygulamaya uygular.
