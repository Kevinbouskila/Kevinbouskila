# SLASH ONE — feuille de route

**SLASH ONE** est l'assistant de direction de Slash Tech : une voix qui pilote une
flotte d'agents Claude Code spécialisés. JARVIS sert de **banc d'essai** pour
l'ergonomie vocale et le poste de pilotage ; SLASH ONE sera une base de code
propre à Slash Tech (contrainte de licence, voir §6).

---

## 1. Premier cas d'usage : décrocher une mission sous 30 jours

| Critère | Valeur |
|---|---|
| TJM plancher | 780 € HT/j (refus automatique en dessous) |
| TJM cible | 850–900 € HT/j |
| Zone | Île-de-France |
| Priorité géographique | Sud et est de Paris, proximité Maisons-Alfort (94) |
| Présentiel | 3 jours/semaine maximum |
| Domaines | IA générative, IA agentique, AI Product Management, AI Product Owner, Head of AI, pilotage de programmes IA |
| Objectif | Mission signée en moins de 30 jours |

**Scoring d'une opportunité** (0–100, pondéré) : TJM 30 · adéquation domaine 25 ·
distance/présentiel 20 · fraîcheur de l'annonce 15 · accessibilité du décideur 10.
Au-dessus de 70 → candidature ; 50–70 → veille ; en dessous → écarté.

**Indicateurs hebdomadaires** : opportunités qualifiées, candidatures envoyées,
taux de réponse, entretiens obtenus, TJM moyen proposé, jours restants sur l'objectif.

---

## 2. Les six agents

Chaque agent est une session Claude Code dédiée, avec un périmètre d'outils
explicite et un niveau d'autonomie. **Aucun n'est développé à ce stade.**

| Agent | Rôle | Entrées | Sorties | Autonomie |
|---|---|---|---|---|
| **SCOUT** | Détecte les missions publiées (plateformes freelance, ESN, jobboards, flux RSS) | Critères §1 | Opportunités scorées | Autonome (lecture seule) |
| **SENTINEL** | Signaux faibles : levées de fonds, créations de postes IA, annonces produit, mouvements de dirigeants | Veille web, actualités | Alertes qualifiées | Autonome (lecture seule) |
| **HUNTER** | Identifie entreprises cibles et décideurs (CTO, CDO, Head of Product), trouve le bon point d'entrée | Sorties SCOUT/SENTINEL | Fiches entreprise + contacts | Autonome (lecture seule) |
| **ENVOY** | Rédige candidatures, messages d'approche et relances | Fiches HUNTER + mon CV | **Brouillons** | **Validation obligatoire avant tout envoi** |
| **PUBLISHER** | Contenus au nom de Slash Tech (LinkedIn, site) | Thèmes, positionnement | **Brouillons** | **Validation obligatoire avant publication** |
| **ANALYST** | Analyse les résultats, identifie ce qui convertit, ajuste le ciblage | Historique complet | Rapport hebdo + recommandations | Autonome (lecture seule) |

**Pipeline** : SCOUT + SENTINEL → HUNTER → ENVOY → (validation humaine) → envoi → ANALYST → réglage des critères.

---

## 3. Architecture cible

```
                      ┌──────────────────────┐
   Voix (FR) ────────▶│   SLASH ONE — noyau  │◀──── Dashboard web
   say / Web Speech   │  orchestrateur vocal │      (orbit + pipeline)
                      └───────┬──────────────┘
                              │ spawn / supervise (abonnement Claude Pro)
         ┌────────────┬───────┴────┬─────────┬──────────┬──────────┐
      SCOUT      SENTINEL       HUNTER     ENVOY    PUBLISHER   ANALYST
         └────────────┴────────────┴─────────┴──────────┴──────────┘
                              │
                     ┌────────┴─────────┐
                     │  CRM (SQLite →   │   opportunités, entreprises,
                     │  Supabase)       │   contacts, candidatures, relances
                     └──────────────────┘
                              │
            Connecteurs MCP : Gmail (brouillons) · Google Calendar ·
            Notion · Google Drive/Sheets · Qonto (lecture) · LinkedIn
```

