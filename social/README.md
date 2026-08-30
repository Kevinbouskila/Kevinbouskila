# Slash Tech — Instagram

Le lancement du compte **@slashtech.io** : 8 carrousels, 4 Reels, un design system,
et une chaîne de production qui permet de fabriquer les contenus suivants sans
repartir de zéro.

Tout est **programmatique**. Aucune slide n'est dessinée à la main : chaque visuel
est du HTML/CSS rendu au pixel près par Chromium. Changer une couleur dans
`design-system/system.css` met à jour les 65 slides d'un coup.

---

## 1. Ce qu'il y a dans ce dossier

```
social/
  SOCIAL-DESIGN-SYSTEM.md      la charte social (couleurs, typo, slash, motion, règles)
  README.md                    ce fichier
  design-system/
    tokens.json                les tokens, source de vérité lisible par machine
    system.css                 le système : tokens CSS, typo, composants
    reel.css                   la couche Reel (1080x1920)
    reel-engine.js             le moteur de motion — seek(t) déterministe
    fonts/                     Inter + JetBrains Mono, embarquées en base64
  directions/                  les 3 directions explorées pour le Post 01 + le comparatif
  feed-preview/                la grille de profil simulée
  tooling/                     la chaîne de production
  01-manifeste/ … 12-arpent/   un dossier par post
```

**Carrousel** : `source/` (slides.mjs + HTML générés) · `export/` (PNG publiables) · `preview/` (planche).
**Reel** : `storyboard/` · `source/` (scenes.mjs + reel.html) · `assets/` (keyframes) ·
`audio/` (WAV) · `export/` (MP4) · `cover/` (couverture 9:16 + crop feed 4:5).

---

## 2. Installation

```bash
cd social/tooling
npm install                       # playwright-core, sharp, les polices
pip3 install imageio-ffmpeg numpy # ffmpeg complet (H.264/AAC/MP4) + synthèse audio
```

Chromium est fourni par l'environnement (`/opt/pw-browsers/chromium-1194/`).
Si son chemin change, l'ajuster dans `tooling/lib.mjs → browser()`.

---

## 3. Fabriquer un carrousel

### 3.1 Créer le post

```bash
mkdir -p social/13-mon-post/{source,export,preview}
```

### 3.2 Écrire `13-mon-post/source/slides.mjs`

Un fichier, un tableau `slides`. On **compose des archétypes**, on n'écrit pas de mise en page :

```js
import { cover, statement, list, note, compare, surfaceSlide, free, closer }
  from '../../tooling/layouts.mjs';
import { t, g, fr, sl } from '../../tooling/kit.mjs';

const cat = 'Adopt', n = 5;   // la catégorie s'affiche « ADOPT / » sur chaque rail

export const slides = [
  cover({ cat, n, dateline: 'Terrain', head: `Un titre<br>qui tient<br>en trois lignes` }),
  statement({ cat, i: 2, n, bg: 'bg-paper-2', head: `Une idée par slide.` }),
  list({ cat, i: 3, n, bg: 'bg-lavender', title: 'Le vrai travail',
         items: ['Premier point', 'Deuxième point'] }),
  free({ cat, i: 4, n, inner: `<div class="split">
           ${t.headline(`Deux idées`)}<hr>${t.headline(`séparées par un filet.`)}
         </div>` }),
  closer({ cat, n }),
];
```

### 3.3 Rendre

```bash
cd social/tooling
node build.mjs 13-mon-post     # sans argument : rebuild des 8 carrousels
```

Sortie : `export/13-mon-post-01.png` … et la planche `preview/13-mon-post-carousel.png`.

### Les archétypes

| Archétype | Quand l'utiliser |
|---|---|
| `cover` | Slide 1. Grande typo, dateline, slash terminal. C'est la vignette du feed. |
| `statement` | Une affirmation. Beaucoup de blanc. Le format le plus fréquent. |
| `list` | Une liste numérotée, filets fins. Jusqu'à 6 items. |
| `note` | Une field note numérotée : `01 /` + titre + corps + pastilles. |
| `compare` | Deux profils abstraits séparés par `≠`. Aucun visage, aucune photo. |
| `surfaceSlide` | Le contenu est un produit : carte claire, barre de fenêtre. |
| `free` | Composition sur mesure. Le rail et le pied restent en place. |
| `closer` | Dernière slide. Logo + signature. |

### Règles à ne pas contourner

- **Toute copie passe par `fr()`.** Dans un `free()`, écrire `${fr('...')}` explicitement,
  sinon les apostrophes restent droites. `node tooling/qa.mjs` le détecte.
