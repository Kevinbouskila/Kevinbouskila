- 👋 Hi, I’m @Kevinbouskila
- 👀 I’m interested in web and mobile app development, chatbot/Voicebot, NFT/Blockchain
- 🌱 I’m currently learning chatbot development
- 📫 How to reach me : kevinbouskila@gmail.com

---

# Polymarket SaaS Platform

Plateforme locale (Docker) de détection, d'analyse et d'exécution automatisée d'opportunités sur
[Polymarket](https://polymarket.com), construite autour d'agents IA spécialisés. L'objectif est de
**maximiser l'espérance de gain à long terme** grâce à une meilleure analyse que le marché — pas de
garantir des profits.

> ⚠️ Ce projet interagit avec des marchés de prédiction réels. Le mode simulation (paper trading)
> est actif par défaut. L'exécution réelle nécessite une configuration explicite et les clés API
> Polymarket appropriées. Utilisez à vos propres risques et vérifiez la conformité légale dans
> votre juridiction avant toute exécution réelle.

## Statut du projet — développement progressif

Le projet est développé étape par étape. Chaque étape est livrée avec code complet, tests, et
documentation avant de passer à la suivante.

| Étape | Composant | Statut |
|---|---|---|
| 1 | **Fondations** — monorepo, schéma DB complet, Docker Compose, Market Scanner Agent | ✅ Livré |
| 2 | News Agent (Reuters, AP, Bloomberg, RSS, X, classification) | ⏳ À venir |
| 3 | LLM Analyst (OpenAI, Claude, Gemini, Ollama) | ⏳ À venir |
| 4 | Quant Agent (edge, EV, Sharpe, Kelly, volatilité, drawdown) | ⏳ À venir |
| 5 | Risk Manager (règles configurables, journalisation) | ⏳ À venir |
| 6 | Execution Engine (paper trading + exécution réelle) | ⏳ À venir |
| 7 | Backtest Engine | ⏳ À venir |
| 8 | Dashboard Next.js complet | ⏳ À venir (skeleton livré à l'étape 1) |
| 9 | Score global (100 pts) + explicabilité des signaux | ⏳ À venir |
| 10 | Configuration UI | ⏳ À venir |
| 11 | Notifications (Discord, Telegram, Slack, Email, Push) | ⏳ À venir |
| 12 | Qualité — couverture de tests étendue, docs, CI/CD final | ⏳ À venir |

## Stack

- **Backend** : Python 3.13, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Redis, Celery, Alembic
- **Frontend** : Next.js 15, React 18, TypeScript, Tailwind CSS, Recharts
- **IA** : multi-provider (OpenAI, Claude, Gemini, Ollama) — architecture orientée agents
- **Infra** : Docker, Docker Compose, GitHub Actions

## Architecture (agents IA)

```
Market Scanner ──┐
                  ├──▶ LLM Analyst ──▶ Quant Agent ──▶ Risk Manager ──▶ Execution Engine
News Agent ───────┘         │                │               │               │
                             ▼                ▼               ▼               ▼
                        LLM Analyses       Signals          Logs           Orders/Positions
                             └────────────────┴───────────────┴───────────────┘
                                              PostgreSQL (source de vérité)
```

1. **Market Scanner** *(livré)* : scanne tous les marchés Polymarket actifs toutes les minutes
   (prix, liquidité, volume, spread, profondeur), via l'API publique Gamma de Polymarket, et
   persiste un enregistrement `Market` + un `MarketSnapshot` horodaté par cycle.
2. **News Agent** : collecte et classifie les actualités en temps réel, les relie aux marchés
   concernés.
3. **LLM Analyst** : produit une probabilité estimée, un intervalle de confiance et une
   explication complète par marché, à partir de l'actualité, l'historique et le consensus.
4. **Quant Agent** : compare la probabilité IA à la probabilité implicite du marché, calcule
   edge / EV / Sharpe simplifié / Kelly / volatilité / drawdown attendu, et ne retient que les
   opportunités à espérance positive.
5. **Risk Manager** : applique des règles configurables (position max, perte max journalière,
   nombre de positions, allocation par marché, exposition) et journalise chaque décision.
6. **Execution Engine** : place/annule/modifie les ordres en mode simulation ou réel, gère les
   sorties partielles, prises de bénéfices et stops de protection.

## Schéma de base de données (étape 1)

Toutes les tables demandées sont définies avec SQLAlchemy 2.0 (`backend/app/models/`) et une
migration Alembic initiale les crée en une fois :

`markets`, `market_snapshots`, `positions`, `orders`, `news`, `news_market_links`, `signals`,
`llm_analyses`, `metrics`, `logs`, `portfolios`, `backtests`, `users`, `configurations`.

## Démarrage rapide (Docker)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- API : http://localhost:8000 (docs OpenAPI interactives sur `/docs`)
- Dashboard : http://localhost:3000
- Le Market Scanner tourne automatiquement via Celery Beat (toutes les 60s par défaut,
  configurable via `MARKET_SCAN_INTERVAL_SECONDS`).

Services démarrés : `postgres`, `redis`, `backend` (FastAPI + migrations auto), `celery-worker`,
`celery-beat`, `frontend`.

## Développement local (sans Docker)

### Backend

```bash
cd backend
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # adapter DATABASE_URL/REDIS_URL pour un Postgres/Redis locaux
alembic upgrade head
uvicorn app.main:app --reload
```

Lancer le worker et le scheduler Celery séparément (nécessite Redis) :

```bash
celery -A app.core.celery_app.celery_app worker --loglevel=info
celery -A app.core.celery_app.celery_app beat --loglevel=info
```

### Tests et lint (backend)

```bash
pytest -q --cov=app --cov-report=term-missing
ruff check .
```

Les tests tournent contre une vraie base PostgreSQL (aucun mock de la couche SQL) ; seul l'appel
réseau à l'API Polymarket est mocké (via `respx`).

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run lint
```

## Structure du dépôt

```
backend/
  app/
    agents/market_scanner/   # client API Polymarket, service de persistance, tâche Celery
    api/v1/                  # endpoints FastAPI (health, markets)
    core/                    # config, DB, Celery, logging
    models/                  # schéma SQLAlchemy complet
    schemas/                 # schémas Pydantic (réponses API)
    alembic/                 # migrations
  tests/                     # pytest (22 tests, ~97% de couverture sur ce périmètre)
frontend/
  src/app/                   # pages Next.js (App Router)
  src/components/            # composants UI
  src/lib/, src/types/       # client API, types partagés
docker-compose.yml
.github/workflows/ci.yml     # lint + tests backend, lint + build frontend
```

## API (étape 1)

- `GET /api/v1/health` — statut du service
- `GET /api/v1/markets` — liste des marchés scannés (filtres `active`, `category`, pagination)
- `GET /api/v1/markets/{id}` — détail d'un marché
- `GET /api/v1/markets/{id}/snapshots` — historique des snapshots (prix/liquidité/volume dans le
  temps)

Documentation interactive complète (OpenAPI) sur `/docs` une fois le backend lancé.

## Configuration

Toutes les variables sont définies dans `backend/.env.example`. Les règles métier (fréquence de
scan, pondérations, seuils de risque…) seront exposées dans la table `configurations` et pilotables
depuis le dashboard à partir de l'étape 10.
