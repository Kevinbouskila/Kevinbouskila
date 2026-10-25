# Réservation automatique — Aerox, dimanche 10h (Centre 16, Maisons-Alfort)

Réserve la séance d'Aerox du dimanche 10h **chaque samedi à 10h00 (heure de Paris)**,
c'est-à-dire exactement 24h avant la séance, pendant Shabbat.

## État

- [x] Scripts écrits (`recon.mjs`, `book.mjs`)
- [ ] **Accès réseau à `www.centre16.fr` à autoriser** dans la politique réseau de l'environnement
- [ ] Identifiants à enregistrer en secrets (`C16_EMAIL`, `C16_PASSWORD`)
- [ ] Reconnaissance à lancer pour figer les sélecteurs dans `config.json`
- [ ] Tâche planifiée du samedi 10h00 à créer

## Étapes

### 1. Autoriser le domaine

Menu de l'environnement cloud (barre de titre de la session) → **Edit** → **Network access** →
ajouter `www.centre16.fr` (et `centre16.fr`) sous **Allowed domains**, en laissant
« Allow package managers » coché.
Doc : https://code.claude.com/docs/en/cloud-environments#network-access

### 2. Enregistrer les identifiants

Dans les **secrets** de l'environnement, jamais dans ce dépôt :

| Secret | Valeur |
|---|---|
| `C16_EMAIL` | email du compte Centre 16 |
| `C16_PASSWORD` | mot de passe |

### 3. Reconnaissance (une fois)

```bash
node aerox-booking/recon.mjs
```

Capture les pages dans `aerox-booking/recon-out/` et enregistre la session dans
`aerox-booking/session.json`. Les sélecteurs exacts sont ensuite écrits dans
`config.json` (champ `selectors`), qui utilise pour l'instant des heuristiques.

### 4. Test à blanc

```bash
node aerox-booking/book.mjs --dry-run
```

Vérifie que le cours est trouvé et que le bouton « Réserver » est repéré, **sans cliquer**.

### 5. Réservation réelle

```bash
node aerox-booking/book.mjs
```

Code de sortie `0` si réservé, `1` sinon. En cas d'erreur, une capture d'écran est
écrite dans `aerox-booking/erreur.png`.

## Réglages (`config.json`)

- `courseName` / `startTime` — le cours visé (`AEROX`, `10:00`)
- `weekday` — `0` = dimanche
- `retry` — 15 tentatives espacées de 20 s, au cas où l'ouverture du créneau serait décalée

## Fichiers à ne jamais committer

`session.json` (cookies de connexion), `recon-out/`, `erreur.png` — voir `.gitignore`.
