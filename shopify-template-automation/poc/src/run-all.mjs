// Chaine complete : generation du theme → fiche produit → publication.
// Par defaut, tout passe par le serveur Admin API mocke local (aucune cle reelle).
// Avec --dry-run : aucune sortie reseau, les mutations sont imprimees.
import { writeTheme } from './1-generate-theme.mjs';
import { writeListing } from './2-generate-listing.mjs';
import { publish } from './3-publish.mjs';
import { startMockServer } from './mock-admin-api.mjs';
import { AdminClient } from './lib/shopify-client.mjs';

const dryRun = process.argv.includes('--dry-run');
const PORT = Number(process.env.MOCK_PORT ?? 8788);

console.log('╭─ Pipeline template Shopify — scenario A (ma propre boutique)');
console.log('│  mode : ' + (dryRun ? 'DRY-RUN (aucun appel reseau)' : 'MOCK (Admin API local sur 127.0.0.1:' + PORT + ')'));
console.log('╰─────────────────────────────────────────────────────────────\n');

const manifest = writeTheme();
console.log('ETAPE 1 ✔ theme genere — ' + manifest.fileCount + ' fichiers, ZIP ' + manifest.zipBytes + ' octets');
console.log('        sha256 ' + manifest.sha256 + '\n');

const listing = writeListing();
console.log('ETAPE 2 ✔ fiche produit redigee');
console.log('        titre : ' + listing.title);
console.log('        tags  : ' + listing.tags.join(', '));
console.log('        media : ' + listing.media.map((m) => m.file).join(', ') + '\n');

let server = null;
let client;
if (dryRun) {
  client = new AdminClient({ dryRun: true });
} else {
  server = await startMockServer(PORT);
  process.env.SHOPIFY_MOCK_UPLOAD_URL = 'http://127.0.0.1:' + PORT + '/staged-upload';
  client = new AdminClient({ endpoint: 'http://127.0.0.1:' + PORT + '/admin/api/2025-10/graphql.json' });
}

console.log('ETAPE 3 — publication via Admin API');
try {
  const result = await publish({ client });
  console.log('\nETAPE 3 ✔ publication terminee');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n⚠️  Rappel — ce que ce pipeline NE fait PAS (cf. RAPPORT-FAISABILITE.md §2.2) :');
  console.log('   • activation du plan payant et verification KYC du moyen de paiement');
  console.log('   • rattachement du fichier telechargeable si l’app native Digital Downloads est utilisee');
  console.log('   • acceptation des CGV / licence du template');
} finally {
  server?.close();
}
