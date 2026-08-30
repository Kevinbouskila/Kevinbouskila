/* Simulates the Instagram profile grid from the 12 covers. */
import fs from 'node:fs';
import sharp from 'sharp';
import { ROOT } from './lib.mjs';

export const POSTS = [
  { d: '01-manifeste',        cat: 'BRAND',       kind: 'carrousel' },
  { d: '02-field-notes',      cat: 'FIELD NOTES', kind: 'carrousel' },
  { d: '03-slash-tech',       cat: 'SLASH TECH',  kind: 'reel' },
  { d: '04-roi',              cat: 'BUSINESS',    kind: 'carrousel' },
  { d: '05-vibe-coding',      cat: 'BUILD',       kind: 'reel' },
  { d: '06-prompting',        cat: 'ADOPT',       kind: 'carrousel' },
  { d: '07-agent-vs-chatbot', cat: 'DECRYPT',     kind: 'carrousel' },
  { d: '08-quality',          cat: 'QUALITY',     kind: 'carrousel' },
  { d: '09-moat',             cat: 'OPINION',     kind: 'reel' },
  { d: '10-scale',            cat: 'SCALE',       kind: 'carrousel' },
  { d: '11-ambassadeurs',     cat: 'ADOPT',       kind: 'carrousel' },
  { d: '12-arpent',           cat: 'BUILD',       kind: 'reel' },
];

export const coverOf = (p) => p.kind === 'reel'
  ? `${ROOT}/${p.d}/cover/${p.d}-cover-feed-1080x1350.png`
  : `${ROOT}/${p.d}/export/${p.d}-01.png`;

async function grid({ out, square, cell = 400, gap = 6, bg = '#FFFFFF' }) {
  const ch = square ? cell : Math.round(cell * 1350 / 1080);
  const W = cell * 3 + gap * 2, H = ch * 4 + gap * 3;
  const comp = [];
  for (let i = 0; i < POSTS.length; i++) {
    const f = coverOf(POSTS[i]);
    if (!fs.existsSync(f)) throw new Error('missing cover: ' + f);
    let img = sharp(f);
    /* The profile grid crops the 4:5 cover to a centred square. */
    if (square) img = img.extract({ left: 0, top: Math.round((1350 - 1080) / 2), width: 1080, height: 1080 });
    comp.push({ input: await img.resize(cell, ch, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer(),
                left: (i % 3) * (cell + gap), top: Math.floor(i / 3) * (ch + gap) });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: bg } })
    .composite(comp).png({ compressionLevel: 9 }).toFile(out);
  console.log(out.split('/').pop(), `${W}x${H}`);
}

await grid({ out: `${ROOT}/feed-preview/feed-preview.png`, square: true, cell: 460 });
await grid({ out: `${ROOT}/feed-preview/feed-preview-4x5.png`, square: false, cell: 460 });
