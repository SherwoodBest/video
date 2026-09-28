# 轻松英语写作 · Channel Intros

Three intro videos for the channel, rendered entirely from code with
[Remotion](https://www.remotion.dev). All soundtracks are original and synthesized, so they are
royalty-free.

| Version   | Video                                                | Length | Style                                                    |
| --------- | ---------------------------------------------------- | ------ | -------------------------------------------------------- |
| Cinematic | [`out/cinematic-intro.mp4`](out/cinematic-intro.mp4) | 20 s   | Film-trailer montage of real footage, ending on 轻松英语写作 |
| Dynamic   | [`out/channel-intro.mp4`](out/channel-intro.mp4)     | 24 s   | Bold kinetic typography cut to a 128 BPM beat, bilingual |
| Minimal   | [`out/minimal-intro.mp4`](out/minimal-intro.mp4)     | 17 s   | Calm serif lines on warm paper, ending on 轻松英语写作       |

All are 1920×1080, H.264 + AAC (the cinematic one at a film-like 25 fps, the others at 60 fps).

## Cinematic version

Modeled on the structure of Claude's launch films: real footage, match cuts, one short phrase,
a breath of silence, then the name. Every montage shot masks a different clip (handwriting,
calligraphy, typewriters, books, ink in water, paint, maps, Earth from orbit) into the same
dome, so each cut lands on an identical horizon. The cuts follow a pulse that speeds up from
about half a second to a fifth of a second.

| Time   | Scene                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| 0:00   | Cold open on Earth's night side and its glowing airglow                            |
| 0:01.4 | A fountain pen draws the S of *Soul*, then a typewriter types *…grey fox jumps*     |
| 0:03.4 | The montage speeds up: ink, paint, maps, pencils, books, Earth from orbit          |
| 0:09.0 | The phrase lands on the cuts: *Find* · *the right* · *words.*                      |
| 0:12.6 | Under *words.*, handwritten *Hello*, *Love*, *Happy*, *Feels*, *Soul* flash by     |
| 0:15.8 | Hard cut to space and silence; *Easy English Writing*, then 轻松英语写作 over Earth   |
| 0:18.4 | The view tilts down into the planet and fades out                                  |

The footage is downloaded rather than committed (see [CREDITS.md](CREDITS.md) for every clip
and its license): run `npm run footage` once before previewing or rendering this version.

## Dynamic version

Every cut, slam and camera punch lands on a beat of the 128 BPM track.

| Time   | Beats | Scene                                                                    |
| ------ | ----- | ------------------------------------------------------------------------ |
| 0:00.0 | 0–4   | Greeting, one word per beat: HELLO · 你好 · WELCOME · 欢迎                  |
| 0:01.9 | 4–8   | 4-3-2-1 film-leader countdown while "EASY ENGLISH WRITING" decodes        |
| 0:03.8 | 8–12  | **Drop**: 轻松英语写作 slams in, subtitle bar wipes on                      |
| 0:05.6 | 12–16 | Tilted name stack that steps and recolors on every beat                  |
| 0:07.5 | 16–32 | Topic cards: GRAMMAR · VOCABULARY · SENTENCES · ESSAYS                   |
| 0:15.0 | 32–36 | Slogan WRITE / BETTER / ENGLISH with 轻松写出地道英文 typed vertically       |
| 0:16.9 | 36–40 | Breakdown: READY? · 准备好了吗？ · LET'S · WRITE!                           |
| 0:18.8 | 40–52 | **Final drop**: logo lockup, subscribe click, bell ring, sign-off, fade  |

## Minimal version

English only until the end card. The piano changes chord with each new line (90 BPM).

| Time   | Beats | Scene                                                                        |
| ------ | ----- | ---------------------------------------------------------------------------- |
| 0:00.0 | 0–2   | A blank page and a blinking caret                                            |
| 0:01.3 | 2–18  | Four lines, revealed word by word as if typed:                               |
|        |       | *Good writing isn’t about big words.* · *It’s about clear ideas, simply said.* |
|        |       | *Let’s make English writing easy.* · *One sentence at a time.*               |
| 0:12.0 | 18–26 | 轻松英语写作 appears, a pen nib draws an underline beneath it, then it fades     |

## Make it yours

- **Dynamic:** everything on screen comes from `src/config.ts`: channel name, English subtitle,
  `@handle`, logo badge, greeting, topics and captions, slogan, button labels, sign-off and the
  four brand colors. Chinese and English can be mixed in any field. The one thing worth filling in
  is `handle`; while it's empty, the English subtitle shows in its place.
- **Cinematic:** edit `src/cinematic/config.ts`: the phrase, the English title before the name,
  and the shot list (which clip, where to start in it, how to frame it, backdrop color). Cut
  times live in `src/cinematic/timeline.json`; clips are listed in `src/cinematic/footage.json`.
- **Minimal:** edit `src/minimal/config.ts`. It holds the English lines (wrap words in
  `*asterisks*` to set them in italic accent color) and the colors. The name on the end card comes
  from `CHANNEL.name` in `src/config.ts`.

Text is auto-fitted in both versions, so longer or shorter lines still fit the frame.

## Commands

Requires Node.js 18+.

```bash
npm install
npm run studio           # live preview of both versions; config edits show up instantly
npm run render           # writes out/channel-intro.mp4
npm run render:minimal   # writes out/minimal-intro.mp4

npm run footage          # once: downloads the cinematic footage (Python 3 + ffmpeg or imageio-ffmpeg)
npm run render:cinematic # writes out/cinematic-intro.mp4
```

The first render downloads a headless Chrome automatically.

## Soundtracks

Each version has its own synthesized track in `public/`, generated by a script in `scripts/`
(`make_soundtrack.py`, `make_minimal_soundtrack.py`, `make_cinematic_soundtrack.py`), with shared
oscillators, filters and instruments in `scripts/synth.py`. Each track reads its video's timeline,
so hits, pulses and chord changes land on cue. To regenerate them (Python 3 with `numpy` and
`scipy`):

```bash
pip install numpy scipy
npm run music
```

To use your own music instead, replace the WAV. For the dynamic and minimal versions, set `bpm`
in the matching timeline to the song's tempo and the animation re-times itself; for the cinematic
version, move the cut times in `src/cinematic/timeline.json` onto your track's beats.

## Project layout

```
src/config.ts           ← dynamic version: text and colors (edit this)
src/timeline.json       dynamic version: tempo, frame rate, sections (in beats)
src/scenes/             dynamic version: Intro, Name, Topics, Slogan, Hype, Outro
src/minimal/            minimal version: config.ts (edit this), timeline, lines, end card
src/cinematic/          cinematic version: config.ts (edit this), timeline, footage list, domes
src/components/         shared pieces: camera, glitch, marquee, film leader, HUD, subscribe/bell…
scripts/                soundtrack synthesizers, footage downloader
public/                 fonts and soundtracks (footage/ is downloaded, not committed)
```

## Licenses

- Footage (cinematic version): NASA (public domain), Mixkit Free License and Coverr License
  clips; see [CREDITS.md](CREDITS.md).
- Fonts: Anton, Inter, JetBrains Mono, Newsreader, Noto Sans SC and Noto Serif SC, all under the
  SIL Open Font License (`public/fonts/licenses/`, and the fontsource npm packages).
- Remotion is free for individuals and companies of up to 3 people; larger companies need a
  [company license](https://www.remotion.pro).
