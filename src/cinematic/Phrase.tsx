import React, {useId} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';
import {linear, tween} from '../lib/anim';
import {CINEMATIC, SHOTS} from './config';
import {DOME, isDark} from './Dome';
import {TL, f} from './timing';

/** Index of the shot on screen at frame `t` (0 = opening). */
const shotAt = (t: number) => {
  let i = 0;
  while (i < TL.cuts.length - 2 && t >= f(TL.cuts[i + 1])) i++;
  return i;
};

/** The phrase, set on an arc concentric with the dome and recolored to contrast with each shot's backdrop. */
export const Phrase: React.FC = () => {
  const t = useCurrentFrame();
  const id = `arc${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const k = TL.phrase.reduce((found, s, i) => (t >= f(s) ? i : found), -1);
  if (k < 0 || t >= f(TL.end.cut)) return null;
  const shotIndex = shotAt(t);
  const bg = shotIndex === 0 ? '#000000' : SHOTS[(shotIndex - 1) % SHOTS.length].bg;
  const size = CINEMATIC.phraseSize[k] ?? CINEMATIC.phraseSize[CINEMATIC.phraseSize.length - 1];
  const last = k === CINEMATIC.phrase.length - 1;
  const start = f(TL.phrase[k]);
  const grow = last ? 1 + tween(t, start, f(TL.end.cut), 0, 0.07, linear) : 1;
  const R = DOME.r + 58;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path id={id} d={`M ${DOME.cx - R} ${DOME.cy} A ${R} ${R} 0 0 1 ${DOME.cx + R} ${DOME.cy}`} fill="none" />
        <text
          fill={isDark(bg) ? '#F4F1EA' : '#16140F'}
          opacity={tween(t, start, start + 3, 0, 1, linear)}
          style={{
            fontFamily: FONT.serif,
            fontWeight: 500,
            fontSize: size * grow,
            letterSpacing: '-0.01em',
          }}
        >
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {CINEMATIC.phrase[k]}
          </textPath>
        </text>
      </svg>
    </AbsoluteFill>
  );
};
