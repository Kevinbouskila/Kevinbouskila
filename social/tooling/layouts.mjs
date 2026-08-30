/* ============================================================
   SLASH TECH — SLIDE ARCHETYPES  ("Editorial Grid")
   Six layouts cover all 12 posts. Compose, never improvise.
   ============================================================ */
import { page, stage, rail, foot, canvas, mark, tile, t, g, sl, surface, pill, fr } from './kit.mjs';

/* Shared per-post CSS. Injected into every slide. */
export const BASE_CSS = `
/* the slash that terminates a headline, in place of a full stop */
.endslash{display:inline-block;width:.152em;height:.84em;border-radius:.076em;background:var(--grad);
  transform:skewX(var(--slash-angle));margin-left:.30em;vertical-align:-.07em}
.endslash--ink{background:var(--ink)}
/* editorial dateline above a headline */
.dateline{display:flex;align-items:center;gap:18px;color:var(--ink-4)}
.dateline .bar{width:56px;height:1px;background:var(--line-2);flex:none}
/* numbered rows */
.rows{display:flex;flex-direction:column}
.rows .r{display:flex;gap:28px;align-items:baseline;padding:26px 0;border-bottom:1px solid var(--line)}
.rows .r:first-child{border-top:1px solid var(--line)}
.rows .r .i{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:500;color:var(--ink-4);flex:none;width:44px;letter-spacing:.06em;font-variant-numeric:tabular-nums}
.rows .r .x{font-size:40px;font-weight:600;letter-spacing:-.022em;color:var(--ink);line-height:1.18}
.rows .r .x small{display:block;font-size:26px;font-weight:400;color:var(--ink-3);letter-spacing:-.008em;margin-top:8px;line-height:1.44}
/* slash progress ticks */
.ticks{display:flex;gap:7px;align-items:center}
.ticks i{width:7px;height:19px;border-radius:4px;background:var(--line-2);transform:skewX(var(--slash-angle));display:block}
.ticks i.on{background:var(--grad)}
/* two-part statement split by a hairline */
.split{display:flex;flex-direction:column;gap:38px}
.split hr{border:0;border-top:1px solid var(--line);width:100%}
/* diagram scaffolding */
.flow{display:flex;flex-direction:column;align-items:flex-start;gap:0}
.flow .edge{width:1px;height:26px;background:var(--line-2);margin-left:38px}
.flow .edge.long{height:34px}
.col2{display:grid;grid-template-columns:1fr 1fr;gap:40px}
`;

export const ticks = (i, n) => `<div class="ticks">${Array.from({length:n},(_,k)=>`<i class="${k<i?'on':''}"></i>`).join('')}</div>`;

const shell = (bg, children, extra = '') =>
  page({ extraCss: BASE_CSS + EXTRA_CSS + extra, body: stage({ bg, children }) });

/* ---- 1. COVER — the thumbnail. Must read at 250px. ---- */
export function cover({ cat, n, dateline, head, bg = 'bg-paper', size = 'displayXl', endslash = true, extra = '', below = '', above = '' }) {
  const H = t[size](head + (endslash ? `<span class="endslash"></span>` : ''));
  return shell(bg, `
    ${rail(cat, 1, n)}
    ${canvas(`<div class="stack gap-40">
      ${dateline ? `<div class="dateline"><span class="bar"></span><span class="micro" style="color:var(--ink-4)">${fr(dateline)}</span></div>` : ''}
      ${above}${H}${below}
    </div>`, 'canvas--center')}
    ${foot()}`, extra);
}

