# Yol haritası ve riskler

## v1.0 (bu sürüm)
Statik PWA, 7 egzersiz türü, TR/EN, çocuk/yetişkin, uyarlanabilir zorluk, ilerleme, 4 tema, isteğe bağlı DKT, yerel veri, çevrimdışı kabuk, GitHub Pages yayını.

## v1.1 — ses kalitesi
- Gerçek cihazlarda telaffuz dinleme testi (bkz. docs/testing.md) ve sonuçlara göre içerik düzeltmesi
- İsteğe bağlı Piper WASM motoru (Türkçe + İngilizce), ses lisanslarının tek tek doğrulanması
- Lisansı uygun (CC0) çevresel ses dosyalarıyla “Çevresel sesler” kategorisi

## v1.2 — içerik ve erişilebilirlik
- DKT gözden geçirmesi sonrası içerik genişletme; açık küme (yazarak cevap) egzersizleri
- Ekran okuyucu manuel testleri, CI’a otomatik erişilebilirlik denetimi

## İkinci sürüme bırakılan / ayrı fizibilite gerektiren
- Uzman paneli, çok kullanıcılı veri paylaşımı, bulut senkronizasyonu
- Mağaza uygulaması (Capacitor) — Apple geliştirici hesabı ücretlidir; web sürümü ücretsiz kalır

## Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Cihazda Türkçe TTS sesi yok | Konuşma egzersizleri kullanılamaz | Açık uyarı + kurulum yönergesi; ton egzersizleri çalışır; v1.1 Piper |
| TTS kalitesi cihazlar arasında farklı | Zorluk tutarsız | Ses adı oturumda gösterilir; sonuçlar cihazlar arası karşılaştırılmamalı |
| Taslak içerik | Eğitsel değer düşük olabilir | Uzman doğrulaması kontrol listesi |
| localStorage silinmesi | İlerleme kaybı | Dışa aktarma/yedek |
| Klinik iddia algısı | Yanlış beklenti | Kurulumda onay, sonuç ve ilerleme ekranlarında açıklama |
