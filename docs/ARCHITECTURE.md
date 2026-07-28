# Architecture

## Vue d'ensemble

La plateforme est un système multi-agents qui détecte, analyse et (à terme)
exécute des opportunités sur Polymarket. Chaque agent est un composant
autonome avec une responsabilité unique, orchestré par Celery, qui lit et
écrit dans un schéma PostgreSQL partagé.

```
Polymarket (Gamma API / CLOB API)
        │
        ▼
┌───────────────────┐   toutes les 60s (Celery beat)
│  Market Scanner    │──────────────────────────────┐
└───────────────────┘                                │
        │ Market, MarketSnapshot                     │
        ▼                                            ▼
┌───────────────────┐                        ┌───────────────┐
│  News Agent        │──News, NewsMarketLink─▶│  PostgreSQL   │
│  (étape suivante)   │                        │   (schéma     │
└───────────────────┘                        │   complet)    │
        │                                      └───────────────┘
        ▼                                            ▲
┌───────────────────┐   LLMAnalysis                  │
│  LLM Analyst        │────────────────────────────────┤
└───────────────────┘                                │
        │                                            │
        ▼                                            │
┌───────────────────┐   Signal (edge, EV, Kelly...)  │
│  Quant Agent        │────────────────────────────────┤
└───────────────────┘                                │
        │                                            │
        ▼                                            │
┌───────────────────┐   validation des règles        │
│  Risk Manager       │────────────────────────────────┤
└───────────────────┘                                │
        │                                            │
        ▼                                            │
┌───────────────────┐   Order, Position               │
│  Execution Engine   │────────────────────────────────┘
│  (paper / live)     │
└───────────────────┘
```

FastAPI expose le tout en lecture/écriture via `/api/v1/*` (OpenAPI généré
automatiquement), consommé par le dashboard Next.js (étape ultérieure).

## Stack (Étape 1)

| Composant     | Choix                                            |
|---------------|---------------------------------------------------|
| API           | FastAPI + Pydantic v2, async de bout en bout      |
| ORM           | SQLAlchemy 2.0 (async, `Mapped`/`mapped_column`)  |
| DB            | PostgreSQL (SQLite en mémoire pour les tests)     |
| Migrations    | Alembic                                            |
| Tâches / cron | Celery + Redis (broker + backend)                 |
| HTTP client   | httpx + tenacity (retries exponentiels)           |
| Tests         | pytest, pytest-asyncio, respx, aiosqlite          |
| Conteneurs    | Docker / Docker Compose                            |

## Agents : contrat commun

`app/agents/base.py` définit `BaseAgent`, la classe de base que chaque agent
implémente avec une seule méthode `async def run(...)`. Celery appelle ensuite
cette méthode via un wrapper synchrone (`asyncio.run(...)`) dans
`app/agents/<agent>/tasks.py`. Ce contrat reste identique pour tous les agents
à venir (News Agent, LLM Analyst, Quant Agent, Risk Manager, Execution
Engine), ce qui garde l'architecture modulaire et testable indépendamment.

## Market Scanner (implémenté)

`app/agents/market_scanner/`

1. **`polymarket_client.py`** — client HTTP asynchrone vers la Gamma API
   (métadonnées de marché : question, catégorie, prix, volume, liquidité) et
   la CLOB API (carnet d'ordres par token de résultat). Retries exponentiels
   via `tenacity` sur les erreurs transitoires ; un échec de carnet d'ordres
   isolé ne fait jamais échouer tout le scan (retourne `None`, journalisé).
2. **`parser.py`** — normalise les payloads bruts de la Gamma API (champs
   encodés en JSON-string, nombres en string) vers un type interne stable
   (`ParsedMarket`, `ParsedOutcome`).
3. **`agent.py`** — `MarketScannerAgent.run()` :
   - pagine sur `/markets` jusqu'à `MARKET_SCAN_MAX_MARKETS` ;
   - récupère les carnets d'ordres en concurrence bornée (`asyncio.Semaphore`)
     — pure I/O réseau, sûr à paralléliser ;
   - **upsert** chaque marché par `condition_id` (idempotent — un scan
     répété met à jour la ligne `Market`, n'en recrée pas) ;
   - insère un nouveau point `MarketSnapshot` (prix yes/no, probabilité
     implicite, spread calculé depuis le meilleur bid/ask, profondeur du
     carnet tronquée à 10 niveaux, volume 24h, liquidité) — c'est la série
     temporelle utilisée par les futurs agents (LLM Analyst, Quant Agent,
     backtester).
   - les écritures DB restent **séquentielles sur une session unique** (une
     `AsyncSession` SQLAlchemy n'est pas thread/coroutine-safe pour un usage
     concurrent), contrairement aux appels réseau qui, eux, sont parallélisés.
4. **`tasks.py`** — tâche Celery `scan_markets_task`, planifiée toutes les
   `MARKET_SCAN_INTERVAL_SECONDS` (60s par défaut) via `celery beat`, avec
   retry automatique (3 tentatives) sur échec inattendu.

## Schéma de base de données

14 tables couvrant l'intégralité du domaine demandé :

- **Markets** (+ `market_snapshots` pour l'historique minute-par-minute)
- **News** (+ `news_market_links`, table de liaison many-to-many vers les
  marchés concernés, avec un score de pertinence)
- **Signals** — sortie du Quant Agent : score global 0-100, edge, EV, Kelly,
  Sharpe simplifié, volatilité, drawdown attendu, statut + raison
  (approuvé/rejeté)
- **LLMAnalyses** — sortie du LLM Analyst : probabilité estimée, intervalle
  de confiance, niveau de confiance, arguments pour/contre, explication
- **Positions**, **Orders** — état du portefeuille et exécution
- **Portfolios** — mode `paper` ou `live`, solde, devise
- **Backtests** — configuration de stratégie + résultats (ROI, Sharpe,
  Sortino, Calmar, etc.)
- **Users**, **Configurations** — comptes et règles configurables par
  catégorie (`scanner`, `llm`, `risk`, `signals`, `notifications`)
- **Metrics**, **Logs** — séries temporelles de métriques et journal
  d'audit/décision, consultés par le dashboard

La migration initiale (`backend/alembic/versions/0001_initial_schema.py`) est
vérifiée sans dérive par rapport aux modèles ORM
(`alembic.autogenerate.compare_metadata` ne rapporte aucune différence).

## API (Étape 1)

- `GET /api/v1/health`, `GET /api/v1/health/db`
- `GET /api/v1/markets` (filtres `status`, `category`, pagination)
- `GET /api/v1/markets/{id}`
- `GET /api/v1/markets/{id}/snapshots`

Les routers pour `positions`, `orders`, `news`, `signals`, `analyses`,
`portfolios`, `backtests`, `configurations` seront ajoutés au fur et à mesure
que les agents correspondants seront implémentés — pas de code mort en
attendant.

## Prochaines étapes

1. **News Agent** — ingestion RSS/API (Reuters, AP, Bloomberg, sites
   officiels), résumé + classification, liaison aux marchés.
2. **LLM Analyst** — multi-provider (OpenAI, Claude, Gemini, Ollama),
   probabilité estimée + explication par marché.
3. **Quant Agent** — edge, EV, Kelly, Sharpe simplifié, volatilité,
   génération de `Signal`.
4. **Risk Manager** — règles configurables, validation des signaux, journal
   de décision.
5. **Execution Engine** — paper trading puis exécution réelle (CLOB API
   authentifiée), stop-loss / take-profit.
6. **Backtest engine**, **Dashboard Next.js**, **Notifications**
   (Discord/Telegram/Slack/Email/Push), **score global 0-100**.
