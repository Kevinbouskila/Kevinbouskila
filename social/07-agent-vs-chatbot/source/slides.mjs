/* POST 07 — AGENT vs CHATBOT · catégorie DECRYPT / · 6 slides
   Diagrammes SaaS : filets fins, nodes clairs, aucune donnée chiffrée. */
import { cover, free, closer } from '../../tooling/layouts.mjs';
import { t, g, fr } from '../../tooling/kit.mjs';

const cat = 'Decrypt', n = 6;

const flow = (steps) => `<div class="dg fixed">${steps.map((s, k) => {
  const [label, variant = ''] = Array.isArray(s) ? s : [s, ''];
  return `${k ? '<div class="e"></div>' : ''}<div class="n ${variant}"><span class="k">${String(k + 1).padStart(2, '0')}</span>${fr(label)}</div>`;
}).join('')}</div>`;

const cmpRow = (k, a, b) => `
  <div class="c lbl">${fr(k)}</div><div class="c">${fr(a)}</div><div class="c alt">${fr(b)}</div>`;

export const slides = [
  cover({ cat, n, size: 'headline', dateline: 'Décryptage', endslash: false,
    head: `Un chatbot<br>attend votre question.`,
    below: `<div style="margin-top:38px;padding-top:38px;border-top:1px solid var(--line)">
      ${t.headline(`Un agent<br>peut avoir un objectif<span class="endslash"></span>`)}</div>` }),

  free({ cat, i: 2, n, bg: 'bg-paper', inner: `
    <div class="stack gap-40">
      ${t.title('Chatbot')}
      ${flow(['Utilisateur', 'Question', ['LLM', 'tint'], 'Réponse'])}
    </div>` }),

  free({ cat, i: 3, n, bg: 'bg-paper-2', inner: `
    <div class="stack gap-32" style="position:relative">
      ${t.title('Agent')}
      <div style="position:relative">
        ${flow([['Objectif', 'hot'], 'Comprendre', 'Choisir une action', 'Utiliser un outil',
                'Observer le résultat', ["Continuer / s'arrêter", 'tint']])}
        <svg width="150" height="318" viewBox="-2 -10 154 338" fill="none"
             style="position:absolute;left:520px;top:250px;overflow:visible">
          <path d="M0 318 H100 A26 26 0 0 0 126 292 V26 A26 26 0 0 0 100 0 H0"
                stroke="#C9BEEF" stroke-width="1.5" fill="none"/>
          <path d="M11 -7 L0 0 L11 7" stroke="#C9BEEF" stroke-width="1.5" fill="none"
                stroke-linejoin="round" stroke-linecap="round"/>
          <text x="146" y="159" fill="#8B8B9E" font-family="JetBrains Mono" font-size="14"
                letter-spacing="1.8" transform="rotate(90 146 159)" text-anchor="middle">BOUCLE</text>
        </svg>
      </div>
      ${t.cap('La boucle recommence tant que l’objectif n’est pas atteint.')}
    </div>` }),

  free({ cat, i: 4, n, bg: 'bg-paper', inner: `
    <div class="stack gap-36">
      ${t.title('Ce qui change')}
      <div class="cmp">
        <div class="h lbl"></div><div class="h">Chatbot</div><div class="h hot">Agent</div>
        ${cmpRow('Point de départ', 'Une question', 'Un objectif')}
        ${cmpRow('Décision', 'Aucune', 'À chaque étape')}
        ${cmpRow('Outils', 'Non', 'Oui')}
        ${cmpRow('Fin', 'La réponse', "Quand l'objectif est atteint")}
      </div>
    </div>` }),

  free({ cat, i: 5, n, bg: 'bg-lavender', inner: `
    <div class="stack gap-28">
      ${t.display(`Plus<br>d'autonomie`)}
      <div class="eq">=</div>
      ${t.display(`plus besoin<br>de ${g('gouvernance')}.`)}
    </div>` }),

  closer({ cat, n }),
];
