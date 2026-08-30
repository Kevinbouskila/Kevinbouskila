/* Three candidate directions for Post 01 — Manifeste.
   Common constraints: light-dominant, premium, no dark field, no AI slop. */
import { page, stage, rail, foot, canvas, mark, tile, t, g, sl, surface, pill, glow, slashlist, fr } from '../tooling/kit.mjs';

/* ============ DIRECTION A — EDITORIAL SAAS ============ */
const cssA = `
.a-slash{position:absolute;right:-70px;top:-140px;height:1660px;width:220px;border-radius:110px;
  background:var(--grad);opacity:.085;transform:skewX(var(--slash-angle));filter:blur(.4px)}
.a-slash2{position:absolute;right:238px;top:-140px;height:1660px;width:11px;border-radius:6px;
  background:var(--grad);opacity:.9;transform:skewX(var(--slash-angle))}
.a-wrap{position:relative;z-index:2}
`;
const A = [
  page({ title:'A/01', extraCss: cssA, body: stage({ bg:'bg-paper', children: `
    ${glow({ x:'86%', y:'34%', size:820, o:.75 })}
    <div class="a-slash"></div><div class="a-slash2"></div>
    ${rail('Brand', 1, 8)}
    ${canvas(`<div class="a-wrap">${t.displayXl(`L'IA<br>ne vaut rien<br>si personne<br>${g("ne l'utilise.")}`)}</div>`, 'canvas--center')}
    ${foot()}` }) }),

  page({ title:'A/05', extraCss: cssA, body: stage({ bg:'bg-paper-2', children: `
    ${rail('Brand', 5, 8)}
    ${canvas(`<div class="stack gap-40" style="margin-top:auto;margin-bottom:auto">
       ${t.micro('Le vrai travail')}
       ${slashlist(["Trouver les bons usages","Les intégrer aux métiers","Vérifier leur qualité","Former les équipes","Mesurer leur valeur"])}
     </div>`)}
    ${foot()}` }) }),

  page({ title:'A/08', extraCss: cssA, body: stage({ bg:'bg-paper', children: `
    ${glow({ x:'50%', y:'46%', size:760, o:.6 })}
    ${rail('Brand', 8, 8)}
    ${canvas(`<div class="stack gap-56" style="align-items:flex-start;position:relative;z-index:2">
       ${tile(112)}
       ${t.display(`Slash<span class="grad">Tech</span> ${sl}`)}
       <div class="stack gap-12">${t.subhead('Concevoir.')}${t.subhead('Déployer.')}${t.subhead('Faire adopter.')}</div>
     </div>`, 'canvas--center')}
    ${foot({ right:`<div class="handle">slashtech.io</div>` })}` }) }),
];

