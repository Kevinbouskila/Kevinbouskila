# Reel 03 — Slash Tech

**Catégorie** SLASH TECH / · **Format** 1080 × 1920 · **Durée** 15.8 s · **30 fps** · H.264 / AAC

Call and response : « Vous avez… » en retrait (encre 3), « On… » en pleine encre. La carte de fin déroule BUILD / ADOPT / SCALE / puis le lockup.

## Timeline

| # | Temps | Fond | Texte |
|---|---|---|---|
| 01 | 0.0s → 1.8s | `#FFFFFF` | Vous avez une idée. |
| 02 | 1.8s → 3.9s | `#FFFFFF` | On la transforme en produit . |
| 03 | 3.9s → 5.7s | `#F7F8FB` | Vous avez l’IA. |
| 04 | 5.7s → 7.8s | `#F7F8FB` | On la transforme en usages . |
| 05 | 7.8s → 9.6s | `#FFFFFF` | Vous avez des usages. |
| 06 | 9.6s → 12.0s | `#FFFFFF` | On vous aide à les déployer à l’ échelle . |
| 07 | 12.0s → 15.8s | `#F5F3FF` | BUILD ADOPT SCALE Slash Tech |

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

`export/03-slash-tech.mp4` · `cover/03-slash-tech-cover-1080x1920.png` ·
`cover/03-slash-tech-cover-feed-1080x1350.png` · `assets/keyframe-*.png` ·
`audio/03-slash-tech-sound-design.wav` · `storyboard/03-slash-tech-keyframes.png`

## Régénérer

```bash
node 03-slash-tech/source/build.mjs
cd tooling && node run-reels.mjs 03-slash-tech && node sound-mux.mjs 03-slash-tech
```
