# Slash Tech — Social Design System

Le système visuel du compte Instagram **@slashtech.io**.
Il dérive de la charte de marque Slash Tech (violet → magenta, Inter, le slash),
et l'adapte à une contrainte propre au réseau social : **le feed doit rester lumineux.**

> **Dark backgrounds should remain exceptional and never dominate the feed.**
> La charte de marque autorise un registre sombre premium pour les couvertures et
> les visuels réseaux. Sur ce compte, cette règle est explicitement inversée :
> le fond sombre est réservé à un usage exceptionnel (au plus **une** création
> sur douze), et n'est jamais un gimmick d'alternance clair/sombre.

Direction retenue : **Editorial Grid** — rigueur suisse dans la structure,
échelle typographique éditoriale, surfaces produit là où le contenu est un produit.

---

## 1. Couleurs

### Surfaces (70–85 % du feed)

| Rôle | Token | HEX | Usage |
|---|---|---|---|
| Papier | `--paper` | `#FFFFFF` | Fond par défaut. La majorité des slides. |
| Papier froid | `--paper-2` | `#F7F8FB` | Marque une respiration, un changement de temps. |
| Papier froid 2 | `--paper-3` | `#F1F2F8` | Aplats internes, plans, remplissages neutres. |
| Lavande | `--lavender` | `#F5F3FF` | Slide d'accent — la plus « teintée » du système. |
| Rose poudré | `--rose` | `#FDF2F9` | Rare. Alterne avec la lavande si besoin de variété. |

### Encre

| Rôle | Token | HEX | Usage |
|---|---|---|---|
| Encre | `--ink` | `#0A0A17` | Tous les titres. Le noir est une couleur de **texte**. |
| Encre 2 | `--ink-2` | `#3F3F52` | Corps de texte. |
| Encre 3 | `--ink-3` | `#5B5B6E` | Texte secondaire, réponses en retrait. |
| Encre 4 | `--ink-4` | `#8B8B9E` | Micro-labels, compteurs, légendes. |
| Encre 5 | `--ink-5` | `#B7B7C6` | Symboles inertes (`=`, `≠`, `→`). |

### Filets

| Token | HEX | Usage |
|---|---|---|
| `--line` | `#ECE9F5` | Filet standard : rails, séparateurs de listes. |
| `--line-2` | `#E1DDEF` | Filet appuyé : bordures de cartes, nodes, arêtes. |

### Accents de marque

| Token | HEX |
|---|---|
| `--violet` | `#7C3AED` |
| `--fuchsia` | `#A21CAF` |
| `--magenta` | `#EC4899` |
| `--violet-deep` | `#5B21B6` |

**Gradient signature** — `linear-gradient(135deg, #7C3AED 0%, #A21CAF 52%, #EC4899 100%)`

### Registre sombre (exceptionnel)

`--ink-deep #0A0A17` · `--ink-deep-2 #101026`. Disponible via `.bg-ink`.
**Non utilisé dans les 12 premiers posts.** À réserver à un moment qui le mérite
vraiment (annonce, prise de parole forte), jamais plus d'une création sur douze.

### Couleurs de données

`#2563EB` bleu · `#16A34A` vert · `#F97316` orange · `#EF4444` rouge.
Uniquement pour la donnée, la syntaxe de code et les statuts.
**Elles ne portent jamais l'identité** et ne remplacent jamais le violet.
Le violet de marque n'est jamais une couleur de série dans un graphique.

---

## 2. Typographie

**Inter**, une seule famille pour toute l'identité.
**JetBrains Mono** est une exception strictement fonctionnelle : compteurs,
labels de diagramme, code, valeurs numériques alignées. Jamais un titre, jamais
une phrase, jamais un élément d'identité.

| Style | Taille | Interligne | Interlettrage | Graisse | Usage |
|---|---|---|---|---|---|
| `display-xl` | 116 px | 0.94 | −0.038 em | 800 | Couverture. Le mot d'ouverture. |
| `display` | 92 px | 0.98 | −0.034 em | 800 | Affirmation forte. |
| `headline` | 70 px | 1.05 | −0.028 em | 800 | Le format le plus courant. |
| `title` | 54 px | 1.12 | −0.024 em | 700 | Titres de bloc, questions. |
| `subhead` | 40 px | 1.22 | −0.018 em | 600 | Sous-titres, signature. |
| `body-l` | 34 px | 1.42 | −0.012 em | 400 | Corps principal. |
| `body` | 30 px | 1.48 | −0.008 em | 400 | Corps secondaire. |
| `label` | 22 px | 1.30 | 0 | 600 | Étiquettes. |
| `micro` | 18 px | 1.30 | +0.14 em | 700 | MAJUSCULES. Eyebrow, dateline. |
| `data` | 22 px | 1.40 | +0.01 em | 500 | Mono. Compteurs, index. |

En Reel, l'échelle monte : `display` 106 px, `headline` 82 px, `title` 60 px.
Un Reel se lit une fois, à bout de bras.

### Règles typographiques

