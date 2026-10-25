// Réserve automatiquement le cours Hyrox du dimanche 10h au Centre 16 (Resamania).
// Lancé chaque samedi à 10h00 (heure de Paris), pendant Shabbat.
// Usage : C16_EMAIL=... C16_PASSWORD=... node aerox-booking/book.mjs [--dry-run] [--date=AAAA-MM-JJ]

import { createRequire } from 'node:module';
// Playwright est installé globalement dans l'environnement : on le résout
// via createRequire car un import ESM nu ne regarde pas NODE_PATH.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
const sel = config.selectors;
const dryRun = process.argv.includes('--dry-run');
const forcedDate = process.argv.find((a) => a.startsWith('--date='))?.slice(7);

const log = (...args) => console.log(new Date().toISOString(), ...args);

/** Attend que la page se stabilise, sans jamais bloquer : la page appelle des
 *  domaines tiers (tracking, paiement) que le proxy refuse, donc l'état
 *  « networkidle » ne serait jamais atteint. */
const settle = (page) =>
  page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

/** N'autorise que Resamania : tout le reste est abandonné immédiatement
 *  plutôt que d'attendre un timeout réseau. */
async function blockThirdParties(context) {
  await context.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return /(^|\.)resamania\.com$/.test(host) ? route.continue() : route.abort();
  });
}

/** Instant (ms epoch) correspondant à une heure murale dans un fuseau donné,
 *  en tenant compte des bascules d'heure d'été. */
function zonedInstant(dateIso, timeHm, tz) {
  const naive = Date.parse(`${dateIso}T${timeHm}:00Z`);
  const offsetAt = (ms) => {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName').value;
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
    return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) * 60000 : 0;
  };
  // Deux passes : la seconde corrige les cas proches d'un changement d'heure.
  const first = naive - offsetAt(naive);
  return naive - offsetAt(first);
}

/** Le club n'ouvre la réservation que 24h avant la séance, pour éviter que
 *  les créneaux soient bloqués des semaines à l'avance. */
function opensAt(dateIso) {
  return zonedInstant(dateIso, config.startTime, config.timezone) - config.bookingOpensHoursBefore * 3600 * 1000;
}

