# Okuma Egzersizi uçtan uca testi (Playwright, Chromium).
# Çalıştırma: python3 -m http.server 8080 &  →  python3 tests/e2e/run_reading.py <ekran-görüntüsü-klasörü>
# Denetler: ana sayfa, katlanmış arama, okuyucu, konumun yeniden yüklemede korunması, ayraç/vurgu, hizalama,
# içindekiler etkin başlığı, liste, sesli okuma düğmesinin kaydırmada gizlenmesi ve ayarlardan kapatılması,
# boş dil/kategori durumu, .txt dosyasından içe aktarma, mikrofon izni İSTENMEMESİ; telefon/tablet/masaüstü.
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import FAKE, onboard, go
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/?nosw'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'e2e-shots-reading'
os.makedirs(OUT, exist_ok=True)
MIC_SPY = """
window.__micCalls = 0;
if (navigator.mediaDevices) { navigator.mediaDevices.getUserMedia = () => { window.__micCalls++; return Promise.reject(new Error('blocked')); }; }
if (navigator.permissions) { const q = navigator.permissions.query.bind(navigator.permissions); navigator.permissions.query = (d) => { if (d && d.name === 'microphone') window.__micCalls++; return q(d); }; }
"""
SAMPLE = """### | Aktarılan Deneme Metni
sub: home | tags: deneme, aktarma | level: 1
---
""" + ' '.join(f'Bu {i}. cümle dışarıdan aktarılan bir okuma metnine aittir.' for i in range(1, 30)) + '\n'

