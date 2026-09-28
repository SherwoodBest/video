import {fitText, measureText} from '@remotion/layout-utils';
import {FONT} from '../theme';

type TextOpts = {fontFamily?: string; fontWeight?: string | number; letterSpacing?: string; upper?: boolean};

const resolve = ({fontFamily = FONT.display, fontWeight = 900, letterSpacing, upper = true}: TextOpts) => ({
  fontFamily,
  fontWeight,
  letterSpacing,
  textTransform: upper ? ('uppercase' as const) : undefined,
});

/** True if the text contains Chinese/Japanese/Korean characters. */
export const hasCjk = (text: string) => /[　-鿿가-힯＀-￯]/.test(text);

/** Largest font size (capped at `max`) that fits `text` on one line within `width` px. */
export const fitSize = (text: string, width: number, max: number, opts: TextOpts = {}) =>
  Math.min(max, fitText({text, withinWidth: width, ...resolve(opts)}).fontSize);

/** Rendered width in px of `text` at `fontSize`. */
export const textWidth = (text: string, fontSize: number, opts: TextOpts = {}) =>
  measureText({text, fontSize, ...resolve(opts)}).width;
