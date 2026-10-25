// Réserve automatiquement le cours Aerox du dimanche 10h au Centre 16.
// Lancé chaque samedi à 10h00 (heure de Paris), soit 24h avant la séance.
// Usage : C16_EMAIL=... C16_PASSWORD=... node aerox-booking/book.mjs [--dry-run]

import { createRequire } from 'node:module';
// Playwright est installé globalement dans l'environnement : on le résout
// via createRequire car un import ESM nu ne regarde pas NODE_PATH.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
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

/** Convertit JJ/MM/AAAA en AAAA-MM-JJ pour le paramètre startedAt. */
function isoDate(fr) {
  const [d, m, y] = fr.split('/');
  return `${y}-${m}-${d}`;
}

async function login(page) {
  // L'app est une SPA ; si une session valide est restaurée, le planning
  // s'affiche directement sans repasser par le formulaire OAuth.
  await page.goto(config.planningUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (!/\/oauth\/login\//.test(page.url()) && !(await page.getByRole('button', { name: /se connecter/i }).count())) {
    log('Session déjà active, pas de reconnexion nécessaire.');
    return;
  }

  // Sinon, parcours de connexion OAuth Symfony en deux étapes.
  await page.goto(config.loginUrl, { waitUntil: 'networkidle' });
  const connectBtn = page.getByRole('button', { name: /se connecter/i }).first();
  if (await connectBtn.count()) {
    await connectBtn.click();
    await page.waitForLoadState('networkidle');
  }

  if (!process.env.C16_EMAIL || !process.env.C16_PASSWORD) {
    throw new Error('Identifiants manquants : définir C16_EMAIL et C16_PASSWORD.');
  }

  // Étape 1 : adresse email.
  await page.locator('input[name="login_step_login[username]"], input[type="email"], input[type="text"]')
    .first().fill(process.env.C16_EMAIL);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');

  // Étape 2 : mot de passe (sélecteur agnostique, le nom de champ peut varier).
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await page.locator('input[type="password"]').first().fill(process.env.C16_PASSWORD);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  if (/\/oauth\/login\//.test(page.url())) {
    throw new Error('Échec de connexion (toujours sur la page OAuth). Vérifier les identifiants ou un éventuel code de vérification.');
  }
  log('Connectée.');
}

/** Cherche la carte du cours visé et clique sur Réserver. Renvoie un statut. */
async function attemptBooking(page, date) {
  // Resamania charge le planning d'une semaine via startedAt (AAAA-MM-JJ).
  const url = `${config.planningUrl}&startedAt=${isoDate(date)}`;
  await page.goto(url, { waitUntil: 'networkidle' });

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
