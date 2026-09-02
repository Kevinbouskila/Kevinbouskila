// Resolveur d'un faux Admin API GraphQL.
// Source unique de verite partagee par le serveur mock (src/mock-admin-api.mjs)
// et par le mode --dry-run du client. Les formes de reponse suivent la doc :
// https://shopify.dev/docs/api/admin-graphql/latest
import { createHash } from 'node:crypto';

const gid = (type, seed) =>
  `gid://shopify/${type}/${parseInt(createHash('sha1').update(String(seed)).digest('hex').slice(0, 8), 16)}`;

// Etat en memoire : permet de verifier l'enchainement des etapes (le produit
// publie est bien celui qui vient d'etre cree).
const state = { files: [], products: [], pages: [], publications: [], themes: [] };

const COST = (requested, actual) => ({
  cost: {
    requestedQueryCost: requested,
    actualQueryCost: actual,
    throttleStatus: { maximumAvailable: 2000, currentlyAvailable: 2000 - actual, restoreRate: 100 },
  },
});

/** @returns {{data: object, extensions: object}} */
export function resolveOperation({ query, variables = {} }) {
  const op = /\b(mutation|query)\s+(\w+)/.exec(query)?.[2] ?? 'anonymous';

  switch (op) {
    case 'StagedUploadsCreate': {
      const targets = (variables.input ?? []).map((i) => ({
        url: `${process.env.SHOPIFY_MOCK_UPLOAD_URL ?? 'http://127.0.0.1:8788/staged-upload'}/${encodeURIComponent(i.filename)}`,
        resourceUrl: `https://mock-cdn.shopify.test/staged/${encodeURIComponent(i.filename)}`,
        parameters: [{ name: 'key', value: `staged/${i.filename}` }],
      }));
      return { data: { stagedUploadsCreate: { stagedTargets: targets, userErrors: [] } }, extensions: COST(11, 11) };
    }

    case 'FileCreate': {
      const files = (variables.files ?? []).map((f) => {
        const file = {
          id: gid('MediaImage', f.originalSource),
          alt: f.alt ?? null,
          fileStatus: 'READY',
          __source: f.originalSource,
        };
        state.files.push(file);
        return file;
      });
      return { data: { fileCreate: { files, userErrors: [] } }, extensions: COST(10, 10) };
    }

    case 'ProductCreate': {
      const input = variables.product ?? variables.input ?? {};
      const product = {
        id: gid('Product', input.title),
        title: input.title,
        handle: (input.handle ?? input.title ?? 'produit').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: input.status ?? 'DRAFT',
        variants: { nodes: [{ id: gid('ProductVariant', input.title), title: 'Default Title' }] },
      };
      state.products.push(product);
      return { data: { productCreate: { product, userErrors: [] } }, extensions: COST(15, 12) };
    }

    case 'ProductVariantsBulkUpdate': {
      const variants = (variables.variants ?? []).map((v) => ({
        id: v.id,
        price: v.price ?? null,
        inventoryItem: { requiresShipping: v.inventoryItem?.requiresShipping ?? true },
      }));
      return {
        data: { productVariantsBulkUpdate: { productVariants: variants, userErrors: [] } },
        extensions: COST(12, 10),
      };
    }

    case 'PublishablePublish': {
      state.publications.push({ id: variables.id, input: variables.input });
      return {
        data: {
          publishablePublish: {
            publishable: { availablePublicationsCount: { count: 1 }, publishedOnCurrentPublication: true },
            userErrors: [],
          },
        },
        extensions: COST(10, 10),
      };
    }

    case 'PageCreate': {
      const input = variables.page ?? {};
      const page = {
        id: gid('Page', input.title),
        title: input.title,
        handle: (input.handle ?? input.title ?? 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isPublished: input.isPublished ?? false,
      };
      state.pages.push(page);
      return { data: { pageCreate: { page, userErrors: [] } }, extensions: COST(10, 10) };
    }

    case 'ThemeCreate': {
      const theme = { id: gid('OnlineStoreTheme', variables.name), name: variables.name, role: 'UNPUBLISHED', processing: true };
      state.themes.push(theme);
      return { data: { themeCreate: { theme, userErrors: [] } }, extensions: COST(10, 10) };
    }

    case 'ThemeStatus': {
      // themeCreate est asynchrone cote Shopify ("might take a couple of minutes") :
      // le mock renvoie processing=false pour permettre de tester la boucle de polling.
      const theme = state.themes.find((t) => t.id === variables.id) ?? { id: variables.id, name: 'mock', role: 'UNPUBLISHED' };
      return { data: { theme: { ...theme, processing: false } }, extensions: COST(3, 3) };
    }

    case 'ThemePublish': {
      const theme = state.themes.find((t) => t.id === variables.id) ?? { id: variables.id, name: 'mock' };
      theme.role = 'MAIN';
      return { data: { themePublish: { theme: { id: theme.id, name: theme.name, role: 'MAIN' }, userErrors: [] } }, extensions: COST(10, 10) };
    }

    case 'Publications':
      return {
        data: { publications: { nodes: [{ id: gid('Publication', 'online-store'), name: 'Online Store' }] } },
        extensions: COST(5, 5),
      };

    default:
      return {
        errors: [{ message: `Operation non geree par le mock : ${op}` }],
        data: null,
        extensions: COST(1, 1),
      };
  }
}

export const mockState = state;
