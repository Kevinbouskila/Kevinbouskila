# ARCHITECTURE.md — MILLION

> **Statut : proposition, en attente de validation.** Aucun code ne doit être écrit avant accord.

---

## 1. Principe directeur

Un **monolithe modulaire** : un backend Python unique, découpé en modules à frontières nettes,
plus un frontend Next.js. Pas de microservices, pas de broker de messages, pas de Kubernetes.

Justification : un seul utilisateur, 20 agents déterministes, des backtests qui se mesurent en
secondes. La complexité distribuée coûterait du temps de développement et de l'hébergement sans
rien apporter. Les frontières de modules sont conçues pour qu'un service puisse être extrait
plus tard si le besoin apparaît réellement.

## 2. Stack retenue

### Backend
| Choix | Version | Pourquoi |
|---|---|---|
| Python | 3.12+ | Écosystème quantitatif, disponible sur macOS via Homebrew. |
| FastAPI | 0.11x | OpenAPI généré, validation Pydantic, support WebSocket natif. |
| Pydantic v2 | 2.x | Les modèles financiers sont validés au bord du système. |
| SQLAlchemy 2.0 + Alembic | — | SQLite en dev, bascule PostgreSQL sans réécrire les requêtes. |
| NumPy + Pandas | — | Vectorisation des backtests et du Monte-Carlo. |
| `uv` | — | Installation et lock rapides, remplace pip/venv. |
| pytest + hypothesis | — | Tests unitaires et tests de propriété sur les invariants financiers. |

**Décimal, pas flottant.** Toute quantité monétaire est un `Decimal` en base et dans l'API
(sérialisé en chaîne), jamais un `float`. Les `float` ne sont tolérés que dans les calculs
d'indicateurs vectorisés, jamais pour un solde ou un PnL.

### Frontend
| Choix | Pourquoi |
|---|---|
| Next.js 15 (App Router) + TypeScript strict | SSR pour l'auth, un seul déploiement. |
| Tailwind CSS v4 + tokens CSS | Les tokens de la charte Slash Tech vivent dans un seul fichier. |
| Radix UI primitives | Accessibilité clavier et ARIA sans réécrire les composants. |
| TanStack Query | Cache serveur, invalidation, retry. |
| **uPlot** pour les séries temporelles | ~45 ko, trace 100 k points à 60 fps. Recharts/Chart.js décrochent sur un backtest minute. |
| **Canvas 2D** pour Orbit, pas Three.js | 21 objets en orbite + halos : le Canvas 2D y suffit, pour ~0 ko de dépendance contre ~600 ko pour Three.js + R3F. Three.js reste une option si une vraie profondeur 3D est demandée. |
| `prefers-reduced-motion` | Respecté : Orbit se fige en disposition statique. |

### Temps réel
**SSE** (`text/event-stream`), pas WebSocket, pour la diffusion d'état (progression de backtest,
ticks de paper trading, événements de risque) : le flux est unidirectionnel serveur → client,
SSE se reconnecte tout seul et traverse les proxies sans configuration. Les commandes remontent
par `POST` classique. Un WebSocket ne sera introduit que si le vocal exige un flux audio
bidirectionnel.

### Persistance
SQLite en dev (`WAL`, `Decimal` stocké en `NUMERIC`). L'abstraction SQLAlchemy et les migrations
Alembic rendent la bascule PostgreSQL mécanique. Les données OHLCV ne vont pas en base : elles
sont cachées en **Parquet** sur disque (compact, typé, lecture partielle), indexées par une table
`dataset`.

## 3. Modules backend et leurs frontières

```
marketdata/    Acquisition, normalisation, cache, contrôle qualité. Ne connaît aucune stratégie.
strategies/    20 stratégies pures. Signature : (fenêtre de données jusqu'à t, état) -> intention.
               Aucune stratégie ne touche la base, le réseau, l'horloge ou le capital.
execution/     Simulateur d'exécution : commissions, spread, slippage, lots, latence, partiels.
risk/          Moteur de risque. Seul module autorisé à approuver un ordre.
portfolio/     Comptabilité : positions, PnL réalisé/latent, equity curve.
backtest/      Orchestrateur événementiel. Avance l'horloge, appelle strategy -> risk -> execution.
montecarlo/    Simulations statistiques. Strictement séparé de backtest/.
papertrading/  Même boucle que backtest, horloge = temps réel, données = flux live.
jarvis/        Routeur d'intentions + générateur de réponses. Lit les autres modules, n'écrit que
               via les commandes autorisées.
api/           Routeurs FastAPI, auth, SSE. Aucune logique métier.
```

**L'invariant d'architecture central :** le chemin d'un ordre est
`strategy → risk → execution → portfolio`, et il n'existe aucun autre chemin vers `portfolio`.
`risk` n'expose pas de mode « bypass », ne lit aucun flag de configuration autorisant une
exception, et ne reçoit jamais d'argument venant de la couche vocale. Un test d'architecture
vérifie que `portfolio` n'est importé par aucun module en dehors de `execution` et des lecteurs.

