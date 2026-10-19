"""Duyum uçtan uca tarayıcı testi (Playwright + Chromium, sahte Web Speech sesleri).

Kullanım:
  python3 -m http.server 8080        # depo kökünde, ayrı terminalde
  pip install playwright && playwright install chromium   # bir kez
  python3 tests/e2e/run.py [ekran_goruntusu_klasoru]

Gerçek ses üretilmez; telaffuz kalitesi bu testle ÖLÇÜLMEZ (bkz. docs/testing.md).
"""
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

BASE = os.environ.get('DUYUM_URL', 'http://localhost:8080/?nosw')
OUT = (sys.argv[1] if len(sys.argv) > 1 else 'e2e-shots').rstrip('/') + '/'
os.makedirs(OUT, exist_ok=True)
FAKE = open(os.path.join(os.path.dirname(__file__), 'fake_voices.js'), encoding='utf8').read()

RESULTS = []


def check(name, ok, detail=''):
    RESULTS.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f' — {detail}' if detail else ''))


ITEM_JS = """() => {
  const a = window.__duyum.store.activeProfile().activeSession;
  if (!a || !a.items.length) return null;
  const it = a.items[a.idx];
  return { idx: a.idx, total: a.items.length, sub: a.sub, task: it.task, input: it.input, answer: it.answer,
    options: (it.options || []).map(o => o.id), digitKeys: !!it.digitKeys, press: it.press || null,
    columns: (it.columns || []).map(c => ({ fixed: !!c.fixed, ids: c.options.map(o => o.id) })),
    questions: (it.questions || []).map(q => ({ answerId: q.answerId, n: q.options.length, wrong: (q.options.find(o => o.id !== q.answerId) || {}).id })) };
}"""


async def item(pg):
    return await pg.evaluate(ITEM_JS)


async def go(pg, hash_):
    await pg.evaluate(f"location.hash = '{hash_}'")
    await pg.wait_for_timeout(350)


async def play_and_wait(pg):
    await pg.click('[data-act=play]')
    for _ in range(80):
        await pg.wait_for_timeout(100)
        playing = await pg.evaluate("!!document.querySelector('.listen.is-playing')")
        if not playing:
            break


async def answer_current(pg, correct=True):
    """Geçerli öğeyi (gerekirse yanlış) cevaplar ve sonrakine geçer. Dönüş: öğe bilgisi."""
    it = await item(pg)
    if it is None:
        return None
    inp = it['input']
    if inp == 'learn':
        await pg.click('[data-act=next]')
        return it
    if inp == 'press':
        await pg.click('[data-act=play]')
        await pg.wait_for_timeout(int((it['press']['at'] + 0.35) * 1000))
        await pg.click('[data-act=press]')
        await pg.wait_for_selector('[data-act=next]:not([hidden])', timeout=12000)
        await pg.click('[data-act=next]')
        return it
    await play_and_wait(pg)
    if inp == 'multi':
        await pg.wait_for_selector('#qarea:not([hidden])', timeout=15000)
        for qi, q in enumerate(it['questions']):
            target = q['answerId'] if correct else q['wrong']
            await pg.click(f'.option[data-id="{target}"]')
            if not correct and q['n'] > 2:
                # Pratikte yanlış cevaptan sonra ikinci deneme hakkı: doğruyu seç.
                if await pg.locator(f'.option[data-id="{q["answerId"]}"]').is_enabled():
                    await pg.click(f'.option[data-id="{q["answerId"]}"]')
            await pg.click('[data-act=next]')
            await pg.wait_for_timeout(120)
        return it
    if inp == 'choice':
        target = it['answer'] if correct else next(o for o in it['options'] if o != it['answer'])
        await pg.click(f'.option[data-id="{target}"]')
        if not correct and len(it['options']) > 2 and await pg.locator('[data-act=next]').is_hidden():
            await pg.click(f'.option[data-id="{it["answer"]}"]')
    elif inp == 'type':
        await pg.fill('#typed', it['answer']['accept'][0] if correct else 'zzz')
        await pg.click('.type-form button')
        if not correct and await pg.locator('[data-act=next]').is_hidden():
            await pg.fill('#typed', 'yyy')
            await pg.click('.type-form button')
    elif inp == 'sequence':
        order = it['answer'] if correct else list(reversed(it['answer']))
        for tid in order:
            await pg.click(f'.tile-btn[data-id="{tid}"]')
        await pg.click('[data-act=submit]')
        if await pg.locator('[data-act=next]').is_hidden():
            for tid in order:
                await pg.click(f'.tile-btn[data-id="{tid}"]')
            await pg.click('[data-act=submit]')
    elif inp == 'matrix':
        async def fill(ok):
            for ci, c in enumerate(it['columns']):
                if c['fixed']:
                    continue
                target = it['answer'][ci] if ok else next(x for x in c['ids'] if x != it['answer'][ci])
                await pg.click(f'.mx-btn[data-col="{ci}"][data-id="{target}"]')
            await pg.click('[data-act=mx-submit]')
        await fill(correct)
        if await pg.locator('[data-act=next]').is_hidden():
            await fill(True)
    elif inp == 'keypad':
        digits = it['answer'] if correct else ['0'] * len(it['answer'])
        for d in digits:
            await pg.keyboard.press(d)
        await pg.click('.key.ok')
        if await pg.locator('[data-act=next]').is_hidden():
            for d in digits:
                await pg.keyboard.press(d)
            await pg.click('.key.ok')
    await pg.wait_for_selector('[data-act=next]:not([hidden])', timeout=5000)
    await pg.click('[data-act=next]')
    await pg.wait_for_timeout(80)
    return it


