# Reel 09 — Moat

**Catégorie** OPINION / · **Format** 1080 × 1920 · **Durée** 24.3 s · **30 fps** · H.264 / AAC

Le marché se remplit à l'écran : 18 produits, puis 126. À la fin, un seul passe en gradient — celui qui est choisi.

## Timeline

| # | Temps | Fond | Texte |
|---|---|---|---|
| 01 | 0.0s → 2.1s | `#FFFFFF` | Construire un SaaS coûtait cher. |
| 02 | 2.1s → 4.9s | `#FFFFFF` | Il fallait : Des développeurs / Du temps / Du capital / |
| 03 | 4.9s → 7.2s | `#F7F8FB` | L’IA compresse une partie de ce coût. |
| 04 | 7.2s → 9.7s | `#FFFFFF` | Donc davantage de produits vont être créés. |
| 05 | 9.7s → 12.2s | `#FFFFFF` | Et quand construire devient plus facile… |
| 06 | 12.2s → 15.1s | `#FFFFFF` | être choisi devient plus difficile. |
| 07 | 15.1s → 17.7s | `#F7F8FB` | Le prochain avantage compétitif ne sera pas simplement : « on sait construire ». |
| 08 | 17.7s → 21.1s | `#FFFFFF` | Ce sera : On sait quoi construire, pour qui, et comment le distribuer. |
| 09 | 21.1s → 24.3s | `#F5F3FF` | La barrière à l’entrée se déplace . |

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

`export/09-moat.mp4` · `cover/09-moat-cover-1080x1920.png` ·
`cover/09-moat-cover-feed-1080x1350.png` · `assets/keyframe-*.png` ·
`audio/09-moat-sound-design.wav` · `storyboard/09-moat-keyframes.png`

## Régénérer

```bash
node 09-moat/source/build.mjs
cd tooling && node run-reels.mjs 09-moat && node sound-mux.mjs 09-moat
```
