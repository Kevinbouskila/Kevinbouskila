# Polymarket Intelligence Platform

Plateforme SaaS locale (Docker) pour détecter, analyser et — à terme —
exécuter automatiquement des opportunités sur [Polymarket](https://polymarket.com),
via un pipeline d'agents IA spécialisés (Market Scanner, News Agent, LLM
Analyst, Quant Agent, Risk Manager, Execution Engine).

L'objectif est de maximiser l'espérance de gain à long terme grâce à une
meilleure analyse que le marché — pas de garantir des profits.

- Architecture détaillée : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Mise en route du backend : [`backend/README.md`](backend/README.md)

## Démarrage rapide

```bash
cp .env.example .env
docker compose up --build
```

- API + documentation OpenAPI : http://localhost:8000/docs
- Le Market Scanner tourne toutes les 60s via Celery beat dès le démarrage.

## État du projet

Construit progressivement, étape par étape. **Étape 1 (fondations) livrée :**

- Schéma PostgreSQL complet (Markets, Positions, Orders, News, Signals, LLM
  Analyses, Metrics, Logs, Portfolios, Backtests, Users, Configurations) +
  migration Alembic vérifiée sans dérive.
- Agent **Market Scanner** : collecte prix/liquidité/volume/spread/profondeur
  du carnet pour tous les marchés actifs, toutes les minutes.
- API FastAPI (`/api/v1/markets`, `/api/v1/health`) avec OpenAPI généré.
- Suite de tests (modèles, client HTTP, agent, API) — 28 tests, aucune
  dépendance externe requise pour les lancer.
- CI GitHub Actions (lint + migrations + tests contre un vrai Postgres).
- Docker Compose (Postgres, Redis, API, worker Celery, beat Celery).

**À venir :** News Agent, LLM Analyst (OpenAI/Claude/Gemini/Ollama), Quant
Agent (edge/EV/Kelly), Risk Manager, Execution Engine (paper puis live),
moteur de backtest, dashboard Next.js, notifications (Discord/Telegram/
Slack/Email/Push).

---

- 👋 Hi, I'm @Kevinbouskila
- 👀 I'm interested in web and mobile app development, chatbot/Voicebot, NFT/Blockchain
- 🌱 I'm currently learning chatbot development
- 📫 How to reach me : kevinbouskila@gmail.com