**Couches** : (1) interface vocale et visuelle · (2) orchestrateur et mémoire ·
(3) agents métier · (4) données (CRM) · (5) connecteurs externes.

---

## 4. Garde-fous (non négociables)

1. **Rien ne sort sans moi.** Aucun agent n'envoie d'e-mail, ne publie, ne poste un
   commentaire ou ne contacte un tiers. ENVOY et PUBLISHER produisent des
   *brouillons*. Techniquement : connecteurs limités aux outils `create_draft`,
   jamais `send_message`.
2. **Aucune dépense.** Aucun agent n'a accès à un moyen de paiement. Qonto en
   lecture seule.
3. **Pas de suppression.** Les agents écrivent dans leur propre espace ; aucune
   suppression de fichier hors de leur bac à sable.
4. **Permissions actives.** `JARVIS_SKIP_PERMISSIONS=false` ; pas de
   `--dangerously-skip-permissions` sur les agents commerciaux.
5. **Journal complet.** Chaque action d'agent est une ligne en base, consultable.
6. **Données personnelles.** HUNTER manipule des données de contact
   professionnelles → RGPD : base de prospection documentée, finalité explicite,
   durée de conservation, droit d'opposition. Pas de scraping de données privées.
7. **Respect des plateformes.** Conditions d'utilisation des jobboards et de
   LinkedIn respectées : pas de scraping automatisé là où il est interdit, API et
   flux officiels en priorité.

---

## 5. Phases

| Phase | Contenu | Sortie | Durée |
|---|---|---|---|
| **0 — Banc d'essai** | JARVIS installé, voix FR, pilotage de sessions validé | Ergonomie vocale éprouvée | en cours |
| **1 — Socle SLASH ONE** | Noyau propre : voix FR, orbit, orchestrateur, CRM SQLite | Base de code Slash Tech, sans dépendance au code sous licence restrictive | 1–2 semaines |
| **2 — SCOUT + HUNTER** | Collecte et qualification, scoring §1 | Un flux quotidien d'opportunités scorées | 1 semaine |
| **3 — ENVOY** | Brouillons de candidature et relances, validation humaine | Candidatures prêtes à relire | 1 semaine |
| **4 — SENTINEL + ANALYST** | Signaux faibles, rapport hebdo, réglage du ciblage | Boucle d'apprentissage | 1 semaine |
| **5 — PUBLISHER** | Contenus Slash Tech | Présence éditoriale | 1 semaine |
| **6 — Application** | App indépendante reliée à l'écosystème Slash Tech | Produit | ultérieur |

**La mission freelance n'attend pas la phase 2.** En parallèle de la phase 1, la
recherche se fait à la main avec Claude en appui : les agents industrialisent un
processus qui doit d'abord faire ses preuves manuellement.

---

## 6. Contrainte de licence — décision structurante

Le dépôt `ericdjavid/jarvis` (et son amont `ethanplusai/jarvis`) est sous licence
propriétaire **personal / non-commercial** : interdiction d'usage commercial,
direct ou indirect, et des œuvres dérivées, sans licence auprès de
https://ethanplus.ai.

Un assistant qui prospecte pour Slash Tech est un usage commercial indirect.
Donc : **phase 0 en évaluation personnelle sur le code de JARVIS, puis phase 1 sur
une base propre**. Ce qui se réutilise librement, ce sont les *idées* vérifiées en
phase 0 (le modèle d'orbite, le mode micro à trois états, la coupure sur « stop »,
la supervision des sessions bloquées), pas le code. Alternative si tu préfères
capitaliser sur le code existant : acheter une licence commerciale à l'auteur —
à arbitrer selon son tarif.
