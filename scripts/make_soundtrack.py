#!/usr/bin/env python3
"""
Synthesizes public/soundtrack.wav: an original 128 BPM electronic track in F minor whose
build-ups, drops, hits and sound effects land on the same beat grid the animation uses
(src/timeline.json). Everything is generated from scratch here, so it is royalty-free.

    pip install numpy scipy
    python3 scripts/make_soundtrack.py
"""
import json
import re
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = json.loads((ROOT / "src" / "timeline.json").read_text())
OUT = ROOT / "public" / "soundtrack.wav"

SR = 48000
BPM = TIMELINE["bpm"]
BEAT = 60.0 / BPM
SEC = {k: tuple(v) for k, v in TIMELINE["sections"].items()}
TOTAL_BEATS = TIMELINE["totalBeats"]
N = int(round(TOTAL_BEATS * BEAT * SR))
# Whooshes follow the topic cards, so count them in the config (defaults to 4).
_topics = re.search(r"topics:\s*\[(.*?)\n\s*\],", (ROOT / "src" / "config.ts").read_text(), re.S)
TOPIC_COUNT = len(re.findall(r"\btitle:", _topics.group(1))) if _topics else 4
rng = np.random.default_rng(128)


# ── helpers ──────────────────────────────────────────────────────────────────

def idx(beat):
    return int(round(beat * BEAT * SR))


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
    def __init__(self):
        self.x = np.zeros((2, N + 5 * SR))

    def add(self, sig, beat, gain=1.0, pan=0.0):
        s = stereo(sig, pan) * gain
        i = idx(beat)
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


def make_riser(beats):
    n = secs(beats * BEAT)
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


# ── arrangement ──────────────────────────────────────────────────────────────

KICK, CLAP = make_kick(), make_clap()
HATS = [make_hat() for _ in range(4)]
OPEN_HAT = make_hat(open_=True)
BOOM, CRASH, SUBDROP = make_boom(), make_crash(), make_subdrop()

drums, bass, music, fx, send = Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []

# Chords per bar (bar = 4 beats), F minor: Fm | Db | Ab | Eb …
FM, DB, AB, EB = [53, 65, 68, 72], [49, 65, 68, 73], [56, 63, 68, 72], [51, 63, 67, 70]
BASS_ROOT = {id(FM): 41, id(DB): 37, id(AB): 44, id(EB): 39}
PROGRESSION = [FM, DB, AB, EB]


