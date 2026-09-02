// ETAPE 3 — Publication via Admin API GraphQL (scenario A).
//
// Enchainement, chaque appel correspondant a une mutation documentee :
//   1. stagedUploadsCreate ........ URLs d'upload temporaires
//      https://shopify.dev/docs/api/admin-graphql/latest/mutations/stageduploadscreate
//   2. fileCreate ................. enregistre le ZIP + les visuels comme assets
//      https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate
//   3. productCreate .............. la fiche produit (status ACTIVE)
//      https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate
//   4. productVariantsBulkUpdate .. requiresShipping: false => produit numerique
//   5. publishablePublish ......... mise en vente sur le canal Online Store
//      https://shopify.dev/docs/api/admin-graphql/latest/mutations/publishablePublish
//   6. pageCreate ................. landing page de presentation
//      https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/pageCreate
//
// Scopes requis : write_products, write_files, write_content, write_publications.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AdminClient } from './lib/shopify-client.mjs';

const ROOT = new URL('..', import.meta.url).pathname;

const Q = {
  stagedUploads: `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}`,
  fileCreate: `mutation FileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files { id alt fileStatus }
    userErrors { field message }
  }
}`,
  productCreate: `mutation ProductCreate($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product { id title handle status variants(first: 1) { nodes { id title } } }
    userErrors { field message }
  }
}`,
  variantsUpdate: `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price inventoryItem { requiresShipping } }
    userErrors { field message }
  }
}`,
  publish: `mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    publishable { availablePublicationsCount { count } }
    userErrors { field message }
  }
}`,
  pageCreate: `mutation PageCreate($page: PageCreateInput!) {
  pageCreate(page: $page) {
    page { id title handle isPublished }
    userErrors { field message }
  }
}`,
  publications: `query Publications { publications(first: 10) { nodes { id name } } }`,
};

export async function publish({ dryRun = false, client } = {}) {
  const listing = JSON.parse(readFileSync(join(ROOT, 'build/listing.json'), 'utf8'));
  const manifest = listing.themeManifest;
  const api = client ?? AdminClient.fromEnv({ dryRun });
  const log = api.log;

  // --- 1 & 2 : upload du ZIP vendable et des visuels -------------------------
  const uploads = [
    { path: manifest.zipPath, filename: manifest.handle + '-' + manifest.version + '.zip', mimeType: 'application/zip', resource: 'FILE', alt: listing.title + ' — archive du theme' },
    ...listing.media.map((m) => ({ path: m.path, filename: m.file, mimeType: m.mimeType, resource: 'IMAGE', alt: m.alt })),
  ];

  const staged = await api.graphql('stagedUploadsCreate', Q.stagedUploads, {
    input: uploads.map((u) => ({
      filename: u.filename,
      mimeType: u.mimeType,
      resource: u.resource,
      httpMethod: 'POST',
      fileSize: String(readFileSync(u.path).length),
    })),
  });

  const targets = staged.stagedUploadsCreate.stagedTargets;
  const sources = [];
  for (const [i, u] of uploads.entries()) {
    const resourceUrl = await api.uploadToStagedTarget(targets[i], readFileSync(u.path), u.filename, u.mimeType);
    sources.push({ originalSource: resourceUrl, alt: u.alt, contentType: u.resource });
  }

  const created = await api.graphql('fileCreate', Q.fileCreate, { files: sources });
  log('   ✓ ' + created.fileCreate.files.length + ' fichiers enregistres sur le CDN');

  // --- 3 : creation du produit ----------------------------------------------
  // status ACTIVE est necessaire : un produit non actif reste invisible sur le
  // canal, meme publie. (cf. doc publishablePublish)
  const productRes = await api.graphql('productCreate', Q.productCreate, {
    product: {
      title: listing.title,
      handle: listing.handle,
      descriptionHtml: listing.descriptionHtml,
      vendor: listing.vendor,
      productType: listing.productType,
      tags: listing.tags,
      status: 'ACTIVE',
      seo: { title: listing.seo.title, description: listing.seo.description },
    },
  });
  const product = productRes.productCreate.product;
  log('   ✓ produit cree : ' + product.id);

  // --- 4 : produit numerique -------------------------------------------------
  const variantId = product.variants.nodes[0].id;
  await api.graphql('productVariantsBulkUpdate', Q.variantsUpdate, {
    productId: product.id,
    variants: [{ id: variantId, price: listing.price, inventoryItem: { requiresShipping: false } }],
  });
  log('   ✓ variante : prix ' + listing.price + ', requiresShipping=false (produit numerique)');

  // --- 5 : publication sur le canal Online Store -----------------------------
  let publicationId = process.env.SHOPIFY_ONLINE_STORE_PUBLICATION_ID;
  if (!publicationId) {
    const pubs = await api.graphql('publications', Q.publications, {});
    publicationId = (pubs.publications.nodes.find((n) => /online store/i.test(n.name)) ?? pubs.publications.nodes[0]).id;
  }
  await api.graphql('publishablePublish', Q.publish, { id: product.id, input: [{ publicationId }] });
  log('   ✓ produit publie sur ' + publicationId);

  // --- 6 : landing page ------------------------------------------------------
  const pageRes = await api.graphql('pageCreate', Q.pageCreate, {
    page: {
      title: listing.landingPage.title,
      handle: listing.landingPage.handle,
      body: listing.landingPage.bodyHtml,
      isPublished: true,
    },
  });
  log('   ✓ page publiee : ' + pageRes.pageCreate.page.handle);

  return {
    productId: product.id,
    productHandle: product.handle,
    pageId: pageRes.pageCreate.page.id,
    publicationId,
    fileIds: created.fileCreate.files.map((f) => f.id),
  };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const dryRun = process.argv.includes('--dry-run');
  console.log('ETAPE 3 — publication (' + (dryRun ? 'dry-run' : 'appels reels/mock') + ')');
  publish({ dryRun }).then((r) => console.log('   → ' + JSON.stringify(r, null, 2)));
}
