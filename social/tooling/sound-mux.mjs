/* Synthesise the sound-design bed for a reel and mux it onto the master. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';
import { addAudio } from './render-reel.mjs';

for (const dir of process.argv.slice(2)) {
  const { config } = await import(`${ROOT}/${dir}/source/scenes.mjs?v=${Date.now()}`);
  let t = 0; const cuts = [];
  config.scenes.forEach((s, i) => { if (i) cuts.push(t); t += s.d; });
  const duration = t;
  fs.mkdirSync(`${ROOT}/${dir}/audio`, { recursive: true });
  const wav = `${ROOT}/${dir}/audio/${dir}-sound-design.wav`;
  execFileSync('python3', ['sound.py', JSON.stringify({ duration, cuts, out: wav })], { stdio: 'inherit' });
  addAudio(dir, wav);
}
