// Şablon tabanlı içerikten (cümle, paragraf, senaryo) soru ve anlamlı çeldiriciler üretir.
// Her soru tek doğru cevap içerir: etiketler benzersizdir ve doğru etiket bir kez bulunur.
import { formOf, normItem, itemValue, isGenerator, perturb, render, poolFor, TemplateError } from './template.js';
import { shuffle, sample } from '../core/rng.js';

function label(text, L) {
  return L.capitalize(String(text).trim());
}

function pushUnique(list, seen, lbl) {
  const key = lbl.toLocaleLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  list.push(lbl);
  return true;
}

// Bir yuvayı soran soru için çeldiriciler: önce metinde geçen diğer değerler (anlamlı), sonra havuz.
function askOptions(q, ctx, n) {
  const { bind, slots, pools, L, rng } = ctx;
  const spec = slots[q.ask];
  const form = q.form || (q.show ? 'show' : 'v');
  const pool = poolFor(slots, q.ask, pools);
  const answer = label(formOf(bind[q.ask], form, L, pool), L);
  const labels = [];
  const seen = new Set();
  pushUnique(labels, seen, answer);
  if (isGenerator(spec)) {
    for (const alt of perturb(spec, normItem(bind[q.ask]), L, rng, n - 1, pools)) {
      pushUnique(labels, seen, label(form === 'show' ? alt.show : alt[form] ?? alt.v, L));
    }
  } else {
    const sameSlots = Object.keys(slots).filter((s) => s !== q.ask && slots[s] === spec);
    const inText = sameSlots.map((s) => bind[s]);
    const rest = shuffle(pool.items.filter((x) => !inText.some((y) => itemValue(y) === itemValue(x))), rng);
    for (const cand of [...inText, ...rest]) {
      if (labels.length >= n) break;
      try {
        pushUnique(labels, seen, label(formOf(cand, form, L, pool), L));
      } catch (err) {
        if (!(err instanceof TemplateError)) throw err;
      }
    }
  }
  return { labels: labels.slice(0, n), answer };
}

function staticOptions(q, ctx, n) {
  const rendered = q.opts.map((o) => label(render(o, ctx.bind, ctx.slots, ctx.pools, ctx.L).replace(/[.]$/, ''), ctx.L));
  const [answer, ...others] = rendered;
  return { labels: [answer, ...sample(others, Math.max(1, n - 1), ctx.rng)], answer };
}

function notSaidOptions(q, ctx, n) {
  const { bind, pools, L, rng } = ctx;
  const pool = pools[q.pool];
  const said = q.said.map((s) => label(itemValue(bind[s]), L));
  const usedValues = new Set(Object.values(bind).map((v) => itemValue(v)));
  const unused = pool.items.filter((x) => !usedValues.has(itemValue(x)));
  if (!unused.length) return null;
  const answer = label(itemValue(pick1(unused, rng)), L);
  const keep = sample(said, Math.max(1, Math.min(said.length, n - 1)), rng);
  return { labels: [answer, ...keep], answer };
}

const pick1 = (list, rng) => list[Math.floor(rng() * list.length)];

function orderOptions(q, ctx, n) {
  const events = q.events.map((e) => label(render(e, ctx.bind, ctx.slots, ctx.pools, ctx.L).replace(/[.]$/, ''), ctx.L));
  const join = (arr) => arr.join(' → ');
  const answer = join(events);
  const labels = [answer];
  const seen = new Set([answer]);
  let guard = 0;
  while (labels.length < Math.min(n, 6) && guard++ < 100) {
    const perm = join(shuffle(events, ctx.rng));
    if (!seen.has(perm)) { seen.add(perm); labels.push(perm); }
  }
  return { labels, answer };
}

function speakerOptions(q, ctx, n) {
  if (!ctx.allowSpeaker || !ctx.lines) return null;
  const line = ctx.lines.find((l) => l.tag === q.tag);
  if (!line) return null;
  const roleLabel = (sp) => label(render(ctx.roles[sp], ctx.bind, ctx.slots, ctx.pools, ctx.L), ctx.L);
  const speakers = [...new Set(ctx.lines.filter((l) => l.sp).map((l) => l.sp))];
  if (speakers.length < 2) return null;
  const answer = roleLabel(line.sp);
  const others = speakers.filter((s) => s !== line.sp).map(roleLabel);
  return { labels: [answer, ...others].slice(0, n), answer };
}

export function buildQuestion(q, ctx, nOptions) {
  const n = Math.max(2, nOptions || 4);
  let res;
  if (q.type === 'speaker') res = speakerOptions(q, ctx, n);
  else if (q.opts) res = staticOptions(q, ctx, n);
  else if (q.type === 'notsaid') res = notSaidOptions(q, ctx, n);
  else if (q.events) res = orderOptions(q, ctx, n);
  else if (q.ask) res = askOptions(q, ctx, n);
  if (!res || res.labels.length < 2) return null;
  const prompt = render(q.q, ctx.bind, ctx.slots, ctx.pools, ctx.L);
  const options = res.labels.map((lbl, i) => ({ id: `o${i}`, label: lbl }));
  const answerId = options.find((o) => o.label === res.answer).id;
  return { prompt, options, answerId, qtype: q.type };
}
