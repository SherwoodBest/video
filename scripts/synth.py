"""
Shared building blocks for the soundtrack scripts: oscillators, filters, instruments and a
simple mix bus. Everything is synthesized from scratch, so the music is royalty-free.
"""
import wave

import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(128)


# ── helpers ──────────────────────────────────────────────────────────────────

def secs(s):
    return int(round(s * SR))


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(n):
    return rng.standard_normal(n)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def fade(x, fin=0.002, fout=0.01):
    n = x.shape[-1]
    env = np.ones(n)
    a, b = min(secs(fin), n // 2), min(secs(fout), n // 2)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if b:
        env[-b:] = np.linspace(1, 0, b)
    return x * env


def filt(x, kind, fc, order=2):
    sos = signal.butter(order, fc, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def svf(x, fc, q=0.707, mode="lp"):
    """Topology-preserving state-variable filter with a per-sample cutoff (for sweeps)."""
    fc = np.clip(np.broadcast_to(fc, x.shape), 20, SR * 0.45)
    g = np.tan(np.pi * fc / SR)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    xs, A1, A2, A3 = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()
    out = [0.0] * len(xs)
    ic1 = ic2 = 0.0
    for i, v0 in enumerate(xs):
        v3 = v0 - ic2
        v1 = A1[i] * ic1 + A2[i] * v3
        v2 = ic2 + A2[i] * ic1 + A3[i] * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v2 if mode == "lp" else v1 if mode == "bp" else v0 - k * v1 - v2
    return np.array(out)


def saw(freq, n, phase0=0.0):
    """Band-limited (PolyBLEP) sawtooth; `freq` may be a scalar or per-sample array."""
    dt = np.broadcast_to(np.asarray(freq, dtype=float) / SR, (n,))
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    lo = ph < dt
    t = ph[lo] / dt[lo]
    y[lo] -= t + t - t * t - 1
    hi = ph > 1 - dt
    t = (ph[hi] - 1) / dt[hi]
    y[hi] -= t * t + t + t + 1
    return y


def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f) / SR))


def stereo(sig, pan=0.0):
    if sig.ndim == 2:
        return sig
    a = (pan + 1) * np.pi / 4
    return np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)


class Bus:
    """Stereo mix bus. Clips are placed by beat position at a fixed tempo."""

    def __init__(self, length, beat_seconds):
        self.x = np.zeros((2, length + 5 * SR))
        self.beat = beat_seconds

    def add(self, sig, beat, gain=1.0, pan=0.0):
        s = stereo(sig, pan) * gain
        i = int(round(beat * self.beat * SR))
        if i < 0:
            s, i = s[:, -i:], 0
        end = min(self.x.shape[1], i + s.shape[1])
        self.x[:, i:end] += s[:, : end - i]


# ── instruments ──────────────────────────────────────────────────────────────

def make_kick():
    n = secs(0.45)
    t = np.arange(n) / SR
    f = 44 + 150 * np.exp(-t / 0.022) + 35 * np.exp(-t / 0.09)
    body = sine(f, n) * np.exp(-t / 0.26)
    click = filt(noise(n), "high", 3000) * np.exp(-t / 0.003) * 0.25
    return fade(norm(np.tanh(1.8 * (body + click))), 0.0005, 0.02)


def make_clap():
    n = secs(0.4)
    t = np.arange(n) / SR
    env = sum(np.where(t >= d, np.exp(-np.maximum(t - d, 0) / 0.0045), 0) for d in (0, 0.011, 0.023))
    env = env + np.where(t >= 0.03, 0.85 * np.exp(-np.maximum(t - 0.03, 0) / 0.12), 0)
    return fade(norm(filt(noise(n) * env, "band", [900, 5500])))


def make_snare(tone=185):
    n = secs(0.3)
    t = np.arange(n) / SR
    body = (sine(tone, n) + 0.6 * sine(tone * 1.72, n)) * np.exp(-t / 0.045)
    nz = norm(filt(noise(n), "band", [1200, 9000])) * np.exp(-t / 0.09)
    return fade(norm(np.tanh(1.5 * (0.7 * body + nz))))


HAT_FREQS = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0])


def metal(n, scale=1.0):
    t = np.arange(n) / SR
    return sum(np.sign(np.sin(2 * np.pi * f * scale * t + rng.uniform(0, 6.28))) for f in HAT_FREQS) / 6


