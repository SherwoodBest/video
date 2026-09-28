#!/usr/bin/env python3
"""
Synthesizes public/soundtrack-cinematic.wav for the cinematic intro, following the shape of a
film-trailer opener: an F-sharp minor drone swells while a mallet pulse lands on every cut and
speeds up with them, everything stops dead at the cut to the end card, then a warm chord blooms
under the title and a small celesta figure greets the channel name. Timing comes from
src/cinematic/timeline.json.

    pip install numpy scipy
    python3 scripts/make_cinematic_soundtrack.py
"""
import json
from pathlib import Path

import numpy as np
from scipy import signal

from synth import (
    SR,
    fade,
    filt,
    make_ding,
    make_piano,
    make_reverb_ir,
    make_soft_kick,
    make_sub,
    make_subdrop,
    make_supersaw,
    midi,
    noise,
    norm,
    secs,
    sine,
    stereo,
    svf,
    write_wav,
)

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "cinematic" / "timeline.json").read_text())
OUT = ROOT / "public" / "soundtrack-cinematic.wav"

N = secs(TL["duration"])
CUTS = TL["cuts"]
END = TL["end"]
STOP = END["cut"]


class Track:
    """Stereo buffer addressed in seconds."""

    def __init__(self):
        self.x = np.zeros((2, N + 6 * SR))

    def add(self, sig, at, gain=1.0, pan=0.0):
        s = stereo(sig, pan) * gain
        i = secs(at)
        end = min(self.x.shape[1], i + s.shape[1])
        self.x[:, i:end] += s[:, : end - i]


def make_mallet(m, vel):
    """Soft marimba-like mallet: fundamental plus the characteristic ~4x partial, quick decay."""
    n = secs(1.2)
    t = np.arange(n) / SR
    f0 = midi(m)
    x = sine(f0, n) * np.exp(-t / 0.45) + 0.35 * sine(f0 * 3.93, n) * np.exp(-t / 0.08)
    x += 0.12 * norm(filt(noise(n), "band", [1500, 5000])) * np.exp(-t / 0.004)
    return fade(norm(x) * np.minimum(1, t / 0.002) * vel, 0.0005, 0.2)


def make_tick():
    """Clock-like click that sharpens the pulse."""
    n = secs(0.03)
    t = np.arange(n) / SR
    return fade(norm(filt(noise(n), "band", [2500, 7000])) * np.exp(-t / 0.004))


drone, pulse, bloom, send, bloom_send = Track(), Track(), Track(), Track(), Track()
# The end chord sits well below the climax, as in a trailer: the silence does the work.
BLOOM = 0.45

# ── Drone: open fifths on F#, swelling and brightening until the cut to the end card. ──
dur = STOP + 0.5
pad = make_supersaw([42, 49, 54, 61], dur, attack=1.2, release=0.3, cutoff=6000, detune=0.12, voices=5)
p = np.clip(np.arange(pad.shape[1]) / secs(STOP), 0, 1)
cutoff = 260 * (2600 / 260) ** (p**1.6)
pad = np.array([svf(ch, cutoff, q=0.9) for ch in pad])
pad *= 0.12 + 0.88 * p**2.2
drone.add(norm(pad), 0, 0.34)
send.add(norm(pad), 0, 0.12)
drone.add(make_sub(30, dur) * (0.2 + 0.8 * np.clip(np.arange(secs(dur)) / secs(STOP), 0, 1) ** 2), 0, 0.3)

# ── Pulse: one mallet note + soft thump + tick on every cut, climbing an F#m9 arpeggio. ──
ARP = [66, 69, 73, 76, 80, 73, 69, 76]
cuts = [c for c in CUTS[1:] if c < STOP]
for i, c in enumerate(cuts):
    k = i / max(1, len(cuts) - 1)
    note = make_mallet(ARP[i % len(ARP)] + (12 if k > 0.7 and i % 2 else 0), 0.35 + 0.6 * k)
    pulse.add(note, c, 0.55, pan=0.25 * np.sin(i * 1.7))
    send.add(note, c, 0.18)
    pulse.add(make_soft_kick(), c, 0.25 + 0.5 * k)
    pulse.add(make_tick(), c, 0.04 + 0.08 * k, pan=-0.3)

