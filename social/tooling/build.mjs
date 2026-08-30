/* Build carousels: slides.mjs -> source/*.html -> export/*.png -> preview/*.png */
import fs from 'node:fs';
import path from 'node:path';
import { serve, browser, newPage, shoot, ROOT } from './lib.mjs';
import { sheet } from './sheet.mjs';

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const dirs = fs.readdirSync(ROOT).filter(d => /^\d\d-/.test(d))
  .filter(d => fs.existsSync(path.join(ROOT, d, 'source', 'slides.mjs')))
  .filter(d => !only.length || only.some(o => d.includes(o))).sort();

const s = await serve(); const br = await browser(); const p = await newPage(br, 1080, 1350);
for (const d of dirs) {
  const mod = await import(`${ROOT}/${d}/source/slides.mjs?v=${Date.now()}`);
  const slides = mod.slides;
  fs.rmSync(`${ROOT}/${d}/export`, { recursive: true, force: true });
  fs.mkdirSync(`${ROOT}/${d}/export`, { recursive: true });
  const outs = [];
  for (let i = 0; i < slides.length; i++) {
    const nn = String(i + 1).padStart(2, '0');
    const hf = `${ROOT}/${d}/source/${nn}.html`;
    fs.writeFileSync(hf, slides[i]);
    const png = `${ROOT}/${d}/export/${d}-${nn}.png`;
    await shoot(p, `${s.base}/${d}/source/${nn}.html`, png, 1080, 1350);
    outs.push(png);
  }
  await sheet({ files: outs, cols: Math.min(4, outs.length), out: `${ROOT}/${d}/preview/${d}-carousel.png`, cell: 420,
                labels: outs.map((_, i) => `${String(i + 1).padStart(2, '0')} / ${String(outs.length).padStart(2, '0')}`) });
  console.log(`${d}  ${outs.length} slides`);
}
await br.close(); s.close();
