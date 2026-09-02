// Client Admin API GraphQL minimal.
// Trois modes :
//   - reel  : SHOPIFY_SHOP + SHOPIFY_ADMIN_TOKEN
//   - mock  : SHOPIFY_MOCK_ENDPOINT (serveur local, cf. src/mock-admin-api.mjs)
//   - dry   : aucune sortie reseau, les operations sont imprimees puis resolues en memoire
//
// Debit : l'Admin GraphQL API est limitee au cout calcule (100 pts/s en Standard,
// 200 en Advanced, 1000 en Plus ; 1000 pts max pour une requete isolee).
// https://shopify.dev/docs/api/usage/limits
import { readFileSync, existsSync } from 'node:fs';
import { resolveOperation } from './mock-resolver.mjs';

export function loadEnv(path = new URL('../../.env', import.meta.url).pathname) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class AdminClient {
  constructor({ shop, token, apiVersion = '2025-10', endpoint, dryRun = false, log = console.log } = {}) {
    this.dryRun = dryRun;
    this.log = log;
    this.apiVersion = apiVersion;
    this.endpoint = endpoint ?? (shop ? `https://${shop}/admin/api/${apiVersion}/graphql.json` : null);
    this.token = token;
    // Seuil sous lequel on attend la restauration du bucket avant d'envoyer la requete suivante.
    this.lowWaterMark = 200;
    this.lastThrottle = null;

    if (!this.dryRun && !this.endpoint) {
      throw new Error('AdminClient: definir SHOPIFY_SHOP + SHOPIFY_ADMIN_TOKEN, ou SHOPIFY_MOCK_ENDPOINT, ou utiliser --dry-run.');
    }
  }

  static fromEnv({ dryRun = false } = {}) {
    loadEnv();
    return new AdminClient({
      shop: process.env.SHOPIFY_SHOP,
      token: process.env.SHOPIFY_ADMIN_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-10',
      endpoint: process.env.SHOPIFY_MOCK_ENDPOINT || undefined,
      dryRun,
    });
  }

  async #respectThrottle() {
    const t = this.lastThrottle;
    if (!t || t.currentlyAvailable >= this.lowWaterMark) return;
    const waitMs = Math.ceil(((this.lowWaterMark - t.currentlyAvailable) / t.restoreRate) * 1000);
    this.log(`   ⏳ bucket a ${t.currentlyAvailable}/${t.maximumAvailable} pts — pause ${waitMs} ms`);
    await sleep(waitMs);
  }

  /**
   * @param {string} label  nom lisible de l'etape
   * @param {string} query  document GraphQL (la 1re ligne doit nommer l'operation)
   * @param {object} variables
   */
  async graphql(label, query, variables = {}) {
    const opName = /\b(?:mutation|query)\s+(\w+)/.exec(query)?.[1] ?? 'anonymous';

    if (this.dryRun) {
      this.log(`\n── [DRY-RUN] ${label} · ${opName}`);
      this.log(query.trim().split('\n').map((l) => `   ${l}`).join('\n'));
      this.log(`   variables: ${JSON.stringify(variables, null, 2).split('\n').join('\n   ')}`);
      return this.#unwrap(label, resolveOperation({ query, variables }));
    }

    await this.#respectThrottle();

    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['X-Shopify-Access-Token'] = this.token;

    let attempt = 0;
    for (;;) {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      // 429 : quota epuise cote REST/edge. On respecte Retry-After quand il est fourni.
      if (res.status === 429 && attempt < 5) {
        const retryAfter = Number(res.headers.get('retry-after') ?? 2);
        this.log(`   ⏳ 429 — nouvelle tentative dans ${retryAfter}s`);
        await sleep(retryAfter * 1000);
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status} ${await res.text()}`);

      const body = await res.json();
      this.lastThrottle = body.extensions?.cost?.throttleStatus ?? this.lastThrottle;

      // THROTTLED est une erreur GraphQL, pas un code HTTP : elle se rejoue.
      const throttled = body.errors?.some((e) => e.extensions?.code === 'THROTTLED');
      if (throttled && attempt < 5) {
        const backoff = 2 ** attempt * 1000;
        this.log(`   ⏳ THROTTLED — backoff ${backoff} ms`);
        await sleep(backoff);
        attempt++;
        continue;
      }
      return this.#unwrap(label, body);
    }
  }

  #unwrap(label, body) {
    if (body.errors?.length) throw new Error(`${label}: ${JSON.stringify(body.errors)}`);
    // Toutes les mutations Admin renvoient userErrors : ne jamais considerer
    // un HTTP 200 comme un succes sans l'avoir verifie.
    for (const payload of Object.values(body.data ?? {})) {
      const errs = payload?.userErrors ?? payload?.mediaUserErrors;
      if (errs?.length) throw new Error(`${label} — userErrors: ${JSON.stringify(errs)}`);
    }
    return body.data;
  }

  /** Upload vers une cible renvoyee par stagedUploadsCreate (multipart/form-data). */
  async uploadToStagedTarget(target, buffer, filename, mimeType = 'application/octet-stream') {
    if (this.dryRun) {
      this.log(`   [DRY-RUN] upload ${filename} (${buffer.length} octets) → ${target.url}`);
      return target.resourceUrl;
    }
    const form = new FormData();
    for (const p of target.parameters ?? []) form.append(p.name, p.value);
    form.append('file', new Blob([buffer], { type: mimeType }), filename);
    const res = await fetch(target.url, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`upload ${filename}: HTTP ${res.status} ${await res.text()}`);
    return target.resourceUrl;
  }
}
