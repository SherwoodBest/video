export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const outCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const inCubic: Ease = (t) => t * t * t;
export const inOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const outExpo: Ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inExpo: Ease = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const inOutExpo: Ease = (t) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const outBack =
  (s = 1.70158): Ease =>
  (t) =>
    1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

/** Maps t from [t0, t1] onto [v0, v1] with easing, clamped at both ends. */
export const tween = (t: number, t0: number, t1: number, v0: number, v1: number, ease: Ease = outExpo) => {
  if (t1 <= t0) return t >= t1 ? v1 : v0;
  const p = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  return v0 + (v1 - v0) * ease(p);
};

/** 0 before `at`, jumps to 1 at `at`, then decays exponentially with time constant `tau`. */
export const pulse = (t: number, at: number, tau: number) => (t < at ? 0 : Math.exp(-(t - at) / tau));

/** Damped oscillation starting at `at` (used for wobbles and bell swings). */
export const wobble = (t: number, at: number, freq: number, tau: number) =>
  t < at ? 0 : Math.sin((t - at) * freq) * Math.exp(-(t - at) / tau);
