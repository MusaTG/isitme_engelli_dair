"""Duyum v3 uçtan uca testleri: hedefler, notlar, kılavuz, yeni görevler, gürültü/ses düzeyi,
kalıcılık, yedekleme, tablet/masaüstü düzeni ve çevrimdışı çalışma.

Kullanım (depo kökünde sunucu çalışırken):
  python3 tests/e2e/run_v3.py [ekran_goruntusu_klasoru]

Gerçek ses üretilmez (sahte Web Speech sesleri); telaffuz kalitesi bu testle ÖLÇÜLMEZ.
"""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from run import (FAKE, check, RESULTS, item, go, play_and_wait, answer_current, finish_session,  # noqa: E402
                 start_study, onboard)
from playwright.async_api import async_playwright  # noqa: E402

BASE = os.environ.get('DUYUM_URL', 'http://localhost:8080/?nosw')
ROOT = BASE.split('?')[0]
OUT = (sys.argv[1] if len(sys.argv) > 1 else 'e2e-shots-v3').rstrip('/') + '/'
os.makedirs(OUT, exist_ok=True)

PROFILE = "window.__duyum.store.activeProfile()"


async def text(pg, sel):
    return (await pg.inner_text(sel)).strip()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True)
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'console: {m.text}'))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(BASE)
        await onboard(pg)

        # ---------- 1. Kılavuz: Ayarlar'dan erişim, arama, kategori, bağlamsal bağlantı ----------
        await go(pg, '#/settings')
        await pg.wait_for_selector('#guide')
        check('Ayarlar içinde kılavuz bölümü', await pg.locator('#guide a[href="#/guide"]').count() == 1)
        await pg.screenshot(path=OUT + 'v3-01-settings-guide.png', full_page=False)
        await pg.click('#guide a[href="#/guide"]')
        await pg.wait_for_selector('#gq')
        n_all = await pg.locator('.guide-list li').count()
        check('kılavuzda 25 konu (v4: okuma eklendi)', n_all == 25, str(n_all))
        await pg.fill('#gq', 'gürültü')
        await pg.wait_for_timeout(150)
        hits = await pg.locator('.guide-list a').evaluate_all('els => els.map(e => e.getAttribute("href"))')
        check('kılavuz araması çalışır', '#/guide/noise' in hits and len(hits) < 24, ', '.join(hits))
        check('aramada odak kutuda kalır', await pg.evaluate("document.activeElement.id") == 'gq')
        await pg.fill('#gq', '')
        await pg.click('[data-cat=goals]')
        cats = await pg.locator('.guide-cat').count()
        check('kategori süzgeci', cats == 1)
        await go(pg, '#/guide/keys')
        await pg.wait_for_selector('.key-diagram')
        check('tuş şeması konusu', await pg.locator('.key-diagram kbd').count() >= 10)
        await pg.screenshot(path=OUT + 'v3-02-guide-keys.png', full_page=True)
        await go(pg, '#/skills')
        href = await pg.get_attribute('.help-link', 'href')
        check('katalogda bağlamsal yardım bağlantısı', href == '#/guide/catalog', href)
        await pg.click('.help-link')
        await pg.wait_for_selector('.guide-topic h1')
        h1 = (await text(pg, '.guide-topic h1')).lower()
        check('bağlamsal bağlantı ilgili konuyu açar', 'katalo' in h1, h1)

        # ---------- 2. Katalog araması ve hiyerarşi süzgeci ----------
        await go(pg, '#/skills')
        await pg.fill('#cat-q', 'matris')
        await pg.wait_for_timeout(150)
        check('katalog araması', await pg.locator('#cat-results [data-start="matrix"]').count() == 1)
        await pg.fill('#cat-q', '')
        await pg.click('[data-h=detect]')
        rows = await pg.locator('#cat-results .task-row').count()
        check('hiyerarşi süzgeci (Farkındalık)', 0 < rows <= 5, str(rows))
        check('seviye adları katalogda', await pg.locator('#cat-results .tag', has_text='Başlangıç').count() >= 1)
        await pg.screenshot(path=OUT + 'v3-03-catalog-filter.png', full_page=True)
        await pg.click('[data-h=""]')

        # ---------- 3. Hedef oluşturma: doğrulama, görev bağlama, plan ----------
        await go(pg, '#/goals')
        await pg.wait_for_selector('.empty')
        await pg.screenshot(path=OUT + 'v3-04-goals-empty.png', full_page=True)
        await go(pg, '#/goals/new')
        await pg.wait_for_selector('form.goal-editor')
        await pg.click('form.goal-editor button[type=submit]')
        err = await text(pg, '#g-title-err')
        check('boş hedef adı reddedilir', len(err) > 3, err)
        await pg.click('#form-errors a')
        check('hata bağlantısı alana odaklanır, rota değişmez', await pg.evaluate("document.activeElement.id") == 'g-title' and await pg.evaluate("location.hash") == '#/goals/new')
        await pg.fill('#g-title', 'Gürültüde kısa cümleler')
        await pg.fill('#g-desc', 'Kafede konuşmaları takip etmek')
        await pg.select_option('#g-source', 'specialist')
        await pg.fill('#g-spec', 'Haftada 3 gün, 10 dakika')
        dow = await pg.evaluate("(new Date().getDay() + 6) % 7")
        await pg.check(f'input[name=day][value="{dow}"]', force=True)
        await pg.fill('#t-filter', 'matris')
        await pg.wait_for_timeout(100)
        await pg.check('input[name=task][value=matrix]')
        await pg.fill('#t-filter', '')
        await pg.wait_for_timeout(100)
        await pg.check('input[name=task][value=pair-middle]')
        await pg.select_option('#g-level', '2')
        await pg.screenshot(path=OUT + 'v3-05-goal-form.png', full_page=True)
        await pg.click('form.goal-editor button[type=submit]')
        await pg.wait_for_function("location.hash.startsWith('#/goal/')")
        g = await pg.evaluate(f"{PROFILE}.goalsV3[0]")
        check('hedef kaydedildi', g['title'] == 'Gürültüde kısa cümleler' and set(g['tasks']) == {'matrix', 'pair-middle'} and g['source'] == 'specialist' and g['plan']['days'] == [dow] and g['preset']['level'] == 2, json.dumps(g, ensure_ascii=False)[:200])
        gid = g['id']

        # Düzenleme
        await go(pg, f'#/goals/edit/{gid}')
        await pg.wait_for_selector('#g-title')
        await pg.fill('#g-title', 'Gürültüde cümleleri anlamak')
        await pg.select_option('#g-priority', 'high')
        await pg.click('form.goal-editor button[type=submit]')
        await pg.wait_for_function("location.hash.startsWith('#/goal/')")
        await pg.wait_for_timeout(200)
        h1 = await text(pg, 'main h1')
        check('hedef düzenlenir', h1 == 'Gürültüde cümleleri anlamak', h1)
        await pg.screenshot(path=OUT + 'v3-06-goal-detail.png', full_page=True)

        # ---------- 4. Ana sayfadaki "Bugünün planı" → hedef oturumu → ilerleme ----------
        await go(pg, '#/home')
        await pg.wait_for_selector('.today-plan')
        check('Bugünün planı hedefi gösterir', await pg.locator(f'[data-today="{gid}"]').count() == 1)
        await pg.screenshot(path=OUT + 'v3-07-home-today.png', full_page=True)
        await pg.click(f'[data-today="{gid}"]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        tasks = await pg.evaluate(f"[...new Set({PROFILE}.activeSession.items.map(i => i.task))]")
        lvl = await pg.evaluate(f"{PROFILE}.activeSession.items.map(i => i.level)")
        check('hedef oturumu bağlı görevleri kullanır', set(tasks) <= {'matrix', 'pair-middle'} and len(tasks) >= 1, ','.join(tasks))
        check('hedefin zorluk ayarı uygulanır (Temel=2)', all(x == 2 for x in lvl), str(lvl))
        await finish_session(pg)
        sess = await pg.evaluate(f"{PROFILE}.sessions.at(-1)")
        check('oturum hedefe bağlı kaydedilir', sess.get('goalId') == gid, str(sess.get('goalId')))
        await go(pg, f'#/goal/{gid}')
        await pg.wait_for_selector('#gd-hist')
        check('hedef geçmişinde oturum', await pg.locator('#gd-hist ~ table tbody tr, section[aria-labelledby=gd-hist] tbody tr').count() >= 1)

        # ---------- 5. Tamamlandı / geri al / arşiv ----------
        await pg.click(f'[data-done="{gid}"]')
        await pg.wait_for_timeout(150)
        st1 = await pg.evaluate(f"{PROFILE}.goalsV3[0].status")
        await pg.click('.toast-btn')
        await pg.wait_for_timeout(150)
        st2 = await pg.evaluate(f"{PROFILE}.goalsV3[0].status")
        check('tamamlandı işaretlenir ve geri alınır', st1 == 'done' and st2 == 'active', f'{st1}->{st2}')
        await pg.click('[data-set=archived]')
        await pg.wait_for_timeout(150)
        await go(pg, '#/goals')
        await pg.wait_for_selector('.tabbar')
        open_n = await pg.locator('.goal-card').count()
        await pg.click('[data-status=archived]')
        arch_n = await pg.locator('.goal-card').count()
        check('arşivlenen hedef arşiv sekmesinde', open_n == 0 and arch_n == 1, f'{open_n}/{arch_n}')
        await go(pg, f'#/goal/{gid}')
        await pg.click('[data-set=active]')
        await pg.wait_for_timeout(100)

        # ---------- 6. Notlar: taslak otomatik kayıt, yeniden açma, süzme, düzenleme, silme + geri alma ----------
        await go(pg, f'#/notes/new?goal={gid}')
        await pg.wait_for_selector('form.note-editor')
        await pg.fill('#n-experience', 'Kafe diyaloğunda ikinci konuşmacıyı kaçırdım')
        await pg.wait_for_timeout(800)
        state = await text(pg, '#save-state')
        check('not taslağı otomatik kaydedilir ve durumu görünür', 'Taslak kaydedildi' in state, state)
        await pg.reload()
        await pg.wait_for_selector('h1')
        await go(pg, '#/notes')
        check('yeniden açınca taslak uyarısı', await pg.locator('text=Taslağa devam et').count() == 1)
        await pg.click('text=Taslağa devam et')
        await pg.wait_for_selector('#n-experience')
        val = await pg.input_value('#n-experience')
        check('taslak geri yüklenir', 'ikinci konuşmacı' in val, val)
        await pg.fill('#n-next', 'Telefon senaryolarını dene')
        await pg.click('form.note-editor button[type=submit]')
        await pg.wait_for_timeout(300)
        notes = await pg.evaluate(f"{PROFILE}.notesV3")
        draft = await pg.evaluate(f"{PROFILE}.noteDraft")
        check('not kaydedilir, taslak temizlenir', len(notes) == 1 and notes[0]['goals'] == [gid] and draft is None, json.dumps(draft))
        await go(pg, '#/notes')
        await go(pg, '#/home')
        draft2 = await pg.evaluate(f"{PROFILE}.noteDraft")
        check('kaydedilen not ekrandan çıkınca taslak olarak geri gelmez', draft2 is None)
        # ikinci not (farklı tür) ve süzme
        await go(pg, '#/notes/new')
        await pg.wait_for_selector('#n-type')
        await pg.select_option('#n-type', 'self')
        await pg.fill('#n-text', 'Bugün yorgundum')
        await pg.click('form.note-editor button[type=submit]')
        await go(pg, '#/notes')
        await pg.wait_for_selector('.note-card')
        both = await pg.locator('.note-card').count()
        await pg.fill('#f-q', 'telefon')
        await pg.wait_for_timeout(150)
        q1 = await pg.locator('.note-card').count()
        await pg.fill('#f-q', '')
        await pg.select_option('#f-type', 'self')
        await pg.wait_for_timeout(150)
        q2 = await pg.locator('.note-card').count()
        check('notlar aranır ve türe göre süzülür', both == 2 and q1 == 1 and q2 == 1, f'{both}/{q1}/{q2}')
        await pg.screenshot(path=OUT + 'v3-08-notes.png', full_page=True)
        await pg.select_option('#f-type', 'all')
        # düzenle
        nid = notes[0]['id']
        await go(pg, f'#/notes/edit/{nid}')
        await pg.wait_for_selector('#n-text')
        await pg.fill('#n-text', 'Ek: gürültü 1 iyi gitti')
        check('düzenlemede kaydedilmemiş değişiklik göstergesi', 'Kaydedilmemiş' in await text(pg, '#save-state'))
        await pg.click('form.note-editor button[type=submit]')
        await pg.wait_for_timeout(250)
        check('not düzenlenir', await pg.evaluate(f"{PROFILE}.notesV3.find(n => n.id === '{nid}').text") == 'Ek: gürültü 1 iyi gitti')
        # sil + geri al
        await go(pg, f'#/notes/edit/{nid}')
        await pg.wait_for_selector('[data-act=delete]')
        await pg.click('[data-act=delete]')
        await pg.wait_for_selector('.toast-btn')
        after_del = await pg.evaluate(f"{PROFILE}.notesV3.length")
        await pg.click('.toast-btn')
        await pg.wait_for_timeout(200)
        after_undo = await pg.evaluate(f"{PROFILE}.notesV3.length")
        check('not silme onaylı ve geri alınabilir', after_del == 1 and after_undo == 2, f'{after_del}/{after_undo}')

        # ---------- 7. Kalıcılık: sayfa yeniden açılınca veriler yerinde ----------
        await pg.reload()
        await pg.wait_for_selector('h1')
        kept = await pg.evaluate(f"[{PROFILE}.goalsV3.length, {PROFILE}.notesV3.length, {PROFILE}.goalsV3[0].title]")
        check('yeniden açınca hedef ve notlar korunur', kept == [1, 2, 'Gürültüde cümleleri anlamak'], str(kept))

        # ---------- 8. Matris, logatom, ortadaki ses ----------
        await start_study(pg, 'matrix', count=5, level=5)
        await play_and_wait(pg)
        cols = await pg.locator('.mx-col').count()
        btns = await pg.locator('.mx-col').first.locator('.mx-btn').count()
        check('matris: 5 sütun × 10 seçenek', cols == 5 and btns == 10, f'{cols}×{btns}')
        await pg.screenshot(path=OUT + 'v3-09-matrix.png', full_page=True)
        it = await item(pg)
        # bir sütunu yanlış seç → kısmi puan geri bildirimi
        for ci, c in enumerate(it['columns']):
            tgt = it['answer'][ci] if ci else next(x for x in c['ids'] if x != it['answer'][0])
            await pg.click(f'.mx-btn[data-col="{ci}"][data-id="{tgt}"]')
        await pg.click('[data-act=mx-submit]')
        fb = await text(pg, '#ex-feedback')
        check('matris kelime bazında geri bildirim', '5 kelimeden 4' in fb, fb)
        await pg.click(f'.mx-btn[data-col="0"][data-id="{it["answer"][0]}"]')
        await pg.click('[data-act=mx-submit]')
        await pg.wait_for_selector('[data-act=next]:not([hidden])')
        await pg.click('[data-act=next]')
        await finish_session(pg)
        score = await text(pg, '.score')
        check('matris oturumu tamamlanır', '5' in score, score)
        for task in ['logatom-cons', 'logatom-vowel', 'pair-middle']:
            await start_study(pg, task, count=5)
            it = await item(pg)
            ok_shape = it is not None and it['input'] == 'choice'
            await finish_session(pg)
            check(f'{task} oturumu çalışır', ok_shape and await pg.locator('.results').count() == 1)
        await pg.screenshot(path=OUT + 'v3-10-results.png', full_page=True)

        # ---------- 9. Gürültüyü azalt / kapat, uygulama ses düzeyi ----------
        await go(pg, '#/settings')
        await pg.wait_for_selector('#appVol')
        await pg.evaluate("const r = document.querySelector('#appVol'); r.value = 40; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change'))")
        vol = await pg.evaluate("window.__duyum.store.state.settings.volume")
        check('uygulama ses düzeyi kaydedilir', abs(vol - 0.4) < 1e-6, str(vol))
        await go(pg, '#/study?task=word-pick')
        await pg.wait_for_selector('#noise')
        await pg.select_option('#noise', '2')
        await pg.select_option('#count', '5')
        await pg.click('form.study button[type=submit]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        await pg.wait_for_selector('[data-act=noise-down]')
        await pg.screenshot(path=OUT + 'v3-11-noise-controls.png', full_page=False)
        await pg.click('[data-act=noise-down]')
        cap1 = await pg.evaluate(f"{PROFILE}.activeSession.noiseCap")
        await pg.click('[data-act=noise-off]')
        cap0 = await pg.evaluate(f"{PROFILE}.activeSession.noiseCap")
        check('gürültü azaltılır ve kapatılır', cap1 == 1 and cap0 == 0 and await pg.locator('[data-act=noise-off]').count() == 0, f'{cap1}/{cap0}')
        await answer_current(pg)
        check('kapatılan gürültü sonraki öğede de kapalı', await pg.locator('[data-act=noise-down]').count() == 0)
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # ---------- 10. Yedekleme: dışa aktar → sil → içe aktar ----------
        await go(pg, '#/settings')
        async with pg.expect_download() as dl:
            await pg.click('[data-act=export]')
        path = await (await dl.value).path()
        data = json.load(open(path, encoding='utf8'))
        prof = data['profiles'][0]
        check('yedek hedefleri ve notları içerir', len(prof['goalsV3']) == 1 and len(prof['notesV3']) == 2)
        await pg.evaluate(f"{PROFILE}.goalsV3 = []; window.__duyum.store.save()")
        await pg.set_input_files('#importFile', path)
        await pg.wait_for_timeout(500)
        back = await pg.evaluate(f"{PROFILE}.goalsV3.length")
        check('içe aktarma hedefleri geri getirir', back == 1, str(back))

        # ---------- 11. Tablet ve masaüstü düzeni ----------
        for name, vp in [('tablet', {'width': 820, 'height': 1180}), ('desktop', {'width': 1366, 'height': 900})]:
            await pg.set_viewport_size(vp)
            for h, shot in [('#/goals', 'goals'), (f'#/goal/{gid}', 'goal'), ('#/guide', 'guide'), ('#/notes', 'notes')]:
                await go(pg, h)
                await pg.wait_for_timeout(250)
                await pg.screenshot(path=OUT + f'v3-12-{name}-{shot}.png', full_page=True)
            overflow = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
            check(f'{name}: yatay taşma yok', not overflow)
        box = await pg.evaluate("(() => { const m = document.querySelector('main').getBoundingClientRect(); const n = document.querySelector('#nav').getBoundingClientRect(); return { left: m.left - n.right, right: innerWidth - m.right, w: m.width }; })()")
        check('masaüstünde içerik ortalı ve sınırlı genişlikte', box['w'] <= 1041 and abs(box['left'] - box['right']) < 60, json.dumps(box))
        check('masaüstü yan menüde kılavuz ve günlük yaşam', await pg.locator('#nav .nav-extra a[href="#/guide"]').is_visible())
        await pg.set_viewport_size({'width': 390, 'height': 844})
        await go(pg, '#/home')
        await pg.wait_for_timeout(200)
        n_nav = await pg.locator('#nav li:visible').count()
        check('telefonda alt çubuk 6 öğe (v4: Okuma eklendi)', n_nav == 6, str(n_nav))
        check('telefonda üst çubukta yardım', await pg.locator('.help-chip').is_visible())
        overflow = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
        check('telefon: yatay taşma yok', not overflow)

        # ---------- 12. İngilizce arayüz: yeni ekranlar ----------
        await go(pg, '#/settings')
        await pg.select_option('#uiLang', 'en')
        await pg.wait_for_timeout(300)
        await go(pg, '#/goals')
        await pg.wait_for_selector('.goal-card')
        check('İngilizce hedef ekranı', 'goals' in (await text(pg, 'h1')).lower())
        await go(pg, '#/guide')
        await pg.fill('#gq', 'backup')
        await pg.wait_for_timeout(150)
        check('İngilizce kılavuz araması', await pg.locator('a[href="#/guide/backup"]').count() == 1)
        check('konsol hatası yok', not errors, '; '.join(errors[:5]))

        # ---------- 13. Çevrimdışı: service worker önbelleğinden açılış ----------
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx2.add_init_script(FAKE)
        p2 = await ctx2.new_page()
        await p2.goto(ROOT)
        await p2.wait_for_selector('h1')
        await p2.evaluate("navigator.serviceWorker.ready")
        await p2.wait_for_timeout(1500)
        await p2.reload()
        await p2.wait_for_function("!!navigator.serviceWorker.controller", timeout=10000)
        await ctx2.set_offline(True)
        await p2.reload()
        await p2.wait_for_selector('h1', timeout=10000)
        h = await p2.inner_text('h1')
        check('çevrimdışı açılış (ilk kurulum ekranı)', len(h) > 2, h)
        ok_pack = await p2.evaluate("fetch('content/tr/matrix.json').then(r => r.ok).catch(() => false)")
        check('çevrimdışı içerik paketi (matris) önbellekte', ok_pack)
        await ctx2.close()
        await b.close()

    failed = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} geçti')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    asyncio.run(main())
