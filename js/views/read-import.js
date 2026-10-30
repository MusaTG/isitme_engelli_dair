// Uygulama içi toplu içe aktarma: dosya(lar) ya da yapıştırılan metin → ön izleme (eklenecek / güncellenecek /
// atlanacak / hatalı, dil–kategori dağılımı, kayıt bazında gerekçe) → onay → kendi metinlerime kayıt → sonuç raporu.
// Kurallar kütüphane aracıyla aynıdır (js/reading/importer.js); hiçbir hatalı kayıt sessizce atlanmaz.
import { t } from '../i18n.js';
import { esc, icon, toast, download } from '../ui.js';
import { saveUserText } from '../reading/state.js';
import { makeText, sectionsText, shingles } from '../reading/core.js';
import { parseImportFile, planImport } from '../reading/importer.js';
import { fmtNum } from './read-common.js';

const STATUS = ['add', 'update', 'skip', 'error'];

function existingFor(rc, libMetas) {
  const ex = [];
  for (const u of rc.R.userTexts) {
    const last = u.versions[u.versions.length - 1];
    if (!last) continue;
    const tx = makeText({ lang: u.lang || 'tr', cat: u.cat, num: 0, title: u.title, meta: { sub: u.sub, kind: 'user' }, body: last.body });
    ex.push({ id: u.id, n: 0, lang: u.lang || 'tr', cat: u.cat, title: u.title, contentHash: tx.contentHash, set: shingles(sectionsText(tx.sections), u.lang || 'tr') });
  }
  for (const m of libMetas) if (m.ch) ex.push({ id: m.id, n: m.n, lang: m.lang || m.id.slice(0, 2), cat: m.cat, title: m.title, contentHash: m.ch, readonly: true, set: null });
  return ex;
}