def make_hat(open_=False):
    n = secs(0.5 if open_ else 0.08)
    t = np.arange(n) / SR
    x = filt(0.6 * metal(n) + 0.5 * noise(n), "high", 7000)
    x = filt(x, "low", 15000)
    return fade(norm(x * np.exp(-t / (0.13 if open_ else 0.016))))


def make_crash(dur=2.6):
    n = secs(dur)
    t = np.arange(n) / SR
    chans = [filt(0.5 * metal(n, 1.47) + noise(n), "high", 4200) * np.exp(-t / 0.8) for _ in range(2)]
    return fade(norm(np.array(chans)), 0.001, 0.25)


def make_boom(dur=2.2):
    n = secs(dur)
    t = np.arange(n) / SR
    sub = sine(30 + 72 * np.exp(-t / 0.12), n) * np.exp(-t / 0.8)
    thump = norm(filt(noise(n), "low", 160)) * np.exp(-t / 0.06)
    rumble = norm(filt(noise(n), "low", 1200)) * np.exp(-t / 0.25)
    return fade(norm(np.tanh(1.8 * (sub + 0.6 * thump + 0.25 * rumble))), 0.0005, 0.3)


def make_subdrop(dur=1.4):
    n = secs(dur)
    t = np.arange(n) / SR
    return fade(norm(sine(28 + 62 * np.exp(-t / 0.35), n) * np.exp(-t / 0.55)), 0.002, 0.2)


def make_riser(seconds):
    n = secs(seconds)
    p = np.arange(n) / n
    fc = 250 * (11000 / 250) ** (p**1.6)
    air = np.array([norm(svf(noise(n), fc * s, q=3.0, mode="bp")) for s in (1.0, 1.04)])
    f = 130 * 2 ** (3.0 * p**1.4)
    tone = norm(svf(saw(f, n) + 0.6 * saw(f * 1.5, n), f * 5, mode="lp"))
    x = (0.8 * air + 0.35 * tone) * p**2.2
    return fade(x, 0.01, 0.006)


def make_whoosh(dur=0.5, lo=350, hi=5500):
    n = secs(dur)
    p = np.arange(n) / n
    bell = np.sin(np.pi * p)
    x = norm(svf(noise(n), lo * (hi / lo) ** (bell**1.3), q=1.4, mode="bp")) * bell**2
    a = (np.linspace(-0.75, 0.75, n) + 1) * np.pi / 4
    return fade(np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2))


def make_pluck(m, dur=0.3):
    n = secs(dur)
    t = np.arange(n) / SR
    f = midi(m)
    x = 0.7 * saw(f, n) + 0.3 * np.sign(sine(f, n))
    return fade(x * np.minimum(1, t / 0.002) * np.exp(-t / 0.1))


def make_supersaw(notes, dur, attack=0.004, tau=None, release=0.06, cutoff=3800, detune=0.16, voices=7):
    n = secs(dur + release)
    t = np.arange(n) / SR
    L, R = np.zeros(n), np.zeros(n)
    mid = (voices - 1) / 2
    for m in notes:
        for v in range(voices):
            s = saw(midi(m + detune * (v - mid) / mid), n, rng.random())
            if v == mid:
                L += 0.7 * s
                R += 0.7 * s
            elif v % 2:
                L += s
            else:
                R += s
    env = np.minimum(1, t / attack)
    if tau:
        env = env * np.exp(-t / tau)
    env = env * np.clip((dur + release - t) / release, 0, 1)
    return fade(norm(filt(np.array([L, R]), "low", cutoff) * env))


def make_bass(m, dur):
    n = secs(dur)
    t = np.arange(n) / SR
    f = midi(m)
    x = 0.85 * sine(f, n) + 0.45 * norm(filt(saw(f, n), "low", 700))
    x = np.tanh(1.3 * x * np.minimum(1, t / 0.004) * (0.75 + 0.25 * np.exp(-t / 0.05)))
    return fade(norm(x), 0.001, 0.015)


def make_beep(freq, dur=0.09):
    n = secs(dur)
    return fade(sine(freq, n), 0.003, 0.02)


