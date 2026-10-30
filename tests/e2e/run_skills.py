"""Beceriler: her gruptaki her görev başlatılır, Dinle → cevap → Sonraki akışı sayfa hatası olmadan ilerlemeli;
sayfadan çıkılabilmeli. Ses motoru hiç başlamazsa: hata görünür, cevaplar kilitli kalır.
Çalıştırma: python3 -m http.server 8080 (depo kökünde) + python3 tests/e2e/run_skills.py"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import FAKE, onboard
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/?nosw'
GROUPS = ['sound', 'phoneme', 'pairs', 'words', 'sentences', 'passages', 'memory']
# Konuşmayı hiç başlatmayan ses motoru (Chrome'daki "takılma" durumunun taklidi)
STUCK = """
setTimeout(() => { const s = window.speechSynthesis; s.speak = () => {}; s.cancel = () => {}; s.resume = () => {}; }, 0);
"""

fails = []
def check(name, ok, info=''):
    print(('OK  ' if ok else 'FAIL'), name, info)
    if not ok: fails.append(name)

async def step_through(pg, errs, label):
    """Bir oturumda 3 öğe: Dinle → (varsa) ilk seçenek → Sonraki."""
    for i in range(3):
        play = pg.locator('[data-act=play]')
        if await play.count():
            await play.first.click(); await pg.wait_for_timeout(700)
        opt = pg.locator('.option:not(:disabled), .tile-btn:not(:disabled), .mx-btn:not(:disabled)')
        if await opt.count():
            await opt.first.click(); await pg.wait_for_timeout(150)
        sub = pg.locator('[data-act=submit]:not(:disabled), [data-act=mx-submit]:not(:disabled)')
        if await sub.count() and await sub.first.is_visible():
            await sub.first.click(); await pg.wait_for_timeout(150)
        typed = pg.locator('#typed:not(:disabled)')
        if await typed.count():
            await typed.fill('x'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        nxt = pg.locator('[data-act=next]:visible')
        skip = pg.locator('[data-act=skip]:visible')
        if await nxt.count(): await nxt.first.click()
        elif await skip.count(): await skip.first.click()
        await pg.wait_for_timeout(250)
        if '#/run' not in pg.url: break

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context()
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE); await onboard(pg)
        total = 0
        for g in GROUPS:
            await pg.goto(BASE + f'#/group/{g}'); await pg.wait_for_timeout(500)
            n = await pg.locator('#main button:has-text("Başla")').count()
            for k in range(n):
                await pg.goto(BASE + f'#/group/{g}'); await pg.wait_for_timeout(400)
                before = len(errs)
                await pg.locator('#main button:has-text("Başla")').nth(k).click(); await pg.wait_for_timeout(700)
                if '#/run' not in pg.url:
                    continue  # ses/cihaz gerektiren görev başlatılamadıysa (ör. stereo) atla
                await step_through(pg, errs, f'{g}#{k}')
                await pg.goto(BASE + f'#/group/{g}'); await pg.wait_for_timeout(400)
                left = '#/group/' in pg.url and await pg.locator('#main button:has-text("Başla")').count() > 0
                check(f'{g} görev {k + 1}: akış hatasız, sayfadan çıkılabiliyor', len(errs) == before and left, '; '.join(errs[before:])[:200])
                total += 1
        print('denenen görev:', total)

        # Ses hiç başlamazsa
        ctx2 = await b.new_context()
        await ctx2.add_init_script(FAKE)
        pg2 = await ctx2.new_page()
        await pg2.goto(BASE); await onboard(pg2)
        await pg2.add_init_script(STUCK)
        await pg2.reload()
        await pg2.goto(BASE + '#/group/words'); await pg2.wait_for_timeout(500)
        await pg2.locator('#main button:has-text("Başla")').nth(1).click(); await pg2.wait_for_timeout(600)
        await pg2.click('[data-act=play]'); await pg2.wait_for_timeout(7500)
        err = await pg2.evaluate("document.querySelector('#ex-error')?.textContent || ''")
        locked = await pg2.evaluate("[...document.querySelectorAll('.option')].every(o => o.disabled)")
        check('ses başlamazsa hata mesajı görünür', 'başlamadı' in err, err[:80])
        check('ses başlamazsa cevaplar kilitli kalır', locked)
        await b.close()
    print(f'\n{len(fails)} başarısız')
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    asyncio.run(main())
