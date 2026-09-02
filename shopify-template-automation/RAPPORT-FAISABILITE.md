# Rapport de faisabilité — Pipeline automatisé de vente d'un template Shopify

**Date :** 2 septembre 2026
**Périmètre :** évaluation technique, pas de construction du produit final.
**Règle de rédaction :** aucune capacité n'est affirmée sans source officielle. Les points non
documentés publiquement sont marqués « non documenté » et traités comme non acquis.

---

## 0. Résumé exécutif (TL;DR)

| Étape | Scénario A — Vendre le thème comme produit digital dans **ma** boutique | Scénario B — Soumettre au **Shopify Theme Store** |
|---|---|---|
| **1. Création du thème** | ✅ Automatisable de bout en bout (génération locale + `themeCreate`/`themeFilesUpsert` ou Shopify CLI) | ⚠️ Génération automatisable, **conformité et originalité jugées par un humain** (revue Shopify) |
| **2. Fiche produit / listing** | ✅ Automatisable (`productCreate`, `fileCreate`, `pageCreate`) | ❌ Aucun endpoint public : le formulaire de listing se remplit dans le Partner Dashboard |
| **3. Publication / mise en ligne** | ⚠️ Publication catalogue ✅ via API, mais **livraison du fichier digital** et **prérequis boutique (plan payant, KYC paiement)** restent humains | ❌ Soumission = upload ZIP manuel + acceptation du Partner Agreement + revue humaine |

**Conclusion courte :** le pipeline le plus proche du « bout en bout » réellement atteignable
aujourd'hui est le **scénario A**, sur une boutique *déjà* opérationnelle (plan payant actif +
moyen de paiement vérifié). Dans ce cadre, `git push` → thème publié → produit en ligne → page
de vente publiée est faisable sans intervention humaine. Le scénario B ne peut pas être
automatisé au-delà de la préparation du ZIP : Shopify n'expose **aucune API de soumission au
Theme Store**.

---

## 1. Inventaire des APIs et CLI disponibles

### 1.1 Shopify CLI — thèmes

Commandes pertinentes : `shopify theme init`, `theme dev`, `theme push`, `theme pull`,
`theme publish`, `theme check`.

