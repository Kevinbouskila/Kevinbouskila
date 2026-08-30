/* REEL 09 — MOAT · catégorie OPINION /
   Le marché se remplit à l'écran : quelques produits, puis beaucoup, puis un seul qui est choisi. */
import { reelPage } from '../../tooling/reelpage.mjs';
import { fr, g, sl } from '../../tooling/kit.mjs';

/* An abstract field of products. `hot` marks the one that gets chosen. */
const grid = (cols, rows, size, gap, hot = -1) => `
  <div class="pgrid" style="grid-template-columns:repeat(${cols},${size}px);gap:${gap}px">
    ${Array.from({ length: cols * rows }, (_, i) =>
      `<i class="${i === hot ? 'hot' : (i % 7 === 3 ? 'mid' : '')}" style="height:${size}px"></i>`).join('')}
  </div>`;

export const config = {
  title: 'Moat — Reel 09', cat: 'Opinion',
  scenes: [
    { d: 2.1, bg: '#FFFFFF', html: `<h1 class="display">${fr('Construire un SaaS<br>coûtait cher.')}</h1>` },
    { d: 2.8, bg: '#FFFFFF', stagger: 0.16, html: `
      <div class="title" style="color:var(--ink-3);margin-bottom:12px">${fr('Il fallait :')}</div>
      <div class="headline">${fr('Des développeurs')} ${sl}</div>
      <div class="headline">${fr('Du temps')} ${sl}</div>
      <div class="headline">${fr('Du capital')} ${sl}</div>` },
    { d: 2.3, bg: '#F7F8FB', html: `<h2 class="headline">${fr("L'IA compresse<br>une partie<br>de ce coût.")}</h2>` },
    { d: 2.5, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:52px">${fr('Donc davantage de produits<br>vont être créés.')}</h2>
      ${grid(6, 3, 96, 20)}` },
    { d: 2.5, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:52px">${fr('Et quand construire<br>devient plus facile…')}</h2>
      ${grid(14, 9, 44, 12)}` },
    { d: 2.9, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:52px">${fr('être choisi<br>devient plus difficile.')}</h2>
      ${grid(14, 9, 44, 12, 59)}` },
    { d: 2.6, bg: '#F7F8FB', html: `
      <div class="title" style="color:var(--ink-3);margin-bottom:14px">${fr('Le prochain avantage compétitif<br>ne sera pas simplement :')}</div>
      <h2 class="headline">${fr('"on sait construire".')}</h2>` },
    { d: 3.4, bg: '#FFFFFF', stagger: 0.18, html: `
      <div class="title" style="color:var(--ink-3);margin-bottom:8px">${fr('Ce sera :')}</div>
      <div class="headline">${fr('On sait quoi construire,')}</div>
      <div class="headline">${fr('pour qui,')}</div>
      <div class="headline">${fr('et comment le distribuer.')}</div>` },
    { d: 3.2, bg: '#F5F3FF', html: `<h1 class="display">${fr("La barrière<br>à l'entrée<br>se ")}${g('déplace')}.</h1>` },
  ],
};
export const html = reelPage(config);