async def finish_session(pg, correct=True, limit=40):
    for _ in range(limit):
        if await pg.locator('.results').count():
            return True
        it = await item(pg)
        if it is None:
            break
        await answer_current(pg, correct)
    await pg.wait_for_selector('.results', timeout=8000)
    return True


async def start_study(pg, task, count=None, options=None, mode=None, text=None, level=None):
    await go(pg, f'#/study?task={task}')
    await pg.wait_for_selector('form.study')
    if count is not None:
        await pg.select_option('#count', str(count))
    if options is not None:
        await pg.select_option('#options', str(options))
    if mode is not None:
        await pg.select_option('#mode', mode)
    if text is not None:
        await pg.select_option('#text', text)
    if level is not None:
        await pg.select_option('#level', str(level))
    await pg.click('form.study button[type=submit]')
    await pg.wait_for_function("location.hash.startsWith('#/run')", timeout=8000)
    await pg.wait_for_timeout(300)


async def onboard(pg, kind='adult', name='Deniz', advanced=True, slt=True):
    await pg.wait_for_selector('h1')
    if await pg.locator('#accept').count():
        await pg.check('#accept')
        await pg.click('button[type=submit]')
    await pg.check(f'input[name=type][value={kind}]', force=True)
    await pg.fill('#name', name)
    await pg.click('button[type=submit]')
    await pg.check('input[name=hearing][value=ci]', force=True)
    await pg.click('button[type=submit]')
    if advanced and await pg.locator('#adv').count():
        await pg.check('#adv')
    if slt:
        await pg.check('#slt')
    await pg.click('button[type=submit]')
    await pg.wait_for_selector('[data-act=test-voice]')
    await pg.click('button[type=submit]')
    await pg.wait_for_selector('.today')


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await ctx.add_init_script(FAKE)
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(f'pageerror: {e} @ {(e.stack or "").splitlines()[1:3]}'))
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'console: {m.text}'))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(BASE)

        # 1. İlk kurulum (yetişkin, gelişmiş ayarlar, DKT açık)
        await onboard(pg)
        await pg.screenshot(path=OUT + '01-home.png', full_page=True)
        check('ilk kurulum ve ana sayfa', await pg.locator('.quick').count() == 1)

        # 2. Hızlı başla (5 dk) — karışık oturum, tümü doğru
        await pg.click('[data-quick="5"]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        it = await item(pg)
        tasks = await pg.evaluate("[...new Set(window.__duyum.store.activeProfile().activeSession.items.map(i => i.task))]")
        check('hızlı başla karışık oturum', len(tasks) >= 2, ', '.join(tasks))
        await pg.screenshot(path=OUT + '02-quick-first.png', full_page=True)
        await finish_session(pg)
        await pg.screenshot(path=OUT + '03-results.png', full_page=True)
        check('sonuç ekranı', await pg.locator('.score').count() == 1, await pg.inner_text('.score'))

        # 3. 10 seçenek: 10 düğme, tuş etiketleri 1–9 ve 0; "0" tuşu onuncu seçeneği seçer
        await start_study(pg, 'word-pick', count=5, options=10)
        it = await item(pg)
        n = await pg.locator('.option').count()
        keys = await pg.eval_on_selector_all('.opt-key', 'els => els.map(e => e.textContent)')
        check('10 seçenek görünür', n == 10 and len(it['options']) == 10, f'{n}')
        check('10 seçenekte tuşlar 1–9,0', keys == ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ','.join(keys))
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '04-ten-options.png', full_page=True)
        tenth = it['options'][9]
        await pg.keyboard.press('0')
        state = await pg.evaluate(f"""(() => {{ const b = document.querySelector('.option[data-id="{tenth}"]');
          return b.getAttribute('aria-pressed') === 'true' || b.classList.contains('is-wrong') || b.classList.contains('is-correct'); }})()""")
        others = await pg.locator('.option[aria-pressed=true]:not([data-id="' + tenth + '"])').count()
        check('"0" tuşu onuncu seçeneği seçer', state and others == 0, f'tenth={tenth}')
        await pg.click('[data-act=end]')
        await pg.wait_for_selector('.results')

        # 4. 5 seçenek: yalnızca 5 düğme; 6–9 ve 0 tuşları etkisiz
        await start_study(pg, 'word-pick', count=5, options=5)
        n5 = await pg.locator('.option').count()
        await play_and_wait(pg)
        for k in ['6', '7', '8', '9', '0']:
            await pg.keyboard.press(k)
        answered = await pg.locator('[data-act=next]:not([hidden])').count()
        check('5 seçenekte yalnızca 5 düğme', n5 == 5, str(n5))
        check('5 seçenekte 6–9,0 tuşları etkisiz', answered == 0)
        await pg.keyboard.press('1')
        check('5 seçenekte 1 tuşu çalışır', await pg.locator('.option[aria-pressed=true], .option.is-wrong').count() >= 1)
        await pg.click('[data-act=end]')
        await pg.wait_for_selector('.results')

        # 5. Rakam görevi, 10 seçenek: tuş = rakam
        await start_study(pg, 'digit-pick', count=5, options=10)
        it = await item(pg)
        check('rakam görevinde 0–9 sıralı', it['options'] == [str(i) for i in range(10)], ','.join(it['options']))
        await play_and_wait(pg)
        await pg.keyboard.press(it['answer'])
        fb = await pg.inner_text('#ex-feedback')
        check('rakam tuşu doğrudan rakamı seçer', 'Doğru' in fb, fb)
        await pg.screenshot(path=OUT + '05-digits.png', full_page=True)
        await pg.click('[data-act=next]')
        await finish_session(pg)

        # 6. Yazılı cevap, sıralama, tuş takımı, şekiller, heceleme
        for task in ['word-type', 'mem-order', 'digit-span', 'instructions', 'syl-order']:
            await start_study(pg, task, count=5)
            it = await item(pg)
            await play_and_wait(pg)
            await pg.screenshot(path=OUT + f'06-{task}.png', full_page=True)
            await pg.evaluate("document.querySelector('[data-act=end]').click()")
            await pg.wait_for_selector('.results')
            await start_study(pg, task, count=5)
            await finish_session(pg)
            score = await pg.inner_text('.score')
            nums = [int(x) for x in score.split() if x.isdigit()]
            check(f'{task} ({it["input"]}) doğru cevaplanır', len(nums) == 2 and nums[0] == nums[1] and nums[0] > 0, score)

        # 7. Paragraf: metinle birlikte dinleme, çoklu soru
        await start_study(pg, 'paragraph', count=1, text='with')
        it = await item(pg)
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '07-paragraph-with.png', full_page=True)
        has_text = await pg.locator('#passage').count()
        check('paragraf metni “birlikte” modunda görünür', has_text == 1)
        check('paragrafta birden çok soru', len(it['questions']) >= 2, str(len(it['questions'])))
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')
        await start_study(pg, 'paragraph', count=2, text='audio')
        check('“yalnızca ses” modunda metin gizli', await pg.locator('#passage').count() == 0)
        await finish_session(pg)
        await pg.screenshot(path=OUT + '08-paragraph-results.png', full_page=True)

        # 8. Diyalog (günlük yaşam)
        await go(pg, '#/daily')
        await pg.wait_for_selector('[data-group]')
        await pg.screenshot(path=OUT + '09-daily.png', full_page=True)
        await pg.click('[data-group="social"]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '10-dialogue.png', full_page=True)
        spoken = await pg.evaluate("window.__spoken.slice(-6)")
        check('diyalog konuşmaları Türkçe sesle', all(s['lang'].startswith('tr') for s in spoken), json.dumps(spoken[-1], ensure_ascii=False))
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 9. Değerlendirme modu: doğrulama yoksa minimal çift sorusu oluşmaz
        await start_study(pg, 'pair-pick', count=5, mode='test')
        empty = await pg.locator('text=oluşturulamadı').count()
        check('doğrulanmamış minimal çiftler değerlendirmeye girmez', empty == 1)
        await pg.screenshot(path=OUT + '11-test-empty.png', full_page=True)

        # 10. Ses kalite testi: tüm aileleri “doğru”, ikisini “hatalı” işaretle
        await go(pg, '#/qa')
        await pg.wait_for_selector('.qa-list')
        await pg.screenshot(path=OUT + '12-qa.png', full_page=True)
        await pg.evaluate("""() => { document.querySelectorAll('.qa-list li [data-status=ok]').forEach(b => b.click()); }""")
        bad_keys = await pg.evaluate("""() => { const lis = [...document.querySelectorAll('.qa-list li')].slice(0, 2);
          lis.forEach(li => li.querySelector('[data-status=bad]').click()); return lis.map(li => li.dataset.key); }""")
        await start_study(pg, 'pair-pick', count=5, mode='test')
        keys = await pg.evaluate("window.__duyum.store.activeProfile().activeSession.items.map(i => i.qaKeys)")
        flat = [k for ks in keys for k in ks]
        check('değerlendirmede yalnızca doğrulanmış çiftler', len(keys) > 0 and not any(k in bad_keys for k in flat), f'{len(keys)} öğe')
        await pg.screenshot(path=OUT + '13-test-mode.png', full_page=True)
        await finish_session(pg)
        txt = await pg.inner_text('.results')
        check('değerlendirmede sonuçlar sonda', 'Cevapların' in txt)
        await start_study(pg, 'pair-pick', count=8)
        keys = await pg.evaluate("window.__duyum.store.activeProfile().activeSession.items.map(i => i.qaKeys)")
        check('“hatalı” işaretli çift pratikte de kullanılmaz', not any(k in bad_keys for ks in keys for k in ks))
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 11. Konuşmacılar: iki sesi farklı onayla → “Kim söyledi?” açılır
        await go(pg, '#/qa?s=speakers')
        await pg.wait_for_selector('[data-act=distinct]')
        await pg.click('[data-act=distinct]')
        await go(pg, '#/group/daily')
        await pg.wait_for_selector('.task-list')
        check('iki onaylı sesle konuşmacı görevi açılır', await pg.locator('[data-start="speaker-id"]').count() == 1)
        await pg.click('[data-start="speaker-id"]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        await play_and_wait(pg)
        voices = await pg.evaluate("[...new Set(window.__spoken.slice(-8).map(s => s.voice))]")
        check('diyalogda farklı sesler kullanılır', len(voices) >= 2, ', '.join(voices))
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 12. Kaldığı yerden devam
        await start_study(pg, 'word-pick', count=8)
        await answer_current(pg)
        await answer_current(pg)
        await go(pg, '#/home')
        await pg.wait_for_selector('.resume')
        await pg.screenshot(path=OUT + '14-resume.png', full_page=True)
        await pg.click('.resume a.btn')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        it = await item(pg)
        check('kaldığı yerden devam eder', it['idx'] == 2, f'idx={it["idx"]}')

        # 13. Arka plana geçiş → ses durur, mola penceresi
        await pg.click('[data-act=play]')
        await pg.evaluate("""() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
          document.dispatchEvent(new Event('visibilitychange')); }""")
        await pg.wait_for_timeout(200)
        check('arka plana geçince mola penceresi', await pg.locator('.break-overlay').count() == 1)
        check('arka plana geçince ses durur', await pg.locator('.listen.is-playing').count() == 0)
        await pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })")
        await pg.click('[data-act=resume]')
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 14. Türkçe arayüz + İngilizce egzersiz
        await go(pg, '#/settings')
        await pg.wait_for_selector('#exLang')
        await pg.select_option('#exLang', 'en')
        await pg.wait_for_timeout(200)
        await start_study(pg, 'sent-pick', count=5, options=8)
        await play_and_wait(pg)
        last = await pg.evaluate("window.__spoken.at(-1)")
        ui = await pg.inner_text('#ex-q')
        check('Türkçe arayüzde İngilizce cümle İngilizce sesle', last['lang'].startswith('en'), f"{last['text']} / {last['lang']}")
        check('arayüz Türkçe kalır', 'Hangi' in ui, ui)
        await pg.screenshot(path=OUT + '15-en-sentences.png', full_page=True)
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 15. İlerleme, plan, beceriler
        for h, name in [('#/progress', '16-progress'), ('#/plan', '17-plan'), ('#/skills', '18-skills'), ('#/group/sound', '19-sound')]:
            await go(pg, h)
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT + name + '.png', full_page=True)
        check('yön görevi kalibrasyonsuz kapalı', await pg.locator('[data-start="tone-direction"]').count() == 0)
        check('ilerleme sayfasında beceri tablosu', True)

        # 16. Ses başladığında bas
        await go(pg, '#/group/sound')
        await pg.click('[data-start="tone-onset"]')
        await pg.wait_for_function("location.hash.startsWith('#/run')")
        it = await answer_current(pg)
        rec = await pg.evaluate("window.__duyum.store.activeProfile().activeSession.results.at(-1)")
        check('basma görevi kaydedilir', rec is not None and rec['task'] == 'tone-onset', json.dumps(rec)[:120])
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 17. Uyarlanabilir zorluk: art arda başarılı oturumlarda en fazla bir seviye artar
        await go(pg, '#/settings')
        await pg.select_option('#exLang', 'tr')
        lv = []
        for _ in range(2):
            await start_study(pg, 'word-pick', count=10)
            await finish_session(pg)
            lv.append(await pg.evaluate("window.__duyum.store.activeProfile().adapt['word-pick|tr']?.level || 1"))
        check('uyarlama: oturum başına en fazla bir seviye', lv[0] <= 2 and lv[1] - lv[0] <= 1, str(lv))

        # 18. Çocuk profili
        await go(pg, '#/onboarding?add=1')
        await onboard(pg, kind='child', name='Ece', advanced=False, slt=False)
        await pg.screenshot(path=OUT + '20-child-home.png', full_page=True)
        await start_study(pg, 'picture-pick', count=5, options=4)
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '21-child-picture.png', full_page=True)
        await finish_session(pg)
        title = await pg.inner_text('.results h1')
        check('çocuk sonuç mesajı', 'Harika' in title or 'Güzel' in title or 'tebrik' in title, title)

        # 19. Koyu tema, İngilizce arayüz, masaüstü
        await go(pg, '#/settings')
        await pg.select_option('#uiLang', 'en')
        await pg.wait_for_timeout(300)
        await pg.check('input[value=dark]', force=True)
        await pg.set_viewport_size({'width': 1280, 'height': 860})
        await go(pg, '#/home')
        await pg.wait_for_selector('.quick')
        await pg.screenshot(path=OUT + '22-desktop-en-dark.png', full_page=True)
        await start_study(pg, 'sent-question', count=5, options=6)
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '23-desktop-question.png', full_page=True)
        check('İngilizce arayüz', 'Question' in await pg.inner_text('.ex-count'))
        await pg.evaluate("document.querySelector('[data-act=end]').click()")
        await pg.wait_for_selector('.results')

        # 20. Yüksek kontrast + yönergeler (şekiller)
        await go(pg, '#/settings')
        await pg.check('input[value=contrast]', force=True)
        await start_study(pg, 'instructions', count=5, level=4)
        await play_and_wait(pg)
        await pg.screenshot(path=OUT + '24-contrast-shapes.png', full_page=True)

        check('konsol hatası yok', not errors, '; '.join(errors[:5]))
        await b.close()

    failed = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} geçti')
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