def make_click():
    n = secs(0.1)
    t = np.arange(n) / SR
    down = norm(filt(noise(n), "band", [2000, 8000])) * np.exp(-t / 0.002)
    tone = sine(3200, n) * np.exp(-t / 0.004) * 0.5
    up_t = np.maximum(t - 0.06, 0)
    up = np.where(t >= 0.06, norm(filt(noise(n), "band", [2500, 9000])) * np.exp(-up_t / 0.0015) * 0.5, 0)
    return fade(norm(down + tone + up))


def make_pop():
    n = secs(0.14)
    t = np.arange(n) / SR
    x = sine(260 + 900 * (1 - np.exp(-t / 0.02)), n) * np.exp(-t / 0.035) * np.minimum(1, t / 0.001)
    return fade(norm(x))


def make_ding(f0):
    n = secs(1.4)
    t = np.arange(n) / SR
    parts = [(1.0, 1.0, 0.6), (2.0, 0.35, 0.35), (2.76, 0.2, 0.25), (5.4, 0.08, 0.12)]
    x = sum(a * sine(f0 * r, n) * np.exp(-t / tau) for r, a, tau in parts)
    return fade(norm(x * np.minimum(1, t / 0.002)))


def make_sparkle(dur=1.0, count=28):
    n = secs(dur)
    out = np.zeros((2, n))
    for _ in range(count):
        start = secs(rng.uniform(0, dur * 0.7))
        ln = min(secs(0.14), n - start)
        tt = np.arange(ln) / SR
        blip = sine(rng.uniform(2500, 7000), ln) * np.exp(-tt / 0.03) * rng.uniform(0.3, 1)
        out[:, start : start + ln] += stereo(blip, rng.uniform(-0.8, 0.8))
    return fade(norm(out))


def make_glitch(dur=0.22):
    n = secs(dur)
    x = np.zeros(n)
    pos = 0
    while pos < n:
        seg = min(secs(rng.uniform(0.008, 0.03)), n - pos)
        tt = np.arange(seg) / SR
        kind = rng.integers(3)
        s = np.sign(np.sin(2 * np.pi * rng.uniform(150, 2500) * tt)) if kind == 0 else noise(seg) if kind == 1 else 0
        x[pos : pos + seg] = s * rng.uniform(0.3, 1)
        pos += seg
    return fade(norm(filt(np.round(x * 6) / 6, "band", [300, 9000])))


def make_reverb_ir(dur=2.2, tau=0.5):
    n = secs(dur)
    t = np.arange(n) / SR
    ir = filt(noise((2, n)), "low", 6500) * np.exp(-t / tau)
    ir[:, : secs(0.012)] = 0
    return ir / np.sqrt(np.sum(ir**2, axis=1, keepdims=True))


def make_piano(m, dur=3.2, vel=0.6):
    """Soft felt piano: slightly inharmonic partials that decay faster the higher they are."""
    f0 = midi(m)
    n = secs(dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 10):
        fk = k * f0 * np.sqrt(1 + 0.00015 * k * k)
        if fk > SR * 0.45:
            break
        amp = vel ** (0.3 + 0.1 * k) / k
        tau = 2.4 * (261.6 / f0) ** 0.35 / (1 + 0.55 * (k - 1))
        x += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    hammer = norm(filt(noise(n), "band", [300, 2500])) * np.exp(-t / 0.006) * 0.05
    x = filt((x / (np.max(np.abs(x)) or 1) + hammer) * np.minimum(1, t / 0.004), "low", 2200 + 5000 * vel)
    return fade(norm(x) * vel, 0.0005, 0.3)


def make_soft_kick():
    n = secs(0.5)
    t = np.arange(n) / SR
    x = sine(42 + 38 * np.exp(-t / 0.04), n) * np.exp(-t / 0.22) * np.minimum(1, t / 0.002)
    return fade(norm(filt(x, "low", 180)), 0.0005, 0.05)


def make_shaker():
    n = secs(0.09)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.012) * np.exp(-t / 0.03)
    return fade(norm(filt(noise(n), "band", [5000, 12000]) * env))


def make_sub(m, dur):
    n = secs(dur)
    t = np.arange(n) / SR
    f = midi(m)
    x = sine(f, n) + 0.25 * sine(2 * f, n)
    return fade(norm(x) * np.minimum(1, t / 0.08), 0.001, 0.4)


def write_wav(path, mix):
    """Writes a (2, n) float mix in [-1, 1] as 16-bit stereo PCM."""
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
