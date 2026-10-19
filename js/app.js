import { createStore } from './store.js';
import { setLocale, t } from './i18n.js';
import { createTTS, createWebSpeechEngine } from './tts.js';
import { icon, esc } from './ui.js';
import { loadPack } from './content/loader.js';
import { buildSession } from './engine/session.js';
import { groupOf, getTask } from './engine/registry.js';
import { makeRng } from './core/rng.js';
import { onboardingView } from './views/onboarding.js';
import { homeView } from './views/home.js';
import { skillsView, groupView, dailyView } from './views/catalog.js';
import { studyView } from './views/study.js';
import { planView } from './views/plan.js';
import { runView } from './views/run.js';
import { progressView } from './views/progress.js';
import { settingsView } from './views/settings.js';
import { qaView } from './views/qa.js';
import { goalsView, goalDetailView, goalEditView, notesView, noteEditView, reportView } from './views/goals.js';
import { guideView } from './views/guide.js';
import { setMasterVolume } from './audio.js';
import { createLibrary } from './reading/data.js';
import { readHomeView } from './views/read-home.js';
import { readLibraryView } from './views/read-library.js';
import { readerView } from './views/read-reader.js';
import { readHistoryView, readFavoritesView, readMarksView } from './views/read-records.js';
import { readListsView, readListView, readSessionView, readSessionContinue } from './views/read-lists.js';
import { readMineView, readMineEditView } from './views/read-mine.js';
import { readAIView } from './views/read-ai.js';

const store = createStore();
const tts = createTTS([createWebSpeechEngine(window)]);
// Uygulama ses düzeyi tüm konuşmalara (QA ve ses testi dâhil) uygulanır.
const rawSpeak = tts.speak.bind(tts);
tts.speak = (text, opts = {}) => rawSpeak(text, { volume: store.state.settings.volume ?? 0.7, ...opts });
const main = document.getElementById('main');
let cleanup = null;
const statusCache = new Map();
const packCache = new Map();

const readJSON = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
};

