import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {CHANNEL} from '../config';
import {FONT} from '../theme';
import {inOutCubic, linear, outCubic, tween} from '../lib/anim';
import {fitSize, textWidth} from '../lib/text';
import {MINIMAL} from './config';
import {bf} from './timing';

const C = MINIMAL.colors;
const TRACKING = 0.14;

/** Fountain-pen nib, tip at (0, 0), tilted like a pen held for writing. */
const Nib: React.FC<{x: number; y: number; opacity: number; lift: number}> = ({x, y, opacity, lift}) => (
  <svg
    width={60}
    height={80}
    viewBox="-30 -74 60 80"
    style={{
      position: 'absolute',
      left: x - 30,
      top: y - 74,
      overflow: 'visible',
      opacity,
      transformOrigin: '30px 74px',
      transform: `translate(${lift * 24}px, ${-lift * 36}px) rotate(32deg)`,
    }}
  >
    <path d="M0 0 L-13 -30 Q-15 -40 -8 -46 L0 -58 L8 -46 Q15 -40 13 -30 Z" fill={C.ink} />
    <path d="M0 -2 L0 -34" stroke={C.paper} strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={0} cy={-37} r={3.4} fill={C.paper} />
    <rect x={-11} y={-72} width={22} height={16} rx={3} fill={C.accent} />
  </svg>
);

/** The channel name, character by character, then a pen draws an underline beneath it. */
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const name = CHANNEL.name;
  const chars = Array.from(name);
  const opts = {fontFamily: FONT.serif, fontWeight: 600, letterSpacing: `${TRACKING}em`, upper: false};
  const size = fitSize(name, 1150, 150, opts);
  const nameW = textWidth(name, size, opts) - size * TRACKING;

  const W = nameW * 0.96;
  const H = 34;
  const d = `M 0 ${H * 0.62} C ${W * 0.18} ${H * 0.28}, ${W * 0.34} ${H * 0.9}, ${W * 0.52} ${H * 0.56} S ${W * 0.84} ${H * 0.2}, ${W} ${H * 0.5}`;
  const drawStart = bf(1.5);
  const drawEnd = bf(2.75);
  const progress = tween(f, drawStart, drawEnd, 0, 1, inOutCubic);
  const stroke = evolvePath(progress, d);
  const tip = getPointAtLength(d, getLength(d) * progress) ?? {x: 0, y: 0};
  const lift = tween(f, drawEnd, drawEnd + 16, 0, 1, outCubic);
  const nibOpacity = tween(f, drawStart - 6, drawStart, 0, 1, linear) * (1 - lift);
  const fadeOut = tween(f, bf(7), bf(8), 0, 1, linear);

  const underlineTop = size * 0.66;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - fadeOut}}>
      <div style={{position: 'relative', transform: `translateY(${-size * 0.12}px)`}}>
        <div
          style={{
            display: 'flex',
            fontFamily: FONT.serif,
            fontWeight: 600,
            fontSize: size,
            lineHeight: 1.2,
            letterSpacing: `${TRACKING}em`,
            marginRight: `${-TRACKING}em`,
            color: C.ink,
          }}
        >
          {chars.map((c, i) => {
            const t = f - 8 - i * 6;
            const blur = tween(t, 0, 28, 14, 0, outCubic);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: tween(t, 0, 20, 0, 1, linear),
                  transform: `translateY(${tween(t, 0, 28, 0.12, 0, outCubic)}em)`,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
        <svg
          width={W}
          height={H}
          style={{position: 'absolute', left: (nameW - W) / 2, top: `calc(50% + ${underlineTop}px)`, overflow: 'visible'}}
        >
          <path
            d={d}
            fill="none"
            stroke={C.accent}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={stroke.strokeDasharray}
            strokeDashoffset={stroke.strokeDashoffset}
            opacity={progress > 0 ? 1 : 0}
          />
        </svg>
        {nibOpacity > 0 && (
          <div style={{position: 'absolute', left: (nameW - W) / 2, top: `calc(50% + ${underlineTop}px)`}}>
            <Nib x={tip.x} y={tip.y} opacity={nibOpacity} lift={lift} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
