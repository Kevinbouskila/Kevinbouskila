// Reconnaissance : se connecte une fois et capture la structure des pages
// afin d'écrire des sélecteurs fiables pour book.mjs.
// Usage : C16_EMAIL=... C16_PASSWORD=... node aerox-booking/recon.mjs

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
const outDir = new URL('./recon-out/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'fr-FR', timezoneId: config.timezone });
const page = await context.newPage();

await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
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
  await page.waitForLoadState('networkidle');

  writeFileSync(new URL('02-apres-login.html', outDir), await page.content());
  await page.screenshot({ path: new URL('02-apres-login.png', outDir).pathname, fullPage: true });
  writeFileSync(new URL('02-url.txt', outDir), page.url());

  // La session est conservée pour éviter de se reconnecter à chaque réservation.
  await context.storageState({ path: new URL('../session.json', import.meta.url).pathname });
  console.log('Session enregistrée. URL après login :', page.url());
}

await browser.close();
console.log('Captures écrites dans aerox-booking/recon-out/');
