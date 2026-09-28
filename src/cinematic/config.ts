// ─────────────────────────────────────────────────────────────────────────────
//  Cinematic version: real footage masked into matching domes, cut to an accelerating
//  pulse, one English phrase, then the channel name over Earth's horizon.
//  Run `npm run footage` once to download the clips into public/footage/.
//  The channel name comes from `CHANNEL.name` in ../config.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const CINEMATIC = {
  /** Phrase pinned above the montage; each part appears on a cut listed in timeline.json → phrase. */
  phrase: ['Find', 'the right', 'words.'],
  /** Font size of each phrase part; the last one lands biggest. */
  phraseSize: [64, 64, 116],
  /** English line on the end card before the channel name ('' to skip). */
  title: 'Easy English Writing',
};

/**
 * One dome shot. `clip` is an id from footage.json, `from` the second to start at in that clip,
 * `bg` the backdrop above the dome. Optional framing: `zoom` (1 = fill), `x`/`y` pixel offsets of
 * the footage inside the dome, and `look`, a CSS filter for the grade.
 */
export type Shot = {clip: string; from: number; bg: string; zoom?: number; x?: number; y?: number; look?: string};

/** Shots in order after the opening; each fills the next gap between cuts in timeline.json. */
export const SHOTS: Shot[] = [
  {clip: 'pen-soul', from: 2.4, bg: '#0B0B0D', zoom: 1.3, y: -250},
  {clip: 'typewriter-fox', from: 3.0, bg: '#E9E2D2', zoom: 1.3, y: -40},
  // Montage, no text yet.
  {clip: 'ink-black', from: 6, bg: '#E7DFCE'},
  {clip: 'paint-palette', from: 3, bg: '#17252A'},
  {clip: 'old-books', from: 4, bg: '#C3D3D6'},
  {clip: 'ink-bloom', from: 12, bg: '#0A0A0E'},
  {clip: 'map', from: 6, bg: '#EFE7D4', zoom: 1.3},
  {clip: 'ink-blue', from: 5, bg: '#D9502C'},
  {clip: 'pencil-shavings', from: 6, bg: '#26352B', zoom: 1.4},
  {clip: 'watercolor', from: 3, bg: '#F2ECE1', zoom: 1.2},
  {clip: 'ripples', from: 4, bg: '#0D1A2B'},
  {clip: 'paint-green', from: 3, bg: '#EDBB45'},
  {clip: 'earth-desert', from: 2, bg: '#030406', zoom: 1.1, y: 120},
  // "Find"
  {clip: 'magnifier', from: 2, bg: '#111111', zoom: 1.2},
  {clip: 'book-pages', from: 1.5, bg: '#D8D0BF', zoom: 1.2},
  {clip: 'typewriter-keys', from: 2, bg: '#A92E55', zoom: 1.2},
  {clip: 'ink-violet', from: 6, bg: '#F0EBE2'},
  {clip: 'pencil-notebook', from: 3, bg: '#34495A', zoom: 1.3},
  {clip: 'drops', from: 5, bg: '#EAE2D1'},
  // "the right"
  {clip: 'typewriter-blue', from: 3, bg: '#F1DFBD', zoom: 1.2},
  {clip: 'ink-red', from: 4, bg: '#101012'},
  {clip: 'pencil-sketch', from: 5, bg: '#7CA3B2', zoom: 1.3},
  {clip: 'ink-oval', from: 6, bg: '#E7DCC7'},
  {clip: 'paint-blue', from: 5, bg: '#0E0E13'},
  {clip: 'gothic-ab', from: 1.5, bg: '#BE4232', zoom: 1.2},
  // "words." — the handwritten words flash by.
  {clip: 'pen-hello', from: 5, bg: '#F3EEE3', zoom: 1.7, x: 380, y: -40},
  {clip: 'love-red', from: 3, bg: '#19191C', zoom: 1.3, x: 160, y: -160},
  {clip: 'happy-orange', from: 6, bg: '#3B5E55', zoom: 1.2},
  {clip: 'feels-green', from: 5, bg: '#F1E6D1', zoom: 1.2},
  {clip: 'happy-purple', from: 7, bg: '#27213C', zoom: 1.2},
  {clip: 'gothic-alphabet', from: 2.5, bg: '#E6DFD2', zoom: 1.2},
  {clip: 'pen-soul', from: 5.5, bg: '#0C0C0C', zoom: 1.3},
  {clip: 'ink-black-2', from: 12, bg: '#D5C6AC'},
  {clip: 'typewriter-fox', from: 6.5, bg: '#1B3942', zoom: 1.35},
  {clip: 'book-pages', from: 3.5, bg: '#EFE4CF', zoom: 1.4},
  {clip: 'ink-bloom', from: 22, bg: '#000000'},
];