/** Date de la prochaine séance visée, au format AAAA-MM-JJ (heure de Paris). */
function targetDate() {
  if (forcedDate) return forcedDate;
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const d = new Date(Date.UTC(+get('year'), +get('month') - 1, +get('day')));
  // Dimanche prochain ; si on est déjà dimanche, celui de la semaine suivante.
  d.setUTCDate(d.getUTCDate() + ((config.weekday - d.getUTCDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

/** Libellé tel qu'affiché sur la carte, ex. « Dimanche 8 novembre ». */
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

async function login(page, date) {
  // L'app est une SPA : si la session est encore valide, le planning s'affiche
  // directement et le formulaire OAuth n'apparaît pas.
  await page.goto(planningUrl(date), { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.waitForTimeout(3000);
  const needsLogin = /\/oauth\/login\//.test(page.url())
    || (await page.locator(sel.loginConnectButton).count()) > 0;
  if (!needsLogin) {
    log('Session déjà active, pas de reconnexion.');
    return;
  }

  if (!process.env.C16_EMAIL || !process.env.C16_PASSWORD) {
    throw new Error('Identifiants manquants : définir C16_EMAIL et C16_PASSWORD.');
  }

  // Parcours OAuth Symfony en deux étapes : email, puis mot de passe.
  await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.locator(sel.loginConnectButton).first().click();

  await page.waitForSelector(sel.email, { timeout: 30000 });
  await page.fill(sel.email, process.env.C16_EMAIL);
  await page.click(sel.emailSubmit);
  await settle(page);

  await page.waitForSelector(sel.password, { timeout: 30000 });
  await page.fill(sel.password, process.env.C16_PASSWORD);
  await page.locator(sel.passwordSubmit).first().click();
  await settle(page);
  await page.waitForTimeout(4000);

  if (/\/oauth\/login\//.test(page.url())) {
    throw new Error('Échec de connexion : toujours sur la page OAuth. Vérifier les identifiants.');
  }
  log('Connectée.');
}

const planningUrl = (date) => `${config.planningUrl}&startedAt=${date}`;

/** Cherche la carte du cours visé et s'inscrit. Renvoie un statut. */
async function attemptBooking(page, date) {
  const label = dayLabel(date);
  await page.goto(planningUrl(date), { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.waitForTimeout(5000);

  // Le planning se charge en défilement infini : le jour visé est en tête de
  // liste grâce à startedAt, mais on déroule un peu au cas où.
  for (let i = 0; i < 3; i++) {
    if (await page.getByText(new RegExp(label, 'i')).count()) break;
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1500);
  }

  // Une carte = un MuiPaper contenant le jour, l'heure et le nom du cours.
  const card = page.locator(sel.courseCard)
    .filter({ hasText: new RegExp(label, 'i') })
    .filter({ hasText: config.startTime })
    .filter({ hasText: new RegExp(config.courseName, 'i') })
    .first();

  if (!(await card.count())) return { status: 'introuvable' };

  const text = (await card.innerText()).replace(/\s+/g, ' ');
  log('Carte trouvée :', text.slice(0, 160));

  if (/annuler/i.test(text)) return { status: 'déjà réservé', text };
  if (/complet/i.test(text)) return { status: 'complet', text };

  const button = card.locator(sel.bookButton).first();
  if (!(await button.count())) return { status: 'pas de bouton', text };
  if (dryRun) return { status: 'dry-run : bouton trouvé', text };

  await button.click();
  await settle(page);
  await page.waitForTimeout(2000);

  // Certaines inscriptions passent par une boîte de confirmation.
  const confirm = page.locator('[role="dialog"]')
    .locator('button:has-text("Confirmer"), button:has-text("Valider"), button:has-text("Je confirme")')
    .first();
  if (await confirm.count()) {
    log('Confirmation demandée, validation.');
    await confirm.click();
    await settle(page);
    await page.waitForTimeout(3000);
  }

  // Seule preuve fiable : la carte propose désormais « Annuler ».
  await page.goto(planningUrl(date), { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.waitForTimeout(5000);
  const after = (await card.innerText().catch(() => '')).replace(/\s+/g, ' ');
  if (/annuler/i.test(after)) return { status: 'réservé', text: after };
  return { status: 'cliqué, confirmation non vérifiée', text: after || text };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const date = targetDate();
const open = opensAt(date);
log(`Cible : ${config.courseName} ${config.startTime} — ${dayLabel(date)} (${date})${dryRun ? ' [dry-run]' : ''}`);
log(`Ouverture des réservations : ${new Intl.DateTimeFormat('fr-FR', { timeZone: config.timezone, dateStyle: 'full', timeStyle: 'short' }).format(new Date(open))}`);

// On n'ouvre le navigateur que peu avant l'ouverture : attendre à vide coûte
// moins qu'un navigateur laissé ouvert une heure.
const LEAD_MS = 3 * 60 * 1000;
const untilOpen = open - Date.now();
if (untilOpen > config.maxWaitMinutes * 60000) {
  log(`Ouverture dans ${Math.round(untilOpen / 60000)} min, soit plus que l'attente autorisée (${config.maxWaitMinutes} min) : tentative immédiate.`);
} else if (untilOpen > LEAD_MS) {
  log(`Attente de ${Math.round((untilOpen - LEAD_MS) / 60000)} min avant d'ouvrir le navigateur.`);
  await sleep(untilOpen - LEAD_MS);
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'fr-FR', timezoneId: config.timezone });
await blockThirdParties(context);
const page = await context.newPage();

const ok = (s) => ['réservé', 'déjà réservé'].includes(s) || s.startsWith('dry-run');
let result = { status: 'échec' };
try {
  await login(page, date);

  // Connexion faite avant l'ouverture : il ne reste que le clic à jouer.
  const remaining = open - Date.now();
  if (remaining > 0 && remaining <= config.maxWaitMinutes * 60000) {
    log(`Ouverture dans ${Math.round(remaining / 1000)} s, attente.`);
    await page.waitForTimeout(remaining);
  }

  // Le créneau peut s'ouvrir avec un léger décalage : on réessaie en rafale.
  for (let i = 1; i <= config.retry.attempts; i++) {
    result = await attemptBooking(page, date);
    log(`Tentative ${i}/${config.retry.attempts} : ${result.status}`);
    if (ok(result.status) || result.status === 'complet') break;
    if (i < config.retry.attempts) await page.waitForTimeout(config.retry.delaySeconds * 1000);
  }
} catch (error) {
  result = { status: 'erreur', error: String(error) };
  await page.screenshot({ path: new URL('./erreur.png', import.meta.url).pathname, fullPage: true })
    .catch(() => {});
  log('Erreur :', error);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ date, cours: config.courseName, heure: config.startTime, ...result }, null, 2));
process.exit(ok(result.status) ? 0 : 1);
