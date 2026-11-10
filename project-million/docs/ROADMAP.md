# ROADMAP.md — MILLION

> **Statut : proposition, en attente de validation.**
> Chaque phase se termine par une démonstration vérifiable. Rien n'est déclaré « terminé »
> sans critère d'acceptation satisfait et test exécuté.

---

## Phase 0 — Cadrage (en cours, aucun code)

**Livrables**
- `PROJECT_SPEC.md` — ✅ écrit
- `docs/ARCHITECTURE.md` — ✅ écrit
- `docs/ROADMAP.md` — ✅ ce fichier
- `docs/OPEN_QUESTIONS.md` — ✅ écrit
- Examen de la licence JARVIS — ✅ fait, conclusion : réimplémentation originale
- Audit de l'environnement — ⚠️ fait sur le conteneur cloud, **pas sur le Mac** (voir Q5)

**Sortie de phase :** validation de l'architecture par le commanditaire. **Bloquant.**

---

## Phase 1 — Socle et moteurs financiers (backend uniquement)

Aucune interface. L'objectif est que les calculs d'argent soient justes avant qu'on les affiche.

1. Squelette projet, `uv`, config Pydantic, SQLAlchemy + Alembic, `/health`.
2. `marketdata/` : client Binance, normalisation OHLCV, cache Parquet, rapport qualité,
   table `dataset` avec hash de contenu. Téléchargement réel de BTC/EUR et ETH/EUR.
3. `marketdata/window.py` : le `DataWindow` qui rend le look-ahead impossible.
4. `execution/` : commissions, spread, slippage, taille minimale, précision, liquidité,
   délai, exécutions partielles.
5. `portfolio/` : grand livre en `Decimal`, PnL réalisé et latent, equity curve, drawdown.
6. `risk/` : les 9 règles, le journal des refus, le kill-switch global, la suspension unitaire.
7. `backtest/` : boucle événementielle, splits chronologiques, reproductibilité par seed.
8. Deux stratégies de référence seulement (Momentum court terme, Retour à la moyenne simple).

**Critères d'acceptation**
- Un portefeuille parti de 1 € ne peut jamais devenir négatif — test de propriété (hypothesis)
  sur des séries de prix aléatoires.
- La stratégie-sonde qui lit le futur **fait échouer** la suite de tests.
- Deux exécutions du même backtest avec le même seed produisent des `trade` bit-identiques.
- Un backtest sur un dataset marqué invalide est refusé avec un message explicite.
- Chaque refus du moteur de risque apparaît dans `risk_event` avec son motif.
- Somme des PnL réalisés + latents = equity finale − equity initiale, au centième de centime.

---

## Phase 2 — Les 20 agents et l'API

1. Les 18 stratégies restantes. Les 5 d'arbitrage sont implémentées **et** marquées
   `NOT_TESTABLE` avec le motif des données manquantes.
2. `agents/registry.py` : les 20 configurations, versionnées.
3. Routeurs FastAPI : agents, expériences, classement, analytics, risque. OpenAPI complet.
4. Auth session, SSE de progression de backtest.
5. `montecarlo/` : dispersion, fréquence de ruine, sensibilité aux frais, drawdowns,
   corrélation inter-agents, règles de réinvestissement.

**Critères d'acceptation**
- Les 20 agents existent en base avec leur configuration complète.
- Les 5 agents d'arbitrage n'ont ni PnL, ni rang, ni capital consommé.
- Un run de 15 agents sur 30 jours de données minute s'exécute et produit un classement.
- La réponse Monte-Carlo est étiquetée `statistical`, jamais `historical`.
- `GET /openapi.json` documente toutes les routes.

---

## Phase 3 — Interface MILLION

1. Tokens de la charte Slash Tech dans `tokens.css`, à partir des captures (voir Q1).
2. Shell applicatif, navigation, responsive, états de chargement et d'erreur.
3. Overview, Leaderboard, Analytics (uPlot), Experiments, Settings.
4. Vue **Objectif 1 million** : capital du meilleur bot, trajectoire théorique, écart,
   rendement quotidien requis, bots actifs, bots ruinés.
5. Fiche agent : capital initial/actuel, PnL, rendement, drawdown, transactions, dernières
   décisions, stratégie, état, graphique.

**Critères d'acceptation**
- Aucun chiffre affiché qui ne vienne de l'API. Aucune donnée de démonstration en dur.
- Les datasets synthétiques s'affichent avec un badge visible.
- Contraste AA minimum sur tous les indicateurs financiers ; navigation clavier complète.
- Lisible et utilisable à 375 px de large.
- La probabilité d'atteindre 1 M€ n'apparaît qu'avec ses hypothèses à côté, ou pas du tout.

---

## Phase 4 — JARVIS et Orbit

1. Orbit en Canvas 2D : réacteur central, 20 agents, couleur par famille, animation par état,
   clic → fiche agent, mode statique sous `prefers-reduced-motion`, mode simplifié mobile.
2. Routeur d'intentions déterministe, les 11 commandes prioritaires.
3. Web Speech API : reconnaissance `fr-FR`, mot d'activation, trois modes micro,
   transcription visible, interruption, indicateur à quatre états, gestion des permissions.
4. Synthèse vocale navigateur. Endpoint proxy `/api/jarvis/speak` prêt pour ElevenLabs,
   désactivé par défaut.
5. Rapport quotidien, détection d'anomalies, propositions d'expériences.
6. Onglet Jarvis : historique des échanges avec les données citées.

**Critères d'acceptation**
- Les 11 commandes répondent avec des chiffres issus d'une requête réelle, vérifiables à la main.
- Toute commande vocale a un équivalent cliquable.
- Aucune commande ne peut lever une règle de risque — test dédié qui tente de le faire.
- Orbit tient 60 fps sur un Mac portable ; l'animation d'un agent en perte n'est jamais
  « positive » visuellement.
- Refus de permission micro → message clair, application pleinement utilisable au clavier.

---

## Phase 5 — Expérimentation et rapport objectif

1. Exécution des backtests sur le split `test`, une seule fois, horodatée.
2. Monte-Carlo à grand nombre de tirages.
3. Rapport : ce qui a marché, ce qui a perdu, pourquoi, sensibilité aux frais, limites
   méthodologiques, et une réponse honnête sur la faisabilité du million en 30 jours.

**Critère d'acceptation :** le rapport conclut par des faits mesurés, y compris si la conclusion
est que l'objectif est hors d'atteinte.

---

## Phase 6 — Préparation production (aucun déploiement)

Durcissement sécurité, Docker Compose + PostgreSQL, variables d'environnement, sauvegardes,
monitoring, `docs/DEPLOYMENT.md`, estimation des coûts d'hébergement.

**Sortie de phase :** tout est prêt, rien n'est en ligne. Déploiement sur accord explicite
uniquement, DNS inclus.

---

## Ce que je recommande de faire en premier

Phase 1 points 1 à 7, sans aucune interface. Si le moteur d'exécution et le moteur de risque
ne sont pas justes et testés, tout ce qui est construit au-dessus affiche des chiffres faux
avec élégance. C'est le seul endroit du projet où un bug est silencieux et grave.
