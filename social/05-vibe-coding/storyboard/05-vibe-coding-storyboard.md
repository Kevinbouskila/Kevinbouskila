# Reel 05 — Vibe coding

**Catégorie** BUILD / · **Format** 1080 × 1920 · **Durée** 16.9 s · **30 fps** · H.264 / AAC

Il y a du code, mais l'éditeur est en light mode : le feed ne bascule jamais dans le terminal noir. Le ≠ est le pivot du film.

## Timeline

| # | Temps | Fond | Texte |
|---|---|---|---|
| 01 | 0.0s → 2.5s | `#FFFFFF` | Aujourd’hui, presque n’importe qui peut construire une app. |
| 02 | 2.5s → 4.4s | `#FFFFFF` | Et c’est une excellente nouvelle. |
| 03 | 4.4s → 7.0s | `#F7F8FB` | Mais générer du code app.tsx 1 // généré en quelques secondes 2 export function Checkout () { 3  |
| 04 | 7.0s → 9.3s | `#FFFFFF` | ≠ construire un produit. |
| 05 | 9.3s → 13.3s | `#FFFFFF` | Comprendre le problème. Faire les bons arbitrages. Concevoir l’expérience. Tester. Mesurer. Dist |
| 06 | 13.3s → 16.9s | `#F5F3FF` | L’IA réduit le coût de construction. Pas le coût des mauvaises décisions . |

## Motion

Entrée 520 ms `easeOutExpo` (montée 34 px, échelle 0.986 → 1) ·
sortie 340 ms `easeInQuad` (retrait 26 px) ·
balayage slash 620 ms `easeInOutCubic` sur chaque coupe ·
fondu de fond synchronisé sur l'entrée de scène.

## Son

Nappe harmonique basse continue · swoosh de bruit filtré 220 ms avant chaque coupe ·
clic UI sur la coupe · résolution douce à −1,05 s de la fin.
Synthétisé par `tooling/sound.py` — aucun sample.

## Livrables

`export/05-vibe-coding.mp4` · `cover/05-vibe-coding-cover-1080x1920.png` ·
`cover/05-vibe-coding-cover-feed-1080x1350.png` · `assets/keyframe-*.png` ·
`audio/05-vibe-coding-sound-design.wav` · `storyboard/05-vibe-coding-keyframes.png`

## Régénérer

```bash
node 05-vibe-coding/source/build.mjs
cd tooling && node run-reels.mjs 05-vibe-coding && node sound-mux.mjs 05-vibe-coding
```
