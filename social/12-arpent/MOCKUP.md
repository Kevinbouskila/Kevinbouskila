# ⚠ Écrans Arpent — conception, pas captures

Ce repository (`Kevinbouskila/Kevinbouskila`) ne contient **pas** le projet Arpent :
il ne contient qu'un `README.md` de profil GitHub. Le site `slashtech.io` est par
ailleurs bloqué par la politique réseau de cet environnement.

Les écrans du Reel 12 sont donc une **conception d'interface** réalisée d'après le
storyboard (prix / surface / charges / DPE / financement / loyer → extraction →
calcul → analyse → décision). Ce ne sont pas des captures du produit réel, et les
valeurs affichées sont des **exemples d'interface**, pas des résultats d'analyse.

## Avant publication

1. Lancer Arpent, faire une vraie analyse.
2. Capturer les écrans en 1080 px de large minimum, en mode clair.
3. Les déposer dans `12-arpent/assets/screens/`.
4. Dans `12-arpent/source/scenes.mjs`, remplacer les blocs `app(...)` par
   `<img src="/12-arpent/assets/screens/xxx.png">` dans un conteneur `.app`.
5. Relancer : `node tooling/run-reels.mjs 12-arpent`.

L'identité du produit doit être conservée exactement : ne pas re-styler Arpent
aux couleurs Slash Tech. Le reel encadre le produit, il ne le remplace pas.
