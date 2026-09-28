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
from pathlib import Path

import numpy as np
from scipy import signal

from synth import (
    SR,
    Bus,
    fade,
    filt,
    make_bass,
    make_beep,
    make_boom,
    make_clap,
    make_click,
    make_crash,
    make_ding,
    make_glitch,
    make_hat,
    make_kick,
    make_pluck,
    make_pop,
    make_reverb_ir,
    make_riser,
    make_snare,
    make_sparkle,
    make_subdrop,
    make_supersaw,
    make_whoosh,
    norm,
    rng,
    secs,
    svf,
    write_wav,
)

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = json.loads((ROOT / "src" / "timeline.json").read_text())
OUT = ROOT / "public" / "soundtrack.wav"

BPM = TIMELINE["bpm"]
BEAT = 60.0 / BPM
SEC = {k: tuple(v) for k, v in TIMELINE["sections"].items()}
TOTAL_BEATS = TIMELINE["totalBeats"]
N = int(round(TOTAL_BEATS * BEAT * SR))
# Whooshes follow the topic cards, so count them in the config (defaults to 4).
_topics = re.search(r"topics:\s*\[(.*?)\n\s*\],", (ROOT / "src" / "config.ts").read_text(), re.S)
TOPIC_COUNT = len(re.findall(r"\btitle:", _topics.group(1))) if _topics else 4


def idx(beat):
    return int(round(beat * BEAT * SR))


# ── arrangement ──────────────────────────────────────────────────────────────

KICK, CLAP = make_kick(), make_clap()
HATS = [make_hat() for _ in range(4)]
OPEN_HAT = make_hat(open_=True)
BOOM, CRASH, SUBDROP = make_boom(), make_crash(), make_subdrop()

drums, bass, music, fx, send = (Bus(N, BEAT) for _ in range(5))
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
fx.add(make_riser(3.85 * BEAT), b0 + 4, 0.34)
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
fx.add(make_riser(3.8 * BEAT), h0, 0.34)
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

write_wav(OUT, mix)

rms = 20 * np.log10(np.sqrt(np.mean(mix[:, idx(SEC["topics"][0]) : idx(SEC["topics"][1])] ** 2)))
print(f"wrote {OUT.relative_to(ROOT)}  {N / SR:.2f}s  groove RMS {rms:.1f} dBFS")
