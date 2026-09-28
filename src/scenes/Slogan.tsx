import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {FPB, HEIGHT, bf, splitBeats} from '../lib/beat';
import {outBack, tween} from '../lib/anim';
import {fitSize} from '../lib/text';
import {Camera} from '../components/Camera';
import {MotionBlurX} from '../components/MotionBlurX';

const LEFT = 140;

/** Vertical line of text typed one character per 16th note, starting on the second beat. */
const VerticalNote: React.FC<{f: number; text: string}> = ({f, text}) => {
  const chars = Array.from(text);
  const size = Math.min(100, 820 / chars.length);
  const step = FPB / 4;
  const start = bf(1);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1560,
        top: HEIGHT / 2 - (chars.length * size) / 2,
        display: 'flex',
        gap: 26,
      }}
    >
      <div
        style={{
          width: 8,
          height: tween(f, start - 4, start + chars.length * step, 0, chars.length * size),
          background: COLORS.primary,
        }}
      />
      <div style={{writingMode: 'vertical-rl', fontFamily: FONT.ui, fontWeight: 900, fontSize: size, lineHeight: 1}}>
        {chars.map((c, i) => {
          const t = f - start - i * step;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: COLORS.paper,
                opacity: t >= 0 ? 1 : 0,
                transform: `scale(${tween(t, 0, 7, 1.6, 1, outBack(2))})`,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Beats 32–36: the slogan stacks up line by line while its translation types out vertically. */
export const SloganScene: React.FC = () => {
  const f = useCurrentFrame();
  const lines = CHANNEL.slogan;
  const slots = splitBeats(3, lines.length);
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '');
  const size = fitSize(longest, 1150, 250);
  const lineH = size * 1.02;
  const top = HEIGHT / 2 - (lineH * lines.length) / 2;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      <Camera
        punches={[0, 1, 2, 3].map((j) => ({at: bf(j), amount: j === 0 ? 0.06 : 0.035, tau: 7}))}
        seed="slogan"
      >
        {lines.map((line, i) => {
          const at = bf(slots[i][0]);
          if (f < at) return null;
          const t = f - at;
          const last = i === lines.length - 1;
          const outlined = !last && i % 2 === 1;
          return (
            <div key={i} style={{position: 'absolute', left: LEFT, top: top + i * lineH}}>
              <MotionBlurX amount={tween(t, 0, 11, 70, 0)}>
                <div
                  style={{
                    ...DISPLAY,
                    fontSize: size,
                    lineHeight: 1,
                    whiteSpace: 'pre',
                    color: outlined ? 'transparent' : last ? COLORS.accent : COLORS.paper,
                    WebkitTextStroke: outlined ? `4px ${COLORS.paper}` : undefined,
                    transform: `translateX(${tween(t, 0, 11, -1100, 0)}px) skewX(${tween(t, 0, 11, -14, 0)}deg)`,
                  }}
                >
                  {line}
                </div>
              </MotionBlurX>
            </div>
          );
        })}
        {CHANNEL.sloganNote && <VerticalNote f={f} text={CHANNEL.sloganNote} />}
      </Camera>
    </AbsoluteFill>
  );
};
