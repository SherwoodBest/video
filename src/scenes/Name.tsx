import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {FPB, HEIGHT, bf} from '../lib/beat';
import {linear, outBack, tween} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize, hasCjk} from '../lib/text';
import {Camera} from '../components/Camera';
import {Glitch} from '../components/Glitch';
import {Letters} from '../components/Letters';
import {Marquee} from '../components/Marquee';

const NAME = CHANNEL.name.toUpperCase();
const SUBTITLE = CHANNEL.subtitle.toUpperCase();

/** Beats 0–4 of the section: the drop. Name slams in character by character, subtitle follows. */
const NameSlam: React.FC = () => {
  const f = useCurrentFrame();
  const size = fitSize(NAME, 1700, hasCjk(NAME) ? 330 : 400);
  const mid = (Array.from(NAME).length - 1) / 2;
  const depth = tween(f, 6, 16, 0, Math.round(size * 0.035));
  const lift = SUBTITLE ? tween(f, bf(2), bf(2) + 16, 0, -size * 0.2) : 0;
  const subSize = fitSize(SUBTITLE || ' ', 1200, 54, {fontFamily: FONT.ui, fontWeight: 800, letterSpacing: '0.14em'});
  const bar = tween(f, bf(2), bf(2) + 10, 0, 1);
  const reveal = tween(f, bf(2) + 3, bf(2) + 16, 0, 100);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.primary}}>
      {[2.4, -3.2, 2.8, -2.2, 3.4].map((speed, r) => (
        <Marquee
          key={r}
          text={SUBTITLE || NAME}
          fontSize={240}
          y={-80 + r * 236}
          speed={speed}
          offset={r * 377}
          stroke={alpha(COLORS.ink, 0.2)}
          strokeWidth={3}
        />
      ))}
      <Camera
        punches={[
          {at: 0, amount: 0.16, tau: 9},
          {at: bf(1), amount: 0.04},
          {at: bf(2), amount: 0.04},
          {at: bf(3), amount: 0.05},
        ]}
        shakes={[
          {at: 0, amount: 28, tau: 12},
          {at: bf(1), amount: 12, tau: 6},
        ]}
        seed="name"
      >
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `translateY(${lift}px)`}}>
            <Glitch active={f >= bf(1) && f < bf(1) + 6} seed="name">
              <Letters
                text={NAME}
                style={{...DISPLAY, fontSize: size, lineHeight: 1.1, color: COLORS.paper}}
                letter={(i) => {
                  const d = Math.abs(i - mid) * 1.6;
                  return {
                    transform: `scale(${tween(f, d, d + 12, 2.6, 1, outBack(1.4))})`,
                    opacity: tween(f, d, d + 2, 0, 1, linear),
                    textShadow: `${depth}px ${depth}px 0 ${COLORS.ink}`,
                  };
                }}
              />
            </Glitch>
          </div>
          {SUBTITLE && (
            <div style={{position: 'absolute', top: HEIGHT / 2 + lift + size * 0.55 + 30}}>
              <div style={{position: 'relative', padding: '14px 34px 14px 40px'}}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: COLORS.accent,
                    transform: `scaleX(${bar})`,
                    transformOrigin: 'left center',
                    boxShadow: `${depth * 0.6}px ${depth * 0.6}px 0 ${COLORS.ink}`,
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    fontFamily: FONT.ui,
                    fontWeight: 800,
                    fontSize: subSize,
                    letterSpacing: '0.14em',
                    color: COLORS.ink,
                    whiteSpace: 'pre',
                    clipPath: `inset(0 ${100 - reveal}% 0 0)`,
                  }}
                >
                  {SUBTITLE}
                </div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
};

const STACK_SCHEMES = [
  {bg: COLORS.ink, fill: COLORS.paper, line: COLORS.primary},
  {bg: COLORS.accent, fill: COLORS.ink, line: COLORS.ink},
  {bg: COLORS.paper, fill: COLORS.primary, line: COLORS.ink},
  {bg: COLORS.primary, fill: COLORS.paper, line: COLORS.ink},
];

/**
 * Beats 4–8: the name (alternating with the subtitle) in a tilted stack that steps one row
 * per beat, recoloring each time.
 */
const NameStack: React.FC<{f: number}> = ({f}) => {
  const k = Math.max(0, Math.min(3, Math.floor(f / FPB)));
  const tk = f - bf(k);
  const s = STACK_SCHEMES[k];
  const size = fitSize(NAME, 1150, 200);
  const rowH = size * 1.02;
  const offset = k + tween(tk, 0, 11, -1, 0);
  const rows = Array.from({length: 13}, (_, i) => i - 6);

  return (
    <AbsoluteFill style={{backgroundColor: s.bg}}>
      <Camera punches={[0, 1, 2, 3].map((j) => ({at: bf(j), amount: 0.05, tau: 7}))} seed="stack">
        <AbsoluteFill style={{transform: 'rotate(-8deg) scale(1.2)'}}>
          {rows.map((r) => {
            const row = r + k;
            const filled = row === k;
            return (
              <Marquee
                key={row}
                text={SUBTITLE && row % 2 !== 0 ? SUBTITLE : NAME}
                fontSize={size}
                y={HEIGHT / 2 - size / 2 + (row - offset) * rowH}
                speed={(row % 2 === 0 ? 1 : -1) * 3}
                offset={row * 211 + 4000}
                color={filled ? s.fill : 'transparent'}
                stroke={filled ? undefined : alpha(s.line, 0.55)}
                strokeWidth={2.5}
                separator={'  '}
              />
            );
          })}
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
};

/** Beats 8–16 overall. */
export const NameScene: React.FC = () => {
  const f = useCurrentFrame();
  return f < bf(4) ? <NameSlam /> : <NameStack f={f - bf(4)} />;
};
