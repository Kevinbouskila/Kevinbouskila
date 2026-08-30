/* POST 08 — QUALITY · catégorie QUALITY / · 8 slides
   L'escalade de criticité se lit par la densité et l'échelle — jamais par une alerte rouge. */
import { cover, statement, free, closer } from '../../tooling/layouts.mjs';
import { t, g, fr, sl } from '../../tooling/kit.mjs';

const cat = 'Quality', n = 8;

/* Criticality bars: 6 steps, height ramps, gradient only at the top step. */
const bars = (lvl) => `<div class="bars">${Array.from({ length: 6 }, (_, k) => {
  const h = 22 + k * 11;
  const cls = k < lvl ? (lvl === 6 && k === 5 ? 'hot' : 'on') : '';
  return `<i class="${cls}" style="height:${h}px"></i>`;
}).join('')}</div>`;

const risk = ({ i, q, verdict, lvl, bg }) => free({ cat, i, n, bg, inner: `
  <div class="stack gap-44">
    ${t.headline(q)}
    <hr style="border:0;border-top:1px solid var(--line)">
    <div class="lvl">
      <div class="stack gap-10">
        <span class="tag" style="font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4)">Criticité</span>
        ${t.title(verdict)}
      </div>
      ${bars(lvl)}
    </div>
  </div>` });

export const slides = [
  cover({ cat, n, size: 'display', dateline: 'Qualité', endslash: true,
    head: `Une IA<br>qui se trompe<br>n'a pas toujours<br>le même coût` }),

  risk({ i: 2, bg: 'bg-paper',    lvl: 1, q: `Elle invente une idée<br>pour votre brainstorming ?`, verdict: 'Faible risque.' }),
  risk({ i: 3, bg: 'bg-paper-2',  lvl: 2, q: `Elle se trompe<br>dans une synthèse interne ?`,       verdict: 'À vérifier.' }),
  risk({ i: 4, bg: 'bg-paper',    lvl: 4, q: `Elle invente<br>une référence juridique ?`,           verdict: 'Autre problème.' }),
  risk({ i: 5, bg: 'bg-lavender', lvl: 6, q: `Elle prend automatiquement<br>une décision métier ?`, verdict: 'Encore autre chose.' }),

  statement({ cat, i: 6, n, bg: 'bg-paper', size: 'headline',
    head: `On ne devrait donc pas<br>évaluer un LLM<br>uniquement sur<br>"la qualité".` }),

  free({ cat, i: 7, n, bg: 'bg-paper-2', inner: `
    <div class="stack gap-36">
      ${t.title('Il faut regarder :')}
      <ul class="slashlist">
        <li>Précision ${sl}</li><li>Latence ${sl}</li><li>Coût ${sl}</li>
        <li>Stabilité ${sl}</li><li>Contexte ${sl}</li><li>${fr("Criticité de l'usage")} ${sl}</li>
      </ul>
    </div>` }),

  free({ cat, i: 8, n, bg: 'bg-paper', showTicks: false, inner: `
    <div class="split">
      ${t.headline(`Le meilleur modèle<br>n'existe pas.`)}
      <hr>
      ${t.headline(`Le meilleur modèle<br>pour un ${g('usage')}, oui.`)}
    </div>` }),
];
