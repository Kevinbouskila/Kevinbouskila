/* Reel pipeline: reel.html -> frames -> MP4 (+ cover, feed crop, keyframes). */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { serve, browser, newPage, ROOT } from './lib.mjs';

const FF = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const FPS = 30, W = 1080, H = 1920;

export async function renderReel(dir, { keyframes = [], coverT = 0 } = {}) {
  const D = `${ROOT}/${dir}`;
  const s = await serve(); const br = await browser();
  const page = await newPage(br, W, H, 1);   // native target resolution: the master is 1080x1920
  await page.addInitScript(() => { window.__capture = true; });
  await page.goto(`${s.base}/${dir}/source/reel.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const dur = await page.evaluate(() => window.DURATION);
  const cuts = await page.evaluate(() => window.CUTS);
  const total = Math.round(dur * FPS);
  const el = await page.$('.stage');

  fs.mkdirSync(`${D}/export`, { recursive: true });
  const mp4 = `${D}/export/${dir}.mp4`;
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-vf', `scale=${W}:${H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-movflags', '+faststart', '-r', String(FPS), mp4], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; });

  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write('.');
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg failed:\n' + ffErr.slice(-1500));

  /* Cover (full reel frame), feed-safe crop, and storyboard keyframes. */
  fs.mkdirSync(`${D}/cover`, { recursive: true });
  fs.mkdirSync(`${D}/assets`, { recursive: true });
  await page.evaluate(t => window.seek(t), coverT);
  const cov = await el.screenshot({ type: 'png' });
  await sharp(cov).resize(W, H, { kernel: 'lanczos3', fit: 'fill' }).png().toFile(`${D}/cover/${dir}-cover-1080x1920.png`);
  /* Feed crop: Instagram shows a 1080x1350 window of the cover. Keep it centred on the type. */
  await sharp(cov).resize(W, H, { kernel: 'lanczos3', fit: 'fill' })
    .extract({ left: 0, top: Math.round((H - 1350) / 2), width: W, height: 1350 })
    .png().toFile(`${D}/cover/${dir}-cover-feed-1080x1350.png`);

  const kf = keyframes.length ? keyframes : cuts.map(c => c + 0.75);
  const shots = [];
  for (let i = 0; i < kf.length; i++) {
    await page.evaluate(t => window.seek(t), kf[i]);
    const b = await el.screenshot({ type: 'png' });
    const o = `${D}/assets/keyframe-${String(i + 1).padStart(2, '0')}.png`;
    await sharp(b).resize(W, H, { kernel: 'lanczos3', fit: 'fill' }).png().toFile(o);
    shots.push(o);
  }
  await br.close(); s.close();
  const size = (fs.statSync(mp4).size / 1048576).toFixed(2);
  console.log(`\n${dir}: ${dur.toFixed(2)}s  ${total}f  ${size}MB  ${shots.length} keyframes`);
  return { mp4, dur, cuts, shots };
}

/* Mux a synthesised sound-design bed onto the silent master. */
export function addAudio(dir, wav) {
  const D = `${ROOT}/${dir}`, mp4 = `${D}/export/${dir}.mp4`, tmp = `${D}/export/.a.mp4`;
  execFileSync(FF, ['-y', '-i', mp4, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', tmp], { stdio: 'ignore' });
  fs.renameSync(tmp, mp4);
  console.log(`${dir}: audio muxed`);
}
export { FF };
