// Egzersiz oynatıcı: tüm giriş türleri (seçenek, yazma, sıralama, tuş takımı, basma, öğrenme kartı,
// paragraf/diyalog), test/pratik modları, tekrar dinleme ve süre sınırları, arka plana geçiş,
// kaldığı yerden devam ve sonuç ekranı.
import { t, formatDuration } from '../i18n.js';
import { esc, icon, announce } from '../ui.js';
import { playTones, playSfx, startNoise, stopNoise, stopAllTones, audioSupported, setNoiseLevel } from '../audio.js';
import { checkTyped, checkSequence, checkPress, checkMatrix } from '../engine/session.js';
import { recordExposure, pruneExposure } from '../engine/exposure.js';
import { updateLevel } from '../engine/adaptive.js';
import { getTask, groupOf } from '../engine/registry.js';
import { langOf } from '../lang/index.js';
import { ttsErrorMessage, taskTitle } from './shared.js';
import { levelName } from '../engine/levels.js';

const now = () => performance.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHAPE_SVG = {
  square: '<rect x="14" y="14" width="72" height="72" rx="6"/>',
  circle: '<circle cx="50" cy="50" r="38"/>',
  triangle: '<path d="M50 12 90 86H10z"/>',
  star: '<path d="m50 8 11.8 26.6 29 2.8-21.9 19.2 6.4 28.4L50 70.3 24.7 85l6.4-28.4L9.2 37.4l29-2.8z"/>',
  heart: '<path d="M50 86S12 62 12 36c0-12 9-22 21-22 8 0 14 4 17 10 3-6 9-10 17-10 12 0 21 10 21 22 0 26-38 50-38 50z"/>',
};

