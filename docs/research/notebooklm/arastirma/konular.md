# Araştırma konuları

Her konu için: soru · defterde eklenecek kaynaklar · hazır istemler · uygulamada etkilenen yer. Kaynak önerilerinde yalnızca bilinen belgeler adıyla anılmıştır; geri kalanı tür olarak verilmiştir (bulduğunuz güncel sürümü ekleyin). Değerlendirme için `degerlendirme-protokolu.md`.

---

## 1. Türkçe metinlerde seviye ölçütü

**Soru:** `level` 1/2/3 için Türkçede kullanılabilecek nesnel ölçüt nedir? Uygulamanın cümle uzunluğuna dayalı tahmini (`autoLevel`) yeterli mi?

**Kaynaklar:** Ateşman (1997) Türkçe okunabilirlik formülü; Bezirci ve Yılmaz (2010) okunabilirlik formülü; Türkçe okunabilirlik formüllerini karşılaştıran güncel çalışmalar; yabancılara Türkçe öğretiminde seviye tanımları.

**İstemler:**
- “Bu kaynaklardaki Türkçe okunabilirlik formüllerini karşılaştır: hangi değişkenleri kullanıyorlar, hangi metin türünde doğrulanmışlar, sınırları ne?”
- “Bir metni 3 düzeye (kolay/orta/ileri) ayırmak için hangi eşikler önerilebilir? Kaynakta dayanağı olmayan eşik verme.”
- “Ortalama cümle uzunluğu ve kelime uzunluğu dışında hangi ölçütler (sözcük sıklığı, yan cümle sayısı) seviyeyi daha iyi gösteriyor?”

**Etkilenen yer:** `js/reading/core.js` → `autoLevel`; durum raporundaki “seviyesi tahmini” sütunu.

## 2. CEFR ile eşleme

**Soru:** 1/2/3 düzeyleri CEFR (A1–C2) ile nasıl eşlenmeli; eşleme kullanıcıya gösterilmeli mi?

**Kaynaklar:** Council of Europe — *CEFR Companion Volume* (2020); okuma anlama ölçek tanımlayıcıları; CEFR'e göre derecelendirilmiş okuma metni örnekleri sunan kurum belgeleri.

**İstemler:**
- “CEFR okuma tanımlayıcılarına göre A2, B1 ve B2 düzeyindeki bir okuma metninin özelliklerini (konu, uzunluk, dil yapısı) özetle.”
- “Üç düzeyli bir ölçeği CEFR'e eşlemenin riskleri neler? Kaynaklar resmî bir eşleme olmadan CEFR etiketi kullanmayı nasıl değerlendiriyor?”

**Etkilenen yer:** okuma kartları ve süzgeçler; istem dosyalarındaki seviye tanımı.

## 3. Okuma hızı ve “okundu” ölçütü

**Soru:** Varsayılan okuma hızları (TR 110, EN 140 kelime/dk sesli okuma) ve bir metnin “okundu” sayılma ölçütü uygun mu?

**Kaynaklar:** Brysbaert (2019), *How many words do we read per minute?* (Journal of Memory and Language); Türkçe sesli/sessiz okuma hızı üzerine çalışmalar; dile göre hece/kelime uzunluğu farkları.

**İstemler:**
- “Yetişkinlerde sessiz ve sesli okuma hızı için kaynaklar hangi aralıkları veriyor? Türkçe gibi eklemeli dillerde kelime/dk nasıl farklılaşıyor?”
- “Bir uygulama, metnin okunduğunu (yalnızca kaydırıldığını değil) hangi ölçütle makul biçimde kabul edebilir?”