def chord_at(beat):
    bar = int(beat // 4)
    return PROGRESSION[(bar - 2) % 4]


def kick(beat, gain=0.85, muffled=False):
    drums.add(filt(KICK, "low", 260) if muffled else KICK, beat, gain)
    kicks.append(beat)


def snare_roll(hits):
    for i, (b, g) in enumerate(hits):
        s = make_snare(185 + i * 9)
        drums.add(s, b, g)
        send.add(s, b, g * 0.25)


def groove(start, end):
    """Four-on-the-floor house groove: off-beat bass, syncopated chord stabs, pad and arpeggio."""
    stab_steps = [0, 3, 6, 10, 13]
    for b in np.arange(start, end, 1.0):
        kick(b)
        if int(b) % 2 == 1:
            drums.add(CLAP, b, 0.6)
            send.add(CLAP, b, 0.15)
        for s in range(4):
            drums.add(HATS[int(rng.integers(4))], b + s / 4, 0.13 if s % 2 == 0 else 0.2, pan=0.25)
        drums.add(OPEN_HAT, b + 0.5, 0.13, pan=-0.2)
        chord = chord_at(b)
        bass.add(make_bass(BASS_ROOT[id(chord)], 0.42 * BEAT), b + 0.5, 0.34)
    for bar_start in np.arange(start, end, 4.0):
        chord = chord_at(bar_start)
        bar_len = min(4.0, end - bar_start)
        stab = make_supersaw(chord, 0.16, tau=0.1, cutoff=5000)
        for step in stab_steps:
            b = bar_start + step / 4
            if b < end:
                music.add(stab, b, 0.4)
                send.add(stab, b, 0.1)
        pad = make_supersaw(chord[1:], bar_len * BEAT, attack=0.08, release=0.1, cutoff=2200, detune=0.12, voices=5)
        music.add(pad, bar_start, 0.12)
        send.add(pad, bar_start, 0.06)
        tones = chord[1:] + [m + 12 for m in chord[1:]]
        for s in range(int(bar_len * 4)):
            note = filt(make_pluck(tones[s % len(tones)], 0.2), "low", 3500)
            music.add(note, bar_start + s / 4, 0.12, pan=0.35 if s % 2 else -0.35)


def whoosh(peak_beat, gain=0.25, dur=0.5):
    fx.add(make_whoosh(dur), peak_beat - dur / 2 / BEAT, gain)


def impact(beat, gain=1.0):
    fx.add(BOOM, beat, 0.85 * gain)
    fx.add(CRASH, beat, 0.3 * gain)
    fx.add(SUBDROP, beat, 0.45 * gain)
    send.add(BOOM, beat, 0.1 * gain)


def reverse_crash(end_beat, beats=1.5, gain=0.3):
    rc = make_crash(beats * BEAT)[:, ::-1]
    fx.add(fade(rc, 0.05, 0.004), end_beat - beats, gain)


# Intro (build): muffled kicks, rising arpeggio, countdown beeps, snare roll, riser.
b0, b1 = SEC["intro"]
impact(b0, 0.45)
for b in range(b0, b1):
    kick(b, 0.6, muffled=True)
arp_notes = [65, 68, 72, 75, 72, 68, 77, 72]
arp = np.zeros(idx(b1 - b0) + SR)
for s in range(int((b1 - b0) * 4)):
    p = make_pluck(arp_notes[s % 8])
    i = idx(s / 4)
    arp[i : i + len(p)] += p
arp = norm(svf(arp, 450 * (9000 / 450) ** (np.linspace(0, 1, len(arp)) ** 1.5), q=1.3))
arp = arp * np.linspace(0.45, 1.0, len(arp))
delay = secs(0.75 * BEAT)
echo = np.zeros((2, len(arp) + 4 * delay))
for k in range(4):
    echo[k % 2, k * delay : k * delay + len(arp)] += arp * (0.42 ** (k + 1))
music.add(np.vstack([arp, arp]) + echo[:, : len(arp)], b0, 0.3)
send.add(arp, b0, 0.15)
for b in np.arange(b0 + 2, b0 + 4, 0.5):
    drums.add(HATS[int(rng.integers(4))], b, 0.08)
for i, b in enumerate(np.arange(b0 + 4, b1 - 0.25, 0.25)):
    drums.add(HATS[i % 4], b, 0.07 + 0.012 * i)
whoosh(b0 + 2, 0.22, 0.35)
whoosh(b0 + 4, 0.28)
for j, b in enumerate(range(b0 + 4, b1)):
    fx.add(make_beep(1760 if j == 3 else 880), b, 0.12)
snare_roll([(b0 + 4, 0.3), (b0 + 5, 0.35), (b0 + 6, 0.42), (b0 + 6.5, 0.48), (b0 + 7, 0.56), (b0 + 7.25, 0.64), (b0 + 7.5, 0.72)])
fx.add(make_riser(3.85), b0 + 4, 0.34)
reverse_crash(b1)

# Name reveal: the drop.
n0, n1 = SEC["name"]
impact(n0)
groove(n0, SEC["slogan"][1])
fx.add(make_glitch(), n0 + 1, 0.3)
send.add(make_glitch(), n0 + 1, 0.05)
whoosh(n0 + 2, 0.2, 0.4)
snare_roll([(n1 - 1, 0.3), (n1 - 0.75, 0.36), (n1 - 0.5, 0.42), (n1 - 0.25, 0.5)])

# Topics: a whoosh into every card, crash every other card.
t0, t1 = SEC["topics"]
for i in range(TOPIC_COUNT):
    b = t0 + round(i * (t1 - t0) / TOPIC_COUNT)
    whoosh(b, 0.26)
    if i % 2 == 0:
        fx.add(CRASH, b, 0.22)

# Slogan: a whoosh under each line sliding in.
s0, s1 = SEC["slogan"]
for j in range(3):
    whoosh(s0 + j, 0.2, 0.35)

# Hype: breakdown. Drums out, pad swells, trailer hits on each word, riser into the final drop.
h0, h1 = SEC["hype"]
pad = make_supersaw(EB, (h1 - h0) * BEAT, attack=0.25, release=0.05, cutoff=9000)
sweep = 500 * (5000 / 500) ** np.linspace(0, 1, pad.shape[1])
pad = np.array([svf(ch, sweep) for ch in pad])
music.add(norm(pad), h0, 0.24)
send.add(norm(pad), h0, 0.12)
for j in range(4):
    fx.add(BOOM, h0 + j, 0.5 + 0.08 * j)
    bass.add(make_bass(39, 0.9 * BEAT), h0 + j, 0.3)
snare_roll([(h0 + 2, 0.3), (h0 + 2.5, 0.36), (h0 + 3, 0.44), (h0 + 3.25, 0.52), (h0 + 3.5, 0.6)])
fx.add(make_riser(3.8), h0, 0.34)
reverse_crash(h1)

# Outro: final drop, subscribe click, bell, big ending.
o0, o1 = SEC["outro"]
impact(o0)
groove(o0, o0 + 8)
fx.add(make_pop(), o0 + 1, 0.3)
fx.add(make_pop(), o0 + 1.25, 0.25)
whoosh(o0 + 2.3, 0.12, 0.6)
fx.add(make_click(), o0 + 3, 0.5)
fx.add(make_sparkle(), o0 + 3, 0.2)
send.add(make_sparkle(), o0 + 3, 0.08)
fx.add(make_click(), o0 + 5, 0.45)
for f0, delay_b, g in ((1318.5, 0.05, 0.3), (1975.5, 0.3, 0.22)):
    d = make_ding(f0)
    fx.add(d, o0 + 5 + delay_b, g)
    send.add(d, o0 + 5 + delay_b, g * 0.4)
end = o0 + 8
impact(end, 0.9)
kick(end)
final = make_supersaw(FM, 2.5 * BEAT, tau=0.9, release=0.4, cutoff=5000)
music.add(final, end, 0.3)
send.add(final, end, 0.2)
bass.add(make_bass(41, 2 * BEAT), end, 0.4)


# ── mix & master ─────────────────────────────────────────────────────────────

L = drums.x.shape[1]
t = np.arange(L) / SR
duck = np.ones(L)
for kb in kicks:
    i = idx(kb)
    seg = min(secs(0.45), L - i)
    tt = t[:seg]
    duck[i : i + seg] = np.minimum(duck[i : i + seg], 1 - 0.6 * np.minimum(1, tt / 0.003) * np.exp(-tt / 0.09))

ir = make_reverb_ir()
rev = np.array([signal.fftconvolve(send.x[c], ir[c])[:L] for c in range(2)])

mix = drums.x + (bass.x + music.x) * duck + fx.x + 0.35 * rev * duck
mix = filt(mix, "high", 28)
mix = mix[:, :N]
mix = np.tanh(1.4 * norm(mix)) / np.tanh(1.4)
fade_len = idx(TOTAL_BEATS - (o1 - 2.5))
mix[:, -fade_len:] *= np.linspace(1, 0, fade_len) ** 2
mix = norm(fade(mix, 0.003, 0.01), 10 ** (-1 / 20))

pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(str(OUT), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

rms = 20 * np.log10(np.sqrt(np.mean(mix[:, idx(SEC["topics"][0]) : idx(SEC["topics"][1])] ** 2)))
print(f"wrote {OUT.relative_to(ROOT)}  {N / SR:.2f}s  groove RMS {rms:.1f} dBFS")
