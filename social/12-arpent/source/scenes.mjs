/* REEL 12 — ARPENT · catégorie BUILD /
   ⚠ Le projet Arpent n'est pas présent dans ce repository (il ne contient qu'un README de profil).
   Les écrans ci-dessous sont donc une CONCEPTION D'INTERFACE, pas des captures du produit réel.
   Voir 12-arpent/MOCKUP.md : remplacer par de vraies captures avant publication. */
import { reelPage } from '../../tooling/reelpage.mjs';
import { fr, g, tile } from '../../tooling/kit.mjs';

const row = (k, v, cls = '') => `<div class="fr"><span class="fk">${fr(k)}</span><span class="fv ${cls}">${fr(v)}</span></div>`;
const app = (name, status, inner) => `
  <div class="app"><div class="top"><span class="slash" style="--sw:10px;--sh:22px"></span>
    <span class="nm">Arpent</span><span class="st">${fr(status)}</span></div>
    <div class="in">${inner}</div></div>`;

export const config = {
  title: 'Arpent — Reel 12', cat: 'Build',
  scenes: [
    { d: 2.5, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:44px">${fr('Une annonce immobilière.')}</h2>
      ${app('Annonce', 'source', `
        <div class="plan"><i class="a"></i><i class="a"></i><i></i><i class="a"></i><i></i><i></i></div>
        ${row('Bien', 'T3 — 68 m²')}${row('Ville', 'Lyon 7ᵉ')}`)}` },

    { d: 2.6, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:44px">${fr("Des dizaines<br>d'informations.")}</h2>
      <div class="pillrow"><span>Prix</span><span>Surface</span><span>Charges</span>
        <span>DPE</span><span>Financement</span><span>Loyer</span></div>` },

    { d: 2.2, bg: '#F7F8FB', html: `
      <h1 class="display">${fr('Analyser avec ')}${g('Arpent')}</h1>` },

    { d: 2.6, bg: '#F7F8FB', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:40px">${fr('Extraction.')}</h2>
      ${app('Extraction', 'étape 1 / 3', `
        ${row('Prix', '420 000 €')}${row('Surface', '68 m²')}${row('Charges', '182 €/mois')}
        ${row('DPE', 'D')}${row('Loyer estimé', '1 150 €/mois')}`)}` },

    { d: 2.6, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:40px">${fr('Calcul.')}</h2>
      ${app('Calcul', 'étape 2 / 3', `
        ${row('Prix au m²', '6 176 €')}${row('Rendement brut', '3,29 %')}
        ${row('Mensualité estimée', '1 780 €')}${row('Effort mensuel', '812 €')}`)}` },

    { d: 2.6, bg: '#FFFFFF', cls: 'top', html: `
      <h2 class="headline" style="margin-bottom:40px">${fr('Analyse.')}</h2>
      ${app('Analyse', 'étape 3 / 3', `
        ${row('Rendement vs marché local', 'inférieur')}
        ${row('Travaux à prévoir', 'DPE D')}
        ${row('Négociation possible', 'oui', 'ok')}
        <div class="verdict" style="margin-top:22px"><span class="vt">${fr('Cash-flow négatif au prix affiché')}</span></div>`)}` },

    { d: 2.2, bg: '#F5F3FF', html: `<h1 class="display">${fr('Décision.')}</h1>` },

    { d: 3.0, bg: '#FFFFFF', html: `
      <h2 class="headline">${fr('Une information dispersée<br>devient une ')}${g('décision lisible')}.</h2>` },

    { d: 3.8, bg: '#FFFFFF', stagger: 0.24, html: `
      <div class="rword" style="font-size:88px">FROM IDEA<em></em></div>
      <div class="rword" style="font-size:88px">TO PRODUCT<em></em></div>
      <div class="mark" style="gap:18px;margin-top:30px">${tile(72)}<span class="wm" style="font-size:44px">Built by Slash<em style="font-style:normal">Tech</em></span></div>` },
  ],
};
export const html = reelPage(config);
