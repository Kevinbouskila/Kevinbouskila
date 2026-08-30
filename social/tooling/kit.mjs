/* ============================================================
   SLASH TECH — SOCIAL COMPONENT KIT
   Every slide in /social is composed from these functions.
   Change a component here and all 12 posts inherit the change.
   ============================================================ */

/* ---- French typography. Applied to all copy, never to markup. ---- */
const NBSP = ' ';        // espace insécable
const NNBSP = ' ';       // espace fine insécable
export function fr(s) {
  if (s == null) return '';
  // Split on HTML tags so attributes and markup are never touched.
  return String(s).split(/(<[^>]*>)/g).map((chunk, i) => {
    if (i % 2) return chunk;                       // a tag — leave alone
    return chunk
      .replace(/(\d)'/g, '$1’')
      .replace(/'/g, '’')                     // straight → typographic apostrophe
      .replace(/"([^"]*)"/g, `«${NNBSP}$1${NNBSP}»`)
      .replace(/ ([;!?»])/g, `${NNBSP}$1`)         // fine nbsp before ; ! ? »
      .replace(/ :/g, `${NBSP}:`)                  // nbsp before :
      .replace(/« /g, `«${NNBSP}`)
      .replace(/(\d) (\d{3})/g, `$1${NNBSP}$2`)    // thousands separator
      .replace(/(\d) ?(€|%|h|min)\b/g, `$1${NNBSP}$2`);
  }).join('');
}

/* ---- Page shell ---- */
export function page({ body, w = 1080, h = 1350, extraCss = '', title = 'Slash Tech' }) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="/design-system/fonts/fonts.css">
<link rel="stylesheet" href="/design-system/system.css">
${extraCss ? `<style>\n${extraCss}\n</style>` : ''}
</head><body>${body}</body></html>`;
}

/* ---- Artboard ---- */
export function stage({ bg = 'bg-paper', cls = '', reel = false, children }) {
  return `<div class="stage ${reel ? 'stage--reel' : ''} ${bg} ${cls}">${children}</div>`;
}

/* ---- Rail: eyebrow + counter, on every carousel slide ---- */
export function rail(category, i, n) {
  const counter = (i != null && n != null)
    ? `<div class="counter"><b>${String(i).padStart(2, '0')}</b> / ${String(n).padStart(2, '0')}</div>` : '';
  return `<div class="rail"><div class="eyebrow"><span class="tick"></span>${category}${NNBSP}/</div>${counter}</div>`;
}

/* ---- Footer: logo lockup + handle ---- */
export function foot({ handle = '@slashtech.io', right = null, compact = false } = {}) {
  const left = compact ? tile(34) : mark();
  return `<div class="foot">${left}${right ?? `<div class="handle">${handle}</div>`}</div>`;
}

export function mark(size = 44) {
  return `<div class="mark"><span class="tile" style="--t:${size}px"><i></i></span><span class="wm">Slash<em>Tech</em></span></div>`;
}
export function tile(size = 44) { return `<span class="tile" style="--t:${size}px"><i></i></span>`; }

/* ---- Content region ---- */
export function canvas(children, mod = '') { return `<div class="canvas ${mod}">${children}</div>`; }

/* ---- Type helpers. All copy passes through fr(). ---- */
export const t = {
  displayXl: (s, cls = '') => `<h1 class="display-xl tight ${cls}">${fr(s)}</h1>`,
  display:   (s, cls = '') => `<h1 class="display tight ${cls}">${fr(s)}</h1>`,
  headline:  (s, cls = '') => `<h2 class="headline tight ${cls}">${fr(s)}</h2>`,
  title:     (s, cls = '') => `<h3 class="title tight ${cls}">${fr(s)}</h3>`,
  subhead:   (s, cls = '') => `<p class="subhead ${cls}">${fr(s)}</p>`,
  bodyL:     (s, cls = '') => `<p class="body-l ${cls}">${fr(s)}</p>`,
  body:      (s, cls = '') => `<p class="body ${cls}">${fr(s)}</p>`,
  label:     (s, cls = '') => `<p class="label ${cls}">${fr(s)}</p>`,
  micro:     (s, cls = '') => `<p class="micro ${cls}">${fr(s)}</p>`,
  cap:       (s, cls = '') => `<p class="cap ${cls}">${fr(s)}</p>`,
};
/* A single contiguous phrase in signature gradient. Never a whole headline. */
export const g = (s) => `<span class="grad">${fr(s)}</span>`;
/* The typographic slash. */
export const sl = `<span class="sl">/</span>`;

/* ---- Components ---- */
export function step(n) { return `<div class="step"><span class="n">${n}<span>${NNBSP}/</span></span></div>`; }

export function slashlist(items, cls = '') {
  return `<ul class="slashlist ${cls}">${items.map(i => `<li>${fr(i)} ${sl}</li>`).join('')}</ul>`;
}

export function pill(label, variant = '') { return `<span class="pill ${variant}">${fr(label)}</span>`; }

export function surface({ name = '', body = '', cls = '', style = '' }) {
  const bar = name === null ? '' :
    `<div class="surface__bar"><span class="slash" style="--sw:9px;--sh:20px"></span>
     <span class="dot"></span><span class="dot"></span><span class="name">${fr(name)}</span></div>`;
  return `<div class="surface ${cls}" style="${style}">${bar}<div class="surface__body">${body}</div></div>`;
}

export function row(k, v, vcls = '') { return `<div class="row"><span class="k">${fr(k)}</span><span class="v ${vcls}">${fr(v)}</span></div>`; }

export function node(label, { idx = '', variant = '' } = {}) {
  return `<div class="node ${variant}">${idx ? `<span class="idx">${idx}</span>` : ''}${fr(label)}</div>`;
}

export function meter(on, total = 6, grad = false) {
  let s = '';
  for (let i = 0; i < total; i++) {
    const h = 12 + i * 4;
    const cls = i < on ? (grad ? 'on grad' : 'on') : '';
    s += `<i class="${cls}" style="height:${h}px"></i>`;
  }
  return `<div class="meter">${s}</div>`;
}

export function glow({ x = '60%', y = '30%', size = 620, o = 1 } = {}) {
  return `<div class="glow" style="left:${x};top:${y};width:${size}px;height:${size}px;transform:translate(-50%,-50%);opacity:${o}"></div>`;
}
