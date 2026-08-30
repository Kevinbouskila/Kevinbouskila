/* POST 04 — ROI · catégorie BUSINESS / · 7 slides
   Aucun chiffre inventé : les seuls nombres cités viennent du script éditorial. */
import { cover, statement, free, surfaceSlide } from '../../tooling/layouts.mjs';
import { t, g, fr } from '../../tooling/kit.mjs';

const cat = 'Business', n = 7;

/* Accumulation rows — a graphic rhythm, never a quantified claim. */
const fx = (on, hot = 0, total = 30) => Array.from({ length: total }, (_, k) =>
  `<i class="${k < hot ? 'hot' : k < on ? 'on' : ''}"></i>`).join('');

export const slides = [
  cover({ cat, n, size: 'headline', dateline: 'Priorisation', bg: 'bg-paper-2',
    head: `Le meilleur use case IA<br>n'est peut-être pas celui<br>qui vous fera gagner<br>100 heures` }),

  free({ cat, i: 2, n, bg: 'bg-paper', inner: `
    <div class="stack gap-24">
      ${t.subhead('Il peut vous faire gagner')}
      ${t.displayXl(`10 minutes<span class="endslash"></span>`)}
    </div>` }),

  statement({ cat, i: 3, n, bg: 'bg-paper-2', size: 'display',
    head: `Mais<br>10 minutes…` }),

  free({ cat, i: 4, n, bg: 'bg-paper', inner: `
    <div class="mult">
      <div class="m"><span class="op">×</span><span class="lb">${fr('plusieurs personnes')}</span><span class="fx">${fx(8)}</span></div>
      <div class="m"><span class="op">×</span><span class="lb">${fr('plusieurs fois par semaine')}</span><span class="fx">${fx(18)}</span></div>
      <div class="m"><span class="op">×</span><span class="lb">${fr("toute l'année")}</span><span class="fx">${fx(46, 0, 46)}</span></div>
    </div>` }),

  statement({ cat, i: 5, n, bg: 'bg-paper', size: 'headline',
    head: `…peuvent devenir<br>beaucoup plus intéressantes<br>qu'une démo spectaculaire<br>utilisée deux fois.` }),

  statement({ cat, i: 6, n, bg: 'bg-lavender', size: 'display', endslash: true,
    head: `Cherchez<br>la fréquence<br>avant le<br>spectaculaire` }),

  surfaceSlide({ cat, i: 7, n, bg: 'bg-paper-2', name: 'priorisation',
    lead: `Une bonne question pour prioriser un use case :`,
    inner: `<div style="padding:20px 8px 14px">
      ${t.headline(`Combien de fois<br>cette tâche est-elle<br>${g('réellement')} effectuée ?`)}
    </div>` }),
];
