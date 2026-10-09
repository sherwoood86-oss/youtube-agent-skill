#!/usr/bin/env python3
"""props.py - Remotion input props from a transcript, an EDL and a window.

    python3 props.py transcript.srt --src talk.mp4                       # the whole video, captioned
    python3 props.py transcript.srt --src talk.mp4 --edl edl.json        # with deadair.py's cuts applied
    python3 props.py transcript.srt --src talk.mp4 --short 312.4 351.0 --hook "Nobody checks this"
    python3 props.py ... --fps 30 --words 3 --out props.json

The EDL is the output of `../yt-edit/deadair.py transcript.srt --json`. A Short window is source
seconds, the span /yt-shorts picked. Prints (or writes) the JSON that template/ renders:

    npx remotion render Edit out.mp4 --props=props.json

WHAT IT DOES NOT DO. It does not touch media and it does not render. It works out which source
ranges survive, where every caption lands on the NEW timeline once the cuts close up, and how many
frames that is. Word timings inside a cue are estimated from character length - the transcript only
has cue timings - so a caption can lead or trail the word by a few frames. A whisper json with word
timestamps would fix that; this reads cue level only.
"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "yt-edit"))
from deadair import load  # noqa: E402  (same parser, one implementation)

MIN_KEEP = 0.25    # a kept range shorter than this, between two cuts, plays as a flash frame
SHORT_MAX = 180.0  # YouTube's Shorts ceiling. Past this it uploads as a regular vertical video.

def flag(a, name, n=1, cast=float):
    if name not in a: return None
    i = a.index(name)
    vals = a[i + 1:i + 1 + n]
    del a[i:i + 1 + n]
    return [cast(v) for v in vals] if n > 1 else cast(vals[0])

def kept(lo, hi, cuts):
    """The window [lo, hi] minus every cut, as sorted, non-overlapping source ranges."""
    out, t = [], lo
    for s, e in sorted((max(lo, c["start"]), min(hi, c["end"])) for c in cuts):
        if e <= s or e <= t: continue
        if s > t: out.append((t, s))
        t = max(t, e)
    if t < hi: out.append((t, hi))
    return out

def phrases(s, e, text, n):
    """Split one cue into n-word captions, timed by share of characters. An estimate, not alignment."""
    words = text.split()
    groups = [" ".join(words[i:i + n]) for i in range(0, len(words), n)] or [text]
    total = sum(len(g) for g in groups) or 1
    out, t = [], s
    for g in groups:
        d = (e - s) * len(g) / total
        out.append((t, t + d, g)); t += d
    return out

def main():
    a = sys.argv[1:]
    as_short = "--short" in a
    win = flag(a, "--short", 2)
    src = flag(a, "--src", cast=str)
    edl = flag(a, "--edl", cast=str)
    hook = flag(a, "--hook", cast=str)
    out = flag(a, "--out", cast=str)
    fps = flag(a, "--fps", cast=int) or 30
    n = flag(a, "--words", cast=int) or (3 if as_short else 7)
    if not a or not os.path.exists(a[0]) or not src: print(__doc__); sys.exit(1)
    cues = load(a[0])
    if not cues: print("no cues found - is this an srt, vtt or whisper json?"); sys.exit(1)
    lo, hi = win if win else (0.0, cues[-1][1])
    if hi <= lo: print(f"window ends before it starts: {lo} -> {hi}"); sys.exit(1)
    cuts = json.load(open(edl))["cuts"] if edl else []

    # Frame-align every kept range first, then build the timeline from those frames. Rounding the
    # running total instead lets a 0.5-frame error per cut drift the captions off the mouth by the
    # end of a long edit.
    segs, at = [], 0
    for s, e in kept(lo, hi, cuts):
        fs, fe = round(s * fps), round(e * fps)
        if fe - fs < max(1, round(MIN_KEEP * fps)): continue
        segs.append({"start": fs / fps, "end": fe / fps, "trimBefore": fs, "from": at, "frames": fe - fs})
        at += fe - fs
    if not segs: print("every frame in the window was cut"); sys.exit(1)

    caps = []
    for s, e, text in cues:
        if e <= lo or s >= hi or not text.strip(): continue
        for ps, pe, p in phrases(s, e, text.strip(), n):
            # A phrase inside a cut is gone. A phrase straddling a cut is clipped to what survives.
            for g in segs:
                cs, ce = max(ps, g["start"]), min(pe, g["end"])
                if ce - cs <= 0: continue
                f0 = g["from"] + round((cs - g["start"]) * fps)
                f1 = g["from"] + round((ce - g["start"]) * fps)
                if f1 > f0: caps.append({"from": f0, "to": f1, "text": p})
    caps.sort(key=lambda c: c["from"])
    for c, nxt in zip(caps, caps[1:]):  # never two captions on screen at once
        if nxt["from"] > c["from"]: c["to"] = min(c["to"], nxt["from"])
    caps = [c for c in caps if c["to"] > c["from"]]

    w, h = (1080, 1920) if as_short else (1920, 1080)
    props = {"src": os.path.basename(src), "fps": fps, "width": w, "height": h,
             "durationInFrames": at, "segments": segs, "captions": caps}
    if hook: props["hook"] = {"text": hook, "frames": min(at, 2 * fps)}
    js = json.dumps(props, indent=1)
    if out: open(out, "w").write(js + "\n")
    else: print(js)

    secs = at / fps
    log = sys.stderr if not out else sys.stdout
    print(f"\n  {a[0]}   {lo:.2f} -> {hi:.2f} source, {len(segs)} kept ranges, {len(caps)} captions", file=log)
    print(f"  {at} frames at {fps}fps = {secs:.2f}s out, {w}x{h}" + (f"   -> {out}" if out else ""), file=log)
    if as_short and secs > SHORT_MAX:
        print(f"  WARNING {secs:.0f}s is over the {SHORT_MAX:.0f}s Shorts ceiling - it will not post as a Short", file=log)
    if as_short and not hook:
        print("  no --hook: the first two seconds have no on-screen text", file=log)
    print(file=log)

if __name__ == "__main__":
    main()
