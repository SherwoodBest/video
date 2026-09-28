#!/usr/bin/env python3
"""
Synthesizes public/soundtrack-minimal.wav for the minimal intro: a calm 90 BPM felt-piano and
pad piece in F major. Chord changes land on each new line and the end card gets a warm chord
bloom, a small celesta figure and a soft pen-scratch under the underline. Timing comes from
src/minimal/timeline.json.

    pip install numpy scipy
    python3 scripts/make_minimal_soundtrack.py
"""
import json
from pathlib import Path

import numpy as np
from scipy import signal

from synth import (
    SR,
    Bus,
    fade,
    filt,
    make_ding,
    make_reverb_ir,
    make_subdrop,
    make_supersaw,
    midi,
    noise,
    norm,
    rng,
    secs,
    sine,
    svf,
    write_wav,
)

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = json.loads((ROOT / "src" / "minimal" / "timeline.json").read_text())
OUT = ROOT / "public" / "soundtrack-minimal.wav"

BEAT = 60.0 / TIMELINE["bpm"]
TOTAL_BEATS = TIMELINE["totalBeats"]
N = int(round(TOTAL_BEATS * BEAT * SR))
L0, L1 = TIMELINE["sections"]["lines"]
E0, E1 = TIMELINE["sections"]["end"]


def idx(beat):
    return int(round(beat * BEAT * SR))


# ── instruments ──────────────────────────────────────────────────────────────

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


def make_pen_scratch(dur):
    """Nib on paper: grainy band-passed noise that swells with the stroke's speed."""
    n = secs(dur)
    p = np.arange(n) / n
    grain = np.repeat(rng.uniform(0.3, 1.0, n // 240 + 1), 240)[:n]
    x = svf(noise(n), 2600 + 1800 * np.sin(np.pi * p), q=1.1, mode="bp") * grain
    return fade(norm(x) * np.sin(np.pi * p) ** 1.5, 0.01, 0.03)


# ── arrangement ──────────────────────────────────────────────────────────────

piano, pad, low, drums, fx, send = (Bus(N, BEAT) for _ in range(6))


def play(m, beat, vel=0.5, dur=3.2):
    note = make_piano(m, dur, vel)
    pan = float(np.clip((m - 62) / 36, -0.5, 0.5))
    piano.add(note, beat, 1.0, pan)
    send.add(note, beat, 0.3, pan)


# Each line gets one bar: (left-hand notes, right-hand arpeggio, bass note).
BARS = [
    ([41, 48], [57, 60, 64, 69, 72, 69, 64, 60], 41),  # Fmaj7
    ([38, 45], [53, 57, 60, 64, 65, 64, 60, 57], 38),  # Dm9
    ([34, 41], [62, 65, 69, 72, 74, 72, 69, 65], 34),  # Bbmaj9
    ([36, 43], [55, 58, 62, 65, 67, 65, 62, 58], 36),  # C9sus4
]
FMAJ9 = [41, 48, 57, 64, 67, 72]

# Blank page: pad breathes in, two soft notes.
pad.add(filt(make_supersaw([53, 57, 60, 64, 67], (L0 + 0.5) * BEAT, attack=1.0, release=0.8, cutoff=1400, detune=0.1, voices=5), "high", 180), 0, 0.22)
play(76, 0, 0.32)
play(72, 1, 0.28)

# Lines: one chord per line; the groove (soft kick + shaker) joins from the second line.
bar_beats = (L1 - L0) / len(BARS)
for i, (lh, arp, root) in enumerate(BARS):
    b0 = L0 + i * bar_beats
    for m in lh:
        play(m, b0, 0.42, 3.6)
    for j, m in enumerate(arp):
        play(m, b0 + j * bar_beats / len(arp), 0.3 + 0.08 * (j % 4 == 0) + 0.02 * i)
    chord = sorted(set(arp))[:4]
    pad.add(filt(make_supersaw(chord, bar_beats * BEAT, attack=0.6, release=0.7, cutoff=1600, detune=0.1, voices=5), "high", 180), b0, 0.16)
    low.add(make_sub(root, bar_beats * BEAT), b0, 0.3)
    if i >= 1:
        for k in range(0, int(bar_beats), 2):
            drums.add(make_soft_kick(), b0 + k, 0.5)
        for s in range(int(bar_beats * 4)):
            if not (i == len(BARS) - 1 and s >= 14):
                drums.add(make_shaker(), b0 + s / 4, 0.07 if s % 2 else 0.11, pan=0.3)

# Swell into the name: a reversed piano chord that blooms right on the downbeat.
swell = np.zeros(secs(3.0))
for m in FMAJ9:
    swell += make_piano(m + 12, 3.0, 0.5)
swell = fade(norm(swell[::-1])[-secs(1.5 * BEAT):], 0.3, 0.004)
fx.add(swell, E0 - 1.5, 0.3)
send.add(swell, E0 - 1.5, 0.15)

# End card: warm Fmaj9 bloom, a soft low hit, celesta figure, pen scratch under the name.
for k, m in enumerate(FMAJ9):
    play(m, E0 + k * 0.03, 0.62, 6.0)
fx.add(make_subdrop(1.6), E0, 0.28)
drums.add(make_soft_kick(), E0, 0.55)
pad.add(filt(make_supersaw([53, 57, 60, 64, 67], (E1 - E0) * BEAT, attack=0.4, release=2.0, cutoff=1600, detune=0.1, voices=5), "high", 200), E0, 0.18)
low.add(make_sub(41, (E1 - E0) * BEAT), E0, 0.32)
for beat, m, g in ((E0 + 0.5, 84, 0.12), (E0 + 1.0, 88, 0.1), (E0 + 1.5, 91, 0.08)):
    bell = make_ding(midi(m))
    fx.add(bell, beat, g, pan=0.2)
    send.add(bell, beat, g * 0.8)
fx.add(make_pen_scratch(1.25 * BEAT), E0 + 1.5, 0.05, pan=0.15)
play(77, E0 + 3, 0.3, 4.0)


# ── mix & master ─────────────────────────────────────────────────────────────

ir = make_reverb_ir(3.2, 0.85)
L = piano.x.shape[1]
rev = np.array([signal.fftconvolve(send.x[c], ir[c])[:L] for c in range(2)])
mix = 0.9 * piano.x + pad.x + low.x + drums.x + fx.x + 0.5 * rev
mix = filt(mix, "high", 30)[:, :N]
mix = np.tanh(1.1 * norm(mix)) / np.tanh(1.1)
tail = idx(1.5)
mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
mix = norm(fade(mix, 0.003, 0.01), 10 ** (-1 / 20))
write_wav(OUT, mix)

rms = 20 * np.log10(np.sqrt(np.mean(mix**2)))
print(f"wrote {OUT.relative_to(ROOT)}  {N / SR:.2f}s  RMS {rms:.1f} dBFS")
