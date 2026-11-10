# Audit, tests et bilan — 10 novembre 2026

## 1. Ce qui a été réellement fait, et où

Cette session Claude Code tourne dans un **conteneur Linux dans le cloud**
(`Linux x86_64`, `/home/user/Kevinbouskila`), pas sur le Mac. Aucun dossier du Mac
n'est partagé via Remote Control (vérifié : liste vide). **L'audit du Mac (phase A)
et les phases B à F ne pouvaient donc pas être exécutés ici.** Ce qui a été fait :

| Phase | État | Preuve |
|---|---|---|
| A — Audit Mac | **Non exécutable ici.** Script livré : `scripts/audit_mac.sh` | — |
| B — Installation | **Non exécutable ici.** Script livré : `scripts/install_jarvis.sh` | — |
| Audit du dépôt | **Fait** | Clone réel de `eric/orbit`, lecture du README, du LICENSE, de `.env.example`, `start.sh`, `tts.py`, `server.py`, `preflight.py`, `claude_env.py` |
| C — Claude Code / coût | **Vérifié dans le code** | `claude_env.py` : `SCRUBBED_ENV_PREFIXES = ("CLAUDE_CODE_", "ANTHROPIC_")` |
| D — Voix FR gratuite | **Code écrit et testé partiellement** | Patch `patches/0001-...patch`, voir §3 |
| E — Premier démarrage | **Non exécutable ici** | Procédure dans `README.md` |
| F — Tests fonctionnels | **Non exécutables ici** (micro requis) | Scénarios dans `MISSION_JARVIS_LOCAL.md` |
| G — Roadmap | **Fait** | `SLASH_ONE_ROADMAP.md` |

## 2. Audit du dépôt `ericdjavid/jarvis`, branche `eric/orbit`

La branche existe. Fork francisé de `ethanplusai/jarvis`. Backend Python
(FastAPI/httpx, `server.py` ~7000 lignes), front Vite + TypeScript, SQLite,
`start.sh` en zsh, migrations, tests pytest, skills.

**Contraintes dures du projet** (README, *Requirements*) :

- **macOS obligatoire** — contrôle des fenêtres, captures, notifications : tout passe par AppleScript. Aucun chemin Linux ni Windows.
- **Google Chrome obligatoire** — le micro utilise l'API Web Speech (`frontend/src/voice.ts`), que Firefox n'a jamais implémentée. Aucune transcription serveur en secours.
- **Claude Code ≥ 2.1.224**, connecté. **Python ≥ 3.11**, **Node ≥ 18**.
- **Warp recommandé** pour lancer : macOS accorde le droit de déplacer des fenêtres à l'app qui lance JARVIS.
- **Certificats HTTPS locaux obligatoires**, sinon chaque appel API renvoie 500 pendant que la page s'affiche normalement.

**Deux points de sécurité relevés dans le code, à corriger pour ton usage :**

1. `JARVIS_SKIP_PERMISSIONS` vaut **`true` par défaut** (`server.py`), ce qui lance les agents avec `--dangerously-skip-permissions`. Le commentaire du projet l'assume : un assistant vocal ne peut pas répondre à une invite interactive. C'est **directement contraire à ton Test 6**. Le script d'installation écrit donc `JARVIS_SKIP_PERMISSIONS=false` dans `.env`. Conséquence à accepter : une session qui tombe sur une demande de permission se bloquera en attendant ta touche — c'est précisément ce que l'onglet Sessions du dashboard sait signaler.
2. `POST /api/runs` lance de vraies sessions Claude Code avec ton autorité complète. Le bind est en `127.0.0.1` et un contrôle d'`Origin` protège les WebSockets. Ne passe jamais `--host 0.0.0.0`.

## 3. Voix française gratuite — ce que j'ai écrit, et ce qui reste à vérifier

**Le problème.** `tts.py` ne connaît que deux fournisseurs, **ElevenLabs** et
**Fish Audio**, tous deux payants, et **sans fallback** : sans clé, `tts.py`
retourne `None`, JARVIS devient muet et ses réponses s'affichent en texte. Aucun
chemin `say` macOS n'existe. Pour l'écoute, en revanche, l'absence de clé
ElevenLabs fait automatiquement basculer sur l'API Web Speech de Chrome —
gratuite, et déjà configurée en français.

