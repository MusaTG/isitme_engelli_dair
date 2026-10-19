// TTS kalite test ekranı: üretilen gerçek sesi, beklenen metni ve doğrulama durumunu gösterir.
// Telaffuz doğruluğu otomatik ölçülemez; kullanıcı/uzman dinleyerek işaretler. Otomatik kontrol yalnızca
// boş/başarısız çıktıyı yakalar. "Hatalı" işaretli içerik hiçbir egzersizde kullanılmaz; değerlendirme
// modunda yalnızca "doğru" işaretli içerik kullanılır.
import { t } from '../i18n.js';
import { esc, icon, toast, selectOptions } from '../ui.js';
import { generate } from '../content/template.js';
import { makeRng } from '../core/rng.js';
import { langName, ttsErrorMessage, voiceHelpHtml } from './shared.js';

const STATUS = ['ok', 'bad', 'unsure'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function qaView(root, ctx, params) {
  const { store } = ctx;
  const profile = store.activeProfile();
  const st = { lang: params.get('lang') || profile.exerciseLang, section: params.get('s') || 'pairs', onlyOpen: false };
  let stopFlag = false;
  const cleanup = () => { stopFlag = true; ctx.tts.cancel(); };

  async function render() {
    const lang = st.lang;
    const pack = await ctx.getPack(lang);
    const L = pack.L;
    const status = await ctx.ttsStatus(lang, profile.voice.en.accent);
    const vk = await ctx.voiceKey(lang);
    const get = (k) => store.qaGet(vk, k);
    const voice = status.ok ? (status.voices.find((v) => `${lang}|${v.voiceURI}` === vk) || status.voices[0]) : null;
    const speak = (text, v) => ctx.tts.speak(text, { lang, voice: v || voice, rate: profile.voice[lang]?.rate || 1 });

    const sections = {
      pairs: pack.families.map((f) => ({ key: `pf:${f.id}`, title: f.words.map((w) => w.w).join(' · '), ipa: f.words.map((w) => `/${w.ipa}/`).join(' '), say: f.words.map((w) => w.w), note: f.note })),
      syllables: pack.syllables.sets.map((s) => ({ key: `ss:${s.id}`, title: s.items.map((x) => x.s).join(' · '), ipa: s.items.map((x) => `/${x.ipa}/`).join(' '), say: s.items.map((x) => x.say), note: s.label })),
      letters: L.LETTERS.map(([l, n]) => ({ key: `lt:${lang}:${l}`, title: l, ipa: `“${n}”`, say: [n] })),
      digits: [{ key: `dg:${lang}`, title: '0 1 2 3 4 5 6 7 8 9', ipa: L.DIGITS.join(', '), say: L.DIGITS }],
      numbers: (() => {
        const rng = makeRng(42);
        const items = ['@time', '@date', '@money', '@number:12:480', '@address'].map((spec) => generate(spec, L, rng, pack.pools));
        return [{ key: `nm:${lang}`, title: items.map((x) => x.show).join(' | '), ipa: items.map((x) => x.v).join(' | '), say: items.map((x) => x.v) }];
      })(),
      stress: lang === 'en' ? pack.words.filter((w) => w.stress && w.syl >= 2).slice(0, 40).map((w) => ({ key: `st:${w.id}`, title: w.w, ipa: t('qa.stressOn', { n: w.stress }), say: [w.w] })) : [],
    };
    const counts = (list) => ({ ok: list.filter((x) => get(x.key) === 'ok').length, bad: list.filter((x) => get(x.key) === 'bad').length, total: list.length });
    const tabs = Object.keys(sections).filter((k) => sections[k].length).concat(['speakers']);
    const list = (sections[st.section] || []).filter((x) => !st.onlyOpen || !get(x.key));

    root.innerHTML = `<a href="#/settings" class="btn ghost small">${icon('back')}${t('nav.settings')}</a>
      <h1 tabindex="-1">${t('nav.qa')}</h1>
      <p class="muted">${t('qa.intro')}</p>
      <div class="grid2">
        <div class="field"><label for="qlang">${t('set.exerciseLang')}</label><select id="qlang">${selectOptions([['tr', t('lang.tr')], ['en', t('lang.en')]], lang)}</select></div>
        <div class="field"><span class="label">${t('qa.voice')}</span><p>${voice ? `<strong>${esc(voice.name)}</strong> <span class="muted">(${esc(voice.lang)})</span>` : esc(t('set.voiceNone', { lang: langName(lang) }))}</p></div>
      </div>
      ${status.ok ? '' : `<div class="alert warn">${icon('info')}<div><p>${esc(t('set.voiceNone', { lang: langName(lang) }))}</p>${voiceHelpHtml(true)}</div></div>`}
      <div class="qa-tabs" role="tablist">${tabs.map((k) => {
        const c = k === 'speakers' ? null : counts(sections[k]);
        return `<button role="tab" aria-selected="${k === st.section}" class="qa-tab${k === st.section ? ' on' : ''}" data-tab="${k}">${t(`qa.s.${k}`)}${c ? ` <span class="small">${c.ok}/${c.total}</span>` : ''}</button>`;
      }).join('')}</div>
      <p class="hint">${t(`qa.h.${st.section}`)}</p>
      ${st.section === 'speakers' ? speakersHtml(status, lang) : `
        <div class="qa-tools"><label class="check small"><input type="checkbox" id="onlyOpen"${st.onlyOpen ? ' checked' : ''}> ${t('qa.onlyOpen')}</label>
        <button class="btn secondary small" data-act="auto"${status.ok ? '' : ' disabled'}>${icon('play')}${t('qa.auto')}</button></div>
        <div id="auto-box" aria-live="polite"></div>
        <ul class="qa-list">${list.map((x) => `<li data-key="${esc(x.key)}">
          <div class="qa-main"><strong>${esc(x.title)}</strong><span class="small muted ipa">${esc(x.ipa)}</span>${x.note ? `<span class="small muted">${esc(x.note)}</span>` : ''}</div>
          <div class="qa-play">${x.say.length > 1 ? x.say.map((s, i) => `<button class="btn ghost small" data-say="${esc(s)}" aria-label="${esc(t('qa.playOne', { text: s }))}">${icon('play')}${i + 1}</button>`).join('') : ''}
            <button class="btn secondary small" data-all="${esc(JSON.stringify(x.say))}"${status.ok ? '' : ' disabled'}>${icon('play')}${t(x.say.length > 1 ? 'qa.playAll' : 'qa.play')}</button></div>
          <div class="qa-status" role="group" aria-label="${esc(t('qa.statusFor', { item: x.title }))}">${STATUS.map((s) => `<button class="qa-btn s-${s}${get(x.key) === s ? ' on' : ''}" data-status="${s}" aria-pressed="${get(x.key) === s}">${t(`qa.${s}`)}</button>`).join('')}</div>
        </li>`).join('') || `<li class="muted">${t('qa.allDone')}</li>`}</ul>`}`;

    const $ = (s) => root.querySelector(s);
    $('#qlang').addEventListener('change', (e) => { st.lang = e.target.value; render(); });
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { st.section = b.dataset.tab; render(); }));
    $('#onlyOpen')?.addEventListener('change', (e) => { st.onlyOpen = e.target.checked; render(); });
    root.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', async () => { try { await speak(b.dataset.say); } catch (err) { toast(ttsErrorMessage(err, lang)); } }));
    root.querySelectorAll('[data-all]').forEach((b) => b.addEventListener('click', async () => {
      try { for (const s of JSON.parse(b.dataset.all)) { await speak(s); await sleep(500); } } catch (err) { toast(ttsErrorMessage(err, lang)); }
    }));
    root.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => {
      const key = b.closest('li').dataset.key;
      const cur = get(key);
      store.qaSet(vk, key, cur === b.dataset.status ? null : b.dataset.status);
      const li = b.closest('li');
      li.querySelectorAll('[data-status]').forEach((x) => { const on = store.qaGet(vk, key) === x.dataset.status; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    }));
    $('[data-act=auto]')?.addEventListener('click', async () => {
      const box = $('#auto-box');
      stopFlag = false;
      const items = sections[st.section];
      let failed = 0;
      box.innerHTML = `<p>${t('qa.autoRunning', { n: 0, total: items.length })} <button class="btn ghost small" data-act="stopAuto">${t('ex.stop')}</button></p>`;
      box.querySelector('[data-act=stopAuto]').addEventListener('click', () => { stopFlag = true; ctx.tts.cancel(); });
      for (let i = 0; i < items.length && !stopFlag; i++) {
        box.firstElementChild.firstChild.textContent = `${t('qa.autoRunning', { n: i + 1, total: items.length })} `;
        for (const s of items[i].say) {
          if (stopFlag) break;
          try { await speak(s); } catch (err) {
            if (err.code === 'empty-output' || err.code === 'synthesis-failed') { store.qaSet(vk, items[i].key, 'bad'); failed += 1; break; }
          }
        }
      }
      box.innerHTML = `<p class="alert ${failed ? 'warn' : 'info'}">${icon('info')}<span>${esc(t('qa.autoDone', { n: failed }))}</span></p>`;
      if (failed) setTimeout(render, 1500);
    });
    bindSpeakers(status, lang, speak);
  }

  function speakersHtml(status, lang) {
    if (!status.ok) return '';
    const confirmed = store.state.qa[`distinct|${lang}`] || [];
    const voices = status.voices;
    return `<div class="panel">
      <p>${t('qa.speakersBody', { n: voices.length })}</p>
      ${voices.length < 2 ? `<p class="alert warn">${icon('info')}<span>${t('qa.speakersFew')}</span></p>` : `
      <div class="grid2"><div class="field"><label for="va">${t('qa.voiceA')}</label><select id="va">${selectOptions(voices.map((v) => [v.voiceURI, `${v.name} (${v.lang})`]), voices[0].voiceURI)}</select></div>
      <div class="field"><label for="vb">${t('qa.voiceB')}</label><select id="vb">${selectOptions(voices.map((v) => [v.voiceURI, `${v.name} (${v.lang})`]), voices[1].voiceURI)}</select></div></div>
      <div class="actions"><button class="btn secondary" data-act="cmp">${icon('play')}${t('qa.compare')}</button>
      <button class="btn primary" data-act="distinct">${t('qa.markDistinct')}</button></div>`}
      <h3 class="h4">${t('qa.confirmed')}</h3>
      ${confirmed.length ? `<ul class="note-list">${confirmed.map((uri) => `<li><span>${esc(voices.find((v) => v.voiceURI === uri)?.name || uri)}</span><button class="btn ghost small" data-unvoice="${esc(uri)}">${icon('trash')}</button></li>`).join('')}</ul>` : `<p class="muted">${t('qa.noConfirmed')}</p>`}
      <p class="hint">${t('qa.speakersNote')}</p></div>`;
  }

  function bindSpeakers(status, lang, speak) {
    const $ = (s) => root.querySelector(s);
    const voices = status.voices || [];
    const byUri = (u) => voices.find((v) => v.voiceURI === u);
    $('[data-act=cmp]')?.addEventListener('click', async () => {
      const text = t(`set.testText.${lang}`);
      try { await speak(text, byUri($('#va').value)); await sleep(600); await speak(text, byUri($('#vb').value)); } catch (err) { toast(ttsErrorMessage(err, lang)); }
    });
    $('[data-act=distinct]')?.addEventListener('click', () => {
      const a = $('#va').value, b = $('#vb').value;
      if (a === b) { toast(t('qa.sameVoice')); return; }
      const key = `distinct|${lang}`;
      store.state.qa[key] = [...new Set([...(store.state.qa[key] || []), a, b])];
      store.save();
      toast(t('common.saved'));
      render();
    });
    root.querySelectorAll('[data-unvoice]').forEach((b) => b.addEventListener('click', () => {
      const key = `distinct|${lang}`;
      store.state.qa[key] = (store.state.qa[key] || []).filter((u) => u !== b.dataset.unvoice);
      store.save();
      render();
    }));
  }

  await render();
  return cleanup;
}
