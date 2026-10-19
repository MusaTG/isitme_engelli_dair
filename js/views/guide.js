// Uygulama içi kullanım kılavuzu: arama, kategoriler, adım adım yönergeler, tuş şeması, SSS.
import { t, getLocale } from '../i18n.js';
import { esc, icon } from '../ui.js';
import TR from '../guide/tr.js';
import EN from '../guide/en.js';

export const GUIDES = { tr: TR, en: EN };
const guide = () => GUIDES[getLocale()] || TR;

export function searchGuide(g, query, cat = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return g.topics.filter((tp) => {
    if (cat && tp.cat !== cat) return false;
    if (!words.length) return true;
    const hay = [tp.title, tp.summary, ...(tp.steps || []), ...(tp.body || []), ...(tp.faq || []).flat()].join(' ').toLocaleLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

function keyDiagram() {
  const k = (x, cls = '') => `<kbd class="${cls}">${esc(x)}</kbd>`;
  return `<figure class="key-diagram" aria-labelledby="kd-cap">
    <div class="kd-row">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((x, i) => k(x, i < 5 ? 'on' : '')).join('')}</div>
    <figcaption id="kd-cap" class="small muted">${esc(t('guide.keysCaption'))}</figcaption>
    <dl class="kd-list">
      <dt>${k(t('guide.keySpace'))}</dt><dd>${esc(t('guide.keySpaceDo'))}</dd>
      <dt>${k('Enter')}</dt><dd>${esc(t('guide.keyEnterDo'))}</dd>
      <dt>${k('← →')}</dt><dd>${esc(t('guide.keyArrowsDo'))}</dd>
      <dt>${k('⌫')}</dt><dd>${esc(t('guide.keyBackDo'))}</dd>
    </dl>
  </figure>`;
}

function topicHtml(tp, g) {
  const idx = g.topics.indexOf(tp);
  const prev = g.topics[idx - 1], next = g.topics[idx + 1];
  return `<a href="#/guide" class="btn ghost small">${icon('back')}${t('guide.title')}</a>
    <article class="guide-topic">
      <p class="small muted">${esc(g.cats[tp.cat])}</p>
      <h1 tabindex="-1">${esc(tp.title)}</h1>
      <p class="lead">${esc(tp.summary)}</p>
      ${tp.steps ? `<h2 class="h3">${t('guide.steps')}</h2><ol class="steps-list">${tp.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${tp.keys ? keyDiagram() : ''}
      ${tp.body ? `<div class="guide-body">${tp.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
      ${tp.faq ? `<div class="faq">${tp.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>` : ''}
      ${tp.related?.length ? `<h2 class="h3">${t('guide.related')}</h2><ul class="chip-links">${tp.related.map((id) => g.topics.find((x) => x.id === id)).filter(Boolean).map((r) => `<li><a href="#/guide/${r.id}">${esc(r.title)}</a></li>`).join('')}</ul>` : ''}
    </article>
    <nav class="pager" aria-label="${esc(t('guide.pager'))}">
      ${prev ? `<a class="btn secondary" href="#/guide/${prev.id}">${icon('back')}<span>${esc(prev.title)}</span></a>` : '<span></span>'}
      ${next ? `<a class="btn secondary pager-next" href="#/guide/${next.id}"><span>${esc(next.title)}</span>${icon('play')}</a>` : ''}
    </nav>`;
}

export async function guideView(root, ctx, topicId, params) {
  const g = guide();
  if (topicId) {
    const tp = g.topics.find((x) => x.id === topicId);
    if (tp) {
      root.innerHTML = topicHtml(tp, g);
      root.querySelector('h1').focus();
      return;
    }
  }
  const st = { q: params?.get('q') || '', cat: params?.get('cat') || '' };
  function render(keep) {
    const list = searchGuide(g, st.q, st.cat);
    root.innerHTML = `<div class="page-head"><div><h1 tabindex="-1">${t('guide.title')}</h1><p class="muted">${t('guide.intro')}</p></div></div>
      <form class="guide-search" role="search" aria-label="${esc(t('guide.searchLabel'))}">
        <label class="sr-only" for="gq">${t('guide.searchLabel')}</label>
        <input id="gq" type="search" placeholder="${esc(t('guide.searchPh'))}" value="${esc(st.q)}" autocomplete="off">
      </form>
      <div class="chip-filter" role="group" aria-label="${esc(t('guide.cats'))}">
        <button class="chipf${!st.cat ? ' on' : ''}" data-cat="" aria-pressed="${!st.cat}">${t('guide.allCats')}</button>
        ${Object.entries(g.cats).map(([id, name]) => `<button class="chipf${st.cat === id ? ' on' : ''}" data-cat="${id}" aria-pressed="${st.cat === id}">${esc(name)}</button>`).join('')}
      </div>
      <p class="small muted" aria-live="polite">${esc(t('guide.found', { n: list.length }))}</p>
      ${list.length ? Object.keys(g.cats).filter((c) => list.some((tp) => tp.cat === c)).map((c) => `<section class="guide-cat" aria-labelledby="gc-${c}">
        <h2 id="gc-${c}" class="h3">${esc(g.cats[c])}</h2>
        <ul class="guide-list">${list.filter((tp) => tp.cat === c).map((tp) => `<li><a href="#/guide/${tp.id}"><strong>${esc(tp.title)}</strong><span class="small muted">${esc(tp.summary)}</span></a></li>`).join('')}</ul>
      </section>`).join('') : `<div class="empty"><p>${t('guide.noMatch')}</p></div>`}`;
    if (keep) { const el = root.querySelector('#gq'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); } else root.querySelector('h1').focus();
    root.querySelector('#gq').addEventListener('input', (e) => { st.q = e.target.value; render(true); });
    root.querySelector('form').addEventListener('submit', (e) => e.preventDefault());
    root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { st.cat = b.dataset.cat; render(); }));
  }
  render();
}

// Ayarlar sayfasındaki görünür kılavuz bölümü.
export function guideSettingsSection() {
  const g = guide();
  return `<section class="panel guide-panel" id="guide" aria-labelledby="s-guide"><h2 id="s-guide" class="h3">${icon('info')}${t('guide.settingsTitle')}</h2>
    <p>${t('guide.settingsBody')}</p>
    <div class="actions"><a class="btn primary" href="#/guide">${t('guide.open')}</a></div>
    <ul class="chip-links">${Object.entries(g.cats).map(([id, name]) => `<li><a href="#/guide?cat=${id}">${esc(name)}</a></li>`).join('')}</ul>
  </section>`;
}
