#!/usr/bin/env python3
"""
Generate the Patchnote launch soundtrack in code (no samples, no licensed music).

  python3 scripts/make-audio.py        → writes public/audio/*.wav

- bed.wav: a 30s music bed. 120 BPM, so 1 beat = 30 frames at 60fps and every scene cut lands
  on a beat. Section boundaries are read from SCENES in src/theme.ts.
- click / tick / type / whoosh / ping / ping-alert / pop / chime / hit .wav: one-shot SFX. Their
  timing is NOT baked in here: src/Soundtrack.tsx places them at frames exported by each scene.

Deterministic: all noise comes from a seeded generator, so re-running produces identical files.
"""
import os
import re
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio")
rng = np.random.default_rng(43)  # seeded: identical output every run


# ---------------------------------------------------------------- timing from theme.ts
def read_scenes():
    src = open(os.path.join(ROOT, "src", "theme.ts")).read()
    fps = int(re.search(r"fps:\s*(\d+)", src).group(1))
    total = int(re.search(r"durationInFrames:\s*(\d+)", src).group(1))
    scenes = {
        m.group(1): (int(m.group(2)), int(m.group(3)))
        for m in re.finditer(r"(\w+):\s*\{\s*from:\s*(\d+),\s*duration:\s*(\d+)\s*\}", src)
    }
    return fps, total, scenes


FPS, TOTAL, SCENES = read_scenes()
DUR = TOTAL / FPS
BPM = 120
BEAT = 60 / BPM


def sec(scene):
    a, d = SCENES[scene]
    return a / FPS, (a + d) / FPS


# ---------------------------------------------------------------- dsp helpers
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    m = re.match(r"([A-G]#?)(-?\d)", name)
    semis = names[m.group(1)] + (int(m.group(2)) - 4) * 12
    return 440.0 * 2 ** (semis / 12)


def saw(f, t, harmonics=10):
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        out += ((-1) ** (k + 1)) * np.sin(2 * np.pi * f * k * t) / k
    return out * (2 / np.pi)


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    env = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n)
    env[:A] = np.linspace(0, 1, A, endpoint=False) if A else env[:A]
    D = min(D, n - A)
    env[A : A + D] = np.linspace(1, s, D, endpoint=False) if D else env[A : A + D]
    R = min(R, n)
    env[n - R :] *= np.linspace(1, 0, R) if R else 1
    return env


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def stereo(mono, width=0.0, delay_ms=0.0):
    """Cheap widening: delay one side slightly."""
    d = int(delay_ms * SR / 1000)
    left = mono
    right = np.concatenate([np.zeros(d), mono[: len(mono) - d]]) if d else mono
    return np.stack([left * (1 - width / 2), right * (1 - width / 2)], axis=1)


def write_wav(name, data):
    data = np.asarray(data)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    peak = np.max(np.abs(data)) or 1.0
    data = data / peak * 0.89  # -1 dBFS peak
    pcm = (data * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {name:16s} {len(data) / SR:5.2f}s")


# ---------------------------------------------------------------- instruments
def pad(chord, dur, bright=900.0, amp=0.18):
    t = t_axis(dur)
    sig = sum(saw(note(n), t, 8) + 0.6 * saw(note(n) * 1.004, t, 8) for n in chord) / len(chord)
    sig = lowpass(sig, bright)
    return sig * adsr(len(t), a=min(0.8, dur / 3), d=0.2, s=0.9, r=min(0.8, dur / 3)) * amp


def bass(n, dur, amp=0.32):
    t = t_axis(dur)
    sig = lowpass(saw(note(n), t, 6), 420) + 0.5 * np.sin(2 * np.pi * note(n) * t)
    return sig * adsr(len(t), a=0.005, d=0.12, s=0.45, r=0.06) * amp


def kick(amp=0.85):
    t = t_axis(0.32)
    f = 46 + 110 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t * 9) * amp


def hat(amp=0.12, decay=60):
    t = t_axis(0.06)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * decay) * amp


def clap(amp=0.22):
    t = t_axis(0.18)
    n = bandpass(rng.standard_normal(len(t)), 900, 3500)
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return n * env * amp


def pluck(n, amp=0.16, dur=0.22):
    t = t_axis(dur)
    f = note(n)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return sig * np.exp(-t * 16) * amp


