# Réservation automatique — Hyrox, dimanche 10h (Centre 16, Maisons-Alfort)

Plateforme : **Resamania** (`member.resamania.com/centreseize`), club `/centreseize/clubs/2020`.

Réserve la séance de **Hyrox du dimanche 10:00** (60 min, CrossBox) **chaque samedi
à 10h00 heure de Paris**, pendant Shabbat.

## État

- [x] Accès réseau à `member.resamania.com` : ouvert
- [x] Identifiants en secrets d'environnement (`C16_EMAIL`, `C16_PASSWORD`)
- [x] Connexion testée de bout en bout (parcours OAuth en deux étapes)
- [x] Sélecteurs réels figés dans `config.json`
- [x] Test à blanc concluant sur le dimanche 8 novembre 2026
- [x] Tâche planifiée du samedi 10h00 créée

## Le cours visé

Aucun cours ne s'appelle « Aerox » au Centre 16. Le planning propose :

| Cours | Jour | Heure | Durée | Lieu | Places |
|---|---|---|---|---|---|
| **Hyrox** (retenu) | dimanche | 10:00 | 60 min | CrossBox | 12 |
| AéroBox | dimanche | 12:00 | 60 min | Studio Fitness | 30 |

`Hyrox` a été retenu : c'est le seul cours du dimanche à 10:00 dont le nom
ressemble à « Aerox ». Avec 12 places seulement, le créneau part vite.

Autres cours du dimanche, si besoin de changer : Pilates 10:00 et 11:00,
WOD 11:00, TRX 12:00, AéroBox 12:00.

## Utilisation

```bash
# Test à blanc : trouve le cours et repère le bouton, sans cliquer
node aerox-booking/book.mjs --dry-run

# Réservation réelle du prochain dimanche
node aerox-booking/book.mjs

# Cibler une date précise (test ou rattrapage)
node aerox-booking/book.mjs --date=2026-11-08
```

Code de sortie `0` si réservé (ou déjà réservé), `1` sinon. En cas d'erreur, une
capture est écrite dans `aerox-booking/erreur.png`.

## Réglages (`config.json`)

- `courseName` / `startTime` — le cours visé (`Hyrox`, `10:00`)
- `weekday` — `0` = dimanche
- `retry` — 10 tentatives espacées de 30 s, au cas où le créneau s'ouvrirait en retard
- `selectors` — sélecteurs réels relevés sur le site, à revoir si Resamania change son interface

## Deux pièges rencontrés, et leur correctif

1. **`networkidle` ne retombe jamais.** La page appelle des domaines tiers
   (Payline, Google Tag Manager) que le proxy de la session refuse ; l'attente
   restait bloquée indéfiniment. Le script n'autorise donc que `*.resamania.com`
   et abandonne tout le reste immédiatement.
2. **Connexion en deux étapes.** Le bouton « Se connecter » redirige vers
   `api.resamania.com/oauth/login/centreseize`, qui demande d'abord l'email
   (`login_step_login[username]`), puis le mot de passe sur un second écran.

## Limite connue

Le dimanche **1er novembre 2026 n'a aucun cours** au planning. La première
exécution, le samedi 31 octobre, ne trouvera donc rien et se terminera en échec :
c'est normal. La première vraie réservation aura lieu le samedi 7 novembre pour
le dimanche 8.

## Fichiers à ne jamais committer

`session.json`, `recon-out/`, `erreur.png` — voir `.gitignore`.
