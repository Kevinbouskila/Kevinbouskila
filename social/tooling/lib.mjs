import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html':'text/html;charset=utf-8', '.css':'text/css;charset=utf-8', '.js':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.json':'application/json' };

/** Static file server rooted at social/, so stylesheets and fonts always resolve. */
export async function serve() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  return { port, base: `http://127.0.0.1:${port}`, close: () => srv.close() };
}

export async function browser() {
  return chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none',
           '--disable-lcd-text', '--force-color-profile=srgb', '--disable-gpu',
           '--disable-background-networking', '--disable-component-update',
           '--disable-sync', '--no-first-run', '--no-default-browser-check'],
  });
}

/** Render one HTML page to a pixel-exact PNG, supersampled 2x then Lanczos-downsampled. */
export async function shoot(page, url, out, w, h, scale = 2) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const el = await page.$('.stage');
  const buf = await (el ?? page).screenshot({ type: 'png' });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(buf).resize(w, h, { kernel: 'lanczos3', fit: 'fill' })
    .png({ compressionLevel: 9, palette: false }).withMetadata({ density: 72 }).toFile(out);
  return out;
}

export async function newPage(br, w, h, scale = 2) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, colorScheme: 'light' });
  return ctx.newPage();
}
