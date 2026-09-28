import React from 'react';
import {useCurrentFrame} from 'remotion';
import {WIDTH} from '../lib/beat';
import {textWidth} from '../lib/text';
import {FONT} from '../theme';

/** One row of endlessly repeating text. Positive `speed` (px/frame) scrolls left. */
export const Marquee: React.FC<{
  text: string;
  fontSize: number;
  y: number;
  speed: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  offset?: number;
  fontFamily?: string;
  fontWeight?: number;
  separator?: string;
}> = ({
  text,
  fontSize,
  y,
  speed,
  color = 'transparent',
  stroke,
  strokeWidth = 2,
  opacity = 1,
  offset = 0,
  fontFamily = FONT.display,
  fontWeight = 900,
  separator = '   ',
}) => {
  const f = useCurrentFrame();
  const unit = `${text}${separator}`;
  const unitWidth = textWidth(unit, fontSize, {fontFamily, fontWeight});
  const copies = Math.ceil(WIDTH / unitWidth) + 2;
  const shift = (((f * speed + offset) % unitWidth) + unitWidth) % unitWidth;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: y,
        transform: `translateX(${-shift}px)`,
        whiteSpace: 'pre',
        fontFamily,
        fontWeight,
        fontSize,
        lineHeight: 1,
        textTransform: 'uppercase',
        color,
        WebkitTextStroke: stroke ? `${strokeWidth}px ${stroke}` : undefined,
        opacity,
      }}
    >
      {unit.repeat(copies)}
    </div>
  );
};
