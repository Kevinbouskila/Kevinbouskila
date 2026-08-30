/* REEL 03 — SLASH TECH · catégorie SLASH TECH /
   Call and response : « Vous avez … » en retrait, « On … » en pleine encre. */
import { reelPage } from '../../tooling/reelpage.mjs';
import { fr, tile, g } from '../../tooling/kit.mjs';

const you = (s) => `<h2 class="title" style="color:var(--ink-3);font-size:68px">${fr(s)}</h2>`;
const us  = (s) => `<h1 class="display">${fr(s)}</h1>`;

export const config = {
  title: 'Slash Tech — Reel 03', cat: 'Slash Tech',
  scenes: [
    { d: 1.8, bg: '#FFFFFF', html: you('Vous avez une idée.') },
    { d: 2.1, bg: '#FFFFFF', html: us(`On la transforme<br>en ${g('produit')}.`) },
    { d: 1.8, bg: '#F7F8FB', html: you("Vous avez l'IA.") },
    { d: 2.1, bg: '#F7F8FB', html: us(`On la transforme<br>en ${g('usages')}.`) },
    { d: 1.8, bg: '#FFFFFF', html: you('Vous avez des usages.') },
    { d: 2.4, bg: '#FFFFFF', html: us(`On vous aide<br>à les déployer<br>à l'${g('échelle')}.`) },
    { d: 3.8, bg: '#F5F3FF', stagger: 0.22, cls: '', html:
      `<div class="rword">BUILD<em></em></div>
       <div class="rword">ADOPT<em></em></div>
       <div class="rword">SCALE<em></em></div>
       <div class="mark" style="gap:20px;margin-top:34px">${tile(84)}<span class="wm" style="font-size:54px">Slash<em style="font-style:normal">Tech</em></span></div>` },
  ],
};
export const html = reelPage(config);