## 4. Anti-look-ahead : comment c'est garanti, pas promis

Trois mécanismes cumulés, parce qu'une seule convention se contourne par accident :

1. **Fenêtre tronquée par construction.** Une stratégie ne reçoit pas le DataFrame complet mais
   un objet `DataWindow` qui ne peut pas indexer au-delà de l'instant simulé — l'accès lève.
2. **Barre fermée uniquement.** Une décision prise sur la barre `t` s'exécute au plus tôt sur
   l'ouverture de `t+1`, plus le délai d'exécution configuré.
3. **Test de régression dédié.** Une stratégie-sonde qui tente de lire le futur doit faire
   échouer la suite de tests. Si ce test passe un jour en vert alors qu'il doit échouer, la
   garantie est cassée.

## 5. Découpage des données

| Split | Rôle | Règle |
|---|---|---|
| `dev` | Écriture et mise au point des stratégies | Consultable librement. |
| `validation` | Choix des hyperparamètres | Nombre d'évaluations compté et affiché. |
| `test` | Mesure finale | **Verrouillé.** Une exécution sur `test` est horodatée et tracée ; le compteur d'accès par version de stratégie est visible dans l'UI. |

Le découpage est chronologique, jamais aléatoire. Les frontières sont figées dans la
configuration du dataset, pas dans le code des stratégies.

## 6. Données de marché

**Source retenue pour le MVP :** données publiques **crypto spot**, API gratuites et sans clé
(Binance `/api/v3/klines`, Kraken `/0/public/OHLC` en secours et recoupement).

Justification : gratuit, pas de clé, historique minute profond, marché continu 24/7 — ce qui est
nécessaire pour un horizon de 30 jours. Les actions sont écartées pour le MVP : les sources
gratuites plafonnent en granularité, et un marché fermé 2/3 du temps détruit l'expérience sur
30 jours.

Chaque dataset porte : source, symbole, intervalle, plage, date de téléchargement, nombre de
barres, nombre de trous comblés, et un hash de contenu. Rapport qualité : barres manquantes,
doublons, horodatages non monotones, prix nuls ou négatifs, `high < low`, volumes nuls,
écarts aberrants. Un dataset qui échoue au contrôle est marqué invalide et refusé par le
backtest, pas silencieusement réparé.

Les données synthétiques existent uniquement dans les fixtures de test, générées par un module
nommé explicitement, avec `synthetic=True` porté jusqu'à l'API et affiché dans l'UI.

## 7. Agents d'arbitrage — le point honnête

Les agents 11 à 15 ont besoin de données que le MVP n'aura pas : carnets d'ordres synchronisés
multi-plateformes, horodatage sub-seconde, et des frais/latences réalistes. Les faire tourner
sur des bougies minute produirait des opportunités d'arbitrage qui n'existent pas.

**Décision :** les agents 11 à 15 sont créés, configurés et affichés avec le statut
`NOT_TESTABLE` et le motif exact des données manquantes. Ils ne reçoivent ni capital consommé,
ni PnL, ni rang au classement. Un backlog technique décrit ce qu'il faudrait acquérir pour les
rendre testables. Les agents 12 et 13 (triangulaire, spot/spot intra-plateforme) sont les plus
accessibles — des bougies 1 s sur une même plateforme pourraient suffire ; à évaluer en Phase 4.

Cela signifie que **15 agents sur 20 seront réellement en compétition au MVP**. C'est volontaire
et c'est la seule option compatible avec l'interdiction de fabriquer des résultats.

## 8. JARVIS

### Chaîne vocale (gratuite au MVP, aucune clé)
| Étage | MVP | Évolution |
|---|---|---|
| Reconnaissance | `SpeechRecognition` du navigateur (Web Speech API, `fr-FR`) | Whisper local (`faster-whisper`) côté serveur si la qualité ou la vie privée l'exigent. |
| Mot d'activation | Détection du mot « Jarvis » dans le flux de transcription continue | Modèle de wake word dédié (openWakeWord) si les faux positifs gênent. |
| Synthèse | `SpeechSynthesis` du navigateur, voix `fr-FR` | ElevenLabs, **via proxy serveur uniquement** (voir ci-dessous). |

