import timeline from '../timeline.json';

type Timeline = {
  bpm: number;
  fps: number;
  width: number;
  height: number;
  totalBeats: number;
  sections: Record<string, number[]>;
};

/** Beat ↔ frame helpers for a timeline (tempo, frame rate, and sections measured in beats). */
export const beatGrid = <T extends Timeline>(tl: T) => {
  /** Frames per beat. Can be fractional (28.125 at 128 BPM and 60 fps). */
  const FPB = (tl.fps * 60) / tl.bpm;
  /** Beat position (fractional allowed) → nearest frame. */
  const bf = (beats: number) => Math.round(beats * FPB);
  /** Start frame and length of a named section, for use as <Sequence> props. */
  const section = (name: keyof T['sections'] & string) => {
    const [start, end] = tl.sections[name];
    return {from: bf(start), durationInFrames: bf(end) - bf(start)};
  };
  return {FPB, bf, section, TOTAL_FRAMES: bf(tl.totalBeats)};
};

export const BPM: number = timeline.bpm;
export const FPS: number = timeline.fps;
export const WIDTH: number = timeline.width;
export const HEIGHT: number = timeline.height;
export const {FPB, bf, section, TOTAL_FRAMES} = beatGrid(timeline);

/** Splits `beats` into `n` consecutive integer-aligned slots: [startBeat, endBeat]. */
export const splitBeats = (beats: number, n: number): [number, number][] =>
  Array.from({length: n}, (_, i) => [Math.round((i * beats) / n), Math.round(((i + 1) * beats) / n)]);