def tick_clock(amp=0.08):
    t = t_axis(0.03)
    return (highpass(rng.standard_normal(len(t)), 4000) * 0.6 + np.sin(2 * np.pi * 3200 * t)) * np.exp(-t * 180) * amp


def riser(dur, amp=0.25):
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    # sweep a band upward in chunks
    chunks = 24
    edges = np.linspace(0, len(t), chunks + 1).astype(int)
    for c in range(chunks):
        lo = 300 * (12 ** (c / chunks))
        seg = bandpass(n, lo, min(lo * 2.2, 20000))[edges[c] : edges[c + 1]]
        out[edges[c] : edges[c + 1]] = seg
    return out * np.linspace(0, 1, len(t)) ** 2 * amp


# ---------------------------------------------------------------- the bed
def make_bed():
    buf = np.zeros(int(DUR * SR) + SR)
    h0, h1 = sec("hook")
    p0, p1 = sec("problem")
    f0, f1 = sec("fix")
    y0, y1 = sec("payoff")
    beats = lambda a, b, step=1.0: np.arange(a, b - 1e-6, BEAT * step)

    # HOOK — a low Am pad swells, a quiet clock ticks in 8ths: tension, plenty of space.
    place(buf, pad(["A2", "C3", "E3"], h1 - h0 + 0.4, bright=600, amp=0.16), h0)
    for i, tb in enumerate(beats(h0 + 1.0, h1, 0.5)):
        place(buf, tick_clock(0.05 + 0.03 * (i % 2 == 0)), tb)
    for tb in beats(h0 + 2.0, h1):
        place(buf, kick(0.35), tb)  # soft heartbeat

    # PROBLEM — Am F Dm E, pulsing 8th-note bass, the clock keeps ticking. Drains away before the wipe.
    prog = [(["A2", "C3", "E3"], "A1"), (["F2", "A2", "C3"], "F1"), (["D2", "F2", "A2"], "D2"), (["E2", "G#2", "B2"], "E1")]
    bar = BEAT * 4
    for k, (chord, root) in enumerate(prog):
        t0 = p0 + k * bar
        place(buf, pad(chord, bar + 0.2, bright=800, amp=0.15), t0)
        for tb in beats(t0, min(t0 + bar, p1 - 0.6), 0.5):
            place(buf, bass(root, BEAT * 0.45, 0.24), tb)
    for i, tb in enumerate(beats(p0, p1 - 0.6, 0.5)):
        place(buf, tick_clock(0.07 + 0.03 * (i % 2 == 0)), tb)
    for tb in beats(p0, p1 - 0.6):
        place(buf, kick(0.4), tb)
    place(buf, riser(1.0, 0.18), p1 - 1.0)  # into the violet wipe

    # FIX — C G Am F. Arp + pad first (anticipation), the beat drops on the Generate click.
    generate_at = f0 + 2.0  # Scene 3 click at local f120 = 2.0s (beat-aligned)
    fprog = [(["C3", "E3", "G3"], "C2", ["C4", "E4", "G4", "C5"]),
             (["G2", "B2", "D3"], "G1", ["B3", "D4", "G4", "B4"]),
             (["A2", "C3", "E3"], "A1", ["C4", "E4", "A4", "C5"]),
             (["F2", "A2", "C3"], "F1", ["A3", "C4", "F4", "A4"])]
    nbars = int(round((f1 - f0) / bar))
    for k in range(nbars):
        chord, root, arp = fprog[k % 4]
        t0 = f0 + k * bar
        place(buf, pad(chord, bar + 0.2, bright=1400, amp=0.13), t0)
        for i, tb in enumerate(beats(t0, t0 + bar, 0.25)):
            place(buf, pluck(arp[i % 4], 0.11 if tb < generate_at else 0.14), tb)
        if t0 >= generate_at - 1e-6 or t0 + bar > generate_at:
            for tb in beats(max(t0, generate_at), t0 + bar, 0.5):
                place(buf, bass(root, BEAT * 0.45, 0.26), tb)
    for tb in beats(generate_at, f1):
        place(buf, kick(0.8), tb)
    for tb in beats(generate_at + BEAT / 2, f1, 1):
        place(buf, hat(0.10), tb)
    for tb in beats(generate_at + BEAT, f1, 2):
        place(buf, clap(0.2), tb)

    # PAYOFF — F, G, then resolve on C at the logo and let it ring out.
    logo_at = y0 + 3.5  # logo lands at local ~f212 (3.53s); 3.5s is beat-aligned
    place(buf, pad(["F2", "A2", "C3", "F3"], 1.6, bright=1600, amp=0.14), y0)
    place(buf, pad(["G2", "B2", "D3", "G3"], 2.1, bright=1800, amp=0.15), y0 + 1.5)
    for tb in beats(y0, logo_at):
        place(buf, kick(0.75), tb)
    for tb in beats(y0 + BEAT / 2, logo_at, 1):
        place(buf, hat(0.1), tb)
    for i, tb in enumerate(beats(y0, logo_at, 0.25)):
        arp = ["A3", "C4", "F4", "A4"] if tb < y0 + 1.5 else ["B3", "D4", "G4", "B4"]
        place(buf, pluck(arp[i % 4], 0.12), tb)
    resolve = pad(["C3", "E3", "G3", "C4", "E4"], y1 - logo_at + 0.5, bright=2200, amp=0.2)
    place(buf, resolve, logo_at)
    for i, n in enumerate(["C5", "E5", "G5", "C6"]):
        place(buf, pluck(n, 0.09, dur=1.2), logo_at + 0.12 * i)
    place(buf, bass("C2", 2.0, 0.3), logo_at)

    buf = buf[: int(DUR * SR)]
    # Gentle master: soft clip, then fade the last 1.2s to silence.
    buf = np.tanh(buf * 1.4) / 1.4
    fade = int(1.2 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade) ** 1.5
    return stereo(buf, width=0.0, delay_ms=7)


