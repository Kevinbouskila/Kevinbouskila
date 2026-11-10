# PROJECT_SPEC.md — MILLION / AI Trading Arena

> **Statut : cadrage validé par le commanditaire, PAS un cahier des charges technique complet.**
> Ce document fige les décisions de cadrage. Les choix techniques détaillés vivent dans
> `docs/ARCHITECTURE.md`, le découpage dans `docs/ROADMAP.md`, et les points non tranchés
> dans `docs/OPEN_QUESTIONS.md`. Toute décision technique contredisant ce fichier doit être
> remontée avant implémentation.

Dernière mise à jour : 2026-11-10

---

## 1. Décisions de cadrage

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Projet | **MILLION — AI Trading Arena** |
| 2 | URL cible | `https://million.slashtech.io` |
| 3 | Dépôt | Nouveau dépôt **privé** dédié, nommé `project-million`. **Ne pas utiliser** `kevinbouskila/kevinbouskila`. Création différée jusqu'à accord explicite. |
| 4 | Environnement de dev | Local, sur le Mac du commanditaire, via Claude Code. |
| 5 | Interface | Charte graphique de `https://www.slashtech.io`, dérivée des captures d'écran fournies par le commanditaire. |
| 6 | Architecture fonctionnelle | 20 bots de trading, 4 familles (Momentum, Mean Reversion, Arbitrage, Adaptative), **1 € de capital virtuel chacun**. |
| 7 | Objectif expérimental | Tenter d'atteindre 1 000 000 € en 30 jours. **Jamais présenté comme un rendement garanti, une prévision ou une promesse.** |
| 8 | JARVIS | Assistant vocal central **en français**, interface Orbit inspirée de `github.com/ericdjavid/jarvis` (branche `eric/orbit`). Licence à examiner avant toute réutilisation. |
| 9 | Fonctionnalités | Données historiques réelles, backtesting rigoureux, moteur de risque indépendant, simulation Monte-Carlo, paper trading, classement des agents, analytics, pilotage vocal. |
| 10 | Sécurité | Aucune transaction réelle. Aucun levier. Aucune API financière payante. Aucun déploiement sans accord explicite. |

## 2. Les 20 agents

| # | Agent | Famille |
|---|-------|---------|
| 1 | Momentum court terme | A — Momentum |
| 2 | Momentum long terme | A — Momentum |
| 3 | Breakout | A — Momentum |
| 4 | Momentum multi-actifs | A — Momentum |
| 5 | Momentum ajusté à la volatilité | A — Momentum |
| 6 | Retour à la moyenne simple | B — Mean Reversion |
| 7 | Bandes de Bollinger | B — Mean Reversion |
| 8 | RSI contrarien | B — Mean Reversion |
| 9 | Retour après excès de volatilité | B — Mean Reversion |
| 10 | Réversion statistique | B — Mean Reversion |
| 11 | Arbitrage inter-plateformes | C — Arbitrage |
| 12 | Arbitrage triangulaire | C — Arbitrage |
| 13 | Arbitrage spot/spot | C — Arbitrage |
| 14 | Arbitrage statistique entre actifs | C — Arbitrage |
| 15 | Détection de désalignements de prix | C — Arbitrage |
| 16 | Détection de régime de marché | D — Adaptative |
| 17 | Combinaison de signaux | D — Adaptative |
| 18 | Allocation dynamique | D — Adaptative |
| 19 | Ensemble de stratégies | D — Adaptative |
| 20 | Sélection adaptative de modèles | D — Adaptative |

Chaque agent porte : identifiant unique, nom, famille, configuration, capital indépendant,
état opérationnel, historique des transactions, journal de décisions, métriques de performance,
version de stratégie, statut d'éligibilité au trading réel.

## 3. Règles non négociables (invariants produit)

Ces règles sont des **invariants** : elles sont implémentées côté serveur, testées, et
ne peuvent être désactivées ni par une décision d'agent, ni par une commande vocale,
ni par un paramètre d'interface.

### 3.1 Risque
- Aucun levier, aucun emprunt, aucune vente à découvert.
- Aucun solde négatif, aucun ordre dépassant le budget autorisé de l'agent.
- Aucun transfert automatique de fonds entre agents.
- **Aucune transaction réelle** dans le MVP ni dans aucune phase sans accord écrit.
- Arrêt automatique en cas d'anomalie critique ; interrupteur d'arrêt global ; suspension
  individuelle d'un bot.
- Chaque refus du moteur de risque est journalisé avec son motif.

### 3.2 Honnêteté des données
- Aucune donnée de marché fabriquée présentée comme réelle.
- Jeux de données synthétiques autorisés **uniquement** pour les tests techniques, avec
  marquage explicite `synthetic: true` porté jusqu'à l'interface.
