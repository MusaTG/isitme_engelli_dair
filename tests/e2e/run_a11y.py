# Erişilebilirlik ve tema denetimi (Playwright + axe-core). Kurulum: npm install (axe-core geliştirme bağımlılığı).
# Çalıştırma: python3 -m http.server 8080 &  →  python3 tests/e2e/run_a11y.py
# Denetler: 4 uygulama teması × 11 sayfa, 4 uygulama × 4 okuyucu teması (görünüm paneli dahil) WCAG 2.x A/AA;
# 320/390/1280 px ve 1–2 kat yazı boyutunda yatay taşma; konsol hataları.
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from run import FAKE, onboard, go, AUTO_CONFIRM
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AXE = open(os.path.join(ROOT, 'node_modules/axe-core/axe.min.js')).read()
TAGS = "{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}"
PAGES = ['#/home', '#/read', '#/read/library?q=deniz', '#/read/text/tr-novel-101', '#/read/history', '#/read/session', '#/read/mine/new', '#/read/ai', '#/settings', '#/skills', '#/goals']
fails = []
def check(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

async def axe(pg, sel='document'):
    await pg.add_script_tag(content=AXE)
    return await pg.evaluate(f"axe.run({sel},{TAGS}).then(r=>r.violations.map(v=>v.id+' ('+v.nodes.length+') '+v.nodes[0].target.join(' ')))")

async def set_themes(pg, app, reader='app'):
    await go(pg, '#/read'); await pg.wait_for_timeout(200)
    await pg.evaluate(f"(()=>{{const s=window.__duyum.store.state.settings; s.theme='{app}'; const R=window.__duyum.store.activeProfile().reading; R.view.theme='{reader}'; window.__duyum.store.save(); window.__duyum.applyPrefs();}})()")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); await ctx.add_init_script(FAKE); await ctx.add_init_script(AUTO_CONFIRM)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto('http://localhost:8080/?nosw'); await onboard(pg)
        for th in ['light', 'dark', 'pastel', 'contrast']:
            await set_themes(pg, th)
            for h in PAGES:
                await go(pg, h); await pg.wait_for_timeout(500)
                v = await axe(pg)
                check(not v, f'axe {th} {h} {v[:2]}')
        for th in ['light', 'dark', 'pastel', 'contrast']:
            for rt in ['light', 'sepia', 'dark', 'dim']:
                await set_themes(pg, th, rt)
                await go(pg, '#/read/text/tr-daily-013'); await pg.wait_for_timeout(600)
                got = await pg.evaluate("document.querySelector('#reader').dataset.rtheme")
                await pg.locator('#r-end').scroll_into_view_if_needed()
                v = await axe(pg)
                await pg.click('[data-act=view]'); await pg.wait_for_timeout(250)
                v += await axe(pg, "document.querySelector('#r-view')")
                await pg.keyboard.press('Escape')
                check(got == rt and not v, f'axe uygulama={th} okuyucu={rt} {v[:2]}')
        await set_themes(pg, 'light')
        for (w, scale) in [(320, 1), (390, 1.5), (1280, 2)]:
            await pg.set_viewport_size({'width': w, 'height': 800})
            await pg.evaluate(f"(()=>{{const s=window.__duyum.store.state.settings; s.textScale={scale}; window.__duyum.store.save(); window.__duyum.applyPrefs();}})()")
            for h in PAGES:
                await go(pg, h); await pg.wait_for_timeout(400)
                ov = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                check(ov <= 2, f'yatay taşma yok {w}px ×{scale} {h} ({ov})')
        await pg.evaluate("(()=>{const s=window.__duyum.store.state.settings; s.textScale=1; window.__duyum.store.save();})()")
        check(not errs, f'konsol hatası yok {errs[:2]}')
        await b.close()
    print(f'\n{len(fails)} başarısız')
    sys.exit(1 if fails else 0)
asyncio.run(main())