Trois modes micro : bouton ponctuel, push-to-talk (maintien d'une touche), écoute continue
optionnelle. Transcription visible en direct. Interruption de JARVIS au clic, à la touche, ou à
la voix. Indicateur visuel à quatre états : inactif / écoute / réflexion / réponse. Gestion
explicite du refus de permission micro, de l'absence d'API dans le navigateur, et du mode
dégradé clavier — **chaque commande vocale a un équivalent cliquable ou tapable.**

**Chrome/Edge requis** pour la Web Speech API ; Safari et Firefox dégradent (support partiel ou
absent). Le mode texte reste pleinement fonctionnel partout.

**Coût ElevenLabs, pour décision ultérieure :** le palier gratuit (~10 k caractères/mois) suffit
à peine à quelques dizaines de réponses ; le premier palier payant est à ~5 $/mois. À ne pas
activer sans validation. La voix navigateur est gratuite et illimitée, mais moins naturelle.
Si ElevenLabs est retenu, la clé reste côté serveur et le frontend n'appelle qu'un endpoint
`/api/jarvis/speak` qui relaie l'audio.

### Intelligence — déterministe d'abord
Les 11 commandes prioritaires sont traitées par un **routeur d'intentions déterministe**
(motifs + extraction d'entités : numéro d'agent, nom, fenêtre temporelle). Les chiffres cités
viennent toujours d'une requête réelle aux modules, jamais d'un modèle de langage. Un LLM
n'intervient qu'en repli, sur les formulations libres non reconnues, et **uniquement pour
reformuler des données qui lui sont fournies en contexte** — il n'a pas le droit de produire un
nombre financier. Les réponses étiquetent fait / estimation / hypothèse.

**Les commandes vocales ne forment pas une API privilégiée.** « Mets l'agent 12 en pause » et
« Arrête toutes les simulations » passent par les mêmes endpoints autorisés que les boutons de
l'UI, et le moteur de risque ne lit jamais leur origine. Aucune commande, vocale ou non, ne peut
désactiver une règle de risque : il n'existe pas d'endpoint pour le faire.

## 9. Arborescence proposée

```
project-million/
├── PROJECT_SPEC.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md        ← ce fichier
│   ├── ROADMAP.md
│   ├── OPEN_QUESTIONS.md
│   ├── DATA_SOURCES.md        ← sources, licences d'usage, limites de débit
│   ├── RISK_RULES.md          ← règles de risque et leur test correspondant
│   ├── DESIGN_TOKENS.md       ← charte Slash Tech, une fois les captures fournies
│   └── DEPLOYMENT.md
├── backend/
│   ├── pyproject.toml
│   ├── million/
│   │   ├── config.py          ← Pydantic Settings, zéro secret en dur
│   │   ├── marketdata/        ← sources/, cache.py, quality.py, window.py
│   │   ├── strategies/        ← base.py, momentum/, meanreversion/, arbitrage/, adaptive/
│   │   ├── execution/         ← simulator.py, costs.py, fills.py
│   │   ├── risk/              ← engine.py, rules.py, killswitch.py, audit.py
│   │   ├── portfolio/         ← ledger.py, metrics.py
│   │   ├── backtest/          ── engine.py, splits.py, reproducibility.py
│   │   ├── montecarlo/        ← engine.py, models.py
│   │   ├── papertrading/
│   │   ├── jarvis/            ← intents.py, handlers.py, report.py, llm_fallback.py
│   │   ├── agents/            ← registry.py (les 20 configurations), state.py
│   │   ├── db/                ← models.py, session.py, migrations/
│   │   └── api/               ← routers/, auth.py, sse.py, deps.py
│   ├── tests/                 ← unit/, integration/, financial_regression/, architecture/
│   └── data/                  ← cache Parquet (gitignored)
├── frontend/
│   ├── src/app/               ← overview, arena, leaderboard, analytics,
│   │                            experiments, jarvis, settings, million
│   ├── src/components/        ← orbit/, charts/, agent/, jarvis/, ui/
│   ├── src/lib/               ← api client, sse, formatters monétaires
│   ├── src/styles/tokens.css  ← source unique des tokens Slash Tech
│   └── tests/
├── scripts/                   ← fetch_data.py, run_experiment.py, seed_agents.py
└── docker-compose.yml         ← app + postgres, pour la phase production
```

## 10. Schéma de données (esquisse)

`agent` · `agent_config` (versionnée) · `experiment` (run de backtest : seed, split, plage,
version de code) · `trade` · `position` · `decision` (log horodaté : signal, intention, verdict
risque) · `equity_point` · `risk_event` (chaque refus, avec motif) · `dataset` (source, hash,
rapport qualité) · `montecarlo_run` · `jarvis_turn` (transcription, intention, réponse, données
citées).

Toute ligne de performance est rattachée à un `experiment`, lui-même rattaché à un `dataset`
et à une version de stratégie — c'est ce qui rend un résultat reproductible et auditable.

## 11. Sécurité

Auth par session cookie `HttpOnly` + `Secure` + `SameSite=Strict`, utilisateur unique, mot de
passe haché Argon2id. Toutes les routes API protégées sauf `/health`. Rate limiting sur
`/api/jarvis/*`. Secrets par variables d'environnement validées au démarrage (l'app refuse de
démarrer si un secret requis manque). Logs structurés JSON. Aucune clé de plateforme de trading
n'existe dans le MVP — il n'y a rien à exposer.

## 12. Ce que cette architecture ne fait pas

- Pas de multi-utilisateur, pas de rôles, pas d'organisation.
- Pas de données tick ni de carnet d'ordres au MVP (d'où `NOT_TESTABLE` sur l'arbitrage).
- Pas de connexion à une plateforme réelle, même en lecture authentifiée.
- Pas de 3D réelle dans Orbit au MVP (Canvas 2D).
- Pas d'entraînement de modèle de machine learning : les stratégies « adaptatives » sont des
  règles de commutation déterministes, pas des modèles appris.