- Les grands titres sont **calés optiquement** sur la marge (`margin-left: −0.055em`).
- Jamais de paragraphe long en petit corps. Une idée par slide.
- Peu de tailles, beaucoup de cohérence : si un texte ne rentre pas, **on coupe le texte**,
  on n'invente pas une taille intermédiaire.
- `font-variant-numeric: tabular-nums` est **réservé** aux composants numériques.
  Appliqué globalement, il élargit le trait d'union d'Inter et casse « peut-être ».

### Typographie française

Toute copie passe par `fr()` (`tooling/kit.mjs`), qui applique automatiquement :
apostrophe typographique `’`, guillemets `«  »`, espace fine insécable avant
`; ! ? »`, espace insécable avant `:`, séparateur de milliers.
**Tout texte écrit en HTML brut doit être passé explicitement dans `fr()`.**

---

## 3. Mise en page

- Format carrousel : **1080 × 1350** (4:5). Reel : **1080 × 1920**.
- Marge : **88 px** sur les quatre côtés. Reel : 88 px latéral, 120 px vertical.
- Grille : 12 colonnes, gouttière 24 px.
- Rayon : 16 px (standard), 24 px (grande carte).
- Structure d'une slide : `rail` (haut) → `canvas` (contenu) → `foot` (bas).

### Zones de sécurité

| Contexte | Contrainte |
|---|---|
| Grille de profil | La couverture est recadrée en **1080 × 1080 centré**. Le titre doit tenir dans cette bande. |
| Feed | Tout le 4:5 est visible. |
| Reel plein écran | Contenu entre **y = 300** et **y = 1640**. L'UI Instagram couvre le haut et le bas. |
| Cover de Reel en feed | Recadrée en **1080 × 1350 centré** — vérifiée à l'export. |

### Test des 250 px

Réduire chaque couverture à ~250 px de large. Le titre principal doit rester
compréhensible. C'est le seul test qui décide de la taille d'un titre.

---

## 4. Composants

### Le slash — le langage graphique

Le slash n'est jamais décoratif. Il a cinq emplois, et cinq seulement :

1. **Suffixe de catégorie** — `BRAND /`, `FIELD NOTES /`, `SCALE /`. Sur chaque rail.
2. **Ponctuation terminale** (`.endslash`) — remplace le point final d'un titre de
   couverture. C'est la seule marque en gradient de la slide. Largeur `0.152em`,
   hauteur `0.84em`, `margin-left: 0.30em`, `skewX(−18°)`.
3. **Numérotation** — `01 /`, `02 /` dans les field notes.
4. **Puce de liste** (`.slashlist`) — chaque item se termine par ` /`.
5. **Transition** (Reels) — la bande qui traverse le cadre à chaque coupe.

**Angle du slash : −18°.** Toute diagonale du système utilise cet angle. Aucune autre.

### Rail
Eyebrow (catégorie + tick gradient) à gauche, compteur `01 / 08` en mono à droite,
filet `--line` dessous.

### Pied
Couverture et slide finale : lockup complet + `@slashtech.io`.
Slides intermédiaires : **symbole seul** + ticks de progression en slash.
Répéter le wordmark huit fois affaiblit la marque.

### Logo
Tuile gradient, rayon `0.28 × taille`, slash blanc `0.115 × taille` de large,
`0.52 × taille` de haut, incliné à −18°.
Wordmark : « Slash » suit le fond, « **Tech** » toujours en gradient.
Zone de protection : la hauteur de la tuile, sur les quatre côtés.

### Surfaces produit
`.surface` — fond blanc, bordure `--line`, rayon 24 px, ombre douce teintée violet.
Barre de fenêtre avec un slash et deux points. À utiliser **uniquement** quand le
contenu est réellement de l'ordre du produit (diagramme, écran, priorisation).

### Diagrammes
Nodes dimensionnés au contenu (`.dg`) ou à largeur fixe (`.dg.fixed`, 520 px) quand
une flèche de boucle doit s'ancrer. Arêtes : filet 1,5 px `#E1DDEF`. Flèches : chevron
ouvert, jamais un triangle plein. Un seul node en gradient par diagramme — le point d'entrée.

### Niveaux et échelles
`.lvl` / `.meter` — la criticité se lit par la **densité et la hauteur**, jamais par
une couleur d'alerte. Pas de rouge, pas de triangle de danger, pas d'esthétique
cybersécurité. Le dernier barreau peut passer en gradient : c'est le maximum.

### Ombres
```
--sh-1  0 1px 2px rgba(16,10,40,.04), 0 2px 8px  rgba(16,10,40,.03)
--sh-2  0 2px 4px rgba(16,10,40,.04), 0 14px 34px rgba(90,40,160,.07)
--sh-3  0 4px 10px rgba(16,10,40,.05), 0 28px 72px rgba(90,40,160,.10)
```
Toujours teintées violet, jamais noires, jamais dures.

---

## 5. Le gradient — règles d'emploi

Le gradient est **précieux**. Sa force vient de sa rareté.

