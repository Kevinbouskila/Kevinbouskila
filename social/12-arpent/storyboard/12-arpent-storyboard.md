# Reel 12 — Arpent

**Catégorie** BUILD / · **Format** 1080 × 1920 · **Durée** 24.1 s · **30 fps** · H.264 / AAC

⚠ Écrans conçus, pas captés — voir MOCKUP.md. Extraction → Calcul → Analyse → Décision, chaque étape dans la même surface produit.

## Timeline

| # | Temps | Fond | Texte |
|---|---|---|---|
| 01 | 0.0s → 2.5s | `#FFFFFF` | Une annonce immobilière. Arpent source Bien T3 — 68 m² Ville Lyon 7ᵉ |
| 02 | 2.5s → 5.1s | `#FFFFFF` | Des dizaines d’informations. Prix Surface Charges DPE Financement Loyer |
| 03 | 5.1s → 7.3s | `#F7F8FB` | Analyser avec Arpent |
| 04 | 7.3s → 9.9s | `#F7F8FB` | Extraction. Arpent étape 1 / 3 Prix 420 000 € Surface 68 m² Charges 182 €/mois DPE D Loyer estim |
| 05 | 9.9s → 12.5s | `#FFFFFF` | Calcul. Arpent étape 2 / 3 Prix au m² 6 176 € Rendement brut 3,29 % Mensualité estimée 1 780 € E |
| 06 | 12.5s → 15.1s | `#FFFFFF` | Analyse. Arpent étape 3 / 3 Rendement vs marché local inférieur Travaux à prévoir DPE D Négociat |
| 07 | 15.1s → 17.3s | `#F5F3FF` | Décision. |
| 08 | 17.3s → 20.3s | `#FFFFFF` | Une information dispersée devient une décision lisible . |
| 09 | 20.3s → 24.1s | `#FFFFFF` | FROM IDEA TO PRODUCT Built by Slash Tech |

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

`export/12-arpent.mp4` · `cover/12-arpent-cover-1080x1920.png` ·
`cover/12-arpent-cover-feed-1080x1350.png` · `assets/keyframe-*.png` ·
`audio/12-arpent-sound-design.wav` · `storyboard/12-arpent-keyframes.png`

## Régénérer

```bash
node 12-arpent/source/build.mjs
cd tooling && node run-reels.mjs 12-arpent && node sound-mux.mjs 12-arpent
```
