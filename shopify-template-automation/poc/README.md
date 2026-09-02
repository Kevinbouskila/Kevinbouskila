# PoC — pipeline template Shopify (scénario A)

Preuve de concept minimale accompagnant [`../RAPPORT-FAISABILITE.md`](../RAPPORT-FAISABILITE.md).
Elle illustre la chaîne **génération du thème → rédaction de la fiche produit → publication via
Admin API**, pour le scénario A uniquement (vendre le template comme produit digital dans sa
propre boutique).

> Le scénario B (Shopify Theme Store) n'a **pas** de PoC : la soumission passe exclusivement par
> le Partner Dashboard, aucune API publique ne l'expose. Voir §3 du rapport.

## Exécuter

Node.js ≥ 18, **zéro dépendance**, **aucune clé réelle nécessaire**.

```bash
npm run demo      # chaîne complète contre un Admin API mocké local (127.0.0.1:8788)
npm run dry-run   # imprime les mutations GraphQL, aucun appel réseau

npm run generate:theme     # étape 1 seule
npm run generate:listing   # étape 2 seule
npm run mock               # serveur mock seul (utile pour inspecter /__state)
```

Sorties dans `build/` : `theme/` (arborescence), `<handle>-<version>.zip`,
`theme-manifest.json`, `listing.json`, `media/*.svg`.

## Ce que fait chaque étape

| Fichier | Étape | Appels Shopify |
|---|---|---|
| `src/1-generate-theme.mjs` | Génère le thème Liquid (layout, sections avec `{% schema %}`, blocs, templates JSON, locales, settings, CSS/JS), le lint et produit le ZIP | — (local) |
| `src/2-generate-listing.mjs` | Titre, `descriptionHtml`, tags/mots-clés, SEO title+description, HTML de landing page, visuels SVG | — (local) |
| `src/3-publish.mjs` | Met tout en ligne | `stagedUploadsCreate` → `fileCreate` → `productCreate` → `productVariantsBulkUpdate` → `publishablePublish` → `pageCreate` |

`src/lib/shopify-client.mjs` gère le débit documenté de l'Admin GraphQL API : lecture de
`extensions.cost.throttleStatus`, pause avant saturation du bucket, retry exponentiel sur
`THROTTLED`, respect de `Retry-After` sur 429, et **vérification systématique des `userErrors`**
(un HTTP 200 ne signifie pas succès sur l'Admin API).

## Passage en réel

```bash
cp .env.example .env   # puis renseigner les valeurs
node src/3-publish.mjs
```

**Scopes requis sur le token Admin API :**
`write_products`, `write_files`, `write_content`, `write_publications`
(+ `write_themes` si l'on pousse le thème par l'API plutôt que par le CLI).
Rappel : toute permission d'écriture inclut la lecture
([access scopes](https://shopify.dev/docs/api/usage/access-scopes)).

Un mot de passe **Theme Access** n'accorde que `write_themes` : il ne suffit **pas** pour créer le
produit ni la page ([theme access](https://shopify.dev/docs/storefronts/themes/tools/theme-access)).

## Bootstrap humain (obligatoire, une seule fois)

Ces étapes ne sont pas scriptables :

1. Boutique sur un **plan payant** et moyen de paiement activé — la vérification d'identité
   (KYC/AML) est imposée par Shopify et ses partenaires bancaires.
2. Création de l'app (admin ou Dev Dashboard) et récupération du **token Admin API**, affiché une
   seule fois.
3. Si l'app native **Digital Downloads** est utilisée : installation manuelle et rattachement
   manuel du fichier au produit (aucune API publique). Alternative automatisable : webhook
   `ORDERS_PAID` → URL signée → email.
4. CGV, licence du template et politique de remboursement.

## Limites assumées de cette PoC

- Le serveur mock ne reproduit ni l'authentification, ni la validation métier de Shopify : il
  prouve l'**enchaînement** des appels, pas leur acceptation par la vraie API.
- Le thème généré est structurellement valide mais volontairement minimal : il ne satisfait pas les
  Theme Store requirements (codebase Skeleton imposé, 21+ fonctionnalités, Lighthouse ≥ 60/90).
- Les versions d'API évoluent : `SHOPIFY_API_VERSION` est figée volontairement, à revalider avant
  toute mise en production.
