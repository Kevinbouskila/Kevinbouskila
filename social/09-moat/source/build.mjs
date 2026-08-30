import fs from 'node:fs';
import { html } from './scenes.mjs';
fs.writeFileSync(new URL('./reel.html', import.meta.url), html);
