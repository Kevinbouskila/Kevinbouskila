/* POST 02 — FIELD NOTES · catégorie FIELD NOTES / · 7 slides
   Enseignements reformulés de façon générique : aucun client, chiffre ou donnée interne. */
import { cover, note, free } from '../../tooling/layouts.mjs';
import { t, g } from '../../tooling/kit.mjs';

const cat = 'Field notes', n = 7;

export const slides = [
  cover({ cat, n, size: 'display', dateline: 'Terrain', endslash: false,
    head: `Déployer l'IA<br>en entreprise :`,
    below: `<div style="margin-top:14px">${t.title(`5 choses qu'on apprend<br>sur le terrain`)}</div>` }),

  note({ cat, i: 2, n, num: '01', bg: 'bg-paper', size: 'headline',
    head: `Les meilleurs cas d'usage<br>sont rarement<br>les plus sexy.`,
    items: ['Reporting', 'Synthèse', 'Analyse de données', "Recherche d'information", 'Production de contenus'] }),

  note({ cat, i: 3, n, num: '02', bg: 'bg-paper-2', size: 'headline',
    head: `Former<br>ne suffit pas.`,
    body: `Une formation montre ce qui est possible.<br>L'accompagnement aide à en faire quelque chose.` }),

  note({ cat, i: 4, n, num: '03', bg: 'bg-paper', size: 'headline',
    head: `Un bon cas d'usage<br>en appelle<br>souvent un autre.`,
    body: `Une automatisation fonctionne ?<br>La vraie question devient : où peut-on la répliquer ?` }),

  note({ cat, i: 5, n, num: '04', bg: 'bg-lavender', size: 'headline',
    head: `La fiabilité devient<br>plus importante<br>à mesure que l'usage<br>devient critique.`,
    body: `Le "ça marche la plupart du temps" ne suffit plus.` }),

  note({ cat, i: 6, n, num: '05', bg: 'bg-paper', size: 'headline',
    head: `Le plafond arrive vite<br>quand l'IA<br>reste isolée.`,
    body: `Sans connexion aux outils métier,<br>beaucoup d'usages restent semi-manuels.` }),

  free({ cat, i: 7, n, bg: 'bg-paper-2', inner: `
    <div class="split">
      ${t.headline(`Tester l'IA<br>est devenu ${g('simple')}.`)}
      <hr>
      ${t.headline(`L'industrialiser<br>ne l'est pas.`)}
    </div>` }),
];
