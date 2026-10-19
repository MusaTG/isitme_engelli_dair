# Gizlilik

- **Veri nerede?** Yalnızca kullanıcının tarayıcısında (`localStorage`, anahtar `duyum.v1`). Sunucu yoktur.
- **Ne toplanır?** İsteğe bağlı takma ad, yaş aralığı (doğum tarihi değil), işitme sistemi, kullanılan taraf, kişisel hedef, ayarlar, egzersiz sonuçları, DKT notları.
- **Ne toplanmaz?** Gerçek ad zorunluluğu, e-posta, konum, ses kaydı. **Mikrofon izni hiç istenmez.**
- **Üçüncü taraf:** Analiz, reklam, çerez, dış font/CDN yoktur. Sayfa yalnızca kendi dosyalarını yükler.
- **TTS:** Konuşma, cihazın seslendirme motoruyla üretilir. Bazı tarayıcıların “internet gerekir” etiketli sesleri metni sağlayıcının sunucusunda işleyebilir; bu sesler Ayarlar’da etiketlenir ve cihazdaki sesler önceliklidir. Gönderilen metin yalnızca egzersiz içeriğidir, kişisel veri değildir.
- **Kullanıcı kontrolü:** Ayarlar → Gizlilik ve veriler: JSON dışa aktarma, yedekten geri yükleme, tüm verileri silme; profil bazında silme.
- **Çocuk profilleri:** Ad gerekmez; yaş aralığı kullanılır; veri cihazdan çıkmaz. Rapor yalnızca açık onay kutusu işaretlenince indirilebilir ve paylaşma kararı kullanıcıdadır (ebeveyn/yasal temsilci tarafından yapılmalıdır).
- **Hedefler ve seans notları (v3):** yalnızca bu cihazda saklanır. DKT bölümü kapatılınca uzman kaynaklı hedef ve notlar gizlenir (silinmez). Rapor yalnızca onay kutusu işaretlenince indirilir; dosyayı kiminle paylaşacağına kullanıcı karar verir. Yeni notun taslağı da yalnızca cihazda tutulur ve “Taslağı sil” ile silinir.
- **Sağlık verisi:** Reklam veya başka amaçla kullanılmaz; uygulama kimseye veri iletmez.

- **Yapay zekâ ile okuma metni oluşturma (v4.1, isteğe bağlı, varsayılan kapalı):** Kullanıcı kendi servisini (Gemini, Groq, OpenRouter, Ollama, Anthropic, OpenAI veya OpenAI uyumlu adres) ve anahtarını girer. Anahtar `duyum.ai.v1` adıyla yalnızca bu cihazda, uygulama verisinden ayrı saklanır; yedeğe/dışa aktarmaya girmez ve “Anahtarı sil” ile silinir. “Metni oluştur”a basıldığında yalnızca yazılan konu, seçilen kategori/uzunluk/seviye ve ek istekler doğrudan o servise gider (Duyum’un sunucusu yoktur); profil, geçmiş, hedef veya notlar gönderilmez. Ekranda kişisel bilgi yazılmaması uyarısı vardır. Çocuk profilinde de aynı uyarı gösterilir; ebeveynin kurması önerilir.
- **Ortak kütüphaneye öneri (v4.1, isteğe bağlı):** GitHub erişim anahtarı `duyum.github.v1` adıyla yalnızca bu cihazda saklanır; “Kütüphaneye öner” yalnızca seçilen metni kullanıcının kendi deposuna dosya olarak yazar.

KVKK / GDPR açısından uygulama işletmecisi kişisel veri işlememektedir (veri cihazda kalır). İleride bulut senkronizasyonu eklenirse isteğe bağlı olmalı ve ayrı bir hukuki değerlendirme yapılmalıdır.