# ---------------------------------------------------------------- one-shot SFX
def sfx_click():
    t = t_axis(0.05)
    body = bandpass(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t * 260)
    blip = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 400) * 0.6
    return body + blip


def sfx_tick():
    t = t_axis(0.04)
    return (np.sin(2 * np.pi * 1900 * t) + 0.4 * np.sin(2 * np.pi * 3800 * t)) * np.exp(-t * 170)


def sfx_type():
    t = t_axis(0.045)
    return lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 200) + 0.5 * np.sin(2 * np.pi * 380 * t) * np.exp(-t * 120)


def sfx_whoosh():
    dur = 0.7
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    chunks = 28
    edges = np.linspace(0, len(t), chunks + 1).astype(int)
    for c in range(chunks):
        x = c / chunks
        center = 250 * (14 ** x)
        out[edges[c] : edges[c + 1]] = bandpass(n, center * 0.6, min(center * 1.8, 20000))[edges[c] : edges[c + 1]]
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return out * env


def bell(f, dur, decay):
    t = t_axis(dur)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.01 * f * t)) * np.exp(-t * decay)


def sfx_ping():  # friendly chat notification
    out = np.zeros(int(0.45 * SR))
    place(out, bell(note("E6"), 0.2, 18), 0.0, 0.8)
    place(out, bell(note("B6"), 0.4, 10), 0.08, 0.9)
    return out


def sfx_ping_alert():  # the CTO ping: lower, minor second, a little harsher
    out = np.zeros(int(0.5 * SR))
    place(out, bell(note("A5"), 0.25, 14), 0.0, 0.9)
    place(out, bell(note("A#5"), 0.4, 9), 0.09, 0.9)
    return out


def sfx_pop():
    t = t_axis(0.18)
    f = 420 + 700 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)


def sfx_chime():  # 4:51 turns green
    out = np.zeros(int(0.9 * SR))
    for i, n in enumerate(["C6", "E6", "G6"]):
        place(out, bell(note(n), 0.7, 7), 0.06 * i, 0.7)
    return out


def sfx_hit():  # logo resolve: soft sub boom + airy shimmer
    t = t_axis(2.6)
    f = 42 + 60 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    air = highpass(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3.0) * 0.18
    return boom + air


def main():
    os.makedirs(OUT, exist_ok=True)
    print(f"scenes from theme.ts: {SCENES}  ({DUR:.1f}s @ {FPS}fps, {BPM} BPM)")
    write_wav("bed.wav", make_bed())
    for name, fn in [
        ("click.wav", sfx_click), ("tick.wav", sfx_tick), ("type.wav", sfx_type), ("whoosh.wav", sfx_whoosh),
        ("ping.wav", sfx_ping), ("ping-alert.wav", sfx_ping_alert), ("pop.wav", sfx_pop),
        ("chime.wav", sfx_chime), ("hit.wav", sfx_hit),
    ]:
        write_wav(name, fn())


if __name__ == "__main__":
    sys.exit(main())
