#!/bin/bash
# install_jarvis.sh — Phase B : installation idempotente de JARVIS sur macOS.
# N'installe aucun service payant, ne touche à aucun réglage de sécurité macOS.
# Usage : bash install_jarvis.sh [dossier-cible]    (défaut : ~/Dev/jarvis)
set -euo pipefail
DEST="${1:-$HOME/Dev/jarvis}"
REPO="https://github.com/ericdjavid/jarvis"
BRANCH="eric/orbit"
PATCH="$(cd "$(dirname "$0")/.." && pwd)/patches/0001-voix-francaise-macos-gratuite.patch"
step(){ printf "\n\033[1m>> %s\033[0m\n" "$1"; }

step "Prérequis"
for c in git python3 node npm openssl; do command -v "$c" >/dev/null || { echo "ERREUR : $c absent. Lance d'abord audit_mac.sh."; exit 1; }; done
command -v claude >/dev/null || echo "AVERTISSEMENT : Claude Code absent (npm install -g @anthropic-ai/claude-code), JARVIS n'aura pas de cerveau."

step "Récupération du dépôt ($BRANCH)"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" remote get-url origin | grep -qi 'ericdjavid/jarvis' || { echo "ERREUR : $DEST existe et n'est pas ce dépôt."; exit 1; }
  git -C "$DEST" fetch origin "$BRANCH" && git -C "$DEST" checkout "$BRANCH" && git -C "$DEST" pull --ff-only origin "$BRANCH"
else
  mkdir -p "$(dirname "$DEST")" && git clone --branch "$BRANCH" "$REPO" "$DEST"
fi
cd "$DEST"

step "Environnement Python (.venv)"
[ -d .venv ] || python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip >/dev/null
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python -m playwright install chromium

step "Dépendances front"
( cd frontend && npm install )

step "Fichier .env"
if [ ! -f .env ]; then
  cp .env.example .env
  # Voix française macOS gratuite, et pas de clé payante requise.
  {
    echo ""
    echo "# --- Configuration SLASH ONE ---"
    echo "JARVIS_TTS_PROVIDER=macos"
    echo "JARVIS_MACOS_VOICE=Thomas"
    echo "JARVIS_STT=browser"
    echo "USER_NAME=Kevin"
    echo "JARVIS_SKIP_PERMISSIONS=false"
  } >> .env
  # neutralise la clé Fish factice du modèle
  sed -i '' 's/^FISH_API_KEY=your-fish-audio-api-key-here/# FISH_API_KEY=/' .env || true
  echo "  .env créé. (.env est déjà dans .gitignore : aucun secret ne partira dans Git.)"
else
  echo "  .env déjà présent, laissé tel quel."
fi
grep -q '^\.env$' .gitignore || echo "AVERTISSEMENT : .env n'est pas dans .gitignore !"

step "Certificats HTTPS locaux (auto-signés, localhost)"
if [ -f cert.pem ] && [ -f key.pem ]; then echo "  déjà présents."
else openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost' 2>/dev/null && echo "  générés."; fi
chmod 600 key.pem

step "Patch voix française macOS (réversible)"
if git diff --quiet -- tts.py server.py preflight.py && ! grep -q synthesize_macos tts.py; then
  git apply --check "$PATCH" && git apply "$PATCH" && echo "  appliqué. Pour revenir en arrière : git -C $DEST checkout -- tts.py server.py preflight.py"
else
  echo "  déjà appliqué ou fichiers modifiés — rien fait."
fi

step "Vérification"
./.venv/bin/python -c "import ast;[ast.parse(open(f).read()) for f in ['tts.py','server.py','preflight.py']];print('  modules Python syntaxiquement valides')"
./.venv/bin/python -c "import tts,inspect;assert hasattr(tts,'synthesize_macos');print('  backend voix macOS présent')"
say -v Thomas "Installation terminée, monsieur." 2>/dev/null && echo "  voix française testée à voix haute" || echo "  AVERTISSEMENT : voix Thomas indisponible, installe-la dans Réglages Système."

printf "\n\033[1mInstallé dans %s\033[0m\nDémarrage : ouvre un onglet Warp, puis  cd %s && ./start.sh\n" "$DEST" "$DEST"
