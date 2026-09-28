import timeline from './timeline.json';

export const TL = timeline;
export const FPS = timeline.fps;
/** Seconds → nearest frame. */
export const f = (seconds: number) => Math.round(seconds * timeline.fps);
export const TOTAL_FRAMES = f(timeline.duration);