export async function runView(root, ctx) {
  const { store } = ctx;
  const profile = store.activeProfile();
  const a = profile.activeSession;
  if (!a || !a.items) {
    root.innerHTML = `<h1 tabindex="-1">${t('run.none')}</h1><p><a class="btn primary" href="#/home">${t('res.home')}</a></p>`;
    return () => {};
  }
  const cfg = a.config;
  const lang = cfg.lang;
  const L = langOf(lang);
  const test = cfg.mode === 'test';
  const child = profile.type === 'child';
  const voicePrefs = profile.voice[lang] || {};
  const speakers = await ctx.distinctVoices(lang);

  let destroyed = false;
  let token = 0;
  let timerId = null;
  let paused = false;
  let lastTick = now();
  const S = { plays: 0, answered: false, tries: 0, playing: false, picked: [], typed: '', pressAt: null, playStart: 0, deadline: null, remaining: null, passageIdx: 0, passageDone: false };

  // ---------- yardımcılar ----------
  const save = () => store.save();
  const item = () => a.items[a.idx];
  const limit = () => cfg.replayLimit || null;
  function tick() {
    const n = now();
    if (!paused && !destroyed) a.elapsed += (n - lastTick) / 1000;
    lastTick = n;
  }
  const tickId = setInterval(tick, 1000);

  function stopPlayback() {
    token += 1;
    ctx.tts.cancel();
    stopAllTones();
    stopNoise();
    S.playing = false;
    setPlayUI();
  }

  function cleanup() {
    destroyed = true;
    stopPlayback();
    clearInterval(tickId);
    clearInterval(timerId);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    tick();
    save();
  }

  const rate = (it) => Math.min(1.3, Math.max(0.6, (voicePrefs.rate || 1) * (it.rate || 1)));
  const volume = () => store.state.settings.volume ?? 0.7;
  // Konuşmacı çeşitliliği: tercih açıksa ve kullanıcı en az iki sesi "farklı" olarak onayladıysa öğeden öğeye ses değişir.
  const varyVoice = () => (profile.prefs.speakerVary && speakers.length >= 2 ? speakers[a.idx % speakers.length] : null);
  const speakOpts = (it, voice) => {
    const v = voice || varyVoice();
    return { lang, rate: rate(it), volume: volume(), accent: profile.voice.en.accent, ...(v ? { voice: v } : { voiceURI: voicePrefs.voiceURI }) };
  };
  // Gürültü: kullanıcı oturum içinde azaltabilir ya da kapatabilir; sınır sonraki öğelerde de geçerlidir.
  const noiseOf = (it) => Math.min(it.noise || 0, a.noiseCap ?? 3);

  async function say(text, it, my, voice) {
    if (my !== token) return;
    await ctx.tts.speak(text, speakOpts(it, voice));
  }

  // Bir öğenin sesini oynatır; "token" değişirse (durdur/sonraki) yarıda kalır.
  async function playItem(it, { onSentence } = {}) {
    const my = ++token;
    const p = it.play;
    const nz = noiseOf(it);
    if (nz) { startNoise(nz); await sleep(500); }
    try {
      if (p.type === 'tones') {
        if (!audioSupported()) throw Object.assign(new Error('audio'), { code: 'unsupported' });
        const h = playTones(p);
        S.playStart = h.startedAt;
        await Promise.race([h.done, new Promise((r) => { const iv = setInterval(() => { if (my !== token) { clearInterval(iv); h.stop(); r(); } }, 50); })]);
      } else if (p.type === 'speech') {
        await say(p.text, it, my);
      } else if (p.type === 'seq') {
        for (const part of p.parts) {
          if (my !== token) break;
          if (part.pause) await sleep(part.pause);
          else if (part.sfx) await playSfx(part.sfx);
          else await say(part.text, it, my);
        }
      } else if (p.type === 'dialog') {
        const order = [...new Set(p.lines.filter((l) => l.sp).map((l) => l.sp))];
        for (let i = 0; i < p.lines.length; i++) {
          if (my !== token) break;
          const line = p.lines[i];
          onSentence?.(i);
          if (line.sfx) { await playSfx(line.sfx); continue; }
          const voice = p.multiVoice && speakers.length >= 2 ? speakers[order.indexOf(line.sp) % speakers.length] : null;
          await say(line.text, it, my, voice);
          await sleep(350);
        }
      } else if (p.type === 'passage') {
        for (let i = S.passageIdx; i < p.sentences.length; i++) {
          if (my !== token) break;
          S.passageIdx = i;
          onSentence?.(i);
          await say(p.sentences[i], it, my);
          await sleep(250);
        }
        if (my === token) S.passageIdx = 0;
      }
    } finally {
      if (nz) { await sleep(300); stopNoise(); }
    }
    return my === token;
  }

  // ---------- çizim ----------
  function header() {
    const it = item();
    const total = a.items.length;
    const pct = (a.idx / total) * 100;
    return `<div class="ex-top">
        <p class="ex-count">${t('ex.progress', { n: a.idx + 1, total })}${test ? ` <span class="tag test">${t('mode.test')}</span>` : ''}</p>
        <div class="ex-tools">
          <button class="btn ghost small" data-act="break">${icon('pause')}${t('ex.break')}</button>
          <button class="btn ghost small" data-act="end">${icon('cross')}${t('ex.end')}</button>
        </div>
      </div>
      <div class="ex-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${a.idx}" aria-label="${esc(t('ex.progress', { n: a.idx + 1, total }))}"><span style="width:${pct}%"></span></div>
      ${it.blockStart && it !== a.items[0] || a.idx === 0 ? `<p class="block-title">${esc(taskTitle(it.task))}</p>` : ''}`;
  }

  function prompt(it, q) {
    if (q) return q.prompt;
    if (it.prompt) return it.prompt;
    return t(it.promptKey, it.promptVars || {});
  }

  function listenButton() {
    return `<div class="listen-wrap">
      <button class="listen" data-act="play" aria-describedby="ex-replays">
        <span class="ripple r1"></span><span class="ripple r2"></span><span class="ripple r3"></span>
        <span class="listen-core">${icon('play')}<span class="listen-label">${t('ex.listen')}</span></span>
      </button></div>
      <p id="ex-replays" class="small muted center"></p>`;
  }

  function badges(it) {
    const out = [];
    const nz = noiseOf(it);
    if (nz) out.push(`<span class="tag">${esc(t('ex.noise', { level: t(`ex.noiseLevel.${nz}`) }))}</span>`);
    if (it.qaRequired && it.qaUnverified) out.push(`<a class="tag warn" href="#/qa">${t('ex.unverified')}</a>`);
    if (it.rate && it.rate !== 1) out.push(`<span class="tag">${t('ex.rate', { n: Math.round(it.rate * 100) })}</span>`);
    const ctl = nz ? `<span class="noise-ctl"><button class="btn ghost small" data-act="noise-down">${t('ex.noiseDown')}</button><button class="btn ghost small" data-act="noise-off">${t('ex.noiseOff')}</button></span>` : '';
    return out.length || ctl ? `<p class="center badges">${out.join(' ')} ${ctl}</p>` : '';
  }

  function changeNoise(off) {
    const it = item();
    const cur = noiseOf(it);
    a.noiseCap = off ? 0 : Math.max(0, cur - 1);
    save();
    if (S.playing) { if (a.noiseCap) setNoiseLevel(a.noiseCap); else stopNoise(); }
    const b = root.querySelector('.badges');
    if (b) b.outerHTML = badges(it) || '<p class="center badges"></p>';
    bindNoise();
    announce(a.noiseCap ? t('ex.noiseLowered', { level: t(`ex.noiseLevel.${a.noiseCap}`) }) : t('ex.noiseStopped'));
  }
  function bindNoise() {
    root.querySelector('[data-act=noise-down]')?.addEventListener('click', () => changeNoise(false));
    root.querySelector('[data-act=noise-off]')?.addEventListener('click', () => changeNoise(true));
  }

  function keyFor(i, opt, it) {
    if (it.digitKeys) return opt.label;
    return i < 9 ? String(i + 1) : i === 9 ? '0' : '';
  }

  function optionsHtml(it, options, { qIndex } = {}) {
    // Resimler yalnızca tüm seçeneklerde varsa gösterilir; aksi hâlde resimli seçenek görsel ipucu olur.
    const pics = options.length > 0 && options.every((o) => o.emoji) && (profile.prefs.pictures || it.pictureOnly);
    const cls = ['options', `n${options.length}`, pics ? 'has-pictures' : '', it.longOptions || options.some((o) => (o.label || '').length > 28) ? 'long' : '', it.audioOptions ? 'audio-opts' : ''].join(' ');
    return `<div class="${cls}" role="group" aria-labelledby="ex-q">${options.map((o, i) => {
      const k = keyFor(i, o, it);
      const label = o.labelKey ? t(o.labelKey) : o.label;
      const hidden = it.audioOptions || it.pictureOnly;
      return `<div class="opt-wrap">
        <button class="option" data-id="${esc(o.id)}" ${qIndex !== undefined ? `data-q="${qIndex}"` : ''} aria-label="${esc(hidden ? `${t('ex.option')} ${i + 1}` : label)}">
          ${k ? `<span class="opt-key" aria-hidden="true">${esc(k)}</span>` : ''}
          ${o.emoji && pics ? `<span class="opt-pic" aria-hidden="true">${o.emoji}</span>` : ''}
          <span class="opt-label${hidden ? ' is-hidden' : ''}">${esc(hidden && it.audioOptions ? `${t('ex.option')} ${i + 1}` : label)}</span>
          <span class="opt-real" hidden>${esc(label)}</span>
          <span class="opt-state" aria-hidden="true"></span>
        </button>
        ${it.audioOptions ? `<button class="opt-play btn ghost small" data-say="${i}" aria-label="${esc(t('ex.playOption', { n: i + 1 }))}">${icon('play')}</button>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  function inputHtml(it) {
    switch (it.input) {
      case 'choice': return optionsHtml(it, it.options);
      case 'type': return `<form class="type-form" data-act="typeform"><label class="sr-only" for="typed">${t('ex.typeHere')}</label>
          <input id="typed" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" lang="${lang}" placeholder="${esc(t('ex.typeHere'))}">
          <button class="btn primary" type="submit">${t('ex.check')}</button></form>`;
      case 'keypad': return `<div class="seq-slots" aria-live="polite">${it.answer.map((_, i) => `<span class="slot" data-slot="${i}"></span>`).join('')}</div>
          <div class="keypad" role="group" aria-label="${esc(t('ex.keypad'))}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="key" data-digit="${d}">${d}</button>`).join('')}
          <button class="key" data-act="undo" aria-label="${esc(t('ex.undo'))}">⌫</button><button class="key" data-digit="0">0</button><button class="key ok" data-act="submit">${t('ex.check')}</button></div>`;
      case 'sequence': return `<div class="seq-slots" aria-live="polite">${it.answer.map((_, i) => `<span class="slot" data-slot="${i}"></span>`).join('')}</div>
          <div class="tiles ${it.options[0]?.shape ? 'shapes' : ''}" role="group" aria-labelledby="ex-q">${it.options.map((o, i) => `<button class="tile-btn" data-id="${esc(o.id)}" aria-label="${esc(o.label)}">
            ${o.shape ? `<svg viewBox="0 0 100 100" aria-hidden="true" class="shape" style="fill:${o.color}">${SHAPE_SVG[o.shape]}</svg>${cfg.textMode !== 'never' && !test ? `<span class="small">${esc(o.label)}</span>` : ''}` : `${o.emoji && profile.prefs.pictures ? `<span class="opt-pic small-pic" aria-hidden="true">${o.emoji}</span>` : ''}<span>${esc(o.label)}</span>`}
            <span class="opt-key" aria-hidden="true">${i < 9 ? i + 1 : ''}</span></button>`).join('')}</div>
          <div class="actions center-actions"><button class="btn ghost" data-act="undo">${t('ex.undo')}</button><button class="btn primary" data-act="submit">${t('ex.check')}</button></div>`;
      case 'matrix': return `<div class="matrix" role="group" aria-labelledby="ex-q" style="--cols:${it.columns.length}">${it.columns.map((c, ci) => `<fieldset class="mx-col${c.fixed ? ' fixed' : ''}">
            <legend>${esc(c.label)}</legend>
            ${c.options.map((o) => `<button type="button" class="mx-btn" data-col="${ci}" data-id="${esc(o.id)}" aria-pressed="${c.fixed ? 'true' : 'false'}"${c.fixed ? ' data-fixed="1"' : ''}>${esc(o.label)}</button>`).join('')}
          </fieldset>`).join('')}</div>
          <p class="small muted center">${t('ex.matrixHint')}</p>
          <div class="actions center-actions"><button class="btn primary" data-act="mx-submit">${t('ex.check')}</button></div>`;
      case 'press': return `<button class="press-btn" data-act="press" disabled>${t(it.press.event === 'start' ? 'ex.pressStart' : 'ex.pressEnd')}</button>
          <p class="small muted center">${t('ex.pressHint')}</p>`;
      default: return '';
    }
  }

  function subtitleBlock(it) {
    const show = cfg.textMode === 'always';
    return `<p class="subtitle${show ? '' : ' is-hidden'}" id="ex-sub">${esc(it.subtitleKey ? t(it.subtitleKey, it.subtitleVars || {}) : it.subtitle || '').replace(/\n/g, '<br>')}</p>`;
  }

  function renderItem() {
    const it = item();
    Object.assign(S, { plays: 0, answered: false, tries: 0, playing: false, picked: [], typed: '', pressAt: null, deadline: null, remaining: null, passageIdx: 0, passageDone: false });
    a.sub = a.sub || 0;
    if (it.input === 'multi') return renderMulti(it);
    if (it.input === 'learn') return renderLearn(it);
    root.innerHTML = `${header()}
      <section class="ex-stage" aria-labelledby="ex-q">
        ${listenButton()}
        ${badges(it)}
        <div id="ex-error"></div>
        <div id="ex-timer" class="timer" hidden></div>
        ${subtitleBlock(it)}
        <h1 id="ex-q" class="ex-question" tabindex="-1">${esc(prompt(it))}</h1>
        ${it.note ? `<p class="small muted center">${t(it.note)}</p>` : ''}
        <p class="small muted center" id="ex-gate">${t('ex.listenFirst')}</p>
        ${inputHtml(it)}
        <div id="ex-feedback" class="feedback" hidden></div>
        <div class="ex-next">
          <button class="btn ghost" data-act="skip">${t('ex.skip')}</button>
          <button class="btn primary large" data-act="next" hidden>${a.idx === a.items.length - 1 ? t('ex.finish') : t('ex.next')}</button>
        </div>
      </section>`;
    lockInputs(true);
    bindCommon();
    root.querySelector('#ex-q').focus();
    setPlayUI();
  }

  function lockInputs(lock) {
    root.querySelectorAll('.option, .tile-btn, .key, #typed, .type-form button, [data-act=submit], [data-act=undo], .mx-btn:not([data-fixed]), [data-act=mx-submit]').forEach((el) => { el.disabled = lock; });
  }

  function setPlayUI() {
    const btn = root.querySelector('[data-act=play]');
    if (!btn) return;
    const lim = limit();
    const exhausted = lim && S.plays >= lim && !S.playing;
    btn.classList.toggle('is-playing', S.playing);
    btn.disabled = Boolean(exhausted);
    btn.querySelector('.listen-core').innerHTML = S.playing
      ? `${icon('stop')}<span class="listen-label">${t('ex.stop')}</span>`
      : exhausted ? `${icon('cross')}<span class="listen-label">${t('ex.noMorePlays')}</span>`
        : `${icon(S.plays ? 'replay' : 'play')}<span class="listen-label">${S.plays ? t('ex.listenAgain') : t('ex.listen')}</span>`;
    const rep = root.querySelector('#ex-replays');
    if (rep) rep.textContent = S.plays ? (lim ? t('ex.playsOf', { n: S.plays, max: lim }) : t('ex.replays', { n: S.plays })) : '';
  }

  async function togglePlay({ onSentence } = {}) {
    if (S.playing) { stopPlayback(); return; }
    const lim = limit();
    if (lim && S.plays >= lim) return;
    const it = item();
    S.playing = true;
    S.plays += 1;
    setPlayUI();
    root.querySelector('#ex-error') && (root.querySelector('#ex-error').innerHTML = '');
    // Paragraf/diyalogda sorular metnin tamamı dinlenince açılır (onPassageHeard).
    if (!S.answered && (it.input !== 'multi' || S.passageDone)) {
      lockInputs(false);
      root.querySelector('#ex-gate')?.remove();
      if (it.input === 'press') root.querySelector('[data-act=press]').disabled = false;
    }
    let complete = false;
    try {
      complete = await playItem(it, { onSentence });
    } catch (err) {
      const box = root.querySelector('#ex-error');
      if (box) box.innerHTML = `<div class="alert warn" role="alert">${icon('info')}<div><p>${esc(ttsErrorMessage(err, lang))}</p><a class="link" href="#/settings">${t('ex.goSettings')}</a></div></div>`;
    } finally {
      if (!destroyed) { S.playing = false; setPlayUI(); }
    }
    if (destroyed) return;
    if (it.input === 'press' && complete && !S.answered) finishPress();
    if (complete && cfg.timeLimit && !S.answered && !S.deadline && it.input !== 'press') startTimer();
    if (it.input === 'multi' && complete) onPassageHeard();
  }

  function startTimer() {
    S.remaining = cfg.timeLimit;
    S.deadline = true;
    const el = root.querySelector('#ex-timer');
    if (!el) return;
    el.hidden = false;
    const draw = () => { el.innerHTML = `<span style="width:${(S.remaining / cfg.timeLimit) * 100}%"></span><em>${t('ex.secondsLeft', { n: Math.ceil(S.remaining) })}</em>`; };
    draw();
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (paused || S.answered) return;
      S.remaining -= 0.25;
      draw();
      if (S.remaining <= 0) { clearInterval(timerId); onTimeout(); }
    }, 250);
  }

  function onTimeout() {
    const it = item();
    if (it.input === 'multi') answerQuestion(null, true);
    else finalize(false, { timeout: true });
  }

  // ---------- cevaplama ----------
  function record(it, ok, extra = {}) {
    const rec = { uid: extra.uid || it.uid, task: it.task, key: it.key, ok, first: ok && S.tries <= 1, rep: S.plays, to: Boolean(extra.timeout), label: extra.label ?? labelFor(it), m: { ...(it.meta || {}), ...(extra.qtype ? { qtype: extra.qtype } : {}) }, mode: cfg.mode, pick: extra.pick ?? null, right: extra.right ?? null };
    a.results.push(rec);
    save();
    return rec;
  }

  function labelFor(it) {
    if (it.input === 'choice' && it.options) {
      const o = it.options.find((x) => x.id === it.answer);
      return o ? (o.labelKey ? null : o.label) : null;
    }
    if (it.input === 'type') return it.answer.accept[0];
    return it.subtitle?.split('\n')[0] || null;
  }

  function answerChoice(id) {
    if (S.answered) return;
    const it = item();
    S.tries += 1;
    const ok = id === it.answer;
    const btn = root.querySelector(`.option[data-id="${CSS.escape(id)}"]`);
    if (!ok && !test && cfg.retry && S.tries === 1 && it.options.length > 2) {
      btn?.classList.add('is-wrong');
      if (btn) { btn.disabled = true; btn.querySelector('.opt-state').innerHTML = icon('cross'); }
      showFeedback(false, t('ex.tryAgain'), true);
      return;
    }
    const right = it.options.find((o) => o.id === it.answer);
    finalize(ok, { picked: id, pick: optText(it.options.find((o) => o.id === id)), right: optText(right) });
  }
  const optText = (o) => (o ? (o.labelKey ? t(o.labelKey) : o.label) : null);

  function finalize(ok, { picked, timeout, typedInfo, pick, right } = {}) {
    if (S.answered) return;
    const it = item();
    S.answered = true;
    clearInterval(timerId);
    stopPlayback();
    record(it, ok, { timeout, pick, right });
    lockInputs(true);
    root.querySelector('[data-act=press]')?.setAttribute('disabled', '');
    if (!test) revealChoice(it, picked);
    let msg;
    if (test) msg = t('ex.saved');
    else if (timeout) msg = t('ex.timeout', { answer: answerText(it) });
    else if (ok) msg = typedInfo?.reason === 'diacritics' ? t('ex.correctDiacritics', { answer: it.answer.accept[0] }) : t('ex.correct');
    else msg = t('ex.wrong', { answer: answerText(it) });
    showFeedback(ok, msg, false, test);
    if (!test && it.explain) root.querySelector('#ex-feedback').insertAdjacentHTML('beforeend', `<span class="explain">${esc(t(it.explain.key, it.explain.vars))}</span>`);
    revealText(it);
    root.querySelector('[data-act=skip]').hidden = true;
    const nb = root.querySelector('[data-act=next]');
    nb.hidden = false;
    nb.focus();
  }

  function answerText(it) {
    if (it.input === 'choice') return optText(it.options.find((o) => o.id === it.answer));
    if (it.input === 'type') return it.answer.accept[0];
    if (it.input === 'sequence') return it.answer.map((id) => it.options.find((o) => o.id === id)?.label).join(' → ');
    if (it.input === 'keypad') return it.answer.join(' ');
    if (it.input === 'press') return t(it.press.event === 'start' ? 'sub.onset' : 'sub.offset');
    if (it.input === 'matrix') return it.subtitle;
    return '';
  }

  function revealChoice(it, picked) {
    root.querySelectorAll('.option').forEach((b) => {
      const isAnswer = b.dataset.id === it.answer;
      const real = b.querySelector('.opt-real')?.textContent;
      const lbl = b.querySelector('.opt-label');
      if (lbl?.classList.contains('is-hidden')) { lbl.textContent = real; lbl.classList.remove('is-hidden'); }
      if (isAnswer) { b.classList.add('is-correct'); b.querySelector('.opt-state').innerHTML = icon('check'); }
      else if (b.dataset.id === picked) { b.classList.add('is-wrong'); b.querySelector('.opt-state').innerHTML = icon('cross'); }
      if (b.dataset.id === picked) b.setAttribute('aria-pressed', 'true');
    });
  }

  function revealText(it) {
    const sub = root.querySelector('#ex-sub');
    if (!sub || test) return;
    if (cfg.textMode === 'after' || cfg.textMode === 'always') sub.classList.remove('is-hidden');
    else if (cfg.textMode === 'never' && !root.querySelector('[data-act=showtext]')) {
      sub.insertAdjacentHTML('beforebegin', `<button class="btn ghost small center-btn" data-act="showtext">${t('ex.showText')}</button>`);
      root.querySelector('[data-act=showtext]').addEventListener('click', (e) => { sub.classList.remove('is-hidden'); e.target.remove(); });
    }
  }

  function showFeedback(ok, msg, retry = false, neutral = false) {
    const fb = root.querySelector('#ex-feedback');
    fb.hidden = false;
    fb.className = `feedback ${neutral ? 'neutral' : ok ? 'ok' : retry ? 'retry' : 'no'}`;
    fb.innerHTML = `${icon(neutral ? 'check' : ok ? 'check' : 'info')}<span>${esc(msg)}</span>`;
    announce(msg);
  }

  function seqPick(id) {
    const it = item();
    if (S.answered || S.picked.length >= it.answer.length) return;
    S.picked.push(id);
    drawSlots(it);
  }
  function drawSlots(it) {
    root.querySelectorAll('.slot').forEach((el, i) => {
      const id = S.picked[i];
      const o = it.options?.find((x) => x.id === id);
      el.textContent = it.input === 'keypad' ? (id ?? '') : (o ? o.label : '');
      el.classList.toggle('filled', id !== undefined);
    });
    root.querySelectorAll('.tile-btn').forEach((b) => b.classList.toggle('is-picked', S.picked.includes(b.dataset.id)));
  }
  function seqSubmit() {
    const it = item();
    if (S.answered) return;
    if (S.picked.length < it.answer.length) { showFeedback(false, t('ex.completeFirst'), true); return; }
    S.tries += 1;
    const ok = checkSequence(S.picked, it.answer);
    const pick = it.input === 'keypad' ? S.picked.join(' ') : S.picked.map((id) => it.options.find((o) => o.id === id)?.label).join(' → ');
    if (!ok && !test && cfg.retry && S.tries === 1) { S.picked = []; drawSlots(it); showFeedback(false, t('ex.tryAgain'), true); return; }
    finalize(ok, { pick, right: answerText(it) });
  }

  function typedSubmit(value) {
    const it = item();
    if (S.answered) return;
    const res = checkTyped(value, it.answer, L);
    if (res.reason === 'empty') { showFeedback(false, t('ex.typeSomething'), true); return; }
    S.tries += 1;
    if (!res.correct && !test && cfg.retry && S.tries === 1) { showFeedback(false, t('ex.tryAgain'), true); return; }
    finalize(res.correct, { typedInfo: res, pick: value, right: it.answer.accept[0] });
  }

  function mxPick(btn) {
    const it = item();
    if (S.answered || btn.dataset.fixed) return;
    const col = Number(btn.dataset.col);
    S.picked[col] = btn.dataset.id;
    root.querySelectorAll(`.mx-btn[data-col="${col}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  }
  function mxSubmit() {
    const it = item();
    if (S.answered) return;
    const picked = it.columns.map((c, i) => (c.fixed ? c.options[0].id : S.picked[i]));
    const res = checkMatrix(picked, it.answer);
    if (!res.complete) { showFeedback(false, t('ex.matrixComplete'), true); return; }
    S.tries += 1;
    const asked = it.columns.filter((c) => !c.fixed).length;
    const rightAsked = it.columns.reduce((n, c, i) => n + (!c.fixed && picked[i] === it.answer[i] ? 1 : 0), 0);
    if (!res.ok && !test && cfg.retry && S.tries === 1) { showFeedback(false, t('ex.matrixPartial', { n: rightAsked, total: asked }), true); return; }
    S.mx = { rightAsked, asked };
    it.meta = { ...(it.meta || {}), mxRight: rightAsked, mxAsked: asked };
    finalize(res.ok, { pick: picked.join(' '), right: it.answer.join(' ') });
    if (!test) {
      root.querySelectorAll('.mx-btn').forEach((b) => {
        const col = Number(b.dataset.col);
        if (b.dataset.id === it.answer[col]) b.classList.add('is-correct');
        else if (b.dataset.id === picked[col]) b.classList.add('is-wrong');
      });
      const span = root.querySelector('#ex-feedback span');
      if (span && !res.ok) span.textContent = `${t('ex.matrixScore', { n: rightAsked, total: asked })} ${t('ex.wrong', { answer: it.subtitle })}`;
    }
  }

  function press() {
    const it = item();
    if (S.answered || S.pressAt !== null) return;
    S.pressAt = (now() - S.playStart) / 1000;
    const btn = root.querySelector('[data-act=press]');
    btn.classList.add('is-pressed');
    btn.textContent = t('ex.pressed');
  }
  function finishPress() {
    const it = item();
    const ok = checkPress(S.pressAt, it.press);
    let note = '';
    if (S.pressAt === null) note = t('ex.pressMissed');
    else if (S.pressAt < it.press.at - 0.15) note = t('ex.pressEarly');
    else if (!ok) note = t('ex.pressLate');
    finalize(ok, { pick: S.pressAt === null ? '—' : `${S.pressAt.toFixed(1)} s`, right: `${it.press.at.toFixed(1)} s` });
    if (note && !test) root.querySelector('#ex-feedback span').textContent = note;
  }

  // ---------- öğrenme kartı ----------
  function renderLearn(it) {
    const c = it.card;
    root.innerHTML = `${header()}
      <section class="learn-card" aria-labelledby="ex-q">
        <p class="small muted">${esc(prompt(it))}</p>
        ${c.emoji ? `<div class="learn-pic" aria-hidden="true">${c.emoji}</div>` : ''}
        <h1 id="ex-q" tabindex="-1" class="learn-word">${esc(c.word)}</h1>
        ${lang === 'tr' && c.syl > 1 ? `<p class="muted">${esc(L.syllabify(c.word).join(' · '))}</p>` : ''}
        <div class="actions center-actions">
          <button class="btn secondary" data-act="play">${icon('play')}${t('ex.listen')}</button>
          ${c.example ? `<button class="btn ghost" data-act="example">${icon('play')}${t('learn.example')}</button>` : ''}
        </div>
        ${c.example ? `<p class="subtitle">${esc(c.example)}</p>` : ''}
        <div class="ex-next"><span></span><button class="btn primary large" data-act="next">${a.idx === a.items.length - 1 ? t('ex.finish') : t('ex.next')}</button></div>
      </section>`;
    bindCommon();
    root.querySelector('[data-act=play]').addEventListener('click', () => { playItem(it).catch(() => {}); });
    root.querySelector('[data-act=example]')?.addEventListener('click', () => { const my = ++token; say(c.example, it, my).catch(() => {}); });
    root.querySelector('#ex-q').focus();
    if (!a.results.some((r) => r.uid === it.uid)) record(it, null, { label: c.word });
    playItem(it).catch(() => {});
  }

  // ---------- paragraf / diyalog ----------
  function passageText(it, highlight = -1) {
    if (it.play.type === 'dialog') {
      return it.play.lines.map((l, i) => (l.sfx ? `<p class="line sfx${i === highlight ? ' now' : ''}">[${esc(t(`sfx.${l.sfx}`))}]</p>`
        : `<p class="line${i === highlight ? ' now' : ''}">${it.play.hideRoles ? '' : `<strong>${esc(l.role)}:</strong> `}${esc(l.text)}</p>`)).join('');
    }
    return `<p>${it.play.sentences.map((s, i) => `<span class="sent${i === highlight ? ' now' : ''}">${esc(s)}</span>`).join(' ')}</p>`;
  }

  function renderMulti(it) {
    const mode = cfg.passageText || 'after';
    const q = it.questions[a.sub];
    const showText = mode === 'with' || mode === 'before';
    root.innerHTML = `${header()}
      <section class="ex-stage multi" aria-labelledby="ex-q">
        <h2 class="h3 passage-title">${esc(it.title || '')}</h2>
        ${it.disclaimer ? `<p class="alert info small">${icon('info')}<span>${t(`note.${it.disclaimer}`)}</span></p>` : ''}
        ${it.rolesLegend ? `<p class="small muted">${esc(t('ex.speakers', { list: it.rolesLegend.join(', ') }))}</p>` : ''}
        ${mode === 'before' && a.sub === 0 && !S.passageDone ? `<div class="passage" id="passage">${passageText(it)}</div><p class="small muted">${t('passage.readFirst')}</p>` : ''}
        ${listenButton()}
        ${badges(it)}
        <div id="ex-error"></div>
        <div id="ex-timer" class="timer" hidden></div>
        ${showText && mode !== 'before' ? `<div class="passage" id="passage">${passageText(it)}</div>` : ''}
        ${mode === 'before' && (a.sub > 0 || S.passageDone) ? `<div class="passage" id="passage">${passageText(it)}</div>` : ''}
        <div id="qarea" ${a.sub === 0 && !S.passageDone ? 'hidden' : ''}>
          <p class="small muted">${t('ex.question', { n: a.sub + 1, total: it.questions.length })}</p>
          <h1 id="ex-q" class="ex-question" tabindex="-1">${esc(q.prompt)}</h1>
          ${optionsHtml({ ...it, longOptions: true }, q.options, { qIndex: a.sub })}
        </div>
        <p class="small muted center" id="ex-gate">${a.sub === 0 && !S.passageDone ? t('passage.listenFirst') : ''}</p>
        <div id="ex-feedback" class="feedback" hidden></div>
        <div id="post-text"></div>
        <div class="ex-next">
          <button class="btn ghost" data-act="skip">${t('ex.skip')}</button>
          <button class="btn primary large" data-act="next" hidden>${t('ex.next')}</button>
        </div>
      </section>`;
    bindCommon();
    if (a.sub > 0 || S.passageDone) { lockInputs(false); S.passageDone = true; }
    else lockInputs(true);
    (root.querySelector('#ex-q') || root.querySelector('.passage-title')).focus?.();
    if (a.sub === 0 && !S.passageDone) root.querySelector('[data-act=play]').focus();
    setPlayUI();
  }

  function highlight(i) {
    const box = root.querySelector('#passage');
    if (!box || (cfg.passageText !== 'with' && cfg.passageText !== 'before')) return;
    box.innerHTML = passageText(item(), i);
  }

  function onPassageHeard() {
    if (S.passageDone) return;
    S.passageDone = true;
    root.querySelector('#qarea').hidden = false;
    root.querySelector('#ex-gate')?.remove();
    lockInputs(false);
    root.querySelector('#ex-q').focus();
    if (cfg.timeLimit) startTimer();
  }

  function answerQuestion(id, timeout = false) {
    if (S.answered) return;
    const it = item();
    const q = it.questions[a.sub];
    S.tries += 1;
    const ok = !timeout && id === q.answerId;
    if (!ok && !timeout && !test && cfg.retry && S.tries === 1 && q.options.length > 2) {
      const btn = root.querySelector(`.option[data-id="${CSS.escape(id)}"]`);
      btn?.classList.add('is-wrong');
      if (btn) { btn.disabled = true; btn.querySelector('.opt-state').innerHTML = icon('cross'); }
      showFeedback(false, t('ex.tryAgain'), true);
      return;
    }
    S.answered = true;
    clearInterval(timerId);
    const right = q.options.find((o) => o.id === q.answerId)?.label;
    record(it, ok, { uid: `${it.uid}#${a.sub}`, timeout, qtype: q.qtype, label: right, pick: q.options.find((o) => o.id === id)?.label ?? null, right });
    lockInputs(true);
    if (!test) {
      root.querySelectorAll('.option').forEach((b) => {
        if (b.dataset.id === q.answerId) { b.classList.add('is-correct'); b.querySelector('.opt-state').innerHTML = icon('check'); }
        else if (b.dataset.id === id) { b.classList.add('is-wrong'); b.querySelector('.opt-state').innerHTML = icon('cross'); }
      });
    }
    showFeedback(ok, test ? t('ex.saved') : timeout ? t('ex.timeout', { answer: right }) : ok ? t('ex.correct') : t('ex.wrong', { answer: right }), false, test);
    const last = a.sub >= it.questions.length - 1;
    if (last && !test && cfg.passageText !== 'never') {
      root.querySelector('#post-text').innerHTML = `<details class="help" ${cfg.passageText === 'after' || cfg.passageText === 'audio' ? 'open' : ''}><summary>${t('passage.showText')}</summary><div class="passage">${passageText(it)}</div></details>`;
    }
    root.querySelector('[data-act=skip]').hidden = true;
    const nb = root.querySelector('[data-act=next]');
    nb.textContent = last ? (a.idx === a.items.length - 1 ? t('ex.finish') : t('ex.next')) : t('ex.nextQuestion');
    nb.hidden = false;
    nb.focus();
  }

  // ---------- akış ----------
  function next() {
    stopPlayback();
    const it = item();
    if (it.input === 'multi' && a.sub < it.questions.length - 1) {
      if (!S.answered) answerQuestion(null);
      a.sub += 1;
      S.answered = false; S.tries = 0; S.deadline = null;
      save();
      renderMulti(it);
      if (cfg.timeLimit) startTimer();
      return;
    }
    a.sub = 0;
    if (a.idx >= a.items.length - 1) { finish(); return; }
    a.idx += 1;
    save();
    renderItem();
    breakCheck();
  }

  // Mola hatırlatıcısı: her "breakEvery" dakikada bir (0 = kapalı) öğeler arasında önerilir; zorunlu değildir.
  function breakCheck() {
    const every = Number(profile.prefs.breakEvery || 0) * 60;
    if (!every) return;
    const slot = Math.floor(a.elapsed / every);
    if (slot > (a.breaksShown || 0)) { a.breaksShown = slot; save(); pause('ex.breakReminder'); }
  }

  function skip() {
    const it = item();
    if (it.input === 'multi') {
      for (let i = a.sub; i < it.questions.length; i++) a.results.push({ uid: `${it.uid}#${i}`, task: it.task, key: it.key, ok: null, rep: S.plays, m: it.meta || {}, mode: cfg.mode });
      a.sub = it.questions.length - 1;
      S.answered = true;
    } else {
      a.results.push({ uid: it.uid, task: it.task, key: it.key, ok: null, rep: S.plays, m: it.meta || {}, mode: cfg.mode });
    }
    save();
    next();
  }

  function pause(reasonKey = 'ex.breakBody') {
    if (root.querySelector('.break-overlay')) return;
    stopPlayback();
    paused = true;
    const overlay = document.createElement('div');
    overlay.className = 'break-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'break-h');
    overlay.innerHTML = `<div class="break-card"><h2 id="break-h">${t('ex.breakTitle')}</h2><p>${t(reasonKey)}</p>
      <button class="btn primary large" data-act="resume">${t('ex.resume')}</button></div>`;
    root.append(overlay);
    const resume = overlay.querySelector('[data-act=resume]');
    resume.focus();
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); resume.focus(); } });
    resume.addEventListener('click', () => {
      paused = false;
      lastTick = now();
      overlay.remove();
      root.querySelector('#ex-q, [data-act=play]')?.focus();
    });
  }

  function endEarly() {
    if (!window.confirm(t('ex.endConfirm'))) return;
    finish();
  }

  function bindCommon() {
    const it = item();
    root.querySelector('[data-act=play]')?.addEventListener('click', () => togglePlay({ onSentence: highlight }));
    root.querySelector('[data-act=next]')?.addEventListener('click', next);
    root.querySelector('[data-act=skip]')?.addEventListener('click', skip);
    root.querySelector('[data-act=break]')?.addEventListener('click', () => pause());
    root.querySelector('[data-act=end]')?.addEventListener('click', endEarly);
    root.querySelectorAll('.option').forEach((b) => b.addEventListener('click', () => (b.dataset.q !== undefined ? answerQuestion(b.dataset.id) : answerChoice(b.dataset.id))));
    root.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', async () => {
      const opt = (it.options || [])[Number(b.dataset.say)];
      if (!opt) return;
      try { const my = ++token; await say(opt.say || opt.label, it, my); } catch (err) { showFeedback(false, ttsErrorMessage(err, lang), true); }
    }));
    root.querySelectorAll('.tile-btn').forEach((b) => b.addEventListener('click', () => seqPick(b.dataset.id)));
    root.querySelectorAll('[data-digit]').forEach((b) => b.addEventListener('click', () => seqPick(b.dataset.digit)));
    root.querySelector('[data-act=undo]')?.addEventListener('click', () => { S.picked.pop(); drawSlots(it); });
    root.querySelector('[data-act=submit]')?.addEventListener('click', seqSubmit);
    root.querySelector('[data-act=typeform]')?.addEventListener('submit', (e) => { e.preventDefault(); typedSubmit(root.querySelector('#typed').value); });
    root.querySelector('[data-act=press]')?.addEventListener('click', press);
    root.querySelectorAll('.mx-btn').forEach((b) => b.addEventListener('click', () => mxPick(b)));
    root.querySelector('[data-act=mx-submit]')?.addEventListener('click', mxSubmit);
    bindNoise();
  }

  function onKey(e) {
    if (root.querySelector('.break-overlay') || destroyed) return;
    const it = item();
    if (!it) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ') {
      if (it.input === 'press' && S.playing) { e.preventDefault(); press(); return; }
      if (tag === 'BUTTON' && !e.target.matches('[data-act=play]')) return;
      e.preventDefault();
      togglePlay({ onSentence: highlight });
      return;
    }
    if (e.key === 'Enter' && S.answered && tag !== 'BUTTON' && tag !== 'A') { root.querySelector('[data-act=next]')?.click(); return; }
    if (/^[0-9]$/.test(e.key)) {
      if (it.input === 'keypad') { root.querySelector(`[data-digit="${e.key}"]`)?.click(); return; }
      if (it.input === 'sequence') { root.querySelectorAll('.tile-btn')[Number(e.key) - 1]?.click(); return; }
      const opts = [...root.querySelectorAll('.option')];
      const target = it.digitKeys ? opts.find((b) => b.dataset.id === e.key) : opts[e.key === '0' ? 9 : Number(e.key) - 1];
      if (target && !target.disabled) target.click();
      return;
    }
    if (e.key === 'Backspace' && (it.input === 'keypad' || it.input === 'sequence')) { e.preventDefault(); S.picked.pop(); drawSlots(it); return; }
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) && e.target.classList?.contains('option')) {
      const opts = [...root.querySelectorAll('.option:not(:disabled)')];
      const i = opts.indexOf(e.target);
      const nextEl = opts[(i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + opts.length) % opts.length];
      nextEl?.focus();
      e.preventDefault();
    }
  }

  // Uygulama arka plana geçince ses durur, süre durur; dönüşte kullanıcı devam eder.
  function onVisibility() {
    if (document.hidden) { tick(); save(); if (S.playing || !paused) pause('ex.backgroundBody'); }
  }

  // ---------- sonuç ----------
  function finish() {
    stopPlayback();
    clearInterval(timerId);
    tick();
    document.removeEventListener('keydown', onKey);
    const scored = a.results.filter((r) => r.ok === true || r.ok === false);
    const correct = scored.filter((r) => r.ok).length;
    const first = scored.filter((r) => r.first).length;
    const reps = scored.reduce((x, r) => x + (r.rep || 0), 0);
    const durationSec = Math.max(1, Math.round(a.elapsed));
    const changes = [];
    if (a.results.length) {
      const now2 = Date.now();
      for (const it of a.items) {
        if (it.noExposure) continue;
        const rs = a.results.filter((r) => r.uid === it.uid || r.uid.startsWith(`${it.uid}#`));
        if (!rs.length) continue;
        const learning = it.input === 'learn';
        recordExposure(profile.exposure, it.key, learning || rs.every((r) => r.ok), now2, { learning });
      }
      pruneExposure(profile.exposure);
      if (!test) {
        const byTask = {};
        for (const r of scored) (byTask[r.task] ||= []).push({ correct: r.ok, replays: r.rep });
        for (const [task, rs] of Object.entries(byTask)) {
          if (profile.manualLevel?.[task]) continue;
          const key = `${task}|${groupOf(task) === 'sound' ? 'all' : lang}`;
          const { entry, change } = updateLevel(profile.adapt[key], rs, profile.prefs.comfort);
          profile.adapt[key] = entry;
          if (change) changes.push({ task, change, level: entry.level });
        }
      }
      if (scored.length || a.results.length) {
        store.recordSession(profile, {
          v: 2, id: a.id, date: new Date().toISOString(), mode: cfg.mode, lang, source: cfg.source || 'free', label: cfg.label || '', ...(cfg.goalId ? { goalId: cfg.goalId } : {}),
          durationSec, items: a.results.map(({ uid, ...r }) => r), total: scored.length, correct,
        });
      }
    }
    const session = profile.sessions[profile.sessions.length - 1];
    profile.activeSession = null;
    save();

    const ratio = scored.length ? correct / scored.length : 0;
    const title = child ? (ratio >= 0.8 ? t('res.child.great') : ratio >= 0.5 ? t('res.child.good') : t('res.child.keep')) : test ? t('res.testTitle') : t('res.title');
    const review = test ? a.results.filter((r) => r.ok !== null) : a.results.filter((r) => r.ok === false);
    const warnings = (a.warnings || []).filter((w) => w.reason);
    root.innerHTML = `<div class="results">
      <h1 tabindex="-1">${esc(title)}</h1>
      ${scored.length ? `<p class="score">${esc(t('res.score', { correct, total: scored.length }))}</p>
      <div class="score-dots" aria-hidden="true">${a.results.filter((r) => r.ok !== undefined && r.task !== 'learn-words').map((r) => `<span class="${r.ok === null ? 'skip' : r.ok ? 'ok' : 'no'}">${r.ok === null ? '–' : r.ok ? icon('check') : icon('cross')}</span>`).join('')}</div>
      <dl class="stats small-stats">
        <div><dt>${t('res.firstTry')}</dt><dd>${Math.round((first / scored.length) * 100)}%</dd></div>
        <div><dt>${t('res.avgReplays')}</dt><dd>${(reps / scored.length).toFixed(1)}</dd></div>
        <div><dt>${t('res.timeLabel')}</dt><dd>${esc(formatDuration(durationSec))}</dd></div>
      </dl>` : `<p>${t('res.noScored')}</p>`}
      ${changes.map((c) => `<p>${esc(t(c.change > 0 ? 'res.levelUpTask' : 'res.levelDownTask', { task: taskTitle(c.task), n: `${c.level} – ${levelName(c.level)}` }))}</p>`).join('')}
      ${warnings.length ? `<div class="alert info">${icon('info')}<div>${warnings.map((w) => `<p class="small">${esc(t(`warn.${w.reason}`, { task: w.task ? taskTitle(w.task) : '', made: w.made ?? '', wanted: w.wanted ?? '' }))}</p>`).join('')}${warnings.some((w) => w.reason === 'content' && getTask(w.task)?.qa === 'required') ? `<a class="link" href="#/qa">${t('nav.qa')}</a>` : ''}</div></div>` : ''}
      ${review.length ? `<section aria-labelledby="rv-h" class="review"><h2 id="rv-h" class="h3">${test ? t('res.answers') : t('res.review')}</h2>
        <table class="table"><thead><tr><th scope="col">${t('res.task')}</th><th scope="col">${t('res.yours')}</th><th scope="col">${t('res.correctAns')}</th></tr></thead>
        <tbody>${review.map((r) => `<tr><td>${esc(taskTitle(r.task))}</td><td>${r.ok ? icon('check') : icon('cross')} ${esc(r.pick ?? (r.to ? t('res.timeoutShort') : '—'))}</td><td>${esc(r.right ?? r.label ?? '')}</td></tr>`).join('')}</tbody></table></section>` : ''}
      ${session && scored.length ? `<fieldset class="comfort"><legend>${t('res.comfortQ')}</legend>
        <div class="segmented">${[3, 2, 1].map((v) => `<label><input type="radio" name="comfort" value="${v}"${session.comfort === v ? ' checked' : ''}><span>${t(`res.comfort.${v}`)}</span></label>`).join('')}</div>
        <p class="hint">${t('res.comfortHint')}</p></fieldset>` : ''}
      <p class="small muted">${test ? t('res.testNote') : t('res.note')}</p>
      <div class="actions">
        <button class="btn primary large" data-act="again">${icon('replay')}${t('res.again')}</button>
        <a class="btn secondary large" href="#/home">${t('res.home')}</a>
      </div></div>`;
    root.querySelector('h1').focus();
    root.querySelectorAll('input[name=comfort]').forEach((r) => r.addEventListener('change', () => { session.comfort = Number(r.value); save(); }));
    root.querySelector('[data-act=again]').addEventListener('click', () => ctx.startSession({ ...cfg, blocks: cfg.blocks.map((b) => ({ ...b, overrides: { ...b.overrides } })) }));
  }

  // ---------- başlangıç ----------
  if (!a.items.length) {
    const reasons = (a.warnings || []).map((w) => t(`warn.${w.reason}`, { task: w.task ? taskTitle(w.task) : '', made: w.made ?? 0, wanted: w.wanted ?? '' }));
    root.innerHTML = `<h1 tabindex="-1">${t('run.empty')}</h1>
      <div class="alert warn">${icon('info')}<div>${reasons.map((r) => `<p>${esc(r)}</p>`).join('')}<p><a class="link" href="#/qa">${t('nav.qa')}</a></p></div></div>
      <p><a class="btn primary" href="#/home">${t('res.home')}</a></p>`;
    profile.activeSession = null;
    save();
    return () => {};
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  if (a.idx >= a.items.length) a.idx = a.items.length - 1;
  const answeredCurrent = a.results.some((r) => r.uid === item().uid || r.uid.startsWith(`${item().uid}#${a.sub}`));
  if (answeredCurrent && item().input !== 'learn') { S.answered = true; next(); } else renderItem();
  return cleanup;
}
