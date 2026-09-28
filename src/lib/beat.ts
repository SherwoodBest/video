import timeline from '../timeline.json';

export const BPM: number = timeline.bpm;
export const FPS: number = timeline.fps;
export const WIDTH: number = timeline.width;
export const HEIGHT: number = timeline.height;

/** Frames per beat. Can be fractional (28.125 at 128 BPM and 60 fps). */
export const FPB = (FPS * 60) / BPM;

/** Beat position (fractional allowed) → nearest frame. */
export const bf = (beats: number) => Math.round(beats * FPB);

export type SectionName = keyof typeof timeline.sections;

export const TOTAL_FRAMES = bf(timeline.totalBeats);

/** Start frame and length of a named section, for use as <Sequence> props. */
export const section = (name: SectionName) => {
  const [start, end] = timeline.sections[name];
  return {from: bf(start), durationInFrames: bf(end) - bf(start)};
};

/** Splits `beats` into `n` consecutive integer-aligned slots: [startBeat, endBeat]. */
export const splitBeats = (beats: number, n: number): [number, number][] =>
  Array.from({length: n}, (_, i) => [Math.round((i * beats) / n), Math.round(((i + 1) * beats) / n)]);
