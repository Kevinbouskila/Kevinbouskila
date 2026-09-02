// ETAPE 1 — Generation du theme + production du ZIP.
// Sortie : build/<handle>-<version>.zip et build/theme/** (arborescence lisible).
//
// Structure conforme a l'architecture de theme documentee :
// https://shopify.dev/docs/storefronts/themes/architecture
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createZip } from './lib/zip.mjs';
import { lintTheme } from './lib/theme-lint.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const config = JSON.parse(await (await import('node:fs/promises')).readFile(join(ROOT, 'config/template.config.json'), 'utf8'));
const T = config.theme;

/** Toutes les entrees du theme, chemin -> contenu. */
export function buildThemeFiles() {
  const files = {};

  files['layout/theme.liquid'] = [
    '<!doctype html>',
    '<html lang="{{ request.locale.iso_code }}">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    '    <title>{{ page_title }}{% if current_page != 1 %} &ndash; {{ current_page }}{% endif %}</title>',
    '    {%- if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif -%}',
    '    <link rel="canonical" href="{{ canonical_url }}">',
    '    {{ content_for_header }}',
    '    {{ "theme.css" | asset_url | stylesheet_tag }}',
    '  </head>',
    '  <body class="template-{{ template.name }}">',
    '    {% sections "header-group" %}',
    '    <main id="MainContent" role="main">',
    '      {{ content_for_layout }}',
    '    </main>',
    '    {% section "footer" %}',
    '    {{ "theme.js" | asset_url | script_tag }}',
    '  </body>',
    '</html>',
    '',
  ].join('\n');

  files['sections/header.liquid'] = [
    '<header class="site-header">',
    '  <a class="site-header__logo" href="{{ routes.root_url }}">{{ shop.name }}</a>',
    '  <nav class="site-header__nav">',
    '    {%- for link in section.settings.menu.links -%}',
    '      <a href="{{ link.url }}">{{ link.title }}</a>',
    '    {%- endfor -%}',
    '  </nav>',
    '  <a class="site-header__cart" href="{{ routes.cart_url }}">{{ "layout.cart" | t }} ({{ cart.item_count }})</a>',
    '</header>',
    '',
    '{% schema %}',
    JSON.stringify({
      name: 'Header',
      settings: [{ type: 'link_list', id: 'menu', label: 'Menu', default: 'main-menu' }],
      enabled_on: { groups: ['header'] },
    }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['sections/hero.liquid'] = [
    '<section class="hero" style="--hero-align: {{ section.settings.text_align }};">',
    '  {%- if section.settings.image != blank -%}',
    '    {{ section.settings.image | image_url: width: 1600 | image_tag: loading: "eager", class: "hero__image" }}',
    '  {%- endif -%}',
    '  <div class="hero__content">',
    '    {%- for block in section.blocks -%}',
    '      {%- case block.type -%}',
    '        {%- when "heading" -%}',
    '          <h1 class="hero__title" {{ block.shopify_attributes }}>{{ block.settings.text }}</h1>',
    '        {%- when "text" -%}',
    '          <p class="hero__text" {{ block.shopify_attributes }}>{{ block.settings.text }}</p>',
    '        {%- when "button" -%}',
    '          <a class="btn" href="{{ block.settings.url }}" {{ block.shopify_attributes }}>{{ block.settings.label }}</a>',
    '      {%- endcase -%}',
    '    {%- endfor -%}',
    '  </div>',
    '</section>',
    '',
    '{% schema %}',
    JSON.stringify({
      name: 'Hero',
      settings: [
        { type: 'image_picker', id: 'image', label: 'Image de fond' },
        { type: 'select', id: 'text_align', label: 'Alignement', default: 'center', options: [
          { value: 'left', label: 'Gauche' }, { value: 'center', label: 'Centre' },
        ] },
      ],
      blocks: [
        { type: 'heading', name: 'Titre', limit: 1, settings: [{ type: 'text', id: 'text', label: 'Titre', default: 'Nouvelle collection' }] },
        { type: 'text', name: 'Texte', settings: [{ type: 'text', id: 'text', label: 'Texte', default: 'Livraison offerte des 50 EUR' }] },
        { type: 'button', name: 'Bouton', settings: [
          { type: 'text', id: 'label', label: 'Libelle', default: 'Decouvrir' },
          { type: 'url', id: 'url', label: 'Lien' },
        ] },
      ],
      presets: [{ name: 'Hero', blocks: [{ type: 'heading' }, { type: 'text' }, { type: 'button' }] }],
    }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['sections/featured-collection.liquid'] = [
    '<section class="featured-collection">',
    '  <h2 class="featured-collection__title">{{ section.settings.title }}</h2>',
    '  <ul class="product-grid" style="--columns: {{ section.settings.columns }};">',
    '    {%- for product in section.settings.collection.products limit: section.settings.limit -%}',
    '      <li>{% render "product-card", product: product %}</li>',
    '    {%- else -%}',
    '      <li>{{ "sections.collection.empty" | t }}</li>',
    '    {%- endfor -%}',
    '  </ul>',
    '</section>',
    '',
    '{% schema %}',
    JSON.stringify({
      name: 'Collection en vedette',
      settings: [
        { type: 'text', id: 'title', label: 'Titre', default: 'Best-sellers' },
        { type: 'collection', id: 'collection', label: 'Collection' },
        { type: 'range', id: 'columns', label: 'Colonnes', min: 2, max: 5, step: 1, default: 4 },
        { type: 'range', id: 'limit', label: 'Produits affiches', min: 2, max: 12, step: 1, default: 8 },
      ],
      presets: [{ name: 'Collection en vedette' }],
    }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['sections/main-product.liquid'] = [
    '<section class="product">',
    '  <div class="product__media">',
    '    {%- for media in product.media limit: 5 -%}',
    '      {{ media | image_url: width: 1200 | image_tag: loading: "lazy" }}',
    '    {%- endfor -%}',
    '  </div>',
    '  <div class="product__info">',
    '    <h1>{{ product.title }}</h1>',
    '    <p class="product__price">{{ product.selected_or_first_available_variant.price | money }}</p>',
    '    {%- form "product", product -%}',
    '      <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">',
    '      <button class="btn" type="submit" {% unless product.available %}disabled{% endunless %}>',
    '        {{ "products.product.add_to_cart" | t }}',
    '      </button>',
    '    {%- endform -%}',
    '    <div class="product__description rte">{{ product.description }}</div>',
    '  </div>',
    '</section>',
    '',
    '{% schema %}',
    JSON.stringify({ name: 'Produit', settings: [] }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['sections/main-page.liquid'] = [
    '<article class="page">',
    '  <h1>{{ page.title }}</h1>',
    '  <div class="rte">{{ page.content }}</div>',
    '</article>',
    '',
    '{% schema %}',
    JSON.stringify({ name: 'Page', settings: [] }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['sections/footer.liquid'] = [
    '<footer class="site-footer">',
    '  <p>&copy; {{ "now" | date: "%Y" }} {{ shop.name }}</p>',
    '</footer>',
    '',
    '{% schema %}',
    JSON.stringify({ name: 'Footer', settings: [] }, null, 2),
    '{% endschema %}',
    '',
  ].join('\n');

  files['snippets/product-card.liquid'] = [
    '<a class="product-card" href="{{ product.url }}">',
    '  {{ product.featured_image | image_url: width: 600 | image_tag: loading: "lazy", class: "product-card__image" }}',
    '  <span class="product-card__title">{{ product.title }}</span>',
    '  <span class="product-card__price">{{ product.price | money }}</span>',
    '</a>',
    '',
  ].join('\n');

  files['templates/index.json'] = JSON.stringify({
    sections: {
      hero: { type: 'hero', blocks: { h: { type: 'heading' }, t: { type: 'text' }, b: { type: 'button' } }, block_order: ['h', 't', 'b'] },
      featured: { type: 'featured-collection' },
    },
    order: ['hero', 'featured'],
  }, null, 2);

  files['templates/product.json'] = JSON.stringify({ sections: { main: { type: 'main-product' } }, order: ['main'] }, null, 2);
  files['templates/page.json'] = JSON.stringify({ sections: { main: { type: 'main-page' } }, order: ['main'] }, null, 2);

  files['sections/header-group.json'] = JSON.stringify({
    type: 'header', name: 'Header group',
    sections: { header: { type: 'header' } }, order: ['header'],
  }, null, 2);

  files['config/settings_schema.json'] = JSON.stringify([
    { name: 'theme_info', theme_name: T.name, theme_version: T.version, theme_author: T.author, theme_documentation_url: config.listing.documentationUrl, theme_support_url: 'mailto:' + config.listing.supportEmail },
    { name: 'Couleurs', settings: [{ type: 'color', id: 'color_accent', label: 'Couleur d’accent', default: T.colorAccent }] },
    { name: 'Typographie', settings: [{ type: 'font_picker', id: 'font_body', label: 'Police du corps', default: 'system' }] },
  ], null, 2);

  files['config/settings_data.json'] = JSON.stringify({ current: { color_accent: T.colorAccent, font_body: 'system' } }, null, 2);

  files['locales/en.default.json'] = JSON.stringify({
    layout: { cart: 'Cart' },
    products: { product: { add_to_cart: 'Add to cart' } },
    sections: { collection: { empty: 'No product yet' } },
  }, null, 2);

  files['locales/fr.json'] = JSON.stringify({
    layout: { cart: 'Panier' },
    products: { product: { add_to_cart: 'Ajouter au panier' } },
    sections: { collection: { empty: 'Aucun produit pour le moment' } },
  }, null, 2);

  files['assets/theme.css'] = [
    ':root { --accent: ' + T.colorAccent + '; --font: ' + T.fontStack + '; }',
    '* { box-sizing: border-box; }',
    'body { margin: 0; font-family: var(--font); color: #14161a; }',
    '.site-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid #e6e8eb; }',
    '.site-header__nav { display: flex; gap: 1rem; }',
    '.hero { position: relative; padding: 4rem 1.5rem; text-align: var(--hero-align, center); }',
    '.hero__image { width: 100%; height: auto; }',
    '.btn { display: inline-block; padding: .75rem 1.5rem; background: var(--accent); color: #fff; text-decoration: none; border: 0; border-radius: 4px; cursor: pointer; }',
    '.product-grid { display: grid; grid-template-columns: repeat(var(--columns, 4), minmax(0, 1fr)); gap: 1.5rem; list-style: none; padding: 0 1.5rem; }',
    '.product { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem 1.5rem; }',
    '@media (max-width: 749px) { .product { grid-template-columns: 1fr; } .product-grid { grid-template-columns: repeat(2, 1fr); } }',
    '',
  ].join('\n');

  files['assets/theme.js'] = [
    '// Aucune dependance externe : la performance Lighthouse est un critere Theme Store.',
    "document.addEventListener('submit', function (event) {",
    "  var form = event.target.closest('form[action*=\"/cart/add\"]');",
    '  if (!form) return;',
    "  var button = form.querySelector('button[type=submit]');",
    '  if (button) button.setAttribute(\'aria-busy\', \'true\');',
    '});',
    '',
  ].join('\n');

  return files;
}

export function writeTheme({ outDir = join(ROOT, 'build') } = {}) {
  const files = buildThemeFiles();

  const lintErrors = lintTheme(files);
  if (lintErrors.length) throw new Error('Theme invalide :\n - ' + lintErrors.join('\n - '));

  const themeDir = join(outDir, 'theme');
  rmSync(themeDir, { recursive: true, force: true });

  const entries = [];
  for (const [path, content] of Object.entries(files)) {
    const full = join(themeDir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    entries.push({ path, content });
  }

  const zipBuffer = createZip(entries);
  const zipName = T.handle + '-' + T.version + '.zip';
  const zipPath = join(outDir, zipName);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(zipPath, zipBuffer);

  const manifest = {
    handle: T.handle,
    name: T.name,
    version: T.version,
    fileCount: entries.length,
    zipPath,
    zipBytes: zipBuffer.length,
    sha256: createHash('sha256').update(zipBuffer).digest('hex'),
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(outDir, 'theme-manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const m = writeTheme();
  console.log('ETAPE 1 — theme genere');
  console.log('   lint local : OK (JSON des templates + blocs schema)');
  console.log('   ' + m.fileCount + ' fichiers · ' + m.zipBytes + ' octets · sha256 ' + m.sha256.slice(0, 16) + '…');
  console.log('   ' + m.zipPath);
}