/* ---- 2. STATEMENT — one idea, lots of air. ---- */
export function statement({ cat, i, n, head, bg = 'bg-paper', size = 'display', sub = '', above = '', endslash = false, align = 'canvas--center', extra = '' }) {
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(`<div class="stack gap-32">${above}
      ${t[size](head + (endslash ? `<span class="endslash"></span>` : ''))}
      ${sub ? t.bodyL(sub) : ''}</div>`, align)}
    ${foot({ right: ticks(i, n), compact: true })}`, extra);
}

/* ---- 3. LIST — numbered rows, the densest layout. ---- */
export function list({ cat, i, n, title, items, bg = 'bg-paper', lead = '', numbered = true, extra = '' }) {
  const body = items.map((it, k) => {
    const [x, s] = Array.isArray(it) ? it : [it, null];
    return `<div class="r"><span class="i">${numbered ? String(k + 1).padStart(2, '0') : '/'}</span>
      <span class="x">${fr(x)}${s ? `<small>${fr(s)}</small>` : ''}</span></div>`;
  }).join('');
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(`<div class="stack gap-36">
      ${title ? t.title(title) : ''}${lead ? t.bodyL(lead) : ''}
      <div class="rows">${body}</div></div>`, 'canvas--center')}
    ${foot({ right: ticks(i, n), compact: true })}`, extra);
}

/* ---- 4. SURFACE — content framed as product UI. ---- */
export function surfaceSlide({ cat, i, n, title, name, inner, bg = 'bg-paper-2', lead = '', extra = '' }) {
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(`<div class="stack gap-32">
      ${title ? t.title(title) : ''}${lead ? t.bodyL(lead) : ''}
      ${surface({ name, body: inner })}</div>`, 'canvas--center')}
    ${foot({ right: ticks(i, n), compact: true })}`, extra);
}

/* ---- 5. FREE — an escape hatch for bespoke compositions. ---- */
export function free({ cat, i, n, inner, bg = 'bg-paper', extra = '', align = 'canvas--center', showTicks = true }) {
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(inner, align)}
    ${foot(showTicks ? { right: ticks(i, n), compact: true } : {})}`, extra);
}

/* ---- 6. CLOSER — the signature that ends every carousel. ---- */
export function closer({ cat, n, lines = ['Concevoir.', 'Déployer.', 'Faire adopter.'], kicker = '', bg = 'bg-paper', extra = '' }) {
  return shell(bg, `
    ${rail(cat, n, n)}
    ${canvas(`<div class="stack gap-48">
      ${kicker ? t.subhead(kicker) : ''}
      <div class="stack gap-40">
        ${tile(104)}
        ${t.display(`Slash<span class="grad">Tech</span><span class="endslash endslash--ink"></span>`)}
        <div class="stack gap-10">${lines.map(l => t.subhead(l)).join('')}</div>
      </div></div>`, 'canvas--center')}
    <div class="foot"><span></span><div class="handle">slashtech.io</div></div>`, extra);
}

/* ---- 7. NOTE — a numbered field note. ---- */
export function note({ cat, i, n, num, head, body = '', items = null, bg = 'bg-paper', size = 'headline', extra = '' }) {
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(`<div class="stack gap-40">
      <div class="notenum">${num}<span>/</span></div>
      ${t[size](head)}
      ${body ? t.bodyL(body) : ''}
      ${items ? `<ul class="notelist">${items.map(x => `<li>${fr(x)}</li>`).join('')}</ul>` : ''}
    </div>`, 'canvas--center')}
    ${foot({ right: ticks(i, n), compact: true })}`, extra);
}

/* ---- 8. COMPARE — two abstract role profiles, split by a hairline. ---- */
export function compare({ cat, i, n, head, left, right, verdict = '', bg = 'bg-paper', extra = '' }) {
  const side = (r) => `<div class="prof">
      <span class="code">${r.code}</span>
      <span class="who">${fr(r.who)}</span>
      <div class="sig">${r.sig.map(v => `<i style="width:${v}%"></i>`).join('')}</div>
      <span class="need">${fr(r.need)}</span></div>`;
  return shell(bg, `
    ${rail(cat, i, n)}
    ${canvas(`<div class="stack gap-56">
      ${t.title(head)}
      <div class="vs">${side(left)}<span class="vsline"><em>≠</em></span>${side(right)}</div>
      ${verdict ? t.bodyL(verdict) : ''}
    </div>`, 'canvas--center')}
    ${foot({ right: ticks(i, n), compact: true })}`, extra);
}

/* CSS for layouts 7–8 and the diagram primitives. Appended to BASE_CSS. */
export const EXTRA_CSS = `
.notenum{font-size:76px;font-weight:800;letter-spacing:-.04em;color:var(--ink);line-height:1}
.notenum span{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-left:.10em}
.notelist{display:flex;flex-wrap:wrap;gap:12px;list-style:none}
.notelist li{font-size:26px;font-weight:500;letter-spacing:-.01em;color:var(--ink-2);
  background:var(--paper);border:1px solid var(--line-2);border-radius:999px;padding:12px 22px}
