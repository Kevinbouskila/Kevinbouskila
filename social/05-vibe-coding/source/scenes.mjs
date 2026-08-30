/* REEL 05 — VIBE CODING · catégorie BUILD /
   Il y a du code, mais l'éditeur reste en light mode : le feed ne bascule jamais dans le terminal noir. */
import { reelPage } from '../../tooling/reelpage.mjs';
import { fr, g } from '../../tooling/kit.mjs';

const L = (n, html) => `<div class="l"><span class="g">${n}</span><span>${html}</span></div>`;
const editor = `
  <div class="ed">
    <div class="bar"><span class="slash" style="--sw:9px;--sh:20px"></span><span class="d"></span><span class="d"></span><span class="f">app.tsx</span></div>
    <div class="code">
      ${L(1, '<span class="cm">// généré en quelques secondes</span>')}
      ${L(2, '<span class="k">export function</span> <span class="fn">Checkout</span>() {')}
      ${L(3, '&nbsp;&nbsp;<span class="k">return</span> &lt;<span class="fn">Form</span> action=<span class="st">"/pay"</span> /&gt;')}
      ${L(4, '}')}
    </div>
  </div>`;

const disc = (s) => `<div class="title" style="font-size:66px;font-weight:700">${fr(s)}</div>`;

export const config = {
  title: 'Vibe coding — Reel 05', cat: 'Build',
  scenes: [
    { d: 2.5, bg: '#FFFFFF', html: `<h1 class="display">${fr("Aujourd'hui,<br>presque n'importe qui<br>peut construire une app.")}</h1>` },
    { d: 1.9, bg: '#FFFFFF', html: `<h2 class="headline">${fr("Et c'est une<br>excellente nouvelle.")}</h2>` },
    { d: 2.6, bg: '#F7F8FB', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:44px">${fr('Mais générer du code')}</h2>${editor}` },
    { d: 2.3, bg: '#FFFFFF', html: `
      <div class="neq">≠</div><h1 class="display">${fr('construire<br>un produit.')}</h1>` },
    { d: 4.0, bg: '#FFFFFF', stagger: 0.17, html:
      [ 'Comprendre le problème.', 'Faire les bons arbitrages.', "Concevoir l'expérience.",
        'Tester.', 'Mesurer.', 'Distribuer.' ].map(disc).join('') },
    { d: 3.6, bg: '#F5F3FF', stagger: 0.30, html: `
      <h2 class="headline">${fr("L'IA réduit<br>le coût de construction.")}</h2>
      <h2 class="headline">${fr('Pas le coût<br>des ')}${g('mauvaises décisions')}.</h2>` },
  ],
};
export const html = reelPage(config);
