# Erişilebilirlik

Hedef: WCAG 2.2 AA.

| Konu | Uygulama |
|---|---|
| Klavye | Tüm kontroller odaklanabilir; egzersizde Boşluk = dinle, 1–4 = seçenek, Enter = sonraki; “İçeriğe geç” bağlantısı |
| Ekran okuyucu | Anlamlı başlık sırası, `aria-live` geri bildirim, ilerleme çubuğu `role=progressbar`, grafiklere tablo alternatifi, simgeler `aria-hidden` |
| Odak | Her ekran değişiminde başlığa odak; mola penceresinde odak tuzağı; görünür 3 px odak halkası |
| Kontrast | Temalar AA hedefiyle seçildi; yüksek kontrast teması (siyah/beyaz/sarı, 2 px kenarlık) |
| Dokunma alanı | En az 48 px (çocuk profilinde 56 px) |
| Hareket | Sistem tercihini izler; Ayarlar’dan kapatılabilir; dalga animasyonu hareketsiz kalın halkaya dönüşür |
| Yazı boyutu | Normal / büyük / çok büyük |
| Ses olmadan geri bildirim | Doğru/yanlış: renk + simge (✓/✕) + metin + kesik çizgili kenarlık — yalnızca renge dayanmaz; geri bildirimde ses kullanılmaz |
| Altyazı | Her zaman / cevaptan sonra / gizli (isteğe bağlı gösterilebilir) |

## Bilinen eksikler

- VoiceOver/TalkBack ile gerçek cihaz testi henüz yapılmadı.
- Otomatik kontrast denetimi (axe vb.) CI’a eklenmedi.
