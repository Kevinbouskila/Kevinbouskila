import sharp from 'sharp';
import fs from 'node:fs';
/** Contact sheet: files laid out in a grid on a neutral ground. */
export async function sheet({ files, cols, out, cell = 360, gap = 18, pad = 24, bg = '#9A9AA6', labels = null, ratio = 1350/1080 }) {
  const cw = cell, ch = Math.round(cell * ratio);
  const rows = Math.ceil(files.length / cols);
  const lh = labels ? 30 : 0;
  const W = pad * 2 + cols * cw + (cols - 1) * gap;
  const H = pad * 2 + rows * (ch + lh) + (rows - 1) * gap;
  const comp = [];
  for (let i = 0; i < files.length; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const left = pad + c * (cw + gap), top = pad + r * (ch + lh + gap) + lh;
    comp.push({ input: await sharp(files[i]).resize(cw, ch, { kernel: 'lanczos3', fit: 'fill' }).png().toBuffer(), left, top });
    if (labels) {
      const svg = `<svg width="${cw}" height="${lh}"><text x="0" y="20" font-family="DejaVu Sans" font-size="16" font-weight="bold" fill="#FFFFFF">${labels[i]}</text></svg>`;
      comp.push({ input: Buffer.from(svg), left, top: top - lh });
    }
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: bg } }).composite(comp).png().toFile(out);
  return out;
}
