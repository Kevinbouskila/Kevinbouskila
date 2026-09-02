// ETAPE 2 — Redaction automatique de la fiche produit.
// Sortie : build/listing.json (titre, descriptionHtml, tags, SEO, HTML de landing page)
//          build/media/*.svg  (visuels de previsualisation generes)
//
// Ici la generation est deterministe (gabarits). Le meme contrat de sortie
// convient a un generateur LLM : seule la fonction buildCopy() changerait.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const config = JSON.parse(readFileSync(join(ROOT, 'config/template.config.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Coupe sur une frontiere de mot : une meta description tronquee en plein mot
// se voit dans les SERP.
const clamp = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…');

export function buildCopy({ theme, listing } = config, manifest = null) {
  const title = theme.name + ' — Theme Shopify ' + (listing.positioning.includes('mode') ? 'mode & lifestyle' : 'ecommerce');

  const descriptionHtml = [
    '<p><strong>' + esc(theme.name) + '</strong> est un theme Shopify concu pour ' + esc(listing.audience) + '.</p>',
    '<h3>Ce que contient le theme</h3>',
    '<ul>',
    ...listing.features.map((f) => '  <li>' + esc(f) + '</li>'),
    '</ul>',
    '<h3>Contenu du fichier</h3>',
    '<ul>',
    '  <li>Archive ZIP installable depuis Boutique en ligne &gt; Themes &gt; Ajouter un theme.</li>',
    manifest ? '  <li>' + manifest.fileCount + ' fichiers, version ' + esc(manifest.version) + '.</li>' : '',
    '  <li>Documentation : <a href="' + esc(listing.documentationUrl) + '">guide d’installation</a>.</li>',
    '  <li>Support : <a href="mailto:' + esc(listing.supportEmail) + '">' + esc(listing.supportEmail) + '</a>.</li>',
    '</ul>',
    '<p><em>Produit numerique : aucun envoi physique. Licence d’utilisation pour une boutique.</em></p>',
  ].filter(Boolean).join('\n');

  const seo = {
    title: clamp(theme.name + ' · Theme Shopify rapide et minimaliste', 70),
    description: clamp('Theme Shopify ' + theme.name + ' : ' + listing.features[0].toLowerCase() + ', design responsive et zero dependance JS. Livraison immediate du fichier ZIP.', 160),
  };

  const landingPageHtml = [
    '<section>',
    '  <h1>' + esc(theme.name) + '</h1>',
    '  <p>' + esc(listing.audience.charAt(0).toUpperCase() + listing.audience.slice(1)) + '.</p>',
    '</section>',
    '<section>',
    '  <h2>Fonctionnalites</h2>',
    '  <ul>' + listing.features.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>',
    '</section>',
    '<section>',
    '  <h2>Questions frequentes</h2>',
    '  <h3>Comment installer le theme ?</h3>',
    '  <p>Depuis l’admin Shopify : Boutique en ligne &gt; Themes &gt; Ajouter un theme &gt; Importer un fichier ZIP.</p>',
    '  <h3>Le fichier est-il livre automatiquement ?</h3>',
    '  <p>Oui, le lien de telechargement est envoye apres confirmation du paiement.</p>',
    '  <h3>Puis-je l’utiliser sur plusieurs boutiques ?</h3>',
    '  <p>La licence couvre une boutique. Contactez ' + esc(listing.supportEmail) + ' pour une licence multi-boutiques.</p>',
    '</section>',
  ].join('\n');

  return {
    title,
    handle: theme.handle,
    vendor: theme.author,
    productType: 'Theme Shopify',
    descriptionHtml,
    tags: listing.keywords,
    seo,
    price: listing.price,
    landingPage: { title: theme.name + ' — presentation', handle: theme.handle + '-presentation', bodyHtml: landingPageHtml },
  };
}

/** Visuel genere en SVG : pas de dependance graphique, poids negligeable. */
function previewSvg({ label, accent, subtitle }) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="' + esc(label) + '">',
    '  <rect width="1200" height="800" fill="#ffffff"/>',
    '  <rect y="0" width="1200" height="72" fill="#f6f7f9"/>',
    '  <circle cx="48" cy="36" r="10" fill="' + accent + '"/>',
    '  <rect x="76" y="28" width="180" height="16" rx="4" fill="#c9ced6"/>',
    '  <rect x="900" y="28" width="220" height="16" rx="4" fill="#c9ced6"/>',
    '  <rect x="0" y="72" width="1200" height="330" fill="' + accent + '" opacity="0.10"/>',
    '  <text x="600" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="54" fill="#14161a">' + esc(label) + '</text>',
    '  <text x="600" y="262" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#5b636e">' + esc(subtitle) + '</text>',
    '  <rect x="520" y="300" width="160" height="48" rx="6" fill="' + accent + '"/>',
    '  <g fill="#eef0f3">',
    '    <rect x="60" y="450" width="250" height="250" rx="8"/>',
    '    <rect x="340" y="450" width="250" height="250" rx="8"/>',
    '    <rect x="620" y="450" width="250" height="250" rx="8"/>',
    '    <rect x="900" y="450" width="240" height="250" rx="8"/>',
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

export function writeListing({ outDir = join(ROOT, 'build') } = {}) {
  let manifest = null;
  try { manifest = JSON.parse(readFileSync(join(outDir, 'theme-manifest.json'), 'utf8')); } catch { /* etape 1 non jouee */ }

  const copy = buildCopy(config, manifest);
  const mediaDir = join(outDir, 'media');
  mkdirSync(mediaDir, { recursive: true });

  const media = [
    { file: 'preview-home.svg', alt: config.theme.name + ' — page d’accueil', label: config.theme.name, subtitle: 'Page d’accueil' },
    { file: 'preview-product.svg', alt: config.theme.name + ' — page produit', label: config.theme.name, subtitle: 'Page produit' },
  ];
  for (const m of media) {
    writeFileSync(join(mediaDir, m.file), previewSvg({ label: m.label, subtitle: m.subtitle, accent: config.theme.colorAccent }));
    m.path = join(mediaDir, m.file);
    m.mimeType = 'image/svg+xml';
  }

  const listing = { ...copy, media, themeManifest: manifest };
  writeFileSync(join(outDir, 'listing.json'), JSON.stringify(listing, null, 2));
  return listing;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const l = writeListing();
  console.log('ETAPE 2 — fiche produit redigee');
  console.log('   titre     : ' + l.title);
  console.log('   mots-cles : ' + l.tags.join(', '));
  console.log('   SEO       : ' + l.seo.title + ' (' + l.seo.description.length + ' car.)');
  console.log('   visuels   : ' + l.media.map((m) => m.file).join(', '));
}
