// Reconnaissance : se connecte une fois et capture la structure des pages
// afin d'écrire des sélecteurs fiables pour book.mjs.
// Usage : C16_EMAIL=... C16_PASSWORD=... node aerox-booking/recon.mjs

import { createRequire } from 'node:module';
// Playwright est installé globalement dans l'environnement : on le résout
// via createRequire car un import ESM nu ne regarde pas NODE_PATH.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/** Attend que la page se stabilise, sans jamais bloquer : les appels aux
 *  domaines tiers (tracking, paiement) sont refusés par le proxy de la
 *  session et "networkidle" ne retomberait donc jamais. */
const settle = (page) =>
  page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

/** N'autorise que les domaines Resamania : tout le reste est abandonné
 *  immédiatement au lieu d'attendre un timeout réseau. */
const ALLOWED_HOSTS = /(^|\.)resamania\.com$/;
async function blockThirdParties(context) {
  await context.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ALLOWED_HOSTS.test(host) ? route.continue() : route.abort();
  });
}

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
const outDir = new URL('./recon-out/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'fr-FR', timezoneId: config.timezone });
await blockThirdParties(context);
const page = await context.newPage();

await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
writeFileSync(new URL('01-login.html', outDir), await page.content());
await page.screenshot({ path: new URL('01-login.png', outDir).pathname, fullPage: true });

// Inventaire des champs de formulaire, pour identifier email / mot de passe.
const fields = await page.$$eval('input, button, a[href]', (nodes) =>
  nodes.map((n) => ({
    tag: n.tagName,
    type: n.getAttribute('type'),
    name: n.getAttribute('name'),
    id: n.id || null,
    placeholder: n.getAttribute('placeholder'),
    href: n.getAttribute('href'),
    text: (n.textContent || '').trim().slice(0, 60),
  })),
);
writeFileSync(new URL('01-login-fields.json', outDir), JSON.stringify(fields, null, 2));

if (process.env.C16_EMAIL && process.env.C16_PASSWORD) {
  // Heuristique : premier champ email/texte, premier champ mot de passe.
  await page.locator('input[type="email"], input[type="text"]').first().fill(process.env.C16_EMAIL);
  await page.locator('input[type="password"]').first().fill(process.env.C16_PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await settle(page);

  writeFileSync(new URL('02-apres-login.html', outDir), await page.content());
  await page.screenshot({ path: new URL('02-apres-login.png', outDir).pathname, fullPage: true });
  writeFileSync(new URL('02-url.txt', outDir), page.url());

  // La session est conservée pour éviter de se reconnecter à chaque réservation.
  await context.storageState({ path: new URL('../session.json', import.meta.url).pathname });
  console.log('Session enregistrée. URL après login :', page.url());
}

await browser.close();
console.log('Captures écrites dans aerox-booking/recon-out/');