fails = []
def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script(FAKE)
        await ctx.add_init_script(MIC_SPY)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
        pg.on('console', lambda m: m.type == 'error' and errs.append(f'console: {m.text}'))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(BASE); await onboard(pg)

        await go(pg, '#/read'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{OUT}/01-home-phone.png', full_page=True)
        check(await pg.locator('h1').count() > 0, 'okuma ana sayfası açıldı')

        await go(pg, '#/read/library?q=cinar'); await pg.wait_for_timeout(900)
        cnt = await pg.inner_text('#rcount')
        check(any(ch.isdigit() and ch != '0' for ch in cnt.split()[0]) if cnt else False, f'katlanmış arama sonuç verdi ("cinar" → {cnt.strip()})')
        check(await pg.locator('mark').count() > 0, 'arama eşleşmeleri vurgulandı')
        await pg.screenshot(path=f'{OUT}/02-search-phone.png', full_page=True)

        tid = 'tr-novel-101'
        await go(pg, f'#/read/text/{tid}'); await pg.wait_for_timeout(900)
        await pg.mouse.wheel(0, 1500); await pg.wait_for_timeout(250)
        fab = await pg.evaluate("document.querySelector('#tts-fab')?.className || ''")
        check('is-away' in fab, 'telefonda sesli okuma düğmesi kaydırırken gizleniyor')
        await pg.wait_for_timeout(1600)
        fab2 = await pg.evaluate("document.querySelector('#tts-fab')?.className || ''")
        check('is-away' not in fab2, 'kaydırma durunca düğme geri geliyor')
        await pg.mouse.wheel(0, 4000); await pg.wait_for_timeout(2500)
        stage = await pg.inner_text('#r-stage')
        await pg.screenshot(path=f'{OUT}/03-reader-phone.png')
        prog = await pg.evaluate(f"JSON.stringify(window.__duyum.store.activeProfile().reading.progress['{tid}']||null)")
        check(prog != 'null' and '"pid"' in prog, f'konum kaydedildi ({stage.strip()})')
        await pg.reload(); await pg.wait_for_timeout(800); await go(pg, f'#/read/text/{tid}'); await pg.wait_for_timeout(1200)
        prog2 = await pg.evaluate(f"JSON.stringify(window.__duyum.store.activeProfile().reading.progress['{tid}']||null)")
        stage2 = await pg.inner_text('#r-stage')
        check(prog2 != 'null' and '"pid"' in prog2 and stage2.split('—')[0].strip() == stage.split('—')[0].strip(), f'yeniden açınca kalınan yere dönüldü ({stage2.strip()})')

        pid = await pg.evaluate("document.querySelector('.r-p')?.dataset.pid")
        await pg.click(f'[data-pid="{pid}"]'); await pg.wait_for_timeout(300)
        if await pg.locator('[data-sel=bookmark]').count():
            await pg.click('[data-sel=bookmark]'); await pg.wait_for_timeout(200)
            if await pg.locator('#db-label').count():
                await pg.fill('#db-label', 'Test'); await pg.click('#r-dlg button[type=submit]'); await pg.wait_for_timeout(300)
        marks = await pg.evaluate(f"window.__duyum.store.activeProfile().reading.marks.filter(m=>m.textId==='{tid}').length")
        check(marks >= 1, 'ayraç eklendi')

        await pg.click('[data-act=view]'); await pg.wait_for_timeout(300)
        await pg.click('input[name=v-align][value=justify]', force=True); await pg.wait_for_timeout(200)
        al = await pg.evaluate("getComputedStyle(document.querySelector('.r-p')).textAlign")
        check(al == 'justify', f'iki yana hizalama uygulandı ({al})')
        await pg.click('#r-view [data-close]')

        # Ayarlar: sesli okuma düğmesini kapat → okuyucuda görünmemeli
        await go(pg, '#/settings'); await pg.wait_for_timeout(500)
        await pg.click('#readTTS', force=True); await pg.wait_for_timeout(200)
        await go(pg, f'#/read/text/{tid}'); await pg.wait_for_timeout(800)
        vis = await pg.evaluate("(()=>{const f=document.querySelector('#tts-fab'); return !!f && !f.hidden && getComputedStyle(f).display!=='none'})()")
        check(not vis, 'ayarlardan kapatılınca sesli okuma düğmesi görünmüyor')
        await go(pg, '#/settings'); await pg.wait_for_timeout(400); await pg.click('#readTTS', force=True)

        # Masaüstü: içindekiler paneli yerleşik ve etkin başlık işaretli
        await pg.set_viewport_size({'width': 1440, 'height': 900})
        await go(pg, f'#/read/text/{tid}'); await pg.wait_for_timeout(1200)
        cur = await pg.evaluate("document.querySelector('.toc-list a[aria-current]')?.textContent || ''")
        check(bool(cur.strip()), f'içindekilerde etkin bölüm işaretli ({cur.strip()[:30]})')
        await pg.screenshot(path=f'{OUT}/04-reader-desktop.png')

        # Tablet: kütüphane filtreleri
        await pg.set_viewport_size({'width': 820, 'height': 1180})
        await go(pg, '#/read/library?cat=novel&len=long'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/05-library-tablet.png', full_page=True)
        check('1' in (await pg.inner_text('#rcount')), 'uzun roman filtresi çalışıyor')

        # Boş kategori (henüz metni olmayan) düzgün boş durum göstermeli
        await go(pg, '#/read/library?cat=poetry'); await pg.wait_for_timeout(700)
        body = await pg.inner_text('main')
        check(len(body) > 20, 'boş kategori sayfası hata vermeden açıldı')
        await pg.screenshot(path=f'{OUT}/06-empty-category-tablet.png', full_page=True)

        # Liste oluşturma (model üzerinden) ve liste sayfası
        await pg.evaluate("""(()=>{const R=window.__duyum.store.activeProfile().reading; R.lists.push({id:'rl_t',name:'E2E',items:['tr-daily-001','tr-stories-001'],targetMin:30,breakEvery:0,idx:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null}); window.__duyum.store.save();})()""")
        await go(pg, '#/read/list/rl_t'); await pg.wait_for_timeout(700)
        check('E2E' in await pg.inner_text('main'), 'okuma listesi sayfası açıldı')

        # Dosyadan içe aktarma (.txt blok biçimi)
        await pg.set_viewport_size({'width': 390, 'height': 844})
        await go(pg, '#/read/mine'); await pg.wait_for_timeout(600)
        path = os.path.abspath(f'{OUT}/aktar.txt')
        open(path, 'w', encoding='utf8').write(SAMPLE)
        await pg.set_input_files('#pack', path); await pg.wait_for_timeout(800)
        check('Aktarılan Deneme Metni' in await pg.inner_text('main'), '.txt dosyasından içe aktarma çalıştı')
        await pg.screenshot(path=f'{OUT}/07-import-phone.png', full_page=True)


        # Kendi metni elle ekleme → kaydet → yeniden yüklemede duruyor
        await go(pg, '#/read/mine/new'); await pg.wait_for_timeout(500)
        await pg.fill('#tt', 'Elle Eklenen Metin')
        await pg.fill('#tb', ' '.join(f'Bu {i}. cümle kullanıcının kendi yazdığı metne aittir.' for i in range(1, 25)))
        await pg.click('#tf button.primary'); await pg.wait_for_timeout(900)
        check('/read/text/u-' in pg.url, 'kendi metni kaydedildi ve okuyucuda açıldı')
        await pg.reload(); await pg.wait_for_timeout(900); await go(pg, '#/read/mine'); await pg.wait_for_timeout(500)
        check('Elle Eklenen Metin' in await pg.inner_text('main'), 'kendi metni yeniden yüklemede duruyor')

        # Yapay zekâ ile oluştur (servis yanıtı taklit edilir; gerçek ağa çıkılmaz)
        long_body = '\n\n'.join(' '.join(f'Kovan {j}. paragrafta arıların {i}. işini anlatıyor.' for i in range(1, 9)) for j in range(1, 8))
        calls = {'n': 0}
        async def fake_gemini(route):
            calls['n'] += 1
            if 'models?' in route.request.url:
                await route.fulfill(status=200, content_type='application/json', body='{"models":[{"name":"models/gemini-2.5-flash","supportedGenerationMethods":["generateContent"]}]}')
                return
            import json as _j
            text = '### | Arıların Bir Günü\nsub: nature | tags: arı, bal, bahçe\n---\n' + long_body
            await route.fulfill(status=200, content_type='application/json', body=_j.dumps({'candidates': [{'content': {'parts': [{'text': text}]}}]}))
        await pg.route('https://generativelanguage.googleapis.com/**', fake_gemini)
        await go(pg, '#/read/ai'); await pg.wait_for_timeout(600)
        await pg.fill('#ai-topic', 'arı, bal, bahçe')
        await pg.click('#ai-go'); await pg.wait_for_timeout(500)
        check(await pg.locator('#ai-err').is_visible(), 'bağlantı ayarlanmadan üretim istenince açık uyarı gösterildi')
        await pg.select_option('#ai-prov', 'gemini'); await pg.fill('#ai-key', 'TEST-KEY'); await pg.press('#ai-key', 'Tab')
        await pg.click('[data-ai=test]'); await pg.wait_for_timeout(600)
        check('1' in await pg.inner_text('#ai-status'), f'bağlantı testi model listesini aldı ({(await pg.inner_text("#ai-status"))[:40]})')
        await pg.screenshot(path=f'{OUT}/08-ai-form.png', full_page=True)
        await pg.click('#ai-go'); await pg.wait_for_selector('#ai-title', timeout=8000)
        check(await pg.input_value('#ai-title') == 'Arıların Bir Günü', 'yapay zekâ metni önizlemeye geldi')
        await pg.screenshot(path=f'{OUT}/09-ai-result.png', full_page=True)
        await pg.click('[data-r=save]'); await pg.wait_for_timeout(900)
        check('/read/text/u-' in pg.url and 'Arıların Bir Günü' in await pg.inner_text('main'), 'yapay zekâ metni kaydedildi ve okuyucuda açıldı')
        stored = await pg.evaluate("localStorage.getItem('duyum.ai.v1')||''")
        backup_has_key = await pg.evaluate("JSON.stringify(window.__duyum.store.state).includes('TEST-KEY')")
        check('TEST-KEY' in stored and not backup_has_key, 'anahtar ayrı saklanıyor, uygulama verisine/yedeğe girmiyor')

        mic = await pg.evaluate('window.__micCalls')
        check(mic == 0, f'mikrofon izni/erişimi hiç istenmedi ({mic})')
        check(not errs, f'konsol hatası yok {errs[:3]}')
        await b.close()
    print(f'\n{len(fails)} başarısız')
    sys.exit(1 if fails else 0)

asyncio.run(main())