.bg-paper .notelist li{background:var(--paper-2)}

.vs{display:grid;grid-template-columns:1fr 92px 1fr;align-items:stretch;gap:0}
.prof{display:flex;flex-direction:column;gap:20px;padding:48px 38px;min-height:430px;background:var(--paper);
  border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--sh-1)}
.prof .code{font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.16em;color:var(--ink-4);text-transform:uppercase}
.prof .who{font-size:44px;font-weight:700;letter-spacing:-.026em;color:var(--ink);line-height:1.08}
.prof .sig{display:flex;flex-direction:column;gap:8px;padding:10px 0 6px}
.prof .sig i{height:10px;border-radius:5px;background:var(--line-2);display:block}
.prof .sig i:first-child{background:var(--ink)}
.prof .need{font-size:25px;font-weight:400;color:var(--ink-3);letter-spacing:-.006em;line-height:1.44;margin-top:auto}
.vsline{display:flex;align-items:center;justify-content:center;position:relative}
.vsline::before{content:"";position:absolute;top:12px;bottom:12px;width:1px;background:var(--line-2)}
.vsline em{position:relative;font-style:normal;font-size:34px;font-weight:500;color:var(--ink-4);
  background:var(--paper);padding:10px 0;line-height:1}
.bg-paper-2 .vsline em{background:var(--paper-2)}
.bg-lavender .vsline em{background:var(--lavender)}

/* --- diagram primitives --- */
.dg{display:flex;flex-direction:column;align-items:flex-start;gap:0}
.dg .n{background:var(--paper);border:1px solid var(--line-2);border-radius:14px;padding:0 28px;align-self:flex-start;
  font-size:29px;font-weight:600;letter-spacing:-.016em;color:var(--ink);box-shadow:var(--sh-1);
  display:flex;align-items:center;gap:16px;height:78px}
