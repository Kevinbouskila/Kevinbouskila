import fs from 'node:fs';
import { serve, browser, newPage, shoot, ROOT } from '../tooling/lib.mjs';
import { sheet } from '../tooling/sheet.mjs';
import { page, stage, rail, foot, canvas, t, g, sl, tile } from '../tooling/kit.mjs';

const css = `
/* V1 — the slash as a typographic glyph, cropped by the frame */
.v1-glyph{position:absolute;right:-96px;top:-176px;font-size:760px;font-weight:800;line-height:1;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  opacity:.13;user-select:none}
.v1-glyph-b{position:absolute;right:-96px;top:-176px;font-size:760px;font-weight:800;line-height:1;
  color:transparent;-webkit-text-stroke:2px rgba(124,58,237,.5)}
/* V2 — a contained slash band at the right edge */
.v2-band{position:absolute;right:-40px;top:-120px;width:196px;height:1620px;border-radius:98px;
  background:linear-gradient(180deg,#F7F5FF 0%,#FDF2F9 100%);transform:skewX(var(--slash-angle))}
.v2-line{position:absolute;right:186px;top:-120px;width:9px;height:1620px;border-radius:5px;
  background:var(--grad);transform:skewX(var(--slash-angle))}
/* V3 — pure type; the slash replaces the full stop */
.v3-mark{display:inline-block;width:15px;height:74px;border-radius:8px;background:var(--grad);
  transform:skewX(var(--slash-angle));margin-left:22px;vertical-align:-8px}
/* shared */
.wrap{position:relative;z-index:3}
`;
const head = `L'IA<br>ne vaut rien<br>si personne<br>`;
const variants = {
  V1: `<div class="v1-glyph">/</div>${rail('Brand',1,8)}${canvas(`<div class="wrap">${t.displayXl(head+g("ne l'utilise."))}</div>`,'canvas--center')}${foot()}`,
  V2: `<div class="v2-band"></div><div class="v2-line"></div>${rail('Brand',1,8)}${canvas(`<div class="wrap">${t.displayXl(head+g("ne l'utilise."))}</div>`,'canvas--center')}${foot()}`,
  V3: `${rail('Brand',1,8)}${canvas(`<div class="wrap">${t.displayXl(head+`ne l'utilise<span class="v3-mark"></span>`)}</div>`,'canvas--center')}${foot()}`,
};
fs.mkdirSync(`${ROOT}/.tmp`,{recursive:true});
const s = await serve(); const br = await browser(); const p = await newPage(br,1080,1350);
const files=[],labels=[];
for (const [k,body] of Object.entries(variants)) {
  fs.writeFileSync(`${ROOT}/.tmp/${k}.html`, page({extraCss:css, body: stage({bg:'bg-paper',children:body})}));
  await shoot(p, `${s.base}/.tmp/${k}.html`, `${ROOT}/.tmp/${k}.png`, 1080,1350);
  files.push(`${ROOT}/.tmp/${k}.png`); labels.push(k);
}
await br.close(); s.close();
await sheet({files,cols:3,out:`${ROOT}/.tmp/covers.png`,cell:420,labels});
console.log('ok');
