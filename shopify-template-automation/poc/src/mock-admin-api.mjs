// Faux Admin API GraphQL + endpoint d'upload stage, pour executer la chaine
// complete sans aucune cle reelle. Ne reproduit ni l'auth, ni la validation
// metier de Shopify : sert uniquement a prouver l'enchainement des appels.
import { createServer } from 'node:http';
import { resolveOperation, mockState } from './lib/mock-resolver.mjs';

const PORT = Number(process.env.MOCK_PORT ?? 8788);

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

export function startMockServer(port = PORT) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname.startsWith('/staged-upload')) {
      const body = await readBody(req);
      console.log(`   [mock] upload recu : ${decodeURIComponent(url.pathname.split('/').pop())} (${body.length} octets)`);
      res.writeHead(201).end('{"ok":true}');
      return;
    }

    if (req.method === 'POST' && url.pathname.includes('/graphql.json')) {
      const { query, variables } = JSON.parse((await readBody(req)).toString('utf8'));
      const result = resolveOperation({ query, variables });
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/__state') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(mockState, null, 2));
      return;
    }

    res.writeHead(404).end('not found');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMockServer().then(() => console.log(`Mock Admin API sur http://127.0.0.1:${PORT}/admin/api/2025-10/graphql.json`));
}
