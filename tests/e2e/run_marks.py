"""Ayraç ve "burada kaldım" işaretleri: okuyucuda ve Ayraçlar sayfasında silinebilmeli. Silme onayı uygulama içi
penceredir (tarayıcı onay penceresi bazı ortamlarda engellenir; burada bilerek her zaman "hayır" döndürülür).
Çalıştırma: python3 -m http.server 8080 (depo kökünde) + python3 tests/e2e/run_marks.py"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import FAKE, onboard
from playwright.async_api import async_playwright

BASE = 'http://localhost:8080/?nosw'
fails = []
def check(name, ok, info=''):
    print(('OK  ' if ok else 'FAIL'), name, info)
    if not ok: fails.append(name)

MARKS = "(JSON.parse(localStorage.getItem('duyum.v1')).profiles.find(Boolean)?.reading?.marks || []).filter(m => m.textId === 'tr-daily-002').map(m => m.type)"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1000, 'height': 800})
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        # Tarayıcı onay penceresi engellenmiş ortam taklidi: her zaman "hayır"
        pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await pg.goto(BASE); await onboard(pg)
        await pg.goto(BASE + '#/read/text/tr-daily-002'); await pg.wait_for_selector('.r-p')

        # Ayraç ekle
        await pg.locator('.r-p').nth(1).click(); await pg.wait_for_selector('#r-sel:not([hidden])')
        await pg.click('[data-sel=bookmark]'); await pg.fill('#db-label', 'Deneme ayracı'); await pg.click('#r-dlg [type=submit]')
        # Burada kaldım
        await pg.locator('.r-p').nth(2).click(); await pg.wait_for_selector('#r-sel:not([hidden])')
        await pg.click('[data-sel=here]'); await pg.wait_for_timeout(200)
        types = await pg.evaluate(MARKS)
        check('ayraç ve "burada kaldım" eklendi', 'bookmark' in types and 'here' in types, str(types))

        # Okuyucuda ayracı sil: işaret düğmesi → Sil → uygulama içi onay → Evet
        await pg.locator('.pm-btn.pm-bm').first.click(); await pg.wait_for_selector('#r-dlg [data-d=del]')
        await pg.click('#r-dlg [data-d=del]')
        await pg.wait_for_selector('.confirm-dlg [data-v="1"]', timeout=3000)
        # Önce Vazgeç: silinmemeli
        await pg.click('.confirm-dlg [data-v="0"]'); await pg.wait_for_timeout(150)
        check('Vazgeç → ayraç duruyor', 'bookmark' in await pg.evaluate(MARKS))
        await pg.click('#r-dlg [data-d=del]'); await pg.click('.confirm-dlg [data-v="1"]'); await pg.wait_for_timeout(200)
        types = await pg.evaluate(MARKS)
        check('okuyucuda ayraç silindi', 'bookmark' not in types, str(types))
        check('pencereler kapandı', await pg.evaluate("!document.querySelector('.confirm-dlg') && !document.querySelector('#r-dlg[open]')"))

        # Okuyucuda "burada kaldım" sil
        await pg.locator('.pm-btn.pm-here').first.click(); await pg.wait_for_selector('#r-dlg [data-d=del]')
        await pg.click('#r-dlg [data-d=del]'); await pg.click('.confirm-dlg [data-v="1"]'); await pg.wait_for_timeout(200)
        types = await pg.evaluate(MARKS)
        check('okuyucuda "burada kaldım" silindi', 'here' not in types, str(types))

        # Ayraçlar sayfasından silme
        await pg.locator('.r-p').nth(3).click(); await pg.wait_for_selector('#r-sel:not([hidden])')
        await pg.click('[data-sel=bookmark]'); await pg.click('#r-dlg [type=submit]')
        await pg.locator('.r-p').nth(4).click(); await pg.wait_for_selector('#r-sel:not([hidden])')
        await pg.click('[data-sel=here]'); await pg.wait_for_timeout(200)
        await pg.goto(BASE + '#/read/marks'); await pg.wait_for_selector('#m-list')
        n0 = await pg.locator('#m-list [data-del]').count()
        for _ in range(n0):
            await pg.locator('#m-list [data-del]').first.click(); await pg.click('.confirm-dlg [data-v="1"]'); await pg.wait_for_timeout(250)
        left = await pg.evaluate(MARKS)
        check('Ayraçlar sayfasından ayraç ve "burada kaldım" silindi', n0 >= 2 and not left, f'{n0} → {left}')
        check('konsol hatası yok', not errs, str(errs[:3]))
        await b.close()
    print(f'\n{len(fails)} başarısız')
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    asyncio.run(main())
