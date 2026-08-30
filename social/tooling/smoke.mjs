import fs from 'node:fs';
import { serve, browser, newPage, shoot, ROOT } from './lib.mjs';
fs.mkdirSync(ROOT + '/.tmp', { recursive: true });
fs.writeFileSync(ROOT + '/.tmp/smoke.html', `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="/design-system/fonts/fonts.css"><link rel="stylesheet" href="/design-system/system.css"></head>
<body><div class="stage"><div class="rail"><div class="eyebrow"><span class="tick"></span>Brand /</div><div class="counter"><b>01</b> / 08</div></div>
<div class="canvas canvas--center"><h1 class="display tight">L'IA ne vaut rien<br>si personne <span class="grad">ne l'utilise.</span></h1></div>
<div class="foot"><div class="mark"><span class="tile"><i></i></span><span class="wm">Slash<em>Tech</em></span></div><div class="handle">@slashtech.io</div></div></div></body></html>`);
const s = await serve(); const br = await browser(); const p = await newPage(br, 1080, 1350);
await shoot(p, s.base + '/.tmp/smoke.html', ROOT + '/.tmp/smoke.png', 1080, 1350);
await br.close(); s.close();
console.log('OK');
