import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {FPB, FPS, WIDTH, bf} from '../lib/beat';
import {inOutCubic, linear, tween, wobble} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize, textWidth} from '../lib/text';
import {Camera} from '../components/Camera';
import {
  BELL_SIZE,
  BUTTON_HEIGHT,
  BellButton,
  Confetti,
  Cursor,
  LogoBadge,
  Ring,
  SubscribeButton,
  subscribeWidth,
} from '../components/Cta';
import {Letters} from '../components/Letters';
import {Marquee} from '../components/Marquee';

const BADGE = 300;
const GAP = 56;
const LOCKUP_Y = 400;
const BUTTON_Y = 700;

const pop = (t: number) => spring({frame: t, fps: FPS, config: {damping: 10, stiffness: 170, mass: 0.8}});

/** Press envelope for a click at frame `at`: quick down, slower release. */
const press = (t: number, at: number) => (t < at + 3 ? tween(t, at, at + 3, 0, 1, linear) : tween(t, at + 3, at + 9, 1, 0));

/** Beats 40–52: logo lockup, subscribe click, bell ring, sign-off, fade out. */
export const OutroScene: React.FC = () => {
  const t = useCurrentFrame();
  const b = t / FPB;
  const name = CHANNEL.name.toUpperCase();
  const nameSize = fitSize(name, 900, 170);
  const handle = CHANNEL.handle || CHANNEL.subtitle;
  const handleSize = 44;
  const nameW = textWidth(name, nameSize);
  const handleW = textWidth(handle, handleSize, {fontFamily: FONT.mono, fontWeight: 700, upper: false});
  const lockupW = BADGE + GAP + Math.max(nameW, handleW);
  const lockupX = (WIDTH - lockupW) / 2;

  const buttonW = subscribeWidth();
  const rowW = buttonW + 28 + BELL_SIZE;
  const rowX = (WIDTH - rowW) / 2;
  const button = {x: rowX + buttonW / 2, y: BUTTON_Y + BUTTON_HEIGHT / 2};
  const bell = {x: rowX + buttonW + 28 + BELL_SIZE / 2, y: BUTTON_Y + BELL_SIZE / 2};

  const clickSub = bf(3);
  const clickBell = bf(5);
  const off = {x: WIDTH + 140, y: 1260};
  const onButton = {x: button.x + 26, y: button.y + 18};
  const onBell = {x: bell.x + 8, y: bell.y + 14};
  const leg = (from: typeof off, to: typeof off, t0: number, t1: number) => ({
    x: tween(t, t0, t1, from.x, to.x, inOutCubic),
    y: tween(t, t0, t1, from.y, to.y, inOutCubic),
  });
  const cursor =
    t < bf(3.6) ? leg(off, onButton, bf(1.8), bf(2.8)) : t < bf(5.7) ? leg(onButton, onBell, bf(3.6), bf(4.6)) : leg(onBell, off, bf(5.7), bf(6.7));

  const typedHandle = Math.floor(tween(t, bf(0.75), bf(1.4), 0, Array.from(handle).length, linear));
  const signoff = Array.from(CHANNEL.signoff);
  const typedSignoff = Math.floor(tween(t, bf(8), bf(8.9), 0, signoff.length, linear));
  const glow = 0.75 + 0.25 * Math.exp(-(t % FPB) / 8);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.ink, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, ${alpha(COLORS.primary, 0.32 * glow)} 0%, ${alpha(COLORS.primary, 0)} 58%)`,
        }}
      />
      {[1.4, -1.1, 1.2].map((speed, r) => (
        <Marquee
          key={r}
          text={name}
          fontSize={230}
          y={-40 + r * 390}
          speed={speed}
          offset={r * 500}
          stroke={alpha(COLORS.paper, 0.06)}
          strokeWidth={3}
        />
      ))}

      <Camera
        punches={[
          {at: 0, amount: 0.12, tau: 10},
          {at: clickSub, amount: 0.02},
          {at: clickBell, amount: 0.015},
          {at: bf(8), amount: 0.04},
        ]}
        shakes={[{at: 0, amount: 24, tau: 12}]}
        zoom={1 + 0.005 * b}
        seed="outro"
      >
        <div
          style={{
            position: 'absolute',
            left: lockupX,
            top: LOCKUP_Y - BADGE / 2,
            display: 'flex',
            alignItems: 'center',
            gap: GAP,
          }}
        >
          <div style={{transform: `scale(${pop(t)}) rotate(${(1 - pop(t)) * -90}deg)`}}>
            <LogoBadge size={BADGE} spin={t * 0.9} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <Letters
              text={name}
              mask
              style={{...DISPLAY, fontSize: nameSize, lineHeight: 1.1, color: COLORS.paper}}
              letter={(i) => ({transform: `translateY(${tween(t, bf(0.25) + i * 1.3, bf(0.25) + i * 1.3 + 13, 110, 0)}%)`})}
            />
            <div
              style={{
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: handleSize,
                color: COLORS.accent,
                whiteSpace: 'pre',
                minHeight: handleSize * 1.3,
              }}
            >
              {Array.from(handle).slice(0, typedHandle).join('')}
            </div>
          </div>
        </div>

        <div style={{position: 'absolute', left: rowX, top: BUTTON_Y, display: 'flex', alignItems: 'center', gap: 28}}>
          <div style={{transform: `scale(${pop(t - bf(1))})`}}>
            <SubscribeButton done={t >= clickSub + 3} press={press(t, clickSub)} />
          </div>
          <div style={{transform: `scale(${pop(t - bf(1.25)) * (1 - 0.1 * press(t, clickBell))})`}}>
            <BellButton swing={wobble(t, clickBell, 0.42, 16) * 26} badge={pop(t - clickBell - 4)} />
          </div>
        </div>

        <Ring x={button.x} y={button.y} t={t - clickSub} radius={330} color={alpha(COLORS.paper, 0.8)} life={26} />
        <Ring x={bell.x} y={bell.y} t={t - clickBell} radius={150} color={COLORS.accent} />
        <Ring x={bell.x} y={bell.y} t={t - clickBell - 7} radius={190} color={COLORS.accent} />
        <Confetti x={button.x} y={button.y} t={t - clickSub} />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 915,
            textAlign: 'center',
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.32em',
            color: alpha(COLORS.paper, 0.7),
            whiteSpace: 'pre',
          }}
        >
          {signoff.slice(0, typedSignoff).join('')}
        </div>

        {t >= bf(1.8) && t < bf(6.7) && <Cursor x={cursor.x} y={cursor.y} press={Math.max(press(t, clickSub), press(t, clickBell))} />}
      </Camera>

      <AbsoluteFill style={{backgroundColor: '#000', opacity: tween(t, bf(10.5), bf(12), 0, 1, linear)}} />
    </AbsoluteFill>
  );
};
