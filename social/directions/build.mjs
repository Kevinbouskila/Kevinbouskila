import fs from 'node:fs';
import { serve, browser, newPage, shoot, ROOT } from '../tooling/lib.mjs';
import { DIRECTIONS } from './directions.mjs';

fs.mkdirSync(`${ROOT}/directions/source`, { recursive: true });
fs.mkdirSync(`${ROOT}/directions/export`, { recursive: true });
const slides = ['01', '05', '08'];
for (const [k, pages] of Object.entries(DIRECTIONS))
  pages.forEach((html, i) => fs.writeFileSync(`${ROOT}/directions/source/${k}-${slides[i]}.html`, html));

const s = await serve(); const br = await browser(); const p = await newPage(br, 1080, 1350);
for (const k of Object.keys(DIRECTIONS)) for (const n of slides) {
  await shoot(p, `${s.base}/directions/source/${k}-${n}.html`, `${ROOT}/directions/export/${k}-${n}.png`, 1080, 1350);
  process.stdout.write(`${k}-${n} `);
}
await br.close(); s.close(); console.log('\ndone');