/* fixed-width flow: lets a loop arrow anchor to a known x */
.dg.fixed .n{width:520px}
.dg.fixed .e{height:28px}
.dg .n .k{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:500;color:var(--ink-4);letter-spacing:.1em}
.dg .n.tint{background:var(--lavender);border-color:#E7E0FB}
.dg .n.hot{background:var(--grad);border-color:transparent;color:#fff;box-shadow:0 6px 18px rgba(124,58,237,.22)}
.dg .n.hot .k{color:rgba(255,255,255,.7)}
.dg .e{height:30px;margin-left:34px;border-left:1px solid var(--line-2);position:relative}
.dg .e::after{content:"";position:absolute;left:-4px;bottom:0;width:7px;height:7px;
  border-right:1px solid var(--line-2);border-bottom:1px solid var(--line-2);transform:rotate(45deg)}
.dg .cap{padding:8px 0 0 34px}

/* system map strip — accumulates one node per slide */
.map{display:flex;align-items:center;gap:0;flex-wrap:nowrap}
.map .m{flex:1;display:flex;flex-direction:column;align-items:center;gap:11px;opacity:.28}
.map .m.on{opacity:1}
.map .m b{width:13px;height:13px;border-radius:50%;background:var(--line-2);display:block}
.map .m.on b{background:var(--ink)}
.map .m.now b{background:var(--grad);box-shadow:0 0 0 6px rgba(124,58,237,.12)}
.map .m span{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ink-4);white-space:nowrap}
.map .m.on span{color:var(--ink-3)}
.maprail{position:relative;padding-top:8px}
.maprail::before{content:"";position:absolute;left:9%;right:9%;top:14px;height:1px;background:var(--line-2)}

/* multiplication / accumulation rows (Post 04) — abstract, never a data claim */
.mult{display:flex;flex-direction:column;gap:0}
.mult .m{display:flex;align-items:center;gap:30px;padding:46px 0;border-bottom:1px solid var(--line)}
.mult .m:first-child{border-top:1px solid var(--line)}
.mult .m .op{font-size:40px;font-weight:600;color:var(--ink-4);flex:none;width:36px;line-height:1}
.mult .m .lb{font-size:36px;font-weight:600;letter-spacing:-.02em;color:var(--ink);flex:none;width:412px;line-height:1.2}
.mult .m .fx{flex:1;display:flex;gap:6px;align-items:center;overflow:hidden;height:34px}
.mult .m .fx i{width:6px;height:26px;border-radius:3px;background:var(--line-2);
  transform:skewX(var(--slash-angle));flex:none;display:block}
.mult .m .fx i.on{background:var(--ink-2)}
.mult .m .fx i.hot{background:var(--grad)}

/* pull-quote with a gradient rule (Post 06) */
.quote{border-left:4px solid transparent;border-image:var(--grad) 1;padding-left:26px}
.quote p{font-size:44px;line-height:1.24;letter-spacing:-.022em;font-weight:600;color:var(--ink-3)}

/* arrow verdict rows (Post 06 / 08) */
.verd{display:flex;flex-direction:column;gap:0}
.verd .v{display:flex;align-items:center;gap:32px;padding:62px 0;border-bottom:1px solid var(--line)}
.verd .v:first-child{border-top:1px solid var(--line)}
.verd .v .a{font-size:60px;font-weight:700;letter-spacing:-.028em;color:var(--ink)}
.verd .v .ar{font-size:38px;color:var(--ink-5);font-weight:400}
.verd .v .b{font-size:60px;font-weight:800;letter-spacing:-.028em;color:var(--ink-4)}
.verd .v.best .b{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

/* risk / criticality escalation (Post 08) — density, never alarm colour */
.lvl{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
.lvl .bars{display:flex;gap:8px;align-items:flex-end;height:76px}
.lvl .bars i{width:26px;border-radius:5px;background:var(--line-2);display:block}
.lvl .bars i.on{background:var(--ink)}
.lvl .bars i.hot{background:var(--grad)}
.lvl .tag{font-family:'JetBrains Mono',monospace;font-size:16px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-4);padding-bottom:6px}

/* three-column comparison table (Post 07) */
.cmp{display:grid;grid-template-columns:.92fr 1fr 1.18fr;border:1px solid var(--line);
  border-radius:var(--radius-lg);overflow:hidden;background:var(--paper);box-shadow:var(--sh-2)}
.cmp .h{padding:22px 26px;font-size:26px;font-weight:700;letter-spacing:-.018em;color:var(--ink);
  background:var(--paper-2);border-bottom:1px solid var(--line)}
.cmp .h.lbl{color:var(--ink-4);font-family:'JetBrains Mono',monospace;font-size:14px;
  letter-spacing:.14em;text-transform:uppercase;font-weight:500}
.cmp .h.hot{background:var(--lavender);color:var(--violet-deep)}
.cmp .c{padding:24px 26px;border-bottom:1px solid var(--line);font-size:26px;font-weight:600;
  letter-spacing:-.016em;color:var(--ink);line-height:1.24}
.cmp .c.lbl{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.14em;
  text-transform:uppercase;font-weight:500;color:var(--ink-4);background:var(--paper-2);display:flex;align-items:center}
.cmp .c.alt{background:#FBFAFF}
.cmp > *:nth-child(3n+1),.cmp > *:nth-child(3n+2){border-right:1px solid var(--line)}
.cmp > *:nth-last-child(-n+3){border-bottom:0}

/* the equals sign as a graphic pivot (Post 07) */
.eq{font-size:132px;font-weight:800;line-height:.8;color:var(--ink-5);letter-spacing:-.04em;padding:6px 0}

/* growing peer network (Post 11) */
.net{width:100%;height:520px;display:block}
.net circle.dim{fill:#fff;stroke:var(--line-2);stroke-width:1.5}
.net circle.on{fill:var(--ink);stroke:none}
.net line{stroke:var(--line-2);stroke-width:1.5}
.net line.on{stroke:#C9BEEF}
`;
