#!/bin/bash
# audit_mac.sh — Phase A : audit en lecture seule du Mac. N'installe RIEN.
# Usage : bash audit_mac.sh
set -u
ok(){ printf "  \033[32mOK\033[0m   %s\n" "$1"; }
ko(){ printf "  \033[31mMANQUE\033[0m %s\n" "$1"; }
wn(){ printf "  \033[33mATTENTION\033[0m %s\n" "$1"; }
h(){ printf "\n\033[1m== %s\033[0m\n" "$1"; }

h "Système"
sw_vers 2>/dev/null | sed 's/^/  /' || echo "  (pas macOS : ce script est fait pour macOS)"
echo "  Architecture : $(uname -m)  ($( [ "$(uname -m)" = arm64 ] && echo 'Apple Silicon' || echo 'Intel'))"
echo "  RAM : $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1073741824 )) Go"
echo "  Disque libre : $(df -h / | awk 'NR==2{print $4}')"

h "Outils requis"
for c in brew git python3 node npm claude openssl lsof; do
  if command -v "$c" >/dev/null 2>&1; then
    case "$c" in
      python3) v=$(python3 -V 2>&1);;
      node)    v="node $(node -v)";;
      npm)     v="npm $(npm -v)";;
      brew)    v="$(brew --version | head -1)";;
      git)     v="$(git --version)";;
      claude)  v="claude $(claude --version 2>/dev/null | head -1)";;
      *)       v="$c présent";;
    esac
    ok "$v  ($(command -v $c))"
  else
    ko "$c absent"
  fi
done

h "Versions minimales"
PYV=$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null || echo 0)
awk -v v="$PYV" 'BEGIN{split(v,a,".");exit !(a[1]>3||(a[1]==3&&a[2]>=11))}' \
  && ok "Python $PYV >= 3.11" || ko "Python $PYV < 3.11 requis"
NODEV=$(node -v 2>/dev/null | tr -d v | cut -d. -f1 || echo 0)
[ "${NODEV:-0}" -ge 18 ] 2>/dev/null && ok "Node $NODEV >= 18" || ko "Node ${NODEV:-absent} < 18 requis"

h "Applications"
for app in "Google Chrome" "Warp"; do
  if [ -d "/Applications/$app.app" ] || [ -d "$HOME/Applications/$app.app" ]; then ok "$app installé"
  else ko "$app absent"; fi
done

h "Claude Code — authentification et facturation"
if command -v claude >/dev/null 2>&1; then
  claude auth status 2>&1 | sed 's/^/  /' || wn "claude auth status indisponible (lance 'claude' une fois)"
else ko "Claude Code absent : npm install -g @anthropic-ai/claude-code"; fi
LEAK=$(env | grep -E '^(ANTHROPIC_|CLAUDE_CODE_|CLAUDECODE)' | cut -d= -f1 | tr '\n' ' ')
[ -z "$LEAK" ] && ok "aucune variable ANTHROPIC_*/CLAUDE_CODE_* exportée (pas de risque de facturation API)" \
  || wn "variables présentes : $LEAK — JARVIS les strippe pour ses enfants, mais vérifie ton shell"

h "Voix française disponible nativement (gratuit)"
if command -v say >/dev/null 2>&1; then
  V=$(say -v '?' 2>/dev/null | grep -i 'fr_FR' | awk '{print $1}' | tr '\n' ' ')
  [ -n "$V" ] && ok "voix fr_FR installées : $V" \
    || wn "aucune voix fr_FR : Réglages Système > Accessibilité > Contenu énoncé > Voix système > Gérer les voix > Français"
  command -v afconvert >/dev/null && ok "afconvert présent (conversion AIFF->WAV)" || ko "afconvert absent"
else ko "commande 'say' absente"; fi

h "Ports utilisés par JARVIS"
for p in 8340 5173; do
  if lsof -ti tcp:$p >/dev/null 2>&1; then wn "port $p déjà occupé par PID $(lsof -ti tcp:$p | tr '\n' ' ')"
  else ok "port $p libre"; fi
done

h "Autorisations macOS à vérifier à la main"
echo "  - Accessibilité  : Warp doit y être coché (focus des fenêtres de session)."
echo "  - Microphone     : Chrome, à l'ouverture du dashboard."
echo "  - Automation     : Warp/Terminal autorisé à piloter Google Chrome (AppleScript)."
echo "  Réglages Système > Confidentialité et sécurité. Aucune protection à désactiver."
printf "\n\033[1mAudit terminé.\033[0m\n"
