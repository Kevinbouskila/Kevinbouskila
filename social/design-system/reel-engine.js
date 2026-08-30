/* ============================================================
   SLASH TECH — REEL ENGINE
   Builds a reel from a scene list and exposes window.seek(t).
   No CSS animations: the frame at time t is pure computation,
   so headless capture is frame-exact and reproducible.
   ============================================================ */
(function (global) {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const E = {
    outExpo:  x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outQuint: x => 1 - Math.pow(1 - x, 5),
    inOutCubic: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inQuad:   x => x * x,
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => {
    const [r1, g1, b1] = hex(a), [r2, g2, b2] = hex(b);
    return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
  };

  const Reel = {
    build(cfg) {
      const IN = cfg.enter ?? 0.52, OUT = cfg.exit ?? 0.34, SWEEP = cfg.sweep ?? 0.62;
      let t = 0;
      const scenes = cfg.scenes.map(s => { const o = { ...s, t0: t, t1: t + s.d }; t += s.d; return o; });
      const DURATION = t;

      const host = document.getElementById('rscenes');
      scenes.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'rscene ' + (s.cls || '');
        el.innerHTML = s.html;
        host.appendChild(el);
        s.el = el;
        s.parts = s.stagger ? Array.from(el.children) : null;
      });

      const rbg = document.getElementById('rbg');
      const sweep = document.getElementById('rsweep');
      const sweep2 = document.getElementById('rsweep2');
      const prog = document.querySelector('.rprog i');

      function seek(now) {
        const tt = clamp(now, 0, DURATION);
        if (prog) prog.style.width = (tt / DURATION * 100).toFixed(3) + '%';

        /* Background: hold each scene's colour, cross-fade across the cut. */
        let bg = scenes[0].bg;
        for (let i = 0; i < scenes.length; i++) {
          const s = scenes[i];
          if (tt >= s.t1 && i < scenes.length - 1) continue;
          const prev = scenes[i - 1];
          if (prev && tt < s.t0 + IN) bg = mixHex(prev.bg, s.bg, E.inOutCubic(clamp((tt - s.t0) / IN)));
          else bg = s.bg;
          break;
        }
        rbg.style.background = bg;

        /* Scenes: rise in, settle, lift out. */
        scenes.forEach((s, i) => {
          const local = tt - s.t0;
          let a = 0, y = 0, sc = 1;
          if (local < -0.001) { a = 0; y = 34; }
          else if (local < IN) { const p = E.outExpo(local / IN); a = p; y = lerp(34, 0, p); sc = lerp(.986, 1, p); }
          else if (local < s.d - OUT) { a = 1; y = 0; }
          else if (local < s.d) { const p = E.inQuad((local - (s.d - OUT)) / OUT); a = 1 - p; y = -lerp(0, 26, p); sc = lerp(1, .994, p); }
          else { a = 0; y = -26; }
          s.el.style.opacity = a.toFixed(4);
          s.el.style.transform = `translateY(calc(-50% + ${y.toFixed(2)}px)) scale(${sc.toFixed(4)})`;
          if (s.cls && s.cls.includes('top')) s.el.style.transform = `translateY(${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
          s.el.style.visibility = a < 0.002 ? 'hidden' : 'visible';

          /* Staggered children (lists, end-card words). */
          if (s.parts) s.parts.forEach((c, k) => {
            const d = k * (s.stagger || 0.14);
            const p = E.outExpo(clamp((local - d) / IN));
            c.style.opacity = (a * p).toFixed(4);
            c.style.transform = `translateY(${lerp(26, 0, p).toFixed(2)}px)`;
          });
        });

        /* The slash sweep crosses on every cut. */
        let sa = 0, sx = -1600, sa2 = 0, sx2 = -1600;
        for (let i = 1; i < scenes.length; i++) {
          const cut = scenes[i].t0, half = SWEEP / 2;
          if (tt > cut - half && tt < cut + half) {
            const p = E.inOutCubic(clamp((tt - (cut - half)) / SWEEP));
            sx = lerp(-1300, 1700, p); sa = Math.sin(p * Math.PI) * 0.16;
            const p2 = E.inOutCubic(clamp((tt - (cut - half) + 0.07) / SWEEP));
            sx2 = lerp(-1300, 1700, p2); sa2 = Math.sin(p2 * Math.PI) * 0.85;
          }
        }
        sweep.style.opacity = sa.toFixed(4);
        sweep.style.transform = `skewX(-18deg) translateX(${sx.toFixed(1)}px)`;
        sweep2.style.opacity = sa2.toFixed(4);
        sweep2.style.transform = `skewX(-18deg) translateX(${sx2.toFixed(1)}px)`;
      }

      global.seek = seek;
      global.DURATION = DURATION;
      global.CUTS = scenes.slice(1).map(s => s.t0);
      global.SCENES = scenes.map(s => ({ t0: s.t0, t1: s.t1 }));
      seek(0);

      /* Preview in a real browser; harmless under headless capture. */
      if (!global.__capture) {
        const start = performance.now();
        const loop = () => { seek(((performance.now() - start) / 1000) % (DURATION + 0.8)); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  };
  global.Reel = Reel;
})(window);