- Aucune performance, transaction ou probabilité inventée.
- Un agent dont les données requises sont indisponibles est marqué **`NOT_TESTABLE`**,
  et non crédité d'un résultat artificiel. Concerne en priorité la famille Arbitrage.
- La probabilité d'atteindre 1 000 000 € n'est affichée que si un modèle statistique
  explicite et justifiable la produit, avec ses hypothèses affichées à côté du chiffre.
- Les simulations Monte-Carlo et les backtests historiques sont étiquetés distinctement
  et jamais agrégés dans un même indicateur.
- JARVIS distingue systématiquement fait / estimation / hypothèse.

### 3.3 Rigueur de backtest
- Aucun biais d'anticipation (look-ahead) : une stratégie ne voit à l'instant `t` que
  les données disponibles à `t`.
- Séparation stricte développement / validation / test.
- Décisions horodatées et reproductibles (seed explicite, versions de stratégie figées).
- Coûts d'exécution modélisés : commissions, spread, slippage, taille minimale d'ordre,
  précision prix/quantité, liquidité disponible, délai d'exécution, exécutions partielles.

### 3.4 Sécurité applicative
- Application privée, authentification obligatoire, HTTPS.
- Secrets exclusivement côté serveur ; aucune clé exposée au navigateur ; aucun secret en dur.
- Pas de modification du DNS de `slashtech.io`, du site vitrine ni de son back-office.
- Pas d'activation d'abonnement payant ou de service facturable sans validation.

### 3.5 Budget
- Budget de trading réel envisagé : **20 € maximum**, phase ultérieure, hors MVP.
- Ce budget est distinct des coûts d'hébergement, de données et de modèles IA, qui doivent
  être estimés et validés avant tout engagement.
- Priorité : open source, données gratuites, simulations locales, algorithmes déterministes.
  Appels LLM uniquement là où ils apportent une valeur mesurable.

## 4. Identité

- Nom : **MILLION** — Signature : **AI Trading Arena** — Assistant : **JARVIS**
- Mention discrète : *Powered by Slash Tech*
- Logo MILLION cohérent avec Slash Tech, sans copier le logo principal.
- Direction artistique : fond très sombre à nuances violettes, dégradés violet électrique →
  magenta/rose, typographie moderne premium, cartes à coins arrondis, ombres douces et
  halos subtils, animations fluides et maîtrisées, indicateurs financiers très lisibles,
  excellent contraste et accessibilité, responsive desktop / tablette / mobile.
- Les valeurs exactes de la charte ne doivent pas être devinées lorsqu'elles sont
  accessibles dans une source Slash Tech. Voir `docs/OPEN_QUESTIONS.md` — Q1.

## 5. Sections d'interface attendues

Overview · Arena (Orbit) · Leaderboard · Analytics · Experiments · Jarvis · Settings
· **Objectif 1 million** (capital du meilleur bot, trajectoire théorique requise, écart à
cette trajectoire, rendement quotidien nécessaire sur le temps restant, bots encore actifs,
bots ayant épuisé leur capital).

## 6. Licence JARVIS — conclusion de l'examen

Examen effectué le 2026-11-10 sur la branche `eric/orbit`.

- `ericdjavid/jarvis` est un fork personnel de `ethanplusai/jarvis`.
- Sa licence autorise l'usage, la copie et la modification à des fins **personnelles,
  éducatives et non commerciales** uniquement.
- Elle **interdit** l'usage du logiciel *et de tout travail dérivé* à des fins commerciales
  sans licence commerciale séparée, y compris l'exploitation en service hébergé (SaaS).

**Conséquence retenue :** MILLION étant destiné à être hébergé sous un domaine d'entreprise
(`million.slashtech.io`) avec la mention *Powered by Slash Tech*, la qualification
« non commercial » n'est pas acquise. **Aucun code, asset ni fichier de ce dépôt ne sera
copié ou adapté.** JARVIS/Orbit sert de référence d'inspiration fonctionnelle uniquement
(réacteur central, carte orbitale d'agents, états colorés, modes micro, mot d'activation) —
principes non protégeables en tant que tels, réimplémentés de façon originale.

Deux détails techniques du fork sont par ailleurs inadaptés à MILLION et confirment la
réimplémentation : il pilote des sessions Claude Code locales via AppleScript (macOS only),
et sa stack frontend est Vite + TypeScript vanilla, là où MILLION cible Next.js.

Si une réutilisation directe devenait souhaitable, il faudrait acquérir une licence
commerciale auprès de l'auteur — décision à coût, donc soumise à validation préalable.

## 7. Hors périmètre explicite

- Toute exécution d'ordre sur un compte réel.
- Tout déploiement en production.
- Toute création de dépôt distant, tant que l'accord n'est pas donné.
- Toute modification du DNS, du site vitrine ou du back-office Slash Tech.
- Tout abonnement payant (données de marché, synthèse vocale, LLM) non validé.
