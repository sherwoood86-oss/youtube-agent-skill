---
name: yt-remotion
description: >-
  Render the pack's output into video with Remotion - the /yt-edit cuts
  closed up, captions burned in, a /yt-shorts pick cut to 9:16 with its hook
  on screen. Use for "render this", "burn in captions", "make the short",
  "apply the cuts", "remotion", or any request to turn an EDL or a Shorts
  pick into an actual file.
---

# yt-remotion

The other skills print what to cut. This one cuts it. `props.py` works out the timeline, and the
Remotion project in `template/` renders it on the user's own machine.

```bash
python3 props.py transcript.srt --src talk.mp4 --edl edl.json --out props.json      # long edit
python3 props.py transcript.srt --src talk.mp4 --short 312.4 351.0 \
        --hook "Nobody checks this" --edl edl.json --out props.json                 # a Short
```

`edl.json` is `../yt-edit/deadair.py transcript.srt --json`. The `--short` window is the span
`/yt-shorts` picked, in source seconds, and `--hook` is the on-screen text it wrote for the first two
seconds. `--words` sets words per caption (3 for a Short, 7 for a long edit by default).

## Rendering

Needs Node 18+. Nothing is installed until the user says so.

```bash
cp -r template/ ~/my-edit && cd ~/my-edit
cp /path/to/talk.mp4 public/          # the --src file, by the same name
cp /path/to/props.json .
npm install
npm run studio                        # scrub it in the browser first
npm run render                        # -> out/edit.mp4
```

## A Short with no footage

`TextShort` is a second composition: no video, just one beat of on-screen text after another on a
gradient, with a progress bar. The script is the props file - see `template/examples/text-short.json`.

- One `scene` per beat: `text`, `seconds` on screen, an optional `kicker` label above it.
- `*asterisks*` around one or several words colour them with the accent.
- Time it for reading, not speaking: about three words a second plus a beat. Keep the whole thing
  under 60 seconds unless the user asks otherwise.
- Write it like any Short (see `/yt-shorts`): a complete first line, a turn, an ending on a line, and
  a last beat that leads back into the first so the loop reads as one sentence.

```bash
npm run render:text                   # -> out/short.mp4 from examples/text-short.json
npx remotion render TextShort out/short.mp4 --props=my-short.json
```

It renders silent. Voiceover and music are the user's to add - say so, do not imply it has sound.

## A recurring blocky character

`Blocky.tsx` draws a block-built character in SVG - head, torso, arms, legs, three moods, a punch,
a walk cycle, a speech bubble - with a palette per character, so one cast runs across episodes.
`BrawlerShort.tsx` is episode 1 of Злыдень, the one who picks a fight with everything: a newbie who
hops over him, a wall that wins, then the viewer. `npm run render:brawler`. It has two sound
effects (`public/sfx/`, synthesised with ffmpeg, no licence attached) and no voice or music.

An episode is hand-keyed choreography, one `<Sequence>` per round, so a new episode is a new file
that reuses `Blocky`. The style is generic block-game, not Roblox: no Roblox name, logo, avatar or
asset goes in, because it is their trademark and a channel that uses it can get the video claimed.

## What it does with footage

- **Closes up the cuts.** Every kept range becomes a `<Sequence>` trimmed into the source, frame
  aligned before the timeline is built so captions do not drift by the end of a long edit. A sliver
  under 0.25s left between two cuts is dropped - it would play as a flash frame.
- **Captions on the NEW timeline.** A caption inside a cut is gone; one straddling a cut is clipped
  to what survives. On 9:16 they sit above the bottom band YouTube covers with its own buttons.
- **The hook on the open** for a Short, for two seconds.
- **Warns past 180 seconds** for a Short - YouTube's ceiling. Over it, it posts as a regular video.

## What it will not do

- **Word timing is estimated.** The transcript has cue timings, not word timings, so a caption can
  lead or trail the word by a few frames. Say so when handing it over. Scrub it in the studio.
- **The 9:16 crop is the centre.** A 16:9 source cropped to vertical loses both sides. If the
  speaker or the screen content is off-centre, the crop cuts it - check before rendering, and do
  not promise it reframes.
- **The cut audio is not crossfaded.** Same as any hard cut: if the EDL floor is tight, the joins can
  click. Raise `--floor` in `deadair.py` before blaming the render.
- It does not upload, and it does not run `npm install` or render without the user asking.

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**
