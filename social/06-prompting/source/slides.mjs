/* POST 06 — PROMPTING · catégorie ADOPT / · 8 slides
   Profils de métiers abstraits : aucune personne, aucun client, aucune photo. */
import { cover, statement, compare, free } from '../../tooling/layouts.mjs';
import { t, g, fr, sl } from '../../tooling/kit.mjs';

const cat = 'Adopt', n = 8;

export const slides = [
  cover({ cat, n, size: 'display', dateline: 'Formation',
    above: `<div class="quote"><p>${fr('"Il faut former tout le monde au prompting."')}</p></div>`,
    head: `Oui.<br>Mais pas de la<br>même manière` }),

  compare({ cat, i: 2, n, bg: 'bg-paper',
    head: `Un commercial n'a pas<br>les mêmes besoins<br>qu'un développeur.`,
    left:  { code: 'Rôle / 01', who: 'Commercial',   sig: [72, 40, 26], need: 'Personnalisation, volume, rapidité.' },
    right: { code: 'Rôle / 02', who: 'Développeur',  sig: [34, 84, 58], need: 'Précision, contexte technique, itération.' } }),

  compare({ cat, i: 3, n, bg: 'bg-paper-2',
    head: `Un juriste n'a pas<br>les mêmes risques<br>qu'un marketeur.`,
    left:  { code: 'Rôle / 03', who: 'Juriste',   sig: [88, 30, 62], need: 'Vérifiabilité, sources, zéro invention.' },
    right: { code: 'Rôle / 04', who: 'Marketeur', sig: [40, 76, 34], need: 'Volume créatif, ton, déclinaison.' } }),

  compare({ cat, i: 4, n, bg: 'bg-paper',
    head: `Un manager n'a pas<br>les mêmes usages<br>qu'un analyste.`,
    left:  { code: 'Rôle / 05', who: 'Manager',  sig: [64, 34, 78], need: 'Synthèse, décision, restitution.' },
    right: { code: 'Rôle / 06', who: 'Analyste', sig: [30, 88, 52], need: 'Données, méthode, reproductibilité.' } }),

  statement({ cat, i: 5, n, bg: 'bg-paper-2', size: 'display',
    head: `Une formation<br>générique permet<br>de démarrer.` }),

  free({ cat, i: 6, n, bg: 'bg-lavender', inner: `
    <div class="stack gap-40">
      ${t.title('Mais la progression<br>vient ensuite des :')}
      <ul class="slashlist">
        <li>Cas réels ${sl}</li><li>Données réelles ${sl}</li><li>Contraintes métier ${sl}</li>
      </ul>
    </div>` }),

  statement({ cat, i: 7, n, bg: 'bg-paper', size: 'display', endslash: true,
    head: `Le bon niveau<br>de formation IA<br>est métier-<br>dépendant` }),

  free({ cat, i: 8, n, bg: 'bg-paper-2', inner: `
    <div class="verd">
      <div class="v"><span class="a">${fr("Former à l'outil")}</span><span class="ar">→</span><span class="b">bien</span></div>
      <div class="v best"><span class="a">${fr("Former à l'usage")}</span><span class="ar">→</span><span class="b">mieux</span></div>
    </div>` }),
];
