"""Slash Tech reel sound design — synthesised, not sampled.
UI clicks on cuts, soft swooshes on transitions, a low sustained pad.
Premium product-demo register: no music bed, no EDM, nothing 'futuristic'."""
import sys, json, wave, numpy as np

SR = 48000

def env(n, a, d, s=0.0):
    e = np.ones(n)
    ai, di = int(a * SR), int(d * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if di: e[-di:] = np.linspace(1, s, di)
    return e

def click(dur=0.055, f=2100, amp=0.16):
    """A short filtered tick — a UI affordance, not a percussion hit."""
    n = int(dur * SR); t = np.arange(n) / SR
    body = np.sin(2*np.pi*f*t) * np.exp(-t*90) + np.sin(2*np.pi*f*1.51*t) * np.exp(-t*140) * .4
    noise = (np.random.default_rng(7).standard_normal(n)) * np.exp(-t*260) * .30
    return (body + noise) * amp * env(n, 0.001, 0.02)

def swoosh(dur=0.44, amp=0.085, seed=3):
    """Band-passed noise swept upward — the slash crossing the frame."""
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.random.default_rng(seed).standard_normal(n)
    # one-pole sweep from dark to bright and back
    cut = 0.02 + 0.34 * np.sin(np.pi * t / dur)
    y = np.zeros(n); prev = 0.0
    for i in range(n):
        prev += cut[i] * (x[i] - prev); y[i] = prev
    y -= np.convolve(y, np.ones(64)/64, mode='same')     # remove rumble
    return y * amp * (np.sin(np.pi * t / dur) ** 1.6)

def pad(dur, amp=0.028):
    """A barely-there harmonic bed. Present, never foreground."""
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.zeros(n)
    for f, g in ((110, 1.0), (165, .45), (220, .30), (330, .14)):
        y += np.sin(2*np.pi*f*t + np.sin(2*np.pi*0.07*t)*0.5) * g
    y *= (0.82 + 0.18*np.sin(2*np.pi*0.09*t))
    return y / 1.9 * amp * env(n, 1.4, 1.8)

def build(duration, cuts, out):
    n = int(duration * SR)
    L = pad(duration); R = pad(duration) * 0.97
    def place(buf, sig, at, pan=0.5):
        i = int(at * SR); j = min(n, i + len(sig))
        if i < n: buf[i:j] += sig[:j-i] * pan
    for k, c in enumerate(cuts):
        sw = swoosh(seed=11 + k)
        place(L, sw, max(0, c - 0.22), 1.00); place(R, sw, max(0, c - 0.22), 0.86)
        ck = click(f=1900 + (k % 3) * 260)
        place(L, ck, c, 0.92); place(R, ck, c + 0.004, 1.00)
    # a soft resolve on the end card
    place(L, click(0.09, 880, 0.13), duration - 1.05, 1.0)
    place(R, click(0.09, 880, 0.13), duration - 1.045, 1.0)
    st = np.stack([L, R], axis=1)
    peak = np.max(np.abs(st))
    if peak > 0: st = st / peak * 0.66          # headroom; Instagram normalises loudly
    fade = int(0.5 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    st[:int(0.08*SR)] *= np.linspace(0, 1, int(0.08*SR))[:, None]
    data = (st * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
    print(f'{out}  {duration:.2f}s  {len(cuts)} cuts')

if __name__ == '__main__':
    cfg = json.loads(sys.argv[1])
    build(cfg['duration'], cfg['cuts'], cfg['out'])