# ── Riser under the phrase: filtered noise and a high string swell. ──
r0 = TL["phrase"][0]
n = secs(STOP - r0)
q = np.arange(n) / n
air = np.array([norm(svf(noise(n), 400 * (7000 / 400) ** (q**1.4), q=2.2, mode="bp")) for _ in range(2)])
pulse.add(air * q**2.5, r0, 0.16)
strings = make_supersaw([73, 76, 80, 85], STOP - r0, attack=STOP - r0, release=0.02, cutoff=5000, detune=0.14, voices=5)
pulse.add(norm(strings) * np.linspace(0, 1, strings.shape[1]) ** 2, r0, 0.14)

# ── Hard stop at the cut: a breath of silence, then the bloom. ──
for tr in (drone, pulse, send):
    i = secs(STOP)
    tr.x[:, i : i + secs(0.015)] *= np.linspace(1, 0, secs(0.015))
    tr.x[:, i + secs(0.015) :] = 0

S = END["sound"]
FSM9 = [42, 49, 57, 64, 68, 73]
for j, m in enumerate(FSM9):
    note = make_piano(m, 6.0, 0.55 + 0.04 * j)
    bloom.add(note, S + 0.025 * j, 1.0, pan=(m - 58) / 40)
    bloom_send.add(note, S + 0.025 * j, 0.35)
warm = make_supersaw([49, 57, 61, 64, 68], TL["duration"] - S, attack=0.8, release=1.5, cutoff=1800, detune=0.1, voices=5)
bloom.add(filt(warm, "high", 160), S, 0.16)
bloom_send.add(filt(warm, "high", 160), S, 0.1)
bloom.add(make_subdrop(2.0), S, 0.22)
bloom.add(make_soft_kick(), S, 0.4)
bloom.add(make_sub(42, TL["duration"] - S), S, 0.22)

# ── Channel name: a small celesta figure. ──
for dt, m, g in ((0.0, 85, 0.14), (0.35, 80, 0.11), (0.7, 88, 0.09)):
    bell = make_ding(midi(m))
    bloom.add(bell, END["name"] + dt, g, pan=0.15)
    bloom_send.add(bell, END["name"] + dt, g * 0.9)

# ── Mix & master ──
ir = make_reverb_ir(3.4, 0.95)
bloom.x *= BLOOM
send.x += BLOOM * bloom_send.x
L = drone.x.shape[1]
rev = np.array([signal.fftconvolve(send.x[c], ir[c])[:L] for c in range(2)])
# Keep the breath after the cut clean: duck the reverb tail until the bloom arrives.
duck = np.ones(L)
i0, i1 = secs(STOP), secs(S)
duck[i0 : i0 + secs(0.08)] = np.linspace(1, 0.08, secs(0.08))
duck[i0 + secs(0.08) : i1] = 0.08
rev *= duck
mix = drone.x + pulse.x + bloom.x + 0.55 * rev
mix = filt(mix, "high", 28)[:, :N]
mix = np.tanh(1.2 * norm(mix)) / np.tanh(1.2)
tail = secs(TL["duration"] - END["fade"])
mix[:, -tail:] *= np.linspace(1, 0, tail) ** 1.5
mix = norm(fade(mix, 0.01, 0.01), 10 ** (-1 / 20))
write_wav(OUT, mix)

m = mix.mean(axis=0)
env = " ".join(f"{20 * np.log10(np.sqrt(np.mean(m[secs(a):secs(a + 1)] ** 2)) + 1e-9):.0f}" for a in range(int(TL["duration"])))
print(f"wrote {OUT.relative_to(ROOT)}  {N / SR:.2f}s  RMS per second: {env}")
