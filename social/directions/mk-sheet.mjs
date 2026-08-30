import { sheet } from '../tooling/sheet.mjs';
const ks = ['A','B','C'], ns = ['01','05','08'];
const files = [], labels = [];
for (const k of ks) for (const n of ns) { files.push(`export/${k}-${n}.png`); labels.push(`${k} — slide ${n}`); }
await sheet({ files, cols: 3, out: 'directions-preview.png', cell: 400, labels });
console.log('ok');
