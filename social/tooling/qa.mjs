/* Contrôle qualité — s'exécute sur les fichiers réellement exportés. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './lib.mjs';
import { POSTS, coverOf } from './feed.mjs';

const fail = [], warn = [], info = [];
const ok = (c, m) => (c ? null : m);

/* ---- 1. Typographie française : rien d'échappé au filtre fr() ---- */
const TAGS = /<[^>]*>/g;
for (const p of POSTS) {
  const dir = `${ROOT}/${p.d}/source`;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.html'))) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const body = raw.slice(raw.indexOf('<body')).replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(TAGS, ' ');
    if (/\w'\w/.test(body)) fail.push(`${p.d}/${f} — apostrophe droite dans le texte rendu`);
    if (/"/.test(body))     fail.push(`${p.d}/${f} — guillemet droit dans le texte rendu`);
  }
}

/* ---- 2. Budget gradient : 2 apparitions max par slide ---- */
for (const p of POSTS) {
  const dir = `${ROOT}/${p.d}/source`;
  for (const f of fs.readdirSync(dir).filter(x => /^\d\d\.html$/.test(x))) {
    const h = fs.readFileSync(path.join(dir, f), 'utf8');
    const body = h.slice(h.indexOf('<body'));
    /* An ink terminal-slash carries no gradient — don't charge it to the budget. */
    const n = (body.match(/class="[^"]*\b(grad|endslash|pill--grad|node--active|hot)\b[^"]*"/g) || [])
                .filter(c => !c.includes('endslash--ink')).length
            + (body.match(/class="tile"/g) || []).length
            + (body.match(/class="tick"/g) || []).length;
    /* Baseline per slide is 2 (eyebrow tick + footer tile); content adds at most 2. */
    if (n > 4) warn.push(`${p.d}/${f} — ${n} marques gradient (base 2 + contenu 2 max)`);
  }
}

/* ---- 3. Dimensions, profil colorimétrique, dominante claire ---- */
async function analyse(file) {
  const im = sharp(file);
  const m = await im.metadata();
  const { data, info: i } = await sharp(file).resize(216, null, { kernel: 'lanczos3' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let light = 0, sum = 0;
  const px = i.width * i.height;
  for (let k = 0; k < data.length; k += 3) {
    const L = (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
    sum += L; if (L > 0.86) light++;
  }
  return { w: m.width, h: m.height, space: m.space, hasAlpha: m.hasAlpha, mean: sum / px, lightPct: light / px * 100 };
}

let slides = 0, lightTotal = 0;
for (const p of POSTS) {
  const files = p.kind === 'reel'
    ? [coverOf(p), `${ROOT}/${p.d}/cover/${p.d}-cover-1080x1920.png`]
    : fs.readdirSync(`${ROOT}/${p.d}/export`).filter(f => f.endsWith('.png')).map(f => `${ROOT}/${p.d}/export/${f}`);
  for (const f of files) {
    const a = await analyse(f);
    const exp = a.h === 1920 ? [1080, 1920] : [1080, 1350];
    const e1 = ok(a.w === exp[0] && a.h === exp[1], `${path.basename(f)} — ${a.w}x${a.h}, attendu ${exp.join('x')}`);
    if (e1) fail.push(e1);
    const e2 = ok(a.space === 'srgb', `${path.basename(f)} — espace ${a.space}, attendu srgb`);
    if (e2) fail.push(e2);
    if (a.lightPct < 70) warn.push(`${path.basename(f)} — ${a.lightPct.toFixed(1)}% de surface claire (cible 70–85%+)`);
    if (p.kind !== 'reel') { slides++; lightTotal += a.lightPct; }
  }
  /* ---- 4. Livrables attendus ---- */
  if (p.kind === 'reel') {
    for (const need of [`export/${p.d}.mp4`, `cover/${p.d}-cover-1080x1920.png`,
                        `cover/${p.d}-cover-feed-1080x1350.png`, `source/reel.html`,
                        `storyboard/${p.d}-storyboard.md`, `audio/${p.d}-sound-design.wav`]) {
      if (!fs.existsSync(`${ROOT}/${p.d}/${need}`)) fail.push(`${p.d} — livrable manquant : ${need}`);
    }
    if (!fs.readdirSync(`${ROOT}/${p.d}/assets`).some(f => f.startsWith('keyframe'))) fail.push(`${p.d} — aucun keyframe`);
  } else {
    if (!fs.existsSync(`${ROOT}/${p.d}/preview/${p.d}-carousel.png`)) fail.push(`${p.d} — planche preview manquante`);
  }
}
info.push(`Surface claire moyenne (carrousels) : ${(lightTotal / slides).toFixed(1)}%  sur ${slides} slides`);

/* ---- 5. Fichiers racine ---- */
for (const f of ['SOCIAL-DESIGN-SYSTEM.md', 'README.md', 'feed-preview/feed-preview.png',
                 'design-system/system.css', 'design-system/tokens.json'])
  if (!fs.existsSync(`${ROOT}/${f}`)) fail.push(`racine — manquant : ${f}`);

/* ---- 6. Test de lisibilité à 250 px ---- */
const { sheet } = await import('./sheet.mjs');
await sheet({ files: POSTS.map(coverOf), cols: 6, out: `${ROOT}/feed-preview/legibility-250.png`,
              cell: 250, labels: POSTS.map(p => p.d) });

const P = s => console.log(s);
P('\n══ QA — SLASH TECH SOCIAL ══');
info.forEach(i => P('  · ' + i));
P(`\n  ERREURS : ${fail.length}`); fail.forEach(f => P('   ✗ ' + f));
P(`  ALERTES : ${warn.length}`);   warn.forEach(w => P('   ! ' + w));
P(fail.length ? '\n  → corrections requises\n' : '\n  → conforme\n');
