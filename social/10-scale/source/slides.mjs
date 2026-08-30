/* POST 10 — SCALE · catégorie SCALE / · 10 slides
   Le système se construit sous les yeux : une brique s'allume à chaque question. */
import { cover, statement, free, closer } from '../../tooling/layouts.mjs';
import { t, g, fr, sl } from '../../tooling/kit.mjs';

const cat = 'Scale', n = 10;
const BRIQUES = ['Responsable', 'Qualité', 'Maintenance', 'Modèle', 'Échelle', 'Mesure'];

/* The system map: `active` bricks lit, the newest one highlighted. */
const map = (active) => `
  <div class="maprail"><div class="map">${BRIQUES.map((l, k) => `
    <div class="m ${k < active ? 'on' : ''} ${k === active - 1 ? 'now' : ''}"><b></b><span>${fr(l)}</span></div>`
  ).join('')}</div></div>`;

/* A question centred in the page, with the map pinned to the foot of the canvas. */
const q = ({ i, head, active, bg = 'bg-paper', sub = '' }) => free({ cat, i, n, bg, inner: `
  <div style="flex:1;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;align-items:center">
      <div class="stack gap-28">${t.headline(head)}${sub}</div>
    </div>
    ${map(active)}
  </div>` });

export const slides = [
  cover({ cat, n, size: 'display', dateline: 'Passage à l’échelle', endslash: false, bg: 'bg-paper-2',
    head: `Votre POC IA<br>fonctionne.`,
    below: `<div style="margin-top:30px">${t.display(`Et maintenant<span class="endslash"></span>`)}</div>` }),

  statement({ cat, i: 2, n, bg: 'bg-paper-2', size: 'display',
    head: `C'est souvent ici<br>que les problèmes<br>commencent.` }),

  q({ i: 3, active: 1, bg: 'bg-paper',    head: `Qui en est<br>responsable ?` }),
  q({ i: 4, active: 2, bg: 'bg-paper',    head: `Qui vérifie<br>sa qualité ?` }),
  q({ i: 5, active: 3, bg: 'bg-paper-2',  head: `Qui maintient :`,
      sub: `<ul class="slashlist" style="margin-top:6px">
              <li>${fr('Les prompts')} ${sl}</li><li>${fr('Les workflows')} ${sl}</li><li>${fr('Les connexions')} ${sl}</li>
            </ul>` }),
  q({ i: 6, active: 4, bg: 'bg-paper',    head: `Que se passe-t-il<br>quand le modèle<br>change ?` }),
  q({ i: 7, active: 5, bg: 'bg-paper',    head: `Qui décide<br>qu'un cas d'usage<br>mérite d'être<br>généralisé ?` }),
  q({ i: 8, active: 6, bg: 'bg-lavender', head: `Comment mesure-t-on<br>sa valeur ?` }),

  free({ cat, i: 9, n, bg: 'bg-paper', inner: `
    <div class="split">
      ${t.headline(`Passer du POC<br>à la production<br>est un problème<br>de ${g('système')}.`)}
      <hr>
      ${t.title(`Pas seulement<br>de technologie.`)}
    </div>` }),

  free({ cat, i: 10, n, bg: 'bg-paper-2', showTicks: false, inner: `
    <div class="stack gap-40">
      ${t.title('Le système')}
      <ul class="slashlist">
        <li>${fr('Gouvernance')} ${sl}</li><li>${fr('Qualité')} ${sl}</li><li>${fr('Ownership')} ${sl}</li>
        <li>${fr('Adoption')} ${sl}</li><li>${fr('Mesure')} ${sl}</li>
      </ul>
    </div>` }),
];