- **Le gradient : deux apparitions maximum par slide**, tuile du pied comprise.
- **Le fond reste clair.** `.bg-ink` existe mais ne doit pas entrer dans le feed
  sans une raison forte — au plus une création sur douze.
- **Si un texte ne rentre pas, on coupe le texte**, on ne crée pas une taille de police.

---

## 4. Fabriquer un Reel

### 4.1 Écrire `NN-post/source/scenes.mjs`

```js
import { reelPage } from '../../tooling/reelpage.mjs';
import { fr, g } from '../../tooling/kit.mjs';

export const config = {
  title: 'Mon reel', cat: 'Build',
  scenes: [
    { d: 2.2, bg: '#FFFFFF', html: `<h1 class="display">${fr('Première scène.')}</h1>` },
    { d: 2.6, bg: '#F7F8FB', stagger: 0.18, html: `
        <div class="headline">${fr('Ligne une')}</div>
        <div class="headline">${fr('Ligne deux')}</div>` },
  ],
};
export const html = reelPage(config);
```

`d` = durée en secondes · `bg` = fond de la scène (fondu automatique entre scènes) ·
`stagger` = les enfants directs entrent en cascade · `cls: 'top'` = la scène est calée
en haut plutôt que centrée (pour un titre + une capture).

### 4.2 Rendre

```bash
node NN-post/source/build.mjs          # scenes.mjs -> reel.html
cd social/tooling
node run-reels.mjs NN-post             # frames -> MP4 + cover + keyframes
node sound-mux.mjs NN-post             # synthèse audio + mux AAC
```

Compter ~90 s de rendu pour 15 s de vidéo.

`reel.html` s'ouvre directement dans un navigateur : le moteur joue la timeline en
boucle. C'est le moyen le plus rapide d'itérer avant de lancer un rendu.

### Le moteur

Aucune animation CSS. `window.seek(t)` calcule l'image au temps `t` — la capture
headless est donc exacte, reproductible, et un rendu interrompu peut être relancé
à l'identique. Le balayage slash se déclenche automatiquement sur chaque coupe.

---

## 5. Le feed

```bash
node tooling/feed.mjs
```

Produit `feed-preview/feed-preview.png` (grille de profil, crops 1:1) et
`feed-preview-4x5.png` (les couvertures entières).

**À vérifier avant toute publication :** les couvertures fonctionnent-elles côte à côte ?
Y a-t-il assez de respiration ? Le feed reste-t-il majoritairement clair ?
Aucune alternance mécanique clair/sombre ?

L'ordre de publication est défini dans `tooling/feed.mjs → POSTS`.

---

## 6. Contrôle qualité

```bash
node tooling/qa.mjs
```

Vérifie automatiquement, sur les fichiers réellement exportés :
dimensions exactes · espace colorimétrique · apostrophes droites · guillemets
non typographiques · budget gradient par slide · dominante claire de chaque
visuel · lisibilité du titre à 250 px · présence de tous les livrables.

Le test des 250 px est aussi produit en planche : `feed-preview/legibility-250.png`.

---

## 7. Ce qu'il faut savoir avant de publier

- **`12-arpent` utilise une interface conçue, pas des captures réelles.**
  Voir `12-arpent/MOCKUP.md`. Ces écrans doivent être remplacés par de vraies
  captures d'Arpent avant publication.
- Le site `slashtech.io` était bloqué par la politique réseau de l'environnement
  de production : l'identité vient de la charte de marque interne, pas du site.
  Vérifier que logo et couleurs correspondent bien à la version en ligne.
- **Aucun chiffre n'a été inventé.** Les seuls nombres présents viennent du script
  éditorial. Les champs de ticks et les signatures de profil sont des rythmes
  graphiques abstraits, sans échelle ni unité.
- Aucun nom de client, de collaborateur ou de programme n'apparaît nulle part.

---

## 8. Modifier le système

| Je veux… | Fichier |
|---|---|
| changer une couleur, une taille de typo, une ombre | `design-system/system.css` (section TOKENS) |
| ajouter un composant réutilisable | `design-system/system.css` + `tooling/kit.mjs` |
| ajouter un archétype de slide | `tooling/layouts.mjs` |
| changer la typographie française automatique | `tooling/kit.mjs → fr()` |
| changer le rythme d'un Reel | `design-system/reel-engine.js` |
| changer le sound design | `tooling/sound.py` |

Après toute modification du système : `node tooling/build.mjs && node tooling/feed.mjs && node tooling/qa.mjs`.
