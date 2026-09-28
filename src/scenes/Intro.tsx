import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {FPB, bf, splitBeats} from '../lib/beat';
import {inExpo, linear, tween} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize, hasCjk} from '../lib/text';
import {Camera} from '../components/Camera';
import {Glitch} from '../components/Glitch';
import {Hud} from '../components/Hud';
import {Leader} from '../components/Leader';
import {Letters} from '../components/Letters';
import {MotionBlurX} from '../components/MotionBlurX';

/** One greeting word; each index gets a different entrance so consecutive beats feel distinct. */
const GreetingWord: React.FC<{text: string; variant: number; t: number; len: number}> = ({text, variant, t, len}) => {
  const size = fitSize(text, 1500, hasCjk(text) ? 400 : 460);
  const base: React.CSSProperties = {
    ...DISPLAY,
    fontSize: size,
    lineHeight: 1,
    color: COLORS.paper,
    textTransform: 'uppercase',
    whiteSpace: 'pre',
  };
  const drift = 1 + (0.05 * t) / len;
  switch (variant % 4) {
    case 0: {
      // Slam: huge and blurred → sharp.
      const s = tween(t, 0, 9, 1.9, 1) * drift;
      return (
        <div
          style={{
            ...base,
            transform: `scale(${s})`,
            filter: `blur(${tween(t, 0, 8, 22, 0)}px)`,
            opacity: tween(t, 0, 2, 0, 1, linear),
          }}
        >
          {text}
        </div>
      );
    }
    case 1:
      // Rise: letters pop up out of a mask, staggered.
      return (
        <div style={{transform: `scale(${drift})`}}>
          <Letters
            text={text}
            mask
            style={base}
            letter={(i) => ({transform: `translateY(${tween(t, i * 1.4, i * 1.4 + 13, 115, 0)}%)`})}
          />
        </div>
      );
    case 2: {
      // Swipe: whips in from the left with directional blur.
      const x = tween(t, 0, 10, -700, 0);
      return (
        <MotionBlurX amount={tween(t, 0, 10, 70, 0)}>
          <div style={{...base, transform: `translateX(${x}px) skewX(${tween(t, 0, 10, -16, 0)}deg) scale(${drift})`}}>
            {text}
          </div>
        </MotionBlurX>
      );
    }
    default: {
      // Outline first, then the brand color floods in from the left.
      const fill = tween(t, len * 0.35, len * 0.75, 0, 100);
      return (
        <div style={{position: 'relative', transform: `scale(${tween(t, 0, 10, 1.3, 1) * drift})`}}>
          <div style={{...base, color: 'transparent', WebkitTextStroke: `4px ${COLORS.paper}`}}>{text}</div>
          <div
            style={{
              ...base,
              position: 'absolute',
              inset: 0,
              color: COLORS.primary,
              clipPath: `inset(-10% ${100 - fill}% -10% -10%)`,
            }}
          >
            {text}
          </div>
        </div>
      );
    }
  }
};

const COUNT_SCHEMES = [
  {bg: COLORS.primary, fg: COLORS.paper},
  {bg: COLORS.ink, fg: COLORS.primary},
  {bg: COLORS.paper, fg: COLORS.ink},
  {bg: COLORS.accent, fg: COLORS.ink},
];

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@';

/** Channel name that "decodes" letter by letter as `progress` goes 0 → 1. */
const scramble = (text: string, progress: number, f: number) =>
  Array.from(text)
    .map((c, i, all) => {
      if (c === ' ' || progress >= (i + 1) / all.length) return c;
      return GLYPHS[Math.floor(random(`scr-${i}-${Math.floor(f / 3)}`) * GLYPHS.length)];
    })
    .join('');

/** Beats 0–8: greeting words on each beat, then a 4-3-2-1 film-leader countdown into the drop. */
export const IntroScene: React.FC = () => {
  const f = useCurrentFrame();
  const words = CHANNEL.greeting;
  const slots = splitBeats(4, words.length);

  const countStart = bf(4);
  const inCount = f >= countStart;
  const k = Math.max(0, Math.min(3, Math.floor((f - countStart) / FPB)));
  const scheme = inCount ? COUNT_SCHEMES[k] : {bg: COLORS.ink, fg: COLORS.paper};
  const tk = f - bf(4 + k);
  const reveal = tween(f, countStart, countStart + 13, 0, 1150);
  const rush = tween(f, bf(7.5), bf(8), 0, 1, inExpo);
  const progress = tween(f, countStart, bf(7.5), 0, 1, linear);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
      {reveal < 1150 && (
        <Camera punches={slots.map(([s]) => ({at: bf(s), amount: 0.07, tau: 7}))} zoom={1 + (0.015 * f) / FPB}>
          {slots.map(([s, e], i) => {
            const end = bf(e) + (i === slots.length - 1 ? 16 : 0);
            if (f < bf(s) || f >= end) return null;
            return (
              <AbsoluteFill key={i} style={{justifyContent: 'center', alignItems: 'center'}}>
                <GreetingWord text={words[i]} variant={i} t={f - bf(s)} len={bf(e) - bf(s)} />
              </AbsoluteFill>
            );
          })}
        </Camera>
      )}

      {inCount && (
        <AbsoluteFill style={{clipPath: `circle(${reveal}px at 50% 50%)`, backgroundColor: scheme.bg}}>
          <Camera
            punches={[0, 1, 2, 3].map((j) => ({at: bf(4 + j), amount: 0.06, tau: 7}))}
            shakes={[{at: bf(7), amount: 8, tau: 30}]}
            zoom={1 + 1.8 * rush}
            seed="count"
          >
            <AbsoluteFill style={{filter: rush > 0.05 ? `blur(${rush * 14}px)` : undefined}}>
              <Glitch active={rush > 0.15} seed="count" strength={0.6 + rush}>
                <Leader
                  fg={scheme.fg}
                  sweep={tk / FPB}
                  label={String(4 - k)}
                  labelScale={tween(tk, 0, 9, 1.35, 1)}
                />
              </Glitch>
            </AbsoluteFill>
          </Camera>
        </AbsoluteFill>
      )}

      <Hud color={alpha(scheme.fg, 0.85)} />

      {inCount && (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            opacity: tween(f, countStart + 4, countStart + 10, 0, 1, linear),
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: '0.18em',
              color: scheme.fg,
              whiteSpace: 'pre',
            }}
          >
            {scramble((CHANNEL.subtitle || CHANNEL.name).toUpperCase(), progress, f)}
          </div>
          <div style={{width: 420, height: 8, background: alpha(scheme.fg, 0.25)}}>
            <div style={{width: `${progress * 100}%`, height: '100%', background: scheme.fg}} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
