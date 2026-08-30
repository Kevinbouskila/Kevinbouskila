/* Storyboard per reel: a markdown timeline + a keyframe contact sheet. */
import fs from 'node:fs';
import { ROOT } from './lib.mjs';
import { sheet } from './sheet.mjs';

const REELS = {
  '03-slash-tech': { t: 'Slash Tech', cat: 'SLASH TECH /', note: "Call and response : « Vous avez… » en retrait (encre 3), « On… » en pleine encre. La carte de fin déroule BUILD / ADOPT / SCALE / puis le lockup." },
  '05-vibe-coding': { t: 'Vibe coding', cat: 'BUILD /', note: "Il y a du code, mais l'éditeur est en light mode : le feed ne bascule jamais dans le terminal noir. Le ≠ est le pivot du film." },
  '09-moat': { t: 'Moat', cat: 'OPINION /', note: "Le marché se remplit à l'écran : 18 produits, puis 126. À la fin, un seul passe en gradient — celui qui est choisi." },
  '12-arpent': { t: 'Arpent', cat: 'BUILD /', note: "⚠ Écrans conçus, pas captés — voir MOCKUP.md. Extraction → Calcul → Analyse → Décision, chaque étape dans la même surface produit." },
};

for (const [d, meta] of Object.entries(REELS)) {
  const { config } = await import(`${ROOT}/${d}/source/scenes.mjs?v=${Date.now()}`);
  let t = 0;
  const rows = config.scenes.map((s, i) => {
    const t0 = t, t1 = t + s.d; t = t1;
    const txt = s.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 96);
    return `| ${String(i + 1).padStart(2, '0')} | ${t0.toFixed(1)}s → ${t1.toFixed(1)}s | \`${s.bg}\` | ${txt} |`;
  });
  const kf = fs.readdirSync(`${ROOT}/${d}/assets`).filter(f => f.startsWith('keyframe')).sort();
  if (kf.length) await sheet({ files: kf.map(f => `${ROOT}/${d}/assets/${f}`), cols: Math.min(8, kf.length),
      out: `${ROOT}/${d}/storyboard/${d}-keyframes.png`, cell: 260, ratio: 1920 / 1080,
      labels: kf.map((_, i) => `KF ${String(i + 1).padStart(2, '0')}`) });

  fs.writeFileSync(`${ROOT}/${d}/storyboard/${d}-storyboard.md`, `# Reel ${d.slice(0, 2)} — ${meta.t}

**Catégorie** ${meta.cat} · **Format** 1080 × 1920 · **Durée** ${t.toFixed(1)} s · **30 fps** · H.264 / AAC

${meta.note}

## Timeline

| # | Temps | Fond | Texte |
|---|---|---|---|
${rows.join('\n')}

## Motion

Entrée 520 ms \`easeOutExpo\` (montée 34 px, échelle 0.986 → 1) ·
sortie 340 ms \`easeInQuad\` (retrait 26 px) ·
balayage slash 620 ms \`easeInOutCubic\` sur chaque coupe ·
fondu de fond synchronisé sur l'entrée de scène.

## Son

Nappe harmonique basse continue · swoosh de bruit filtré 220 ms avant chaque coupe ·
clic UI sur la coupe · résolution douce à −1,05 s de la fin.
Synthétisé par \`tooling/sound.py\` — aucun sample.

## Livrables

\`export/${d}.mp4\` · \`cover/${d}-cover-1080x1920.png\` ·
\`cover/${d}-cover-feed-1080x1350.png\` · \`assets/keyframe-*.png\` ·
\`audio/${d}-sound-design.wav\` · \`storyboard/${d}-keyframes.png\`

## Régénérer

\`\`\`bash
node ${d}/source/build.mjs
cd tooling && node run-reels.mjs ${d} && node sound-mux.mjs ${d}
\`\`\`
`);
  console.log(`${d} storyboard — ${config.scenes.length} scènes, ${t.toFixed(1)}s`);
}
