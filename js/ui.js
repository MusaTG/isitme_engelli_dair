// Küçük arayüz yardımcıları.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const PATHS = {
  home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  notes: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1z"/><path d="M9 9h6M9 13h4"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  wave: '<path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10.5v3"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.5 3.8-5 7-5s6 1.5 7 5"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  bookmark: '<path d="M7 4h10v16l-5-3.5L7 20z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
  marker: '<path d="m14 5 5 5-8 8H6v-5z"/><path d="M4 21h16"/>',
  pencil: '<path d="M15 5l4 4L9 19H5v-4z"/>',
  toc: '<path d="M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11"/>',
  font: '<path d="M4 19 9 6l5 13M5.8 14.5h6.4"/><path d="M15 19v-5.5a2.5 2.5 0 0 1 5 0V19M15 16h5"/>',
  more: '<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  archive: '<rect x="4" y="5" width="16" height="4" rx="1"/><path d="M5.5 9v10h13V9M10 13h4"/>',
  spark: '<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  focus: '<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || ''}</svg>`;
}

export function announce(message) {
  const region = document.getElementById('live');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = message; }, 40);
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

export function download(filename, text, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function selectOptions(options, selected) {
  return options.map(([value, label]) => `<option value="${esc(value)}"${String(value) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`).join('');
}

// Günlük hedef halkası (SVG). Tasarımın imza öğesi: ses dalgası halkası.
export function goalRing(done, goal, label) {
  const ratio = goal ? Math.min(1, done / goal) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return `<svg class="goal-ring" viewBox="0 0 132 132" role="img" aria-label="${esc(label)}">
    <circle cx="66" cy="66" r="62" class="ring-echo"/>
    <circle cx="66" cy="66" r="${r}" class="ring-track"/>
    <circle cx="66" cy="66" r="${r}" class="ring-fill"${ratio === 0 ? ' visibility="hidden"' : ''} stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - ratio)).toFixed(1)}" transform="rotate(-90 66 66)"/>
    <text x="66" y="64" class="ring-num">${esc(Math.floor(done))}</text>
    <text x="66" y="84" class="ring-unit">/ ${esc(goal)}</text>
  </svg>`;
}

// Geri alınabilir işlem bildirimi (ör. not silme). Süre dolunca işlem kalıcı olur.
let actionTimer;
export function toastAction(message, actionLabel, onAction, ms = 8000) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(actionTimer);
  el.innerHTML = `<span>${esc(message)}</span> <button type="button" class="btn small secondary toast-btn">${esc(actionLabel)}</button>`;
  el.hidden = false;
  const btn = el.querySelector('button');
  btn.addEventListener('click', () => { clearTimeout(actionTimer); el.hidden = true; onAction(); });
  btn.focus({ preventScroll: true });
  actionTimer = setTimeout(() => { el.hidden = true; }, ms);
}

// Bulunulan ekrana göre kılavuzdaki ilgili konuya bağlantı.
export function helpLink(topic, label) {
  return `<a class="help-link" href="#/guide/${esc(topic)}">${icon('info')}<span>${esc(label)}</span></a>`;
}
