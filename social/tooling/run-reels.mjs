import { renderReel } from './render-reel.mjs';
const JOBS = {
  '03-slash-tech': { coverT: 14.2 },
  '05-vibe-coding': { coverT: 15.4 },
  '09-moat': { coverT: 21.4 },
  '12-arpent': { coverT: 22.8 },
};
for (const d of process.argv.slice(2)) {
  const j = JOBS[d] || {};
  await renderReel(d, j.coverT != null ? { coverT: j.coverT } : {});
}
console.log('ALL REELS DONE');
