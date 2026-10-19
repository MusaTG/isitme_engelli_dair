// Service worker: uygulama kabuğunu önbelleğe alır, böylece ilk ziyaretten sonra çevrimdışı açılır.
// Yeni sürüm yayınlarken CACHE adındaki sürüm numarasını artırın; kullanıcılar güncelleme bildirimi alır.
const CACHE = 'duyum-v4.1.0-5dccb04c';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/tokens.css',
  './js/app.js',
  './js/audio.js',
  './js/content/loader.js',
  './js/content/phon.js',
  './js/content/questions.js',
  './js/content/template.js',
  './js/content/validate.js',
  './js/core/rng.js',
  './js/engine/adaptive.js',
  './js/engine/common.js',
  './js/engine/exposure.js',
  './js/engine/levels.js',
  './js/engine/registry.js',
  './js/engine/session.js',
  './js/engine/stats.js',
  './js/engine/tasks/advanced.js',
  './js/engine/tasks/passages.js',
  './js/engine/tasks/phoneme.js',
  './js/engine/tasks/sentences.js',
  './js/engine/tasks/sound.js',
  './js/engine/tasks/words.js',
  './js/goals.js',
  './js/guide/en.js',
  './js/guide/tr.js',
  './js/i18n.js',
  './js/lang/en.js',
  './js/lang/index.js',
  './js/lang/tr.js',
  './js/reading/ai.js',
  './js/reading/core.js',
  './js/reading/data.js',
  './js/reading/github.js',
  './js/reading/readaloud.js',
  './js/reading/rules.js',
  './js/reading/search.js',
  './js/reading/state.js',
  './js/store.js',
  './js/tts.js',
  './js/ui.js',
  './js/views/catalog.js',
  './js/views/goals.js',
  './js/views/guide.js',
  './js/views/home.js',
  './js/views/onboarding.js',
  './js/views/plan.js',
  './js/views/progress.js',
  './js/views/qa.js',
  './js/views/read-ai.js',
  './js/views/read-common.js',
  './js/views/read-home.js',
  './js/views/read-library.js',
  './js/views/read-lists.js',
  './js/views/read-mine.js',
  './js/views/read-reader.js',
  './js/views/read-records.js',
  './js/views/run.js',
  './js/views/settings.js',
  './js/views/shared.js',
  './js/views/study.js',
  './locales/en.js',
  './locales/reading.en.js',
  './locales/reading.tr.js',
  './locales/tr.js',
  './content/en/matrix.json',
  './content/en/meta.json',
  './content/en/pairs.json',
  './content/en/paragraphs.json',
  './content/en/pools.json',
  './content/en/scenarios.json',
  './content/en/sentences.json',
  './content/en/syllables.json',
  './content/en/words.json',
  './content/reading/categories.json',
  './content/reading/en/catalog.json',
  './content/reading/manifest.json',
  './content/reading/tr/catalog.json',
  './content/tr/matrix.json',
  './content/tr/meta.json',
  './content/tr/pairs.json',
  './content/tr/paragraphs.json',
  './content/tr/pools.json',
  './content/tr/scenarios.json',
  './content/tr/sentences.json',
  './content/tr/syllables.json',
  './content/tr/words.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html'))),
  );
});
