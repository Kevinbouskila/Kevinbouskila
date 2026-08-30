/* POST 01 — MANIFESTE · catégorie BRAND / · 8 slides */
import { cover, statement, list, closer, free } from '../../tooling/layouts.mjs';
import { t, g, fr } from '../../tooling/kit.mjs';

const cat = 'Brand', n = 8;

export const slides = [
  cover({ cat, n, dateline: 'Manifeste', head: `L'IA<br>ne vaut rien<br>si personne<br>ne l'utilise` }),

  statement({ cat, i: 2, n, bg: 'bg-paper',
    head: `Acheter des licences<br>est facile.` }),

  statement({ cat, i: 3, n, bg: 'bg-paper-2',
    head: `Faire une démo<br>impressionnante<br>aussi.` }),

  statement({ cat, i: 4, n, bg: 'bg-paper', size: 'displayXl', endslash: true,
    head: `Le vrai sujet<br>commence<br>après` }),

  list({ cat, i: 5, n, bg: 'bg-lavender', title: 'Le vrai travail',
    items: ['Trouver les bons usages', 'Les intégrer aux métiers', 'Vérifier leur qualité',
            'Former les équipes', 'Mesurer leur valeur'] }),

  statement({ cat, i: 6, n, bg: 'bg-paper', size: 'headline',
    head: `Et transformer<br>une expérimentation<br>en quelque chose<br>qu'on utilise vraiment.` }),

  free({ cat, i: 7, n, bg: 'bg-paper-2', inner: `
    <div class="split">
      ${t.headline(`C'est là que l'IA<br>devient un ${g('produit')}.`)}
      <hr>
      ${t.headline(`Et qu'un produit<br>devient un ${g('usage')}.`)}
    </div>` }),

  closer({ cat, n }),
];