export async function openImportDialog(ctx, rc, { files = [], text = null } = {}) {
  const items = [];
  const fileErrors = [];
  for (const f of files) {
    const name = f.name || 'metin.txt';
    let content = '';
    try { content = await f.text(); } catch { fileErrors.push(`${name}: ${t('rd.imp.readFail')}`); continue; }
    if (content.length > 5_000_000) { fileErrors.push(`${name}: ${t('rd.imp.tooBig')}`); continue; }
    const { blocks, errors } = parseImportFile(name, content);
    for (const e of errors) fileErrors.push(`${name}: ${e}`);
    // Dosya adından dil/kategori (tr-dialogue-01.txt): bloğun kendi lang/cat alanı yoksa kullanılır
    const fn = name.toLowerCase().split(/[-_. ]+/);
    const lang = fn.find((x) => x === 'tr' || x === 'en');
    const cat = fn.find((x) => rc.cats.categories.some((c) => c.id === x));
    for (const b of blocks) items.push({ block: b, file: name, lang, cat });
  }
  if (text != null) {
    const { blocks, errors } = parseImportFile(/^\s*[[{]/.test(text) ? 'yapistirilan.json' : /^[^\n]*[,;][^\n]*\n/.test(text) && /^\s*(title|başlık|baslik)\b/i.test(text) ? 'yapistirilan.csv' : 'yapistirilan.txt', text);
    for (const e of errors) fileErrors.push(`${t('rd.imp.pasted')}: ${e}`);
    for (const b of blocks) items.push({ block: b, file: t('rd.imp.pasted') });
  }
  const libMetas = [];
  for (const l of ['tr', 'en']) { try { const c = await rc.lib.catalog(l); for (const m of c.texts) libMetas.push({ ...m, lang: l }); } catch { /* katalog yok */ } }
  const plan = planImport(items, { cats: rc.cats, existing: existingFor(rc, libMetas), mode: 'user', defaults: { lang: rc.lang, cat: 'daily' } });

  const dlg = document.createElement('dialog');
  dlg.className = 'r-dlg imp-dlg';
  dlg.setAttribute('aria-labelledby', 'imp-h');
  document.body.append(dlg);
  const close = () => { dlg.close?.(); dlg.remove(); };
  dlg.addEventListener('close', () => dlg.remove());
  let filter = 'all';
  let result = null;

  const render = () => {
    const s = plan.summary;
    const rows = plan.rows.filter((r) => filter === 'all' || r.status === filter);
    const dist = Object.entries(s.dist).map(([l, c]) => `<li><strong>${esc(t(`lang.${l}`))}</strong>: ${Object.entries(c).map(([k, n]) => `${esc(rc.catName(k))} ${n}`).join(', ')}</li>`).join('');
    dlg.innerHTML = `<div class="dlg-form">
      <h2 class="h3" id="imp-h">${icon('download')}${t(result ? 'rd.imp.doneTitle' : 'rd.imp.title')}</h2>
      ${result ? `<p role="status">${esc(t('rd.imp.doneBody', { add: result.add, update: result.update }))}</p>` : `<p class="small muted">${t('rd.imp.previewNote')}</p>`}
      <div class="imp-sum" role="group" aria-label="${esc(t('rd.imp.summary'))}">
        ${STATUS.map((k) => `<button type="button" class="imp-stat st-${k}${filter === k ? ' on' : ''}" data-f="${k}" aria-pressed="${filter === k}"><span class="n">${s[k]}</span><span>${esc(t(`rd.imp.st.${k}`))}</span></button>`).join('')}
      </div>
      ${dist ? `<p class="small"><strong>${t('rd.imp.dist')}</strong></p><ul class="small imp-dist">${dist}</ul>` : ''}
      ${fileErrors.length ? `<div class="alert warn small" role="alert">${icon('info')}<div><p><strong>${t('rd.imp.fileErrors')}</strong></p><ul>${fileErrors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div></div>` : ''}
      ${filter !== 'all' ? `<button type="button" class="btn ghost small" data-f="all">${t('rd.imp.showAll')}</button>` : ''}
      <ol class="imp-list">${rows.map((r) => `<li class="imp-row st-${r.status}">
        <span class="rbadge st-${r.status}">${esc(t(`rd.imp.st.${r.status}`))}</span>
        <span class="imp-title"><strong>${esc(r.title || t('rd.imp.noTitle'))}</strong>
          <span class="small muted">${esc([r.lang ? t(`lang.${r.lang}`) : '?', r.cat ? rc.catName(r.cat) : '?', r.words ? t('rd.words', { n: fmtNum(r.words) }) : '', r.where].filter(Boolean).join(' · '))}</span>
          ${r.reasons.length ? `<span class="small ${r.status === 'error' ? 'err-text' : 'muted'}">${esc(r.reasons.join(' · '))}</span>` : ''}
          ${r.warnings.length ? `<span class="small warn-text">${esc(r.warnings.join(' · '))}</span>` : ''}</span></li>`).join('') || `<li class="muted small">${t('rd.imp.none')}</li>`}</ol>
      <div class="actions">
        ${result ? `<button type="button" class="btn secondary" data-a="report">${icon('download')}${t('rd.imp.report')}</button><button type="button" class="btn primary" data-a="close">${t('rd.close')}</button>`
    : `<button type="button" class="btn ghost" data-a="close">${t('rd.cancel')}</button><button type="button" class="btn primary" data-a="apply"${s.add + s.update ? '' : ' disabled'}>${esc(t('rd.imp.apply', { n: s.add + s.update }))}</button>`}
      </div></div>`;
    dlg.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = filter === b.dataset.f ? 'all' : b.dataset.f; render(); dlg.querySelector(`[data-f="${filter}"]`)?.focus(); }));
    dlg.querySelector('[data-a=close]').addEventListener('click', () => { close(); if (result) ctx.rerender(); });
    dlg.querySelector('[data-a=apply]')?.addEventListener('click', apply);
    dlg.querySelector('[data-a=report]')?.addEventListener('click', () => download(`duyum-ice-aktarma-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`, JSON.stringify({ at: new Date().toISOString(), summary: plan.summary, fileErrors, rows: plan.rows.map(({ block, ...r }) => r) }, null, 2)));
  };

  function apply() {
    const R = rc.R;
    let add = 0;
    let update = 0;
    const snapshot = JSON.stringify(R.userTexts);
    for (const r of plan.rows) {
      if (r.status !== 'add' && r.status !== 'update') continue;
      const m = r.block.meta;
      const data = { title: r.block.title.trim(), lang: r.lang, cat: r.cat, sub: m.sub, aud: ['all', 'child', 'adult'].includes(m.aud) ? m.aud : 'all', tags: (m.tags || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10), author: m.author || '', source: m.source || '', license: m.license || t('rd.importedLicense'), kind: 'user', body: r.block.body };
      if (r.status === 'update') { saveUserText(R, data, r.updateOf); update += 1; } else { const u = saveUserText(R, data); r.newId = u.id; add += 1; }
    }
    if (!ctx.store.save()) {
      // Kayıt başarısız: bellekteki değişikliği geri al (yarım içe aktarma kalmasın)
      R.userTexts.splice(0, R.userTexts.length, ...JSON.parse(snapshot));
      toast(t('rd.storageFull'));
      return;
    }
    result = { add, update };
    filter = 'all';
    render();
    dlg.querySelector('h2')?.focus?.();
  }

  render();
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  dlg.querySelector('[data-a=apply], [data-a=close]')?.focus();
  return { plan, dialog: dlg };
}

export function pasteDialog(ctx, rc) {
  const dlg = document.createElement('dialog');
  dlg.className = 'r-dlg imp-dlg';
  dlg.setAttribute('aria-labelledby', 'paste-h');
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.innerHTML = `<form class="dlg-form" method="dialog">
    <h2 class="h3" id="paste-h">${t('rd.imp.pasteTitle')}</h2>
    <p class="small muted">${t('rd.imp.pasteHint')}</p>
    <div class="field"><label for="paste-t">${t('rd.imp.pasteLabel')}</label><textarea id="paste-t" rows="12" spellcheck="false" placeholder="### | Başlık&#10;sub: home | level: 1 | tags: ev, sabah&#10;---&#10;Metin…"></textarea></div>
    <p class="field-err small" id="paste-e" hidden>${t('rd.imp.pasteEmpty')}</p>
    <div class="actions"><button type="button" class="btn ghost" data-a="close">${t('rd.cancel')}</button><button type="submit" class="btn primary">${t('rd.imp.preview')}</button></div></form>`;
  dlg.querySelector('[data-a=close]').addEventListener('click', () => dlg.close());
  dlg.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = dlg.querySelector('#paste-t').value;
    if (!v.trim()) { dlg.querySelector('#paste-e').hidden = false; dlg.querySelector('#paste-t').focus(); return; }
    dlg.close();
    openImportDialog(ctx, rc, { text: v });
  });
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  dlg.querySelector('textarea').focus();
}