**Le correctif** (`patches/0001-voix-francaise-macos-gratuite.patch`, 3 fichiers,
+72 lignes, aucune suppression) :

- `tts.py` : ajout d'une fonction `synthesize_macos()` qui appelle `say -v Thomas -o out.aiff`, convertit en WAV 16 bits via `afconvert`, et renvoie les octets. WAV parce que le front décode avec `decodeAudioData` (`frontend/src/voice.ts:576`), qui accepte le WAV partout. Échec → `None`, exactement comme les fournisseurs payants : on dégrade vers le texte, on ne lève pas d'exception.
- `server.py` : `JARVIS_TTS_PROVIDER=macos` force cette voix ; c'est aussi le repli automatique quand aucune clé payante n'est présente. `synthesize_speech()` branche dessus avant l'appel HTTP.
- `preflight.py` : le contrôle de démarrage ne réclame plus de clé quand la voix macOS est choisie.

**Réversible** : `git checkout -- tts.py server.py preflight.py`.

**Testé — honnêtement :**

| Vérification | Résultat |
|---|---|
| Les trois fichiers restent syntaxiquement valides | **OK** (`ast.parse`) |
| Routage `provider="macos"` → sous-processus → octets WAV retournés | **OK**, avec des `say`/`afconvert` factices sur Linux : retourne bien l'en-tête `RIFF....WAVE` |
| Chemin « pas de clé » inchangé pour Fish/ElevenLabs | **OK** (retourne `None`) |
| Qualité et latence de la vraie voix Thomas | **NON TESTÉ** — pas de macOS ici |
| Intégration bout en bout (parler, entendre) | **NON TESTÉ** — micro requis |

Autrement dit : la plomberie est juste, la voix reste à entendre. C'est la
première chose à vérifier sur ton Mac (commande donnée dans `MISSION_JARVIS_LOCAL.md`, étape 4).

Si la voix `say` te paraît trop robotique, l'étape suivante logique est un TTS
neuronal local (Piper ou Kokoro, modèle FR de 100–200 Mo, 0 € récurrent) : le même
point d'extension dans `tts.py` convient, seule la commande change.

## 4. Coûts

| Poste | Coût |
|---|---|
| Cerveau JARVIS (Claude Code) | **0 €** en plus — ton abonnement Claude Pro. `claude_env.py` strippe tout `ANTHROPIC_*` des processus enfants : aucune bascule accidentelle vers une API facturée n'est possible, même avec une clé dans `.env`. |
| Voix (synthèse) | **0 €** — `say` macOS, hors ligne |
| Écoute (transcription) | **0 €** — API Web Speech de Chrome |
| Dépendances Python/npm | **0 €** |
| **Total** | **0 €** |

Une seule limite réelle : les **deux fenêtres de quota** de ton abonnement Claude
Pro (5 heures et 7 jours). L'onglet Usage du dashboard les affiche. Faire tourner
plusieurs agents en parallèle les consomme vite — d'où la consigne de valider une
session avant d'en lancer plusieurs.

## 5. Licence — point bloquant pour Slash Tech

`LICENSE` n'est pas une licence open source. C'est une licence propriétaire
*personal / non-commercial*, © 2026 Ethan Rogers :

- **Autorisé** : usage, copie, modification, exécution à des fins personnelles, éducatives et non commerciales.
- **Interdit sans licence commerciale** : vendre le logiciel ou un dérivé, l'intégrer à un produit ou service payant, **« l'utiliser pour générer du revenu, directement ou indirectement »**, l'héberger en SaaS.
- **Obligation** : conserver la notice de copyright dans toute copie.
- **Licence commerciale** : https://ethanplus.ai

Un assistant qui prospecte pour Slash Tech relève de l'usage commercial indirect.
Décision retenue : **phase 0 en évaluation personnelle**, puis base de code propre
pour SLASH ONE (voir `SLASH_ONE_ROADMAP.md` §6). Les dépendances elles-mêmes
(FastAPI, httpx, Vite, three.js…) sont en licences permissives et ne posent pas de
problème.

## 6. Prochaine étape

Colle le contenu de `MISSION_JARVIS_LOCAL.md` dans une session `claude` ouverte
dans Warp **sur ton Mac**, et renvoie-moi la sortie de l'audit, les erreurs de
`logs/jarvis.log` et le résultat des tests T1→T6.