/* ============ DIRECTION B — PRODUCT-LED ============ */
const cssB = `
.b-grid{position:absolute;inset:0;background-image:
  linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
  background-size:72px 72px;opacity:.55}
.b-card{position:relative;z-index:2}
.b-tabs{display:flex;gap:10px;margin-bottom:34px}
.b-kv{display:flex;justify-content:space-between;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}
.b-kv:last-child{border-bottom:0}
.b-kv .kk{font-size:27px;font-weight:500;color:var(--ink-3);letter-spacing:-.012em}
.b-kv .vv{font-size:19px;font-weight:600;color:var(--violet);letter-spacing:.02em;text-transform:uppercase}
.b-cta{display:flex;align-items:center;justify-content:space-between;gap:20px;
  background:var(--lavender);border:1px solid #E9E3FA;border-radius:16px;padding:24px 26px}
`;
const B = [
  page({ title:'B/01', extraCss: cssB, body: stage({ bg:'bg-paper-2', children: `
    <div class="b-grid"></div>${glow({ x:'50%', y:'40%', size:900, o:.7 })}
    ${rail('Brand', 1, 8)}
    ${canvas(`<div class="b-card">${surface({ name:'manifesto.md', body:`
        <div class="b-tabs">${pill('Adoption','pill--grad')}${pill('Produit')}${pill('Usage')}</div>
        ${t.headline(`L'IA ne vaut rien<br>si personne<br>${g("ne l'utilise.")}`)}
      `, style:'margin-top:8px' })}</div>`, 'canvas--center')}
    ${foot()}` }) }),

  page({ title:'B/05', extraCss: cssB, body: stage({ bg:'bg-paper-2', children: `
    <div class="b-grid"></div>
    ${rail('Brand', 5, 8)}
    ${canvas(`<div class="b-card stack gap-32" style="margin-top:auto;margin-bottom:auto">
      ${t.title('Le vrai travail')}
      ${surface({ name:'pipeline', body:`
        <div class="b-kv"><span class="kk">Trouver les bons usages</span><span class="vv">Cadrage</span></div>
        <div class="b-kv"><span class="kk">Les intégrer aux métiers</span><span class="vv">Intégration</span></div>
        <div class="b-kv"><span class="kk">Vérifier leur qualité</span><span class="vv">Évaluation</span></div>
        <div class="b-kv"><span class="kk">Former les équipes</span><span class="vv">Adoption</span></div>
        <div class="b-kv"><span class="kk">Mesurer leur valeur</span><span class="vv">Mesure</span></div>` })}
    </div>`)}
    ${foot()}` }) }),

  page({ title:'B/08', extraCss: cssB, body: stage({ bg:'bg-paper-2', children: `
    <div class="b-grid"></div>${glow({ x:'50%', y:'44%', size:820, o:.7 })}
    ${rail('Brand', 8, 8)}
    ${canvas(`<div class="b-card">${surface({ name:null, body:`
      <div class="stack gap-40" style="padding:20px 12px 12px">
        <div class="mark" style="gap:18px">${tile(72)}<span class="wm" style="font-size:44px">Slash<em>Tech</em></span></div>
        <div class="stack gap-10">${t.title('Concevoir.')}${t.title('Déployer.')}${t.title('Faire adopter.')}</div>
        <div class="b-cta"><span class="body" style="color:var(--violet-deep)">${fr("De l'idée au produit — et à l'usage.")}</span>${pill('slashtech.io','pill--grad')}</div>
      </div>` })}</div>`, 'canvas--center')}
    ${foot()}` }) }),
];

/* ============ DIRECTION C — SWISS / TECH MINIMALISM ============ */
const cssC = `
.c-cols{position:absolute;top:0;bottom:0;left:88px;right:88px;display:flex;gap:24px}
.c-cols i{flex:1;border-left:1px solid var(--line)}
.c-cols i:last-child{border-right:1px solid var(--line)}
.c-num{position:absolute;left:88px;top:200px;font-family:'JetBrains Mono',monospace;
  font-size:17px;letter-spacing:.18em;color:var(--ink-4);writing-mode:vertical-rl;text-transform:uppercase}
.c-body{position:relative;z-index:2;margin-left:170px}
.c-hair{width:190px;height:5px;border-radius:3px;background:var(--grad)}
.c-meta{display:flex;gap:0;border-top:1px solid var(--line);margin-top:auto}
.c-meta div{flex:1;padding:22px 0 0;border-right:1px solid var(--line)}
.c-meta div:last-child{border-right:0;text-align:right}
.c-meta span{display:block;font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.14em;color:var(--ink-4);text-transform:uppercase}
`;
const C = [
  page({ title:'C/01', extraCss: cssC, body: stage({ bg:'bg-paper', children: `
    <div class="c-cols">${'<i></i>'.repeat(6)}</div>
    ${rail('Brand', 1, 8)}
    <div class="c-num">Manifeste ${'—'} 2026</div>
    ${canvas(`<div class="c-body stack gap-44">
       <div class="c-hair"></div>
       ${t.display(`L'IA ne vaut rien<br>si personne<br>${g("ne l'utilise.")}`)}
     </div>`, 'canvas--center')}
    ${foot()}` }) }),

  page({ title:'C/05', extraCss: cssC, body: stage({ bg:'bg-paper', children: `
    <div class="c-cols">${'<i></i>'.repeat(6)}</div>
    ${rail('Brand', 5, 8)}
    ${canvas(`<div class="c-body stack gap-36" style="margin-top:40px">
       ${t.micro('Le vrai travail')}
       <div class="stack gap-0">
         ${['Trouver les bons usages','Les intégrer aux métiers','Vérifier leur qualité','Former les équipes','Mesurer leur valeur']
           .map((s,i)=>`<div style="display:flex;gap:26px;align-items:baseline;padding:24px 0;border-bottom:1px solid var(--line)">
             <span class="data" style="color:var(--ink-4);flex:none;width:56px">0${i+1}</span>
             <span class="title" style="font-size:44px">${fr(s)}</span></div>`).join('')}
       </div>
     </div>`)}
    ${foot()}` }) }),

  page({ title:'C/08', extraCss: cssC, body: stage({ bg:'bg-paper', children: `
    <div class="c-cols">${'<i></i>'.repeat(6)}</div>
    ${rail('Brand', 8, 8)}
    ${canvas(`<div class="c-body stack gap-48" style="margin-top:60px">
       <div class="c-hair"></div>
       ${t.display(`Slash<span class="grad">Tech</span> ${sl}`)}
       <div class="stack gap-14">${t.subhead('Concevoir.')}${t.subhead('Déployer.')}${t.subhead('Faire adopter.')}</div>
     </div>`)}
     <div class="c-meta"><div><span>Studio</span></div><div style="padding-left:24px"><span>IA ${'&'} Produit</span></div><div><span>slashtech.io</span></div></div>
    ${foot()}` }) }),
];

export const DIRECTIONS = { A, B, C };
export const LABELS = { A:'Editorial SaaS', B:'Product-led', C:'Swiss / Tech minimalism' };
