import '@fontsource-variable/noto-sans-sc';
import type React from 'react';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export {COLORS} from './config';

/** Chinese glyphs fall back to Noto Sans SC (variable weight, loaded on demand per character). */
const CJK = 'Noto Sans SC Variable';

export const FONT = {
  display: `Anton, '${CJK}'`,
  ui: `Inter, '${CJK}'`,
  mono: `'JetBrains Mono', '${CJK}'`,
};

/** Big headline style. Weight 900 makes the Chinese fallback render in Black to match Anton. */
export const DISPLAY: React.CSSProperties = {fontFamily: FONT.display, fontWeight: 900};

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const face = (family: string, file: string, weight: string, unicodeRange: string) =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, unicodeRange, format: 'woff2'});

const latinFonts = Promise.all([
  // Anton ships a single weight; declaring the full range stops the browser from faking bold.
  face('Anton', 'anton-latin-400-normal.woff2', '100 900', LATIN),
  face('Anton', 'anton-latin-ext-400-normal.woff2', '100 900', LATIN_EXT),
  ...['600', '700', '800', '900'].flatMap((w) => [
    face('Inter', `inter-latin-${w}-normal.woff2`, w, LATIN),
    face('Inter', `inter-latin-ext-${w}-normal.woff2`, w, LATIN_EXT),
  ]),
  face('JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500', LATIN),
  face('JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700', LATIN),
]);

/** Resolves once every font face needed for `text` is ready, so text measurement is exact. */
export const loadFonts = async (text: string) => {
  await latinFonts;
  await Promise.all(['500', '700', '800', '900'].map((w) => document.fonts.load(`${w} 64px '${CJK}'`, text)));
};
