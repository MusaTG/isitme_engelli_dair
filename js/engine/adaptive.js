// Uyarlanabilir zorluk (isteğe bağlı). Tek bir yanlış cevapla sıçrama yapılmaz:
// karar en az 8 yeni cevap ve son 10 cevabın başarısı + ortalama tekrar dinleme sayısıyla verilir,
// bir oturumda en fazla bir seviye değişir. Değerlendirme (test) oturumları seviyeyi değiştirmez.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;
export const COMFORT = {
  relaxed: { up: 0.9, down: 0.6 },
  balanced: { up: 0.8, down: 0.5 },
  challenging: { up: 0.75, down: 0.45 },
};

export function updateLevel(entry = {}, results = [], comfort = 'balanced') {
  const e = { level: entry.level || 1, hist: [...(entry.hist || [])], since: entry.since || 0 };
  const answered = results.filter((r) => r && r.correct !== null && r.correct !== undefined);
  for (const r of answered) e.hist.push([r.correct ? 1 : 0, r.replays || 0]);
  e.hist = e.hist.slice(-12);
  e.since += answered.length;
  let change = 0;
  if (e.since >= 8 && e.hist.length >= 8) {
    const last = e.hist.slice(-10);
    const acc = last.reduce((a, x) => a + x[0], 0) / last.length;
    const replays = last.reduce((a, x) => a + x[1], 0) / last.length;
    const th = COMFORT[comfort] || COMFORT.balanced;
    if (acc >= th.up && replays <= 2.5 && e.level < MAX_LEVEL) change = 1;
    else if (acc < th.down && e.level > MIN_LEVEL) change = -1;
    if (change) { e.level += change; e.since = 0; e.hist = []; }
  }
  return { entry: e, change };
}