| Élément | Détail | Source |
|---|---|---|
| `theme push` | Uploade le thème local vers la boutique ; peut publier directement en thème live | [theme push](https://shopify.dev/docs/api/shopify-cli/theme/theme-push) |
| `theme publish` | Publie un thème non publié de la bibliothèque ; sans ID de thème, la commande **passe en mode interactif** (prompt de sélection) → en CI il faut passer l'ID explicitement | [theme publish](https://shopify.dev/docs/api/shopify-cli/theme/theme-publish) |
| `theme dev` | Crée un *development theme* (ne compte pas dans la limite de thèmes, supprimé après 7 jours d'inactivité) | [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) |
| Usage CI/CD | Documenté officiellement (`Use Shopify CLI in a CI/CD pipeline`) | [CLI CI/CD](https://shopify.dev/docs/storefronts/themes/tools/cli/ci-cd) |

**Authentification non interactive.** Pour piloter le CLI sans login navigateur, il faut un
mot de passe généré par l'app **Theme Access**, passé via `--password` (ou la variable
d'environnement équivalente), ou un token Admin API.
Source : [Manage theme access](https://shopify.dev/docs/storefronts/themes/tools/theme-access),
[Shopify CLI for themes](https://shopify.dev/docs/storefronts/themes/tools/cli).

**Point bloquant à connaître (bootstrap) :** l'obtention de ce mot de passe est un acte humain.
L'app Theme Access s'installe manuellement depuis l'App Store par le *store owner* ou un staff
disposant des permissions ; le mot de passe est **envoyé par email**, le lien **expire après 7
jours** et **n'est consultable qu'une seule fois**. Il accorde uniquement le scope `write_themes`.
Source : [Manage theme access](https://shopify.dev/docs/storefronts/themes/tools/theme-access).

> Conséquence d'architecture : un token Theme Access **ne suffit pas** pour le scénario A —
> il ne donne pas accès aux produits ni aux pages. Il faut un second jeu de credentials Admin API.

**Theme Kit** : outil historique, remplacé par Shopify CLI 3.x pour les commandes de thème
([changelog de migration](https://shopify.dev/changelog/migrating-theme-commands-over-to-cli-3-0)).
Ne pas bâtir de nouveau pipeline dessus.

**Outils CI complémentaires officiels :**
- [Shopify Lighthouse CI GitHub Action](https://shopify.dev/docs/storefronts/themes/tools/lighthouse-ci) — audite home / page produit / page collection à chaque PR.
- [Theme Check](https://shopify.dev/docs/storefronts/themes/tools/cli) (`shopify theme check`) — linter Liquid.

### 1.2 Admin API (GraphQL) — thèmes

Depuis la version d'API 2024-10, la gestion des thèmes est exposée dans l'Admin GraphQL API.
Source : [changelog « theme and theme file management in the Admin GraphQL API »](https://shopify.dev/changelog/introducing-theme-and-theme-file-management-in-the-admin-graphql-api).

| Opération | Rôle | Source |
|---|---|---|
| `themes` / `theme` (queries) | Lister/filtrer les thèmes par rôle ou nom ; `files` expose métadonnées et contenu | [themes](https://shopify.dev/docs/api/admin-graphql/latest/queries/themes) |
| `themeCreate` | Crée un thème **à partir de l'URL publique d'un ZIP** | [OnlineStoreTheme](https://shopify.dev/docs/api/admin-graphql/latest/objects/OnlineStoreTheme), [Theme (REST)](https://shopify.dev/docs/api/admin-rest/latest/resources/theme) |
| `themeFilesUpsert` | Crée/met à jour des fichiers de thème — **maximum 50 fichiers par requête** | [themeFilesUpsert](https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeFilesUpsert) |
| `themePublish` | Publie un thème (l'ancien thème publié devient non publié) | [themePublish](https://shopify.dev/docs/api/admin-graphql/latest/mutations/themePublish) |
| `themeUpdate` / `themeDelete` | Renommage / suppression d'un thème non publié | [themeUpdate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeUpdate) |

**Limites documentées :**
- **20 thèmes maximum** par boutique, dont un publié ([Theme](https://shopify.dev/docs/api/admin-rest/latest/resources/theme)).
- Création par ZIP : le thème n'est réellement disponible qu'après extraction côté Shopify, ce qui
  « peut prendre quelques minutes » → **le pipeline doit poller le statut avant de publier**
  ([Theme](https://shopify.dev/docs/api/admin-rest/latest/resources/theme)).
- `themeFilesUpsert` : 50 fichiers/requête → un thème complet demande plusieurs batches.

**Scopes :** `write_themes` (inclut `read_themes` — « toute permission d'écriture inclut la
lecture »). Source : [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes).
Depuis l'API 2023-04, les requêtes `PUT`/`DELETE` sur la ressource Asset sont restreintes par
`write_themes` ([Asset API legacy](https://shopify.dev/docs/apps/build/online-store/asset-legacy)).

### 1.3 Admin API (GraphQL) — produits, fichiers, pages, publication

| Opération | Rôle | Scope | Source |
|---|---|---|---|
| `productCreate` | Crée le produit (titre, description HTML, vendor, médias) | `write_products` | [productCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate) |
| `stagedUploadsCreate` | Génère des URLs d'upload temporaires (gros fichiers, médias, ZIP) | `write_files` | [stagedUploadsCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/stageduploadscreate) |
| `fileCreate` | Crée l'asset (image, PDF, fichier générique) depuis une URL externe ou un staged upload | `write_files` | [fileCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate) |
| `publishablePublish` | Publie une ressource (produit, collection) sur une ou plusieurs *publications* ; publication programmée possible (online store uniquement) | `write_publications` | [publishablePublish](https://shopify.dev/docs/api/admin-graphql/latest/mutations/publishablePublish) |
| `pageCreate` | Crée une page de contenu de la boutique (titre, HTML, `isPublished`, `templateSuffix`) | `write_content` | [pageCreate](https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/pageCreate) |

**Prérequis de visibilité :** « pour qu'un produit soit visible dans un canal, il doit avoir un
`ProductStatus` actif » ([publishablePublish](https://shopify.dev/docs/api/admin-graphql/latest/mutations/publishablePublish)).
Créer le produit ne suffit donc pas : `status: ACTIVE` **et** publication sur le canal Online Store.

**Limites de débit (Admin GraphQL, coût calculé) :** 100 points/s en plan Standard, 200 en
Advanced, 1000 en Shopify Plus ; **une requête isolée ne peut pas dépasser 1000 points**, quel que
soit le plan. Source : [Shopify API limits](https://shopify.dev/docs/api/usage/limits).
→ Un pipeline qui pousse un thème complet + médias doit gérer `THROTTLED` et lire
`extensions.cost.throttleStatus` (implémenté dans la PoC).

### 1.4 Partner API — ce qu'elle couvre réellement

**Vérification demandée : oui, elle existe — non, elle ne permet pas de soumettre un thème.**

La Partner API (GraphQL) donne un accès *programmatique aux données du Partner Dashboard* :
apps, thèmes, référencements d'affiliation, transactions et événements historiques (installs,
uninstalls, charges, earnings). Endpoint de la forme
`https://partners.shopify.com/{organization_id}/api/{version}/graphql.json`.
Source : [GraphQL Partner API](https://shopify.dev/docs/api/partner/latest).

Permissions par client API :
- *View financials* → ressources `Transaction` (et mutation `appCreditCreate`).
- *Manage apps* → ressources `App` et événements applicatifs.
- *Manage themes* → ressource `Theme` (**consultation** des thèmes gérés par l'organisation).

Côté mutations, la documentation ne référence que des opérations liées à la facturation des apps,
notamment [`appCreditCreate`](https://shopify.dev/docs/api/partner/latest/mutations/appCreditCreate).

> **Aucune mutation de soumission, de création de listing, d'upload de ZIP ou de gestion de la
> revue Theme Store n'est documentée dans la Partner API.** La ressource `Theme` y est un objet de
> reporting (earnings, événements), pas un canal de publication.

### 1.5 Tableau de synthèse « quelle clé pour quoi »

| Besoin | Credential | Scopes | Obtention |
|---|---|---|---|
| Push/publication de thème via CLI | Theme Access password | `write_themes` uniquement | **Manuelle** : app Theme Access, mot de passe par email, lien 7 jours, vue unique |
| Thème + produits + pages via API | Token Admin API (app custom / Dev Dashboard) | `write_themes`, `write_products`, `write_files`, `write_content`, `write_publications` | **Manuelle** : création de l'app et récupération du token dans l'admin / Dev Dashboard ; le token n'est affiché **qu'une fois** |
| Lecture des revenus et événements Partner | Partner API client token | View financials / Manage apps / Manage themes | Manuelle, dans le Partner Dashboard |
| Soumission Theme Store | **aucun** | — | **Impossible par API** |

Sources : [Generate access tokens for admin-created custom apps](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin),
[Manage theme access](https://shopify.dev/docs/storefronts/themes/tools/theme-access),
[Access scopes](https://shopify.dev/docs/api/usage/access-scopes).

> ⚠️ **À vérifier avant implémentation :** la documentation d'accès aux tokens évolue. Les apps
> « admin-created custom apps » sont désormais présentées comme la voie historique, la voie
> courante passant par une app du **Dev Dashboard** avec *client credentials* (l'action Lighthouse
> CI officielle accepte les deux). Dans les deux cas **le bootstrap reste un acte humain**, donc la
> conclusion de ce rapport ne change pas.
> Réf. : [Manage App Automation Tokens](https://shopify.dev/docs/apps/build/dev-dashboard/app-automation-tokens),
> [Lighthouse CI](https://shopify.dev/docs/storefronts/themes/tools/lighthouse-ci).

---

## 2. Scénario A — Vendre le template comme produit digital dans ma propre boutique

Ici, je suis le marchand. Le thème est un **fichier ZIP vendu comme produit numérique** ; Shopify
n'a aucun rôle de validation éditoriale.

### 2.1 Ce qui est automatisable

```
génération du thème (local)
  → ZIP
  → stagedUploadsCreate + fileCreate           (upload du ZIP et des screenshots sur le CDN)
  → productCreate (status: ACTIVE)             (titre, description HTML, SEO, tags/mots-clés)
  → productVariantsBulkUpdate                  (requiresShipping: false → produit numérique)
  → publishablePublish (canal Online Store)    (mise en vente effective)
  → pageCreate                                 (landing page de vente, isPublished: true)
```

Chaque maillon est une mutation Admin API documentée (§1.3). Rien dans cette chaîne n'exige
d'interface graphique. Elle est déclenchable depuis GitHub Actions à chaque tag Git.

### 2.2 Où l'automatisation s'arrête — actions humaines obligatoires

| Blocage | Nature | Détail |
|---|---|---|
| **Création du token Admin API** | Technique/contractuelle, *one-shot* | L'app et son token se créent dans l'admin ou le Dev Dashboard ; le token n'est affiché qu'une fois. Non scriptable. |
| **Plan payant + activation du moyen de paiement** | **Légale (KYC/AML)** | Shopify et ses partenaires bancaires « sont tenus de collecter et vérifier » identité, structure juridique, documents (pièce d'identité, immatriculation, numéro fiscal, justificatif d'adresse) avant les premiers versements. ([Shopify Payments account setup](https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/account-setup)) |
| **Livraison du fichier au client** | Technique | L'app **Digital Downloads** de Shopify s'installe manuellement et **n'expose pas d'API publique** pour attacher un fichier à un produit ou récupérer l'URL de téléchargement. ([Digital downloads](https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads)) |
| **CGV, politique de remboursement, licence du thème, TVA/TVA OSS** | Légale/contractuelle | Contenu rédigeable automatiquement, mais l'engagement contractuel est un acte du marchand. |
| **Suppression du mot de passe de la boutique (mise en ligne réelle)** | Paramétrage | Le storefront reste protégé tant que le marchand ne l'ouvre pas. |

### 2.3 Contournement du seul vrai verrou technique (livraison du fichier)

Trois options, par ordre de degré d'automatisation :

1. **App tierce de digital delivery avec API** (SendOwl, Sky Pilot, etc.) — automatisable, mais
   dépend d'un fournisseur externe et de son API, hors périmètre shopify.dev.
2. **Livraison maison** : webhook `ORDERS_PAID` → génération d'une URL signée à durée limitée →
   email transactionnel. Entièrement automatisable avec des primitives documentées
   ([WebhookSubscriptionTopic](https://shopify.dev/docs/api/admin-graphql/latest/enums/WebhookSubscriptionTopic)),
   mais c'est un service à construire et héberger.
3. **Digital Downloads (natif Shopify)** : rattachement du fichier **manuel** pour chaque produit.
   → C'est ce qui fait passer l'étape 3 de ✅ à ⚠️ si l'on reste 100 % natif.

### 2.4 Verdicts scénario A

| Étape | Verdict | Justification |
|---|---|---|
| **1. Création du template** | ✅ **Automatisable de bout en bout** — génération locale (Liquid/JSON/CSS/JS) + `themeCreate`/`themeFilesUpsert`/`themePublish` ou `shopify theme push`. Clés : token Admin API `write_themes` ou Theme Access password. | §1.1, §1.2 |
| **2. Rédaction de la fiche produit** | ✅ **Automatisable de bout en bout** — `productCreate` (titre, `descriptionHtml`, tags, SEO), `stagedUploadsCreate`+`fileCreate` pour les screenshots, `pageCreate` pour la landing. Clés : `write_products`, `write_files`, `write_content`. | §1.3 |
| **3. Publication / mise en ligne** | ⚠️ **Automatisable partiellement** — la mise en vente (`status: ACTIVE` + `publishablePublish`) est 100 % API ; restent manuels : prérequis boutique (plan, KYC paiement), et le rattachement du fichier téléchargeable si l'on utilise l'app native Digital Downloads. | §2.2, §2.3 |

---

## 3. Scénario B — Soumettre le template au Shopify Theme Store

Ici, Shopify est l'éditeur de la marketplace : il y a un contrat (Partner Agreement), une revue
humaine, et des critères subjectifs.

### 3.1 Le chemin réel de soumission

Documenté sur [Submitting a theme to the Shopify Theme Store](https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme) :

1. Ouvrir le **Partner Dashboard**.
2. Ajouter le **fichier ZIP** du thème.
3. **Cocher la case attestant avoir lu et accepté le Shopify Partner Agreement.**
4. Uploader, puis remplir les **informations de listing** — un formulaire distinct est généré
   **par preset** contenu dans le ZIP ([Theme Store listing page](https://shopify.dev/docs/storefronts/themes/store/review-process/listings)).
5. Soumettre. L'équipe de revue teste le thème contre les Theme Store requirements
   ([Review process](https://shopify.dev/docs/storefronts/themes/store/review-process)).

Aucune de ces cinq étapes n'a d'équivalent API documenté. Le seul artefact produisible
automatiquement est le ZIP (étape 2).

### 3.2 Exigences qui imposent structurellement un humain

| Exigence | Pourquoi ce n'est pas automatisable | Source |
|---|---|---|
| Acceptation du **Partner Agreement** à la soumission | Acte contractuel nominatif | [submit-theme](https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme) |
| **Revue manuelle** par la theme review team | Décision humaine ; rejet ou liste de changements notifiés par email ; revue principalement en heures ouvrées EST du lundi au vendredi | [Review process](https://shopify.dev/docs/storefronts/themes/store/review-process), [Updating your theme](https://shopify.dev/docs/storefronts/themes/store/success/updates) |
| **Design unique et intentionnel**, « ne ressemblant pas étroitement aux thèmes existants » | Critère esthétique subjectif | [Theme store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) |
| **Codebase imposée** : le **Skeleton Theme** est le seul codebase approuvé ; les soumissions dérivées de **Dawn ou Horizon ne sont pas éligibles** | Contrainte de génération : interdit de partir des thèmes de référence habituels | [requirements](https://shopify.dev/docs/storefronts/themes/store/requirements), [changelog 15 mai 2025](https://shopify.dev/changelog/updated-shopify-theme-store-requirements-and-submission-process-effective-may-15-2025) |
| **Exclusivité** : vente exclusive sur le Theme Store | **Rend A et B mutuellement exclusifs pour un même thème** | [requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) |
| **Demo stores** : au moins un par preset, correspondant à l'industrie et à la taille de catalogue taguées, avec **droits obtenus sur tous les assets** conformément au Partner Agreement | Droits d'usage = acte juridique ; le contenu de démo doit exister réellement | [requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) |
| **Documentation du thème + formulaire de contact support public** | Engagement de service continu | [requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) |
| **Cadence de mise à jour** : minimum 4 semaines entre deux updates (exception : toutes les 2 semaines pendant les 2 premiers mois d'un nouveau thème) | Plafonne de fait tout pipeline de déploiement continu | [Updating your theme](https://shopify.dev/docs/storefronts/themes/store/success/updates) |

### 3.3 Exigences automatiquement vérifiables (ce qu'un pipeline peut pré-valider)

- **Lighthouse : performance ≥ 60 et accessibilité ≥ 90, mobile et desktop** → automatisable avec
  la [Shopify Lighthouse CI GitHub Action](https://shopify.dev/docs/storefronts/themes/tools/lighthouse-ci).
- **Structure du ZIP** : dossier `/listings` requis dès qu'il y a plusieurs presets (inutile s'il
  n'y a qu'un seul preset) ; presets tagués avec **au maximum deux industries** et **une catégorie
  de taille de catalogue** → vérifiable par script.
- **Qualité du code Liquid** : `shopify theme check`.
- **Fonctionnalités obligatoires** (abonnements, cartes-cadeaux, recherche à facettes, etc.) →
  vérifiables par introspection des fichiers du thème.
- Sources : [requirements](https://shopify.dev/docs/storefronts/themes/store/requirements),
  [changelog du 15 mai 2025](https://shopify.dev/changelog/updated-shopify-theme-store-requirements-and-submission-process-effective-may-15-2025),
  [Testing your theme](https://shopify.dev/docs/storefronts/themes/store/test-theme),
  [Common theme rejections](https://shopify.dev/docs/storefronts/themes/store/review-process/common-theme-rejections).

### 3.4 Verdicts scénario B

| Étape | Verdict | Justification |
|---|---|---|
| **1. Création du template** | ⚠️ **Automatisable partiellement** — la génération du code et l'auto-contrôle (theme check, Lighthouse, structure `/listings`, presets) sont scriptables ; mais le codebase est imposé (Skeleton, Dawn/Horizon exclus), l'originalité du design est un critère humain, et les demo stores doivent exister avec des droits obtenus sur les assets. | §3.2, §3.3 |
| **2. Rédaction du listing** | ❌ **Non automatisable** — contrainte **technique** (aucun endpoint public de création/édition de listing) doublée d'une contrainte **contractuelle** (formulaire lié au Partner Agreement). Le contenu marketing peut être *rédigé* automatiquement, mais sa saisie est manuelle, preset par preset. | §1.4, §3.1 |
| **3. Publication** | ❌ **Non automatisable** — upload ZIP dans le Partner Dashboard, case Partner Agreement, puis **revue humaine** Shopify avec pouvoir de rejet. Contraintes contractuelle + humaine, sans contournement licite. | §3.1, §3.2 |

---

## 4. Preuve de concept (scénario A)

Code : [`poc/`](./poc). Node.js ≥ 18, **zéro dépendance**, **aucune clé réelle**.

Elle exécute la chaîne complète contre un **serveur Admin API mocké local** :

```bash
cd shopify-template-automation/poc
npm run demo        # génération thème → ZIP → fiche produit → publication (mock)
npm run dry-run     # imprime les mutations GraphQL sans aucun appel réseau
```

Trois étapes séparées, exactement comme dans le pipeline cible :

| Fichier | Étape | Ce qu'il fait |
|---|---|---|
| `src/1-generate-theme.mjs` | 1 | Génère un thème Liquid minimal mais structurellement valide (layout, templates JSON, sections avec `schema`, blocs, `config/settings_schema.json`, locales, CSS/JS) et produit le ZIP |
| `src/2-generate-listing.mjs` | 2 | Génère le contenu marchand : titre, `descriptionHtml`, bullet points, mots-clés, SEO title/description, HTML de la landing page |
| `src/3-publish.mjs` | 3 | `stagedUploadsCreate` → upload → `fileCreate` → `productCreate` → `productVariantsBulkUpdate` (`requiresShipping: false`) → `publishablePublish` → `pageCreate` |

Le client GraphQL (`src/lib/shopify-client.mjs`) implémente la gestion documentée du débit :
lecture de `extensions.cost.throttleStatus`, attente proportionnelle, et retry exponentiel sur
`THROTTLED` ([API limits](https://shopify.dev/docs/api/usage/limits)).

`ci/theme-deploy.yml.example` montre le même enchaînement en GitHub Actions.
`poc/README.md` liste les scopes exacts et les étapes humaines de bootstrap.

---

## 5. Recommandation finale

### 5.1 Le pipeline le plus proche du « bout en bout » atteignable aujourd'hui

**Scénario A, sur une boutique déjà opérationnelle, avec livraison du fichier maison.**

```
[HUMAIN, une seule fois]
  boutique sur plan payant + Shopify Payments vérifié (KYC)
  app custom / Dev Dashboard → token Admin API (write_themes, write_products,
                                write_files, write_content, write_publications)
  CGV / licence / politique de remboursement validées
  service de livraison (webhook ORDERS_PAID → URL signée) déployé une fois

[100 % AUTOMATIQUE, à chaque tag Git]
  génération du thème  →  theme check + Lighthouse CI
  → ZIP → themeCreate / theme push → polling → themePublish (boutique démo)
  → stagedUploadsCreate + fileCreate (ZIP vendable + screenshots)
  → productCreate (ACTIVE) → productVariantsBulkUpdate (requiresShipping: false)
  → publishablePublish (Online Store) → pageCreate (landing)
  → produit en vente, sans intervention humaine
```

Coût de mise en place : les prérequis humains sont **non récurrents**. Une fois faits, la
production et la mise en vente d'un nouveau template sont réellement « bout en bout ».

### 5.2 Ce qui restera humain dans tous les cas

1. **L'identité et la conformité financière** — vérification KYC/AML par Shopify et ses partenaires
   bancaires. Aucun contournement, par conception réglementaire.
2. **L'acceptation des engagements contractuels** — Partner Agreement (scénario B), CGV et licence
   du template (scénario A). Une case à cocher engage une personne, pas un script.
3. **La décision éditoriale de Shopify** (scénario B) — revue manuelle, critères d'originalité
   subjectifs, pouvoir de rejet, cadence d'update plafonnée à une toutes les 4 semaines.
4. **La saisie du listing Theme Store** (scénario B) — pas d'API, formulaire par preset.
5. **Les droits sur les assets de démo** (scénario B) — permission à obtenir auprès des ayants droit.
6. **Le bootstrap des credentials** (A et B) — création de l'app et récupération d'un token affiché
   une seule fois ; mot de passe Theme Access envoyé par email, valable 7 jours, consultable une fois.

### 5.3 Arbitrage stratégique

- Vouloir les deux canaux pour **le même** thème est exclu : le Theme Store impose l'exclusivité.
- Le Theme Store apporte la distribution mais impose le codebase Skeleton, une revue humaine et une
  cadence de mise à jour bridée → incompatible avec une logique de production automatisée à volume.
- La vente en propre laisse la totalité de la chaîne sous contrôle programmatique, au prix de
  l'acquisition de trafic — qui devient le vrai goulot d'étranglement, et il n'est pas technique.

**Recommandation :** construire d'abord le pipeline du scénario A (ROI technique immédiat,
automatisation réelle), et ne traiter le scénario B que comme un canal éditorial ponctuel, avec
soumission manuelle assumée, si un thème atteint un niveau de finition justifiant la revue Shopify.

---

## 6. Sources

Toutes les affirmations de faisabilité ci-dessus s'appuient sur :

**Shopify CLI / thèmes**
- https://shopify.dev/docs/api/shopify-cli/theme
- https://shopify.dev/docs/api/shopify-cli/theme/theme-push
- https://shopify.dev/docs/api/shopify-cli/theme/theme-publish
- https://shopify.dev/docs/api/shopify-cli/theme/theme-dev
- https://shopify.dev/docs/storefronts/themes/tools/cli
- https://shopify.dev/docs/storefronts/themes/tools/cli/ci-cd
- https://shopify.dev/docs/storefronts/themes/tools/theme-access
- https://shopify.dev/docs/storefronts/themes/tools/lighthouse-ci
- https://shopify.dev/changelog/migrating-theme-commands-over-to-cli-3-0

**Admin API**
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/publishablePublish
- https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/pageCreate
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/stageduploadscreate
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/themePublish
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeFilesUpsert
- https://shopify.dev/docs/api/admin-graphql/latest/objects/OnlineStoreTheme
- https://shopify.dev/docs/api/admin-rest/latest/resources/theme
- https://shopify.dev/docs/api/usage/limits
- https://shopify.dev/docs/api/usage/access-scopes
- https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin
- https://shopify.dev/changelog/introducing-theme-and-theme-file-management-in-the-admin-graphql-api

**Partner API**
- https://shopify.dev/docs/api/partner/latest
- https://shopify.dev/docs/api/partner/latest/mutations/appCreditCreate

**Theme Store**
- https://shopify.dev/docs/storefronts/themes/store
- https://shopify.dev/docs/storefronts/themes/store/requirements
- https://shopify.dev/docs/storefronts/themes/store/review-process
- https://shopify.dev/docs/storefronts/themes/store/review-process/submit-theme
- https://shopify.dev/docs/storefronts/themes/store/review-process/listings
- https://shopify.dev/docs/storefronts/themes/store/review-process/common-theme-rejections
- https://shopify.dev/docs/storefronts/themes/store/test-theme
- https://shopify.dev/docs/storefronts/themes/store/success/updates
- https://shopify.dev/changelog/updated-shopify-theme-store-requirements-and-submission-process-effective-may-15-2025

**Help Center (opérations marchand)**
- https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/account-setup
- https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads

> **Note de méthode :** l'environnement d'exécution de ce rapport bloque le téléchargement direct
> des pages `shopify.dev` et `help.shopify.com` (proxy egress). Les faits ci-dessus proviennent de
> l'index de recherche officiel de ces mêmes pages. Les points cités sont stables et corroborés par
> plusieurs pages ; les zones d'évolution rapide (mécanisme d'obtention des tokens) sont
> explicitement signalées comme « à vérifier ». Recontrôler les URLs avant implémentation.
