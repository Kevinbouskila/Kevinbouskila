import fs from 'node:fs';
import { serve, browser, newPage, shoot, ROOT } from './lib.mjs';
const tests = {
  'current (kern liga calt ss01 cv05)':'"kern" 1,"liga" 1,"calt" 1,"ss01" 1,"cv05" 1',
  'no cv05':'"kern" 1,"liga" 1,"calt" 1,"ss01" 1',
  'no ss01 no cv05':'"kern" 1,"liga" 1,"calt" 1',
  'no calt':'"kern" 1,"liga" 1',
  'normal':'normal',
};
const rows = Object.entries(tests).map(([k,v])=>
  `<div style="margin:0 0 26px"><div style="font:500 15px 'JetBrains Mono',monospace;color:#888;margin-bottom:4px">${k}</div>
   <div style="font-family:Inter;font-weight:800;font-size:52px;letter-spacing:-.024em;font-feature-settings:${v}">peut-être · est-elle · semi-manuels</div></div>`).join('');
fs.writeFileSync(`${ROOT}/.tmp/h.html`,`<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="/design-system/fonts/fonts.css">
<body style="margin:0;background:#fff"><div class="stage" style="width:1080px;height:700px;padding:40px">${rows}</div></body>`);
const s=await serve(); const br=await browser(); const p=await newPage(br,1080,700);
await shoot(p,`${s.base}/.tmp/h.html`,`${ROOT}/.tmp/h.png`,1080,700);
await br.close(); s.close(); console.log('ok');
