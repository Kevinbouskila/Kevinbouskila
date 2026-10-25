// Réserve automatiquement le cours Aerox du dimanche 10h au Centre 16.
// Lancé chaque samedi à 10h00 (heure de Paris), soit 24h avant la séance.
// Usage : C16_EMAIL=... C16_PASSWORD=... node aerox-booking/book.mjs [--dry-run]

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
const dryRun = process.argv.includes('--dry-run');
const sessionPath = new URL('./session.json', import.meta.url).pathname;

const log = (...args) => console.log(new Date().toISOString(), ...args);

/** Date de la prochaine séance visée, au format JJ/MM/AAAA (heure de Paris). */
function targetDate() {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: config.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const today = new Date(Date.UTC(+get('year'), +get('month') - 1, +get('day')));
  const daysAhead = (config.weekday - today.getUTCDay() + 7) % 7 || 7;
  today.setUTCDate(today.getUTCDate() + daysAhead);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(today.getUTCDate())}/${pad(today.getUTCMonth() + 1)}/${today.getUTCFullYear()}`;
}

async function login(page) {
  await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
  const passwordField = page.locator(config.selectors.password ?? 'input[type="password"]').first();
  if (!(await passwordField.count())) {
    log('Déjà connectée (aucun formulaire de connexion).');
    return;
  }
  await page.locator(config.selectors.email ?? 'input[type="email"], input[type="text"]').first()
    .fill(process.env.C16_EMAIL);
  await passwordField.fill(process.env.C16_PASSWORD);
  await page.locator(config.selectors.submit ?? 'button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  log('Connectée.');
}

/** Cherche la carte du cours visé et clique sur Réserver. Renvoie un statut. */
async function attemptBooking(page, date) {
  await page.goto(config.planningUrl, { waitUntil: 'networkidle' });

  const card = config.selectors.courseCard
    ? page.locator(config.selectors.courseCard)
    : page.locator('*', { hasText: new RegExp(config.courseName, 'i') })
        .filter({ hasText: config.startTime })
        .last();

  if (!(await card.count())) return { status: 'introuvable' };

  const text = (await card.first().innerText()).replace(/\s+/g, ' ');
  log('Cours trouvé :', text.slice(0, 160));

  if (/réserv(é|ee|ée)|inscrit/i.test(text)) return { status: 'déjà réservé', text };

  const button = card.first().locator(
    config.selectors.bookButton ?? 'button, a',
  ).filter({ hasText: /réserver|s.inscrire/i }).first();

  if (!(await button.count())) return { status: 'pas de bouton', text };
  if (dryRun) return { status: 'dry-run : bouton trouvé', text };

  await button.click();
  await page.waitForLoadState('networkidle');
  const after = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  if (/réservation (confirmée|enregistrée)|inscription confirmée/i.test(after)) {
    return { status: 'réservé', text };
  }
  return { status: 'cliqué, confirmation à vérifier', text };
}

const date = targetDate();
log(`Cible : ${config.courseName} ${config.startTime} du ${date}${dryRun ? ' (dry-run)' : ''}`);

const browser = await chromium.launch();
const context = await browser.newContext({
  locale: 'fr-FR',
  timezoneId: config.timezone,
  storageState: existsSync(sessionPath) ? sessionPath : undefined,
});
const page = await context.newPage();

let result = { status: 'échec' };
try {
  await login(page);
  // Le créneau peut s'ouvrir avec quelques secondes de décalage : on réessaie.
  for (let i = 1; i <= config.retry.attempts; i++) {
    result = await attemptBooking(page, date);
    log(`Tentative ${i}/${config.retry.attempts} : ${result.status}`);
    if (['réservé', 'déjà réservé'].includes(result.status) || result.status.startsWith('dry-run')) break;
    if (i < config.retry.attempts) await page.waitForTimeout(config.retry.delaySeconds * 1000);
  }
  await context.storageState({ path: sessionPath });
} catch (error) {
  result = { status: 'erreur', error: String(error) };
  await page.screenshot({ path: new URL('./erreur.png', import.meta.url).pathname, fullPage: true })
    .catch(() => {});
  log('Erreur :', error);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ date, ...result }, null, 2));
process.exit(['réservé', 'déjà réservé'].includes(result.status) || result.status.startsWith('dry-run') ? 0 : 1);
