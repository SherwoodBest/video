import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY} from '../theme';
import {FPB, bf, splitBeats} from '../lib/beat';
import {inExpo, linear, tween} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize, hasCjk} from '../lib/text';
import {Camera} from '../components/Camera';

/** Beats 36–40: the breakdown. One word per beat over spinning speed lines, then a rush into the final drop. */
export const HypeScene: React.FC = () => {
  const f = useCurrentFrame();
  const b = f / FPB;
  const words = CHANNEL.hype;
  const slots = splitBeats(4, words.length);
  const rush = tween(f, bf(3.5), bf(4), 0, 1, inExpo);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.primary, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${b * 14}deg at 50% 50%, ${alpha(COLORS.ink, 0.13)} 0deg 5deg, transparent 5deg 15deg)`,
          transform: `scale(${1.3 + 0.08 * b})`,
        }}
      />
      <Camera
        punches={slots.map(([s]) => ({at: bf(s), amount: 0.08, tau: 7}))}
        shakes={[
          {at: bf(2), amount: 6, tau: 60},
          {at: bf(3), amount: 12, tau: 60},
        ]}
        zoom={1 + 0.03 * b + 2.4 * rush}
        seed="hype"
      >
        <AbsoluteFill style={{filter: rush > 0.05 ? `blur(${rush * 18}px)` : undefined}}>
          {slots.map(([s, e], i) => {
            const last = i === slots.length - 1;
            if (f < bf(s) || (f >= bf(e) && !last)) return null;
            const t = f - bf(s);
            const size = fitSize(words[i], 1500, hasCjk(words[i]) ? 330 : 400);
            return (
              <AbsoluteFill key={i} style={{justifyContent: 'center', alignItems: 'center'}}>
                <div
                  style={{
                    ...DISPLAY,
                    fontSize: size,
                    lineHeight: 1,
                    whiteSpace: 'pre',
                    color: last ? COLORS.accent : COLORS.paper,
                    textShadow: `${size * 0.035}px ${size * 0.035}px 0 ${COLORS.ink}`,
                    transform: `scale(${tween(t, 0, 8, 1.6, 1)})`,
                    opacity: tween(t, 0, 2, 0, 1, linear),
                  }}
                >
                  {words[i]}
                </div>
              </AbsoluteFill>
            );
          })}
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
};