**Etkilenen yer:** `DEFAULT_WPM`, süre sınıfları (kısa/orta/uzun), okundu işaretleme (§1 #14).

## 4. Metin türlerinin yapısı

**Soru:** Diyalog, mektup/günlük, eleştirel karşılaştırma, haber ve bilgilendirici metin türleri için iyi bir okuma metninin yapı ölçütleri neler?

**Kaynaklar:** metin türleri (genre) ve okuma öğretimi üzerine eğitim kaynakları; dil öğretiminde diyalog ve mektup metni yazım rehberleri.

**İstemler:**
- “Her tür için (diyalog, mektup, günlük, haber, bilgilendirici, karşılaştırma) zorunlu yapı öğelerini ve sık yapılan hataları listele.”
- “Okuma pratiği için yazılan kurgusal haber metinlerinin gerçek haberle karıştırılmaması için hangi önlemler öneriliyor?”

**Etkilenen yer:** `js/reading/rules.js` → `GUIDE`; NotebookLM kılavuzu ve istemler.

## 5. Telif, lisans ve yapay zekâ beyanı

**Soru:** Yapay zekâ destekli taslak metinler hangi lisansla yayınlanmalı, kullanıcıya nasıl beyan edilmeli?

**Kaynaklar:** Creative Commons lisans belgeleri (CC BY 4.0, CC0) ve SSS; yapay zekâ üretimi içerikte telif konusunda resmî kurum açıklamaları; yayın kuruluşlarının yapay zekâ beyan yönergeleri.

**İstemler:**
- “Yapay zekâ ile üretilmiş ve insan tarafından düzenlenmiş metinlerde telif ve lisans durumu bu kaynaklara göre nedir? Belirsiz noktaları ayrı yaz.”
- “Okura gösterilecek kısa ve dürüst bir ‘yapay zekâ destekli taslak, insan incelemesinden geçti / geçmedi’ beyanı için örnek ifadeler öner.”

**Etkilenen yer:** `categories.json` lisans notu; metin başına `origin`, `reviewed` alanlarının okuyucuda gösterimi.

## 6. Okuma konforu ve tema

**Soru:** Yazı tipi, satır uzunluğu, satır aralığı ve renk temaları (açık, sepya, koyu, yüksek kontrast) için kanıta dayalı varsayılanlar neler?

**Kaynaklar:** W3C — *WCAG 2.2* (1.4.3, 1.4.8, 1.4.12); British Dyslexia Association — *Dyslexia Style Guide*; koyu tema ve okuma performansı üzerine çalışmalar.

**İstemler:**
- “Uzun metin okumada önerilen satır uzunluğu, satır aralığı ve harf aralığı aralıklarını kaynaklarıyla ver.”
- “Koyu ve açık temanın okuma hızı ve yorgunluk üzerindeki etkisi konusunda kaynaklar ne diyor? Çelişen bulgular var mı?”
- “‘Yumuşak okuma’ (soft reading) teması için kontrast oranı WCAG'yi karşılarken parlamayı azaltan renk ilkeleri neler?”

**Etkilenen yer:** Faz 6 tema çalışması (sistem teması, Soft Reading), okuyucu görünüm paneli varsayılanları.

## 7. Benzer uygulamalar

**Soru:** İşitme kaybı olan yetişkinlere yönelik dinleme/okuma pratiği uygulamaları hangi özellikleri sunuyor, nasıl raporluyor?

**Kaynaklar:** uygulama mağaza açıklamaları; işitsel rehabilitasyon programlarının kamuya açık tanıtım belgeleri; bu programları değerlendiren derlemeler.

**İstemler:**
- “Bu uygulamaların ortak özelliklerini, ilerleme raporlama biçimlerini ve yaptıkları iddiaları tablo hâlinde çıkar.”
- “Hangi iddialar kaynakla desteklenmiş, hangileri pazarlama dili? Duyum'un kaçınması gereken ifadeleri listele.”

**Etkilenen yer:** ana sayfa ve rehber metinleri, ilerleme ekranı.

## 8. Tarayıcı depolaması

**Soru:** Kullanıcı verisi (ilerleme, kendi metinleri) için localStorage yeterli mi, IndexedDB'ye ne zaman geçilmeli?

**Kaynaklar:** MDN — *Storage quotas and eviction criteria*; web.dev — *Storage for the web*; `navigator.storage.persist()` belgeleri; tarayıcıların (Safari ITP dahil) veri silme politikaları.

**İstemler:**
- “localStorage ve IndexedDB için tarayıcı başına kota ve silinme koşullarını özetle; Safari'nin 7 gün kuralı PWA'ları nasıl etkiliyor?”
- “Kalıcı depolama izni (persist) hangi tarayıcıda nasıl veriliyor? Kullanıcıya nasıl açıklanmalı?”

**Etkilenen yer:** `js/store.js`; §1 #2 depolama mimarisi (Faz 6).