### Où il est autorisé
- Le tick de l'eyebrow (1 par slide, minuscule).
- La tuile du logo.
- Le slash terminal d'une couverture.
- **Un** groupe de mots par carrousel, exceptionnellement deux s'ils se répondent
  (ex. « produit » / « usage »).
- Un état actif : node d'entrée d'un diagramme, dernier barreau d'une échelle,
  la tuile choisie dans un champ.
- Les ticks de progression déjà parcourus.

### Où il est interdit
- En fond d'une zone de texte.
- Sur un titre entier — jamais. Un mot clé, le reste en encre.
- Sur plusieurs composants sans lien dans une même slide.
- En glow diffus derrière la typographie (« blob » IA).
- Comme couleur de série dans un graphique.

### Budget par slide
Chaque slide porte une **base de deux marques** — le tick de l'eyebrow et la tuile
du pied. Le contenu peut en ajouter **deux au maximum** : soit quatre marques en tout.
Au-delà, retirer. `tooling/qa.mjs` vérifie ce budget sur chaque slide exportée.

La slide de clôture ne répète pas le lockup : le grand logo occupe le corps, le
pied ne porte que l'adresse. Un logo par slide suffit toujours.

---

## 6. Densité et blanc

- Une idée forte par slide. Si deux idées, un filet les sépare (`.split`).
- Le vide est un composant. Une slide à 70 % vide est une slide réussie.
- Une liste ne dépasse pas 6 items. Au-delà, elle se scinde.
- Pas plus d'un niveau de hiérarchie sous le titre.

---

## 7. Rythme du feed

- Fonds : majorité `--paper`, ponctué de `--paper-2` et d'un `--lavender` par carrousel.
- **Jamais** clair / sombre / clair / sombre. L'alternance est une variation d'intensité
  lumineuse, pas un contraste noir-blanc.
- Alterner les registres : texte pur → produit → diagramme → data → texte pur.
- Les couvertures doivent tenir **côte à côte** dans la grille de profil :
  vérifier avec `feed-preview/feed-preview.png` avant toute publication.

---

## 8. Motion (Reels)

### Durées
| Rôle | ms |
|---|---|
| Micro (état, hover) | 180 |
| Base (apparition d'un élément) | 320 |
| Entrée de scène | 520 |
| Sortie de scène | 340 |
| Balayage slash | 620 |
| Scène complète | 1800 – 4000 |

### Courbes
```
entrée   easeOutExpo        1 − 2^(−10x)
sortie   easeInQuad         x²
balayage easeInOutCubic
```

### Vocabulaire autorisé
fondu · translation verticale (≤ 34 px) · échelle très courte (0.986 → 1) ·
masque · balayage slash · déplacement de curseur · scroll.

### Interdits
transitions CapCut · zoom agressif · shake · glitch · lens flare ·
aberration chromatique · rotation 3D · rebond.

### Principe
Le rendu est **déterministe** : `window.seek(t)` calcule l'image au temps `t`.
Aucune animation CSS. La capture headless est donc exacte et reproductible.

---

## 9. Son

Registre : **démo produit premium**. Pas de musique au sens propre.
- Clics UI courts et filtrés sur chaque coupe.
- Swoosh de bruit filtré, monté puis redescendu, sur le balayage slash.
- Nappe harmonique très basse (−31 dB environ), présente mais jamais au premier plan.
- Résolution douce sur la carte de fin.

Interdits : EDM, trap, corporate uplifting, « musique futuriste IA ».
Le son est synthétisé par `tooling/sound.py` — aucun sample, aucun droit à gérer.

---

## 10. Anti AI-slop — liste d'exclusion

Ne jamais produire : robot humanoïde · cerveau lumineux · main robotique ·
puce à néons · circuit imprimé · hologramme · espace, galaxie, planète ·
cube 3D gratuit · globe lumineux · personne souriante devant un écran ·
photo stock corporate · dégradé arc-en-ciel · blob abstrait · glassmorphism ·
dizaines de cartes flottantes · glow violet massif · esthétique crypto, gaming,
cyberpunk, « futur de l'IA ».

Test : **si un élément graphique ne sert ni la compréhension, ni le rythme, ni la
hiérarchie, ni la marque — il sort.**

---

## 11. Confidentialité éditoriale

Ne jamais publier : nom de client · nom de collaborateur · marque cliente ·
donnée interne · volume interne · capture interne · résultat client identifiable ·
chiffre issu d'un projet confidentiel · nom du programme ambassadeurs ·
détail technique interne · information propriétaire.

Les enseignements de terrain sont **reformulés de façon générique**.
**Aucun chiffre n'est inventé pour rendre un post plus impressionnant.**
Les seuls nombres présents dans ces 12 posts proviennent du script éditorial
lui-même (« 100 heures », « 10 minutes », « 80 pages ») et sont utilisés comme
figures de raisonnement, jamais comme mesures.

Les champs de ticks (Post 04) et les signatures de profil (Post 06) sont des
**rythmes graphiques abstraits**, sans axe, sans échelle, sans unité : ils
n'énoncent aucune quantité.
