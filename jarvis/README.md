# JARVIS / SLASH ONE — démarrer et arrêter

Ce dossier contient tout ce qu'il faut pour installer et faire tourner JARVIS
(branche `eric/orbit` de `ericdjavid/jarvis`) sur un Mac, **sans aucun service
payant** : voix française via `say` (macOS, gratuit, hors ligne), écoute via
l'API Web Speech de Chrome (gratuite), cerveau via **ton abonnement Claude Pro**.

> **Licence — à lire.** Le code de JARVIS est sous licence propriétaire
> *personal / non-commercial* (© 2026 Ethan Rogers). L'usage personnel et
> éducatif est libre ; **tout usage commercial, direct ou indirect, est interdit
> sans licence** (contact : https://ethanplus.ai). L'installation décrite ici est
> à usage personnel d'évaluation. Voir `AUDIT_ET_BILAN.md`.

## Contenu

| Fichier | Rôle |
|---|---|
| `scripts/audit_mac.sh` | Phase A : audit en lecture seule du Mac. N'installe rien. |
| `scripts/install_jarvis.sh` | Phase B : clone, venv, npm, `.env`, certificats, patch voix. Idempotent. |
| `patches/0001-voix-francaise-macos-gratuite.patch` | Ajoute un backend TTS `macos` à `tts.py`. Réversible. |
| `MISSION_JARVIS_LOCAL.md` | Le prompt à coller dans une session Claude Code **sur ton Mac**. |
| `SLASH_ONE_ROADMAP.md` | Feuille de route de l'assistant commercial SLASH ONE. |
| `AUDIT_ET_BILAN.md` | Audit du dépôt, tests, limites, coûts. |

## Installation (une fois)

```bash
bash scripts/audit_mac.sh
```

```bash
bash scripts/install_jarvis.sh ~/Dev/jarvis
```

Puis, **une seule fois**, les autorisations macOS (aucune protection n'est désactivée) :

- **Réglages Système › Confidentialité et sécurité › Accessibilité** → cocher **Warp**, puis **quitter et relancer Warp**. Sans ça, cliquer sur une session dans l'Orbit ne ramènera pas sa fenêtre au premier plan.
- **Micro** : Chrome demandera l'autorisation à l'ouverture du dashboard. Accepter.
- **Automatisation** : Warp demandera à piloter Google Chrome (ouverture de liens).
- Si aucune voix française : **Réglages Système › Accessibilité › Contenu énoncé › Voix système › Gérer les voix** → Français (Thomas, Audrey).

## Démarrer

Toujours **depuis un onglet Warp** (macOS accorde le contrôle des fenêtres à l'app qui lance JARVIS) :

```bash
cd ~/Dev/jarvis && ./start.sh
```

`start.sh` tue toute instance précédente, démarre le backend (`:8340`, HTTPS local), le front Vite (`:5173`) et ouvre Chrome sur le dashboard.

- Interface vocale : `http://localhost:5173`
- Dashboard : `http://localhost:5173/dashboard.html`

**Clique une fois dans la page** pour autoriser le son, puis dis « Jarvis » ou clique sur le réacteur.

Raccourcis : **J** change le mode micro (mot d'activation / écoute continue / coupé) · **Échap** fait taire JARVIS · **1-9** ouvrent la session correspondante.

## Arrêter

Dans l'onglet Warp où tourne JARVIS : **Ctrl-C**. Puis, pour être sûr que rien ne survit (le serveur garde le micro et le cerveau vivants même après avoir rendu les ports) :

```bash
pkill -f 'server.py --host'; lsof -ti tcp:8340 -ti tcp:5173 | xargs kill 2>/dev/null; pkill -f 'vite --port 5173'
```

Vérifier que c'est bien arrêté :

```bash
lsof -ti tcp:8340 tcp:5173 || echo "JARVIS est arrêté"
```

## Logs

```bash
tail -f ~/Dev/jarvis/logs/jarvis.log
```

## Pièges connus

- **Le port du micro.** L'autorisation micro de Chrome est liée à l'origine *avec le port*. Si Vite démarre sur 5174 (port 5173 occupé), l'autorisation ne suit pas et Chrome **ne redemande pas** : le micro reste muet en silence. `start.sh` utilise `--strictPort`, donc il échouera franchement plutôt que de glisser — libère le port 5173.
- **Les certificats sont obligatoires.** Sans `cert.pem`/`key.pem`, le backend sert du HTTP, le proxy Vite ne l'atteint plus et chaque appel API renvoie 500 alors que la page s'affiche normalement.
- **Chrome uniquement.** Firefox n'implémente pas `SpeechRecognition` ; il n'y a aucune transcription côté serveur en secours.
- **Lancer depuis une autre app que Warp** (ou depuis une session Claude Code) casse le focus des fenêtres.