const ctx = {
  store,
  tts,
  library: createLibrary(readJSON),
  go(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  rerender: () => render(),
  applyPrefs,
  refreshShell,
  async getPack(lang) {
    if (!packCache.has(lang)) packCache.set(lang, loadPack(lang, readJSON, store.customPacks()));
    return packCache.get(lang);
  },
  clearPacks: () => packCache.clear(),
  async ttsStatus(lang, accent) {
    const key = `${lang}|${accent || ''}`;
    if (!statusCache.has(key)) statusCache.set(key, tts.status(lang, accent));
    return statusCache.get(key);
  },
  clearTTSCache: () => statusCache.clear(),
  // Telaffuz doğrulamaları seçili sese bağlıdır.
  async voiceKey(lang) {
    const p = store.activeProfile();
    const st = await ctx.ttsStatus(lang, p?.voice.en.accent);
    if (!st.ok) return `${lang}|none`;
    const chosen = st.voices.find((v) => v.voiceURI === p?.voice[lang]?.voiceURI) || st.voices[0];
    return `${lang}|${chosen.voiceURI}`;
  },
  async qaStatusFn(lang) {
    const vk = await ctx.voiceKey(lang);
    return (key) => store.qaGet(vk, key);
  },
  // Kullanıcının "gerçekten farklı" olarak onayladığı ve cihazda bulunan sesler.
  async distinctVoices(lang) {
    const st = await ctx.ttsStatus(lang, store.activeProfile()?.voice.en.accent);
    const confirmed = store.state.qa[`distinct|${lang}`] || [];
    return st.ok ? st.voices.filter((v) => confirmed.includes(v.voiceURI)) : [];
  },
  levelFor(profile, lang) {
    return (task) => {
      if (profile.manualLevel?.[task]) return profile.manualLevel[task];
      const key = `${task}|${groupOf(task) === 'sound' ? 'all' : lang}`;
      return profile.adapt?.[key]?.level || 1;
    };
  },
  catLabel(pack) {
    return (c) => pack.meta.categories?.[c]?.[store.state.settings.uiLang] || c;
  },
  async startSession(config) {
    const profile = store.activeProfile();
    const lang = config.lang || profile.exerciseLang;
    const pack = await ctx.getPack(lang);
    const status = await ctx.ttsStatus(lang, profile.voice.en.accent);
    const qaStatus = await ctx.qaStatusFn(lang);
    const distinct = await ctx.distinctVoices(lang);
    const prefs = profile.prefs;
    const full = {
      mode: prefs.mode, audience: profile.type, seenRatio: prefs.seenRatio, replayLimit: prefs.mode === 'test' ? 2 : prefs.replayLimit,
      timeLimit: prefs.timeLimit, textMode: prefs.mode === 'test' ? 'never' : profile.subtitles, passageText: prefs.passageText, retry: prefs.retry && prefs.mode !== 'test',
      ...config, lang,
    };
    full.blocks = full.blocks.map((b) => ({ ...b, overrides: { ...(prefs.options ? { options: prefs.options } : {}), ...(prefs.rateVary ? { rateVary: true } : {}), ...(prefs.noise ? { noise: prefs.noise } : {}), ...(b.overrides || {}) } }));
    const session = buildSession({
      config: full, pack, exposure: profile.exposure, qaStatus, voicesDistinct: distinct.length, stereoOk: store.state.settings.stereoOk,
      speechOk: status.ok, levelFor: ctx.levelFor(profile, lang), catLabel: ctx.catLabel(pack), rng: makeRng(),
    });
    profile.activeSession = { id: `s_${Date.now()}`, config: full, items: session.items, warnings: session.warnings, idx: 0, sub: 0, results: [], elapsed: 0, createdAt: new Date().toISOString() };
    store.save();
    ctx.go('#/run');
    return session;
  },
  taskAvailable(task, { speechOk, voices = 0 }) {
    const def = getTask(task);
    if (!def) return false;
    const lang = store.activeProfile()?.exerciseLang;
    if (def.langs && !def.langs.includes(lang)) return false;
    if (def.needsTTS && !speechOk) return false;
    if (def.needsVoices && voices < def.needsVoices) return false;
    if (def.needsStereo && !store.state.settings.stereoOk) return false;
    return true;
  },
};

function applyPrefs() {
  const s = store.state.settings;
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.dataset.audience = store.activeProfile()?.type || 'adult';
  root.style.setProperty('--text-scale', s.textScale);
  const reduce = s.reducedMotion === 'reduce' || (s.reducedMotion === 'system' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.dataset.motion = reduce ? 'reduce' : 'full';
  setMasterVolume(s.volume ?? 0.7);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim() || '#f3f6fa';
}

// "extra" öğeler geniş ekranda yan menüde görünür; telefonda alt çubuk 5 öğeyle sınırlıdır
// (Günlük yaşam katalogda, kılavuz üst çubuktaki yardım bağlantısında ve Ayarlar'da).
const NAV = [
  { hash: '#/home', icon: 'home', key: 'nav.home' },
  { hash: '#/skills', icon: 'grid', key: 'nav.skills', also: ['#/group/', '#/study', '#/plan'] },
  { hash: '#/read', icon: 'book', key: 'nav.read', short: 'nav.readShort' },
  { hash: '#/daily', icon: 'wave', key: 'nav.daily', extra: true },
  { hash: '#/goals', icon: 'notes', key: 'nav.goals', short: 'nav.goalsShort', also: ['#/goal/', '#/notes', '#/slt'] },
  { hash: '#/progress', icon: 'chart', key: 'nav.progress' },
  { hash: '#/guide', icon: 'info', key: 'nav.guide', extra: true },
  { hash: '#/settings', icon: 'gear', key: 'nav.settings', also: ['#/qa'] },
];

function refreshShell() {
  document.title = `${t('app.name')} – ${t('app.tagline')}`;
  document.querySelector('.skip-link').textContent = t('app.skip');
  const profile = store.activeProfile();
  const nav = document.getElementById('nav');
  const showNav = Boolean(profile && store.state.settings.onboarded);
  nav.hidden = !showNav;
  document.body.classList.toggle('no-nav', !showNav);
  nav.setAttribute('aria-label', t('nav.main'));
  nav.innerHTML = showNav ? `<ul>${NAV.map((n) => `<li${n.extra ? ' class="nav-extra"' : ''}><a href="${n.hash}" data-nav="${n.hash}" data-also="${(n.also || []).join(' ')}">${icon(n.icon)}${n.short ? `<span class="nav-long">${t(n.key)}</span><span class="nav-short">${t(n.short)}</span>` : `<span>${t(n.key)}</span>`}</a></li>`).join('')}</ul>` : '';
  document.getElementById('profile-chip').innerHTML = showNav
    ? `<a href="#/guide" class="chip help-chip" data-nav="#/guide" aria-label="${esc(t('nav.guide'))}">${icon('info')}<span class="help-chip-label">${t('nav.help')}</span></a><a href="#/settings" class="chip">${icon('user')}<span>${esc(profile.name || t(`profile.${profile.type}`))}</span></a>` : '';
  document.querySelector('.brand-tag').textContent = t('app.tagline');
  const warn = document.getElementById('storage-warn');
  warn.hidden = store.persistent;
  warn.textContent = t('app.storageWarning');
  markActive();
}

function markActive() {
  const hash = location.hash.split('?')[0];
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const also = (a.dataset.also || '').split(' ').filter(Boolean);
    const active = hash.startsWith(a.dataset.nav) || also.some((x) => hash.startsWith(x));
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

async function render() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  tts.cancel();
  const [path, query] = (location.hash || '#/home').slice(1).split('?');
  const params = new URLSearchParams(query || '');
  const profile = store.activeProfile();
  if ((!profile || !store.state.settings.onboarded) && path !== '/onboarding') { location.replace('#/onboarding'); return; }
  markActive();
  main.innerHTML = `<p class="muted loading">${t('app.loading')}</p>`;
  main.className = `view view-${path.startsWith('/read/text/') ? 'reader' : path.split('/')[1] || 'home'}`;
  try {
    const group = path.match(/^\/group\/(\w+)$/);
    let m;
    if (path === '/onboarding') onboardingView(main, ctx, params);
    else if (path === '/run') cleanup = await runView(main, ctx, params);
    else if (path === '/skills') await skillsView(main, ctx, params);
    else if (group) await groupView(main, ctx, group[1]);
    else if (path === '/daily') await dailyView(main, ctx);
    else if (path === '/study') await studyView(main, ctx, params);
    else if (path === '/plan') await planView(main, ctx);
    else if (path === '/goals' || path === '/slt') await goalsView(main, ctx, params);
    else if (path === '/goals/new') await goalEditView(main, ctx, null, params);
    else if (path === '/goals/report') await reportView(main, ctx);
    else if ((m = path.match(/^\/goals\/edit\/([\w-]+)$/))) await goalEditView(main, ctx, m[1], params);
    else if ((m = path.match(/^\/goal\/([\w-]+)$/))) await goalDetailView(main, ctx, m[1]);
    else if (path === '/notes') await notesView(main, ctx, params);
    else if (path === '/notes/new') cleanup = await noteEditView(main, ctx, null, params);
    else if ((m = path.match(/^\/notes\/edit\/([\w-]+)$/))) cleanup = await noteEditView(main, ctx, m[1], params);
    else if (path === '/read') await readHomeView(main, ctx);
    else if (path === '/read/library') await readLibraryView(main, ctx, params);
    else if ((m = path.match(/^\/read\/text\/([\w-]+)$/))) cleanup = await readerView(main, ctx, m[1], params);
    else if (path === '/read/history') await readHistoryView(main, ctx, params);
    else if (path === '/read/favorites') await readFavoritesView(main, ctx);
    else if (path === '/read/marks') await readMarksView(main, ctx, params);
    else if (path === '/read/lists') await readListsView(main, ctx);
    else if ((m = path.match(/^\/read\/list\/([\w-]+)$/))) await readListView(main, ctx, m[1]);
    else if (path === '/read/session') await readSessionView(main, ctx);
    else if (path === '/read/session/continue') { await readSessionContinue(ctx); return; }
    else if (path === '/read/ai') await readAIView(main, ctx, params);
    else if (path === '/read/mine') await readMineView(main, ctx, params);
    else if (path === '/read/mine/new') await readMineEditView(main, ctx, null);
    else if ((m = path.match(/^\/read\/mine\/edit\/([\w-]+)$/))) await readMineEditView(main, ctx, m[1]);
    else if (path === '/guide') await guideView(main, ctx, null, params);
    else if ((m = path.match(/^\/guide\/([\w-]+)$/))) await guideView(main, ctx, m[1], params);
    else if (path === '/progress') await progressView(main, ctx);
    else if (path === '/settings') await settingsView(main, ctx);
    else if (path === '/qa') cleanup = await qaView(main, ctx, params);
    else await homeView(main, ctx);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="alert warn" role="alert">${icon('info')}<div><p>${esc(t('app.error'))}</p><p class="small muted">${esc(err.message)}</p></div></div>`;
  }
  enhanceReadNav(main);
  if (path !== '/onboarding' && path !== '/run') main.querySelector('h1')?.focus({ preventScroll: true });
  if (path !== '/run' && !path.startsWith('/read/text/')) window.scrollTo(0, 0);
}

// Okuma alt menüsü: etkin sekmeyi görünür alana kaydır, sona gelince kenar soluklaşmasını kaldır.
function enhanceReadNav(root) {
  const nav = root.querySelector('.read-nav');
  if (!nav) return;
  const upd = () => nav.classList.toggle('at-end', nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4);
  const cur = nav.querySelector('[aria-current]');
  if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
  nav.addEventListener('scroll', upd, { passive: true });
  upd();
}

function offlineBanner() {
  const el = document.getElementById('offline');
  const update = () => { el.hidden = navigator.onLine; el.textContent = t('app.offline'); };
  addEventListener('online', update);
  addEventListener('offline', update);
  update();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || new URLSearchParams(location.search).has('nosw')) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          const bar = document.getElementById('update');
          bar.hidden = false;
          bar.innerHTML = `<span>${t('app.updateReady')}</span> <button class="btn small secondary">${t('app.reload')}</button>`;
          bar.querySelector('button').addEventListener('click', () => location.reload());
        }
      });
    });
  }).catch(() => { /* çevrimdışı önbellek isteğe bağlıdır */ });
}

setLocale(store.state.settings.uiLang);
applyPrefs();
refreshShell();
offlineBanner();
registerSW();
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applyPrefs);
if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', () => statusCache.clear());
addEventListener('hashchange', render);
render();
window.__duyum = ctx;
