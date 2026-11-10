# Prompt à coller dans Claude Code **sur ton Mac**

Ouvre Warp, `cd ~/Dev` (ou où tu veux), lance `claude`, puis colle le bloc ci-dessous.
Cette session-là a les accès que la session cloud n'a pas : ton système, ton micro,
tes autorisations macOS.

> Prérequis côté toi : récupère ce dossier `jarvis/` sur ton Mac (il est poussé sur
> la branche `claude/friendly-cannon-be01sx` du dépôt `kevinbouskila/kevinbouskila`),
> ou recopie simplement les deux scripts et le patch.

---

```
Tu es un ingénieur logiciel senior. Mission : installer et rendre réellement
opérationnel JARVIS (branche eric/orbit de https://github.com/ericdjavid/jarvis)
sur ce Mac, avec une conversation vocale bidirectionnelle en français, à coût zéro.

CONTRAINTES ABSOLUES
- Aucun service payant, aucun abonnement, aucune clé API facturée à l'usage.
  La voix passe par `say` (macOS) et l'écoute par l'API Web Speech de Chrome.
- Le cerveau tourne sur mon abonnement Claude Pro. Vérifie qu'aucune variable
  ANTHROPIC_* / CLAUDE_CODE_* n'est exportée dans mon shell, et ne crée aucune
  clé API Anthropic.
- Ne désactive aucune protection macOS. Pour chaque autorisation nécessaire,
  explique-moi quoi cocher et pourquoi, et attends que je l'aie fait.
- Ne stocke aucun secret dans Git. `.env` doit rester ignoré.
- Ne déclare rien "opérationnel" sans l'avoir testé et m'avoir montré la sortie.
- Avant toute installation système (Homebrew, npm -g, brew install), présente-moi
  la liste exacte de ce que tu vas installer et demande mon accord.

ÉTAPES
1. Lance `bash <chemin>/scripts/audit_mac.sh` et commente le résultat :
   dis-moi uniquement ce qui manque et ce que ça implique.
2. Installe les prérequis manquants (gratuits uniquement), après mon accord.
3. Lance `bash <chemin>/scripts/install_jarvis.sh ~/Dev/jarvis`. Il clone la
   branche eric/orbit, crée .venv, installe les dépendances Python et npm,
   crée .env (JARVIS_TTS_PROVIDER=macos, JARVIS_STT=browser,
   JARVIS_SKIP_PERMISSIONS=false), génère cert.pem/key.pem et applique le patch
   patches/0001-voix-francaise-macos-gratuite.patch (backend TTS macOS gratuit
   ajouté à tts.py — écrit et testé en amont, mais jamais exécuté sur macOS :
   c'est à toi de le vérifier pour de vrai).
4. Vérifie l'installation sans me solliciter :
   - `./.venv/bin/python -m pytest -q` (note les tests qui échouent déjà en amont)
   - `./.venv/bin/python -c "import asyncio,tts;print(len(asyncio.run(tts.synthesize_macos('Bonjour monsieur, je suis Slash One.')).audio))"`
     → doit afficher une taille de WAV non nulle. Sinon corrige.
   - `say -v Thomas "Test"` doit s'entendre.
   - `claude auth status` → connecté, sans clé API.
5. Démarre : `cd ~/Dev/jarvis && ./start.sh` depuis CET onglet Warp. Vérifie que
   :8340 et :5173 écoutent, que le dashboard répond (curl), et lis logs/jarvis.log
   pour en extraire les erreurs réelles.
6. Dis-moi précisément quelles autorisations macOS cocher, puis fais-moi passer
   les tests qui exigent ma voix :
   T1 « Jarvis » → il s'active et le réacteur change d'état.
   T2 « Jarvis, présente-toi en français. » → réponse pertinente, prononcée en FR.
   T3 « Jarvis, lance un agent Claude Code qui analyse le projet SLASH ONE. »
       → une session apparaît dans l'Orbit et une ligne dans l'onglet Runs.
   T4 « Jarvis, où en est mon agent ? » → résumé oral de l'état réel.
   T5 « Stop » → la voix se coupe net.
   T6 Sécurité : avec JARVIS_SKIP_PERMISSIONS=false, vérifie qu'une action
       sensible (suppression de fichier, envoi d'e-mail, dépense) déclenche bien
       une demande de permission et ne passe pas en silence. Vérifie aussi que
       data/jarvis/connections.json ne contient aucun connecteur capable
       d'envoyer un e-mail ou de publier.
7. Pour chaque test : réussi / échoué / nécessite mon micro. Ne maquille rien.
8. Si tu dois modifier le code de JARVIS, fais-le de façon isolée et réversible
   (un commit par sujet, dans un clone local, jamais poussé vers le dépôt amont),
   et explique-moi pourquoi.

ATTENTION LICENCE : le LICENSE de ce projet interdit l'usage commercial. On reste
en évaluation personnelle. Ne construis aucun agent commercial à partir de ce code.
```

---

Quand il a fini, renvoie-moi ici sa sortie (surtout l'audit, les erreurs de
`logs/jarvis.log` et le résultat des tests T1→T6) : j'enchaîne sur les correctifs
et sur la Phase G.
