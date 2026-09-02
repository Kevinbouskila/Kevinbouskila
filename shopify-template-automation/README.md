# Vendre un template Shopify : étude de faisabilité d'un pipeline automatisé

| Livrable | Contenu |
|---|---|
| [`RAPPORT-FAISABILITE.md`](./RAPPORT-FAISABILITE.md) | Le rapport : inventaire des APIs/CLI (Shopify CLI, Admin API, Partner API), séparation des deux scénarios, verdict par étape, recommandation, sources shopify.dev |
| [`poc/`](./poc) | Preuve de concept exécutable du scénario A : génération du thème → fiche produit → publication via Admin API, contre un mock local, sans clé réelle |

## Verdict en une ligne

Vendre le template **dans sa propre boutique** est automatisable de bout en bout une fois la
boutique opérationnelle ; le **soumettre au Shopify Theme Store** ne l'est pas — aucune API de
soumission n'existe, l'acte est contractuel et la revue est humaine.

```bash
cd poc && npm run demo
```
