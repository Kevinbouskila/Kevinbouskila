/* Re-shoot a reel cover at a chosen time without re-rendering the video. */
import sharp from 'sharp';
import { serve, browser, newPage, ROOT } from './lib.mjs';
const [dir, tRaw] = process.argv.slice(2);
const s = await serve(); const br = await browser(); const page = await newPage(br, 1080, 1920, 1);
await page.addInitScript(() => { window.__capture = true; });
await page.goto(`${s.base}/${dir}/source/reel.html`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(t => window.seek(t), Number(tRaw));
const buf = await page.screenshot({ type: 'png' });
await sharp(buf).png().toFile(`${ROOT}/${dir}/cover/${dir}-cover-1080x1920.png`);
await sharp(buf).extract({ left: 0, top: (1920 - 1350) / 2, width: 1080, height: 1350 })
  .png().toFile(`${ROOT}/${dir}/cover/${dir}-cover-feed-1080x1350.png`);
await br.close(); s.close();
console.log(`${dir} cover @ ${tRaw}s`);
