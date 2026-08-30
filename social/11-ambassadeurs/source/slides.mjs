/* POST 11 — AMBASSADEURS · catégorie ADOPT / · 10 slides
   Métaphore de diffusion : un node, puis plusieurs, puis un réseau.
   Aucun visage, aucune photo, aucun nom — l'humain est suggéré par la structure. */
import { cover, statement, free } from '../../tooling/layouts.mjs';
import { t, g, fr } from '../../tooling/kit.mjs';

const cat = 'Adopt', n = 10;

/* A fixed, hand-placed graph. Revealing the first k nodes grows the network deterministically. */
const P = [[118,222],[266,140],[262,308],[402,74],[398,224],[410,362],[542,140],[538,292],
           [662,66],[666,208],[658,354],[788,130],[792,270],[802,390]];
const E = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[4,6],[4,7],[5,7],[6,8],[6,9],[7,9],[7,10],
           [9,11],[9,12],[10,12],[10,13]];

const net = (k) => `
  <svg class="net" viewBox="0 0 900 440" fill="none" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7C3AED"/><stop offset=".52" stop-color="#A21CAF"/><stop offset="1" stop-color="#EC4899"/>
    </linearGradient></defs>
    <g opacity=".26">
      ${E.filter(([a, b]) => !(a < k && b < k)).map(([a, b]) =>
        `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="#E1DDEF" stroke-width="1.5" stroke-dasharray="3 6"/>`).join('')}
      ${P.slice(k).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#E1DDEF" stroke-width="1.5"/>`).join('')}
    </g>
    ${E.filter(([a, b]) => a < k && b < k).map(([a, b]) =>
      `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" class="on"/>`).join('')}
    ${P.slice(0, k).map(([x, y], i) => i === 0
      ? `<circle cx="${x}" cy="${y}" r="17" fill="url(#sg)"/>`
      : `<circle cx="${x}" cy="${y}" r="11" class="on"/>`).join('')}
  </svg>`;

/* Statement above, network pinned to the foot of the canvas. */
const diff = ({ i, head, k, bg = 'bg-paper', size = 'headline' }) => free({ cat, i, n, bg, inner: `
  <div style="flex:1;display:flex;flex-direction:column">
    <div style="flex:1;display:flex;align-items:center">${t[size](head)}</div>
    ${net(k)}
  </div>` });

export const slides = [
  cover({ cat, n, size: 'headline', dateline: 'Adoption', endslash: false,
    head: `Vous voulez faire adopter<br>l'IA dans une entreprise ?`,
    below: `<div style="margin-top:38px;padding-top:38px;border-top:1px solid var(--line)">
      ${t.headline(`Ne commencez pas<br>uniquement par l'outil<span class="endslash"></span>`)}</div>` }),

  diff({ i: 2, k: 1,  bg: 'bg-paper',    head: `Trouvez des personnes<br>capables de montrer<br>ce qu'il permet de faire.` }),

  statement({ cat, i: 3, n, bg: 'bg-paper-2', size: 'display',
    head: `Pas nécessairement<br>les plus techniques.` }),

  diff({ i: 4,  k: 3,  bg: 'bg-paper',    head: `Des personnes<br>qui connaissent<br>leur métier.` }),
  diff({ i: 5,  k: 5,  bg: 'bg-paper',    head: `Qui expérimentent.`, size: 'display' }),
  diff({ i: 6,  k: 8,  bg: 'bg-paper-2',  head: `Qui partagent<br>leurs cas d'usage.`, size: 'display' }),
  diff({ i: 7,  k: 11, bg: 'bg-paper',    head: `Qui répondent<br>aux questions.`, size: 'display' }),
  diff({ i: 8,  k: 14, bg: 'bg-lavender', head: `Qui font circuler<br>ce qui fonctionne.`, size: 'display' }),

  free({ cat, i: 9, n, bg: 'bg-paper', inner: `
    <div class="split">
      ${t.headline(`L'adoption se diffuse<br>mieux par les ${g('pairs')}`)}
      <hr>
      ${t.title(`que par une documentation<br>de 80 pages.`)}
    </div>` }),

  free({ cat, i: 10, n, bg: 'bg-paper', showTicks: false, inner: `
    <div style="flex:1;display:flex;flex-direction:column">
      <div style="flex:1;display:flex;align-items:center">
        ${t.headline(`Les meilleurs<br>programmes IA<br>créent aussi<br>des ${g('communautés')}.`)}
      </div>
      ${net(14)}
    </div>` }),
];
