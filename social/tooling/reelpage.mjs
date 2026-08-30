/* Builds a self-contained, browser-previewable reel page from a scene list. */
import { fr, tile } from './kit.mjs';

export function reelPage({ title, cat, handle = '@slashtech.io', scenes, enter, exit, sweep, css = '' }) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="/design-system/fonts/fonts.css">
<link rel="stylesheet" href="/design-system/system.css">
<link rel="stylesheet" href="/design-system/reel.css">
${css ? `<style>\n${css}\n</style>` : ''}
</head><body>
<div class="stage stage--reel">
  <div class="rbg" id="rbg"></div>
  <div class="rhud"><div class="eyebrow"><span class="tick"></span>${cat} /</div></div>
  <div class="rprog"><i></i></div>
  <div class="rscenes" id="rscenes"></div>
  <div class="rfoot">${tile(40)}<div class="handle">${handle}</div></div>
  <div class="rsweep" id="rsweep"></div>
  <div class="rsweep2" id="rsweep2"></div>
</div>
<script src="/design-system/reel-engine.js"></script>
<script>
Reel.build(${JSON.stringify({ enter, exit, sweep, scenes }, (k, v) => v === undefined ? undefined : v)});
</script>
</body></html>`;
}
export { fr };
