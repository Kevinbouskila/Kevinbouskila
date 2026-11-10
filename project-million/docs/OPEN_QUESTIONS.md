# OPEN_QUESTIONS.md — informations manquantes avant de coder

> Les questions **bloquantes** empêchent de démarrer la phase indiquée.
> Les autres ont une valeur par défaut que je prendrai sauf avis contraire.

---

## Bloquantes

### Q1 — Charte graphique Slash Tech (bloque la Phase 3)
`slashtech.io` et `www.slashtech.io` **ne résolvent pas** depuis cette session, même après
ouverture du réseau (un autre hôte ouvert en même temps, `raw.githubusercontent.com`, répond
normalement — l'ouverture a donc bien pris effet). Je ne peux ni lire le CSS, ni extraire les
tokens.

Le brief interdit de deviner les valeurs lorsqu'elles sont accessibles dans le code. Il me faut
donc l'un de ces trois éléments :
1. les captures d'écran annoncées (vitrine + back-office), ou
2. le fichier de tokens / variables CSS / config Tailwind du site, ou
3. la liste explicite : hex des violets et magentas, dégradé signature, famille de police,
   rayons d'arrondi, échelle d'espacement.

En attendant, j'ai relevé qu'une skill `slashtech-brand` existe dans ton compte et mentionne
violet `#7C3AED` → magenta `#EC4899` et la police Inter. **Je n'ai pas appliqué ces valeurs** :
je veux ta confirmation qu'elles font autorité, ou tes captures.

### Q2 — Dépôt `project-million` (bloque la Phase 1)
Tu veux un dépôt privé dédié, et pas de création distante pour l'instance — noté, je n'ai rien
créé. Mais j'ai besoin de savoir où le code doit vivre :
- **(a)** tu crées `project-million` privé sur GitHub et me l'attaches → je développe dedans ;
- **(b)** je développe en local dans ce conteneur et tu récupères une archive ;
- **(c)** tu lances une nouvelle session Claude Code sur ton Mac, dans un `project-million`
  local, et ces documents servent de point de départ.

Compte tenu de la décision 4 (développement local sur ton Mac), **(c)** est probablement ce que
tu veux. Dis-le moi : ça change ce que je fais de ces fichiers.

### Q3 — Les 5 agents d'arbitrage (bloque la Phase 2)
Ils ont besoin de carnets d'ordres multi-plateformes synchronisés sub-seconde, que le MVP
n'aura pas. Mon choix par défaut : les créer et les marquer `NOT_TESTABLE` avec le motif,
sans PnL ni rang — donc **15 agents sur 20 réellement en compétition**. C'est la seule option
compatible avec l'interdiction de fabriquer des résultats.

Alternatives possibles : (a) accepter 15 compétiteurs, (b) remplacer les 5 par 5 stratégies
testables en gardant le nom de la famille, (c) budgéter une source de données tick payante
(coût à chiffrer, donc validation requise). **Je prends (a) sauf avis contraire.**

---

## Non bloquantes — mes valeurs par défaut

| # | Question | Défaut que je prends |
|---|---|---|
| Q4 | Univers d'actifs | Crypto spot, BTC/EUR et ETH/EUR, bougies 1 min, données publiques gratuites Binance (Kraken en recoupement). Seul univers gratuit avec un historique minute profond et un marché 24/7 cohérent avec un horizon de 30 jours. |
| Q5 | Audit du Mac | Je tourne dans un conteneur cloud Linux, **pas sur ton Mac** : je n'ai pas pu auditer ton environnement réel. L'audit ici donne Python 3.13.18, Node 22.23.4, npm/pnpm/yarn, `uv`, git. Sur ton Mac il faudra vérifier Homebrew, Python 3.12+, Node 20+. |
| Q6 | Horizon de la compétition | 30 jours calendaires de données, en backtest d'abord, paper trading ensuite. |
| Q7 | Réinvestissement | Capitalisation intégrale par défaut (c'est la seule façon mathématique d'approcher ×1 000 000) ; les règles alternatives sont comparées en Monte-Carlo. |
| Q8 | Modèle de frais | Frais taker 0,10 %, spread mesuré sur les données, slippage proportionnel à la taille relative au volume de la barre. Paramétrable, et la sensibilité aux frais est un livrable du Monte-Carlo. |
| Q9 | Taille minimale d'ordre | Contrainte dure et majeure : avec 1 € de capital, la plupart des plateformes imposent un minimum de 5 à 10 € par ordre. **Un bot à 1 € ne peut légalement passer aucun ordre réel.** Au MVP (virtuel) j'applique les minima réels de la plateforme et les agents bloqués par ce minimum sont marqués comme tels — c'est un résultat, pas un bug. À arbitrer avant toute phase réelle. |
| Q10 | Synthèse vocale | Web Speech API du navigateur, gratuite, zéro clé. ElevenLabs câblé mais désactivé ; activation sur validation (~5 $/mois au premier palier payant). |
| Q11 | LLM pour JARVIS | Aucun appel LLM au MVP : routeur d'intentions déterministe pour les 11 commandes. Un repli LLM sera proposé séparément, avec estimation de coût. |
| Q12 | Authentification | Utilisateur unique, mot de passe haché Argon2id, session cookie. Pas d'OAuth, pas de multi-utilisateur. |
| Q13 | Probabilité d'atteindre 1 M€ | Affichée uniquement depuis le Monte-Carlo, étiquetée « estimation statistique sous hypothèses », avec les hypothèses visibles. Jamais de pourcentage sans modèle. |
| Q14 | Hébergement | À chiffrer en Phase 6. Un VPS à 5–10 €/mois suffit techniquement. Rien n'est souscrit sans validation. |

---

## Risques identifiés

| Risque | Gravité | Traitement |
|---|---|---|
| ×1 000 000 en 30 jours exige ~+54 %/jour composés, soit un facteur sans précédent sur un marché liquide. | Élevée | Ce n'est pas un risque technique mais un fait à mesurer. Le système est conçu pour le mesurer honnêtement, y compris pour conclure à l'échec. |
| La taille minimale d'ordre rend un capital de 1 € inexploitable sur le marché réel (Q9). | Élevée | Modélisée dès la Phase 1, et affichée comme contrainte structurelle. |
| Biais de survivant sur 20 agents : le meilleur sur 20 paraîtra bon par pur hasard. | Élevée | Monte-Carlo sur agents corrélés, et split `test` verrouillé avec compteur d'accès. |
| Surajustement en validation. | Moyenne | Nombre d'évaluations compté et affiché par version de stratégie. |
| Web Speech API absente ou partielle hors Chrome/Edge. | Moyenne | Mode texte et clavier équivalent à 100 % des commandes vocales. |
| Limites de débit Binance sur de longs téléchargements. | Faible | Cache Parquet, téléchargement incrémental, pause automatique. |
| Licence JARVIS non commerciale. | Résolue | Réimplémentation originale, aucun code copié. Voir `PROJECT_SPEC.md` §6. |
