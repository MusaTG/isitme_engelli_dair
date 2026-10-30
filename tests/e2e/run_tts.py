"""Sesli dinleme: kelime öbeği vurgusu, elle kaydırınca takibin durması, durdur → kaldığı yerden devam,
dokunulan kelimeden devam, kelime sınırı olayı göndermeyen seslerde tahmini ilerleme.
Çalıştırma: python3 -m http.server 8080 (depo kökünde) + python3 tests/e2e/run_tts.py"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import FAKE, onboard
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/?nosw'
# Yavaş sahte ses: her kelimede (isteğe bağlı) boundary olayı, kelime başına 120 ms.
SLOW = """
(() => {
  let timers = [];
  window.__spoken = [];
  const voices = speechSynthesis.getVoices();
  const synth = {
    getVoices: () => voices,
    speak(u) {
      window.__spoken.push(u.text);
      const words = [...u.text.matchAll(/\\S+/g)];
      timers.push(setTimeout(() => u.onstart && u.onstart(), 5));
      words.forEach((m, i) => timers.push(setTimeout(() => {
        if (window.__boundary !== false && u.onboundary) u.onboundary({ name: 'word', charIndex: m.index });
      }, 10 + i * 120)));
      timers.push(setTimeout(() => u.onend && u.onend(), 20 + words.length * 120));
    },
    cancel() { timers.forEach(clearTimeout); timers = []; },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
})();
"""

fails = []
def check(name, ok, info=''):
    print(('OK  ' if ok else 'FAIL'), name, info)
    if not ok: fails.append(name)

HL_TEXT = """(() => { const h = CSS.highlights.get('%s'); if (!h) return null; const r = [...h][0]; return r ? r.toString() : null; })()"""
HL_COUNT = """(() => { const h = CSS.highlights.get('%s'); return h ? h.size : 0; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 900, 'height': 700})
        await ctx.add_init_script(FAKE)
        await ctx.add_init_script(SLOW)
        pg = await ctx.new_page()
        errs = []
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto(BASE); await onboard(pg)
        await pg.goto(BASE + '#/read/text/tr-daily-001'); await pg.wait_for_selector('#tts-fab')
        title = await pg.evaluate("document.querySelector('.r-title').textContent")

        # 1) Başlat → önce metin başlığı okunur; okunan kelime belirgin, yanındakiler soluk (3 kelime: 1 + 2 yardımcı)
        await pg.click('#tts-fab'); await pg.wait_for_timeout(200)
        spoken0 = await pg.evaluate('window.__spoken[0] || ""')
        check('metin başlığı okunuyor', spoken0 == title, repr(spoken0))
        hl = await pg.evaluate(HL_TEXT % 'tts-w0')
        check('başlıkta okunan kelime vurgulu', hl in title.split(), repr(hl))
        await pg.wait_for_timeout(900)
        hl2 = await pg.evaluate(HL_TEXT % 'tts-w0')
        n1 = await pg.evaluate(HL_COUNT % 'tts-w1')
        check('vurgu kelime kelime ilerliyor', bool(hl2) and hl2 != hl and len(hl2.split()) == 1, repr(hl2))
        check('yanındaki 2 kelime yardımcı (soluk) vurguda', n1 == 2, str(n1))
        check('eski tek-renk öbek vurgusu yok', await pg.evaluate("!CSS.highlights.has('tts-word')"))
        para_bg = await pg.evaluate("getComputedStyle(document.querySelector('.r-p.tts-now')).backgroundColor")
        check('paragraf arka planı vurgulanmıyor', para_bg in ('rgba(0, 0, 0, 0)', 'transparent'), para_bg)

        # 2) Elle kaydırma → takip düğmesi, otomatik kaydırma yok, vurgu sürüyor
        await pg.mouse.move(450, 400); await pg.mouse.wheel(0, 900); await pg.wait_for_timeout(300)
        y1 = await pg.evaluate('scrollY')
        follow_vis = await pg.evaluate("!document.querySelector('#tts-follow').hidden")
        check('elle kaydırınca "Okunan yere git" görünüyor', follow_vis)
        before = await pg.evaluate(HL_TEXT % 'tts-w0')
        await pg.wait_for_timeout(1500)
        y2 = await pg.evaluate('scrollY')
        after = await pg.evaluate(HL_TEXT % 'tts-w0')
        check('elle kaydırmadan sonra sayfa ortalanmıyor', y1 == y2, f'{y1} → {y2}')
        check('vurgu ilerlemeye devam ediyor', before != after, f'{before!r} → {after!r}')
        await pg.click('#tts-follow'); await pg.wait_for_timeout(700)
        in_view = await pg.evaluate("""(() => { const r = [...CSS.highlights.get('tts-w0')][0].getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; })()""")
        check('"Okunan yere git" vurguyu görünür yapıyor', in_view)

        # 3) Durdur → devam noktası işaretli; Dinle → aynı kelimeden devam
        await pg.click('#tts-fab'); await pg.wait_for_timeout(150)
        pos = await pg.evaluate("JSON.stringify((() => { const h = CSS.highlights.get('tts-resume'); return h ? [...h][0].toString() : null; })())")
        check('durdurunca devam noktası işaretli', pos not in ('null', '""'), pos)
        stopped_word = await pg.evaluate(HL_TEXT % 'tts-resume')
        await pg.evaluate('window.__spoken = []')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(150)
        spoken = await pg.evaluate('window.__spoken[0] || ""')
        check('Dinle kaldığı kelimeden devam ediyor (başa sarmıyor)', spoken.startswith(stopped_word), f'{stopped_word!r} / {spoken[:40]!r}')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(100)

        # 4) Kelimeye dokun → oradan devam
        target = await pg.evaluate("""(() => { const pt = document.querySelectorAll('.r-p .pt')[1]; pt.scrollIntoView({block:'center'}); const tn = pt.firstChild; const i = tn.data.indexOf(' ', 20) + 1; const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + 1); const b = r.getBoundingClientRect(); const w = tn.data.slice(i).split(/\\s+/)[0]; return { x: b.left + 2, y: b.top + b.height / 2, w }; })()""")
        await pg.mouse.click(target['x'], target['y']); await pg.wait_for_timeout(150)
        await pg.keyboard.press('Escape')
        await pg.evaluate('window.__spoken = []')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(150)
        spoken = await pg.evaluate('window.__spoken[0] || ""')
        check('dokunulan kelimeden başlıyor', spoken.startswith(target['w']), f'{target["w"]!r} / {spoken[:40]!r}')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(100)

        # 5) Konum yeniden açılışta korunuyor
        saved = await pg.evaluate("JSON.parse(localStorage.getItem('duyum.v1')).profiles.find(Boolean)?.reading?.progress?.['tr-daily-001']?.ttsAt || null")
        check('devam noktası kaydediliyor', bool(saved and saved.get('pid')), str(saved))

        # 6) Vurgu genişliği 1 kelime + sınır olayı gelmeyen ses (tahmini ilerleme)
        await pg.evaluate("window.__boundary = false")
        await pg.click('[data-act=view]'); await pg.select_option('#v-ttsw', '1'); await pg.click('[data-close=view]')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(200)
        a = await pg.evaluate(HL_TEXT % 'tts-w0')
        await pg.wait_for_timeout(1500)
        c = await pg.evaluate(HL_TEXT % 'tts-w0')
        check('1 kelimelik vurgu (yardımcı yok)', bool(a) and len(a.split()) == 1 and await pg.evaluate(HL_COUNT % 'tts-w1') == 0, repr(a))
        check('sınır olayı olmadan da ilerliyor (tahmini)', a != c, f'{a!r} → {c!r}')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(100)

        # 7) Bölüm başlıkları okunuyor: 2. bölüme kaydır, Dinle → önce bölüm başlığı
        await pg.goto(BASE + '#/read/text/tr-daily-099'); await pg.wait_for_selector('#tts-fab')
        h2 = await pg.evaluate("(() => { const h = document.querySelectorAll('.r-h')[1]; const p = h.parentElement.querySelector('.r-p'); const top = document.querySelector('.r-top').getBoundingClientRect().height; window.scrollTo(0, p.getBoundingClientRect().top + scrollY - top - 10); return h.textContent; })()")
        await pg.wait_for_timeout(600)
        await pg.evaluate('window.__spoken = []')
        await pg.click('#tts-fab'); await pg.wait_for_timeout(60)
        now_h = await pg.evaluate("!!document.querySelector('.r-h.tts-now') && (CSS.highlights.get('tts-w0') ? [...CSS.highlights.get('tts-w0')][0].toString() : '')")
        check('başlık okunurken başlık işaretli ve vurgulu', bool(now_h) and now_h in h2, repr(now_h))
        await pg.wait_for_timeout(240)
        sp = await pg.evaluate('window.__spoken.slice(0, 2)')
        check('bölüm başlığı okunuyor', bool(sp) and sp[0] == h2, f'{h2!r} / {sp!r}')
        await pg.wait_for_timeout(len(h2.split()) * 120 + 400)
        sp2 = await pg.evaluate('window.__spoken[1] || ""')
        check('başlıktan sonra bölümün ilk paragrafı', len(sp2) > 0 and not sp2.startswith(h2), repr(sp2[:40]))
        await pg.click('#tts-fab')

        check('konsol hatası yok', not errs, str(errs[:3]))
        await b.close()
    print(f'\n{len(fails)} başarısız')
    sys.exit(1 if fails else 0)

asyncio.run(main())
