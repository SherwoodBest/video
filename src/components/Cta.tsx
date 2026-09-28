import React from 'react';
import {random} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {linear, tween} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize, hasCjk, textWidth} from '../lib/text';

export const LogoBadge: React.FC<{size: number; spin: number}> = ({size, spin}) => (
  <div style={{position: 'relative', width: size, height: size}}>
    <svg
      width={size}
      height={size}
      style={{position: 'absolute', inset: 0, overflow: 'visible', transform: `rotate(${spin}deg)`}}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={6}
        strokeDasharray="22 16"
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: size * 0.09,
        borderRadius: '50%',
        background: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 24px 70px ${alpha(COLORS.primary, 0.45)}, inset 0 -10px 0 ${alpha(COLORS.ink, 0.18)}`,
      }}
    >
      <div
        style={{
          ...DISPLAY,
          fontSize: fitSize(CHANNEL.badge, size * 0.6, size * (hasCjk(CHANNEL.badge) ? 0.46 : 0.38)),
          lineHeight: 1,
          color: COLORS.paper,
        }}
      >
        {CHANNEL.badge}
      </div>
    </div>
  </div>
);

export const BUTTON_HEIGHT = 108;
const LABEL = {fontFamily: FONT.ui, fontWeight: 800, letterSpacing: '0.06em', upper: false};
const CHECK = 46;

/** Button width that fits both labels, so it doesn't jump when it flips to "subscribed". */
export const subscribeWidth = () =>
  Math.ceil(Math.max(textWidth(CHANNEL.subscribe, 44, LABEL), textWidth(CHANNEL.subscribed, 44, LABEL) + CHECK + 16)) +
  2 * 56;

export const SubscribeButton: React.FC<{done: boolean; press: number}> = ({done, press}) => (
  <div
    style={{
      width: subscribeWidth(),
      height: BUTTON_HEIGHT,
      borderRadius: BUTTON_HEIGHT / 2,
      background: done ? '#2B2B33' : COLORS.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      transform: `scale(${1 - 0.08 * press})`,
      boxShadow: done ? 'none' : `0 16px 50px ${alpha(COLORS.primary, 0.45)}`,
    }}
  >
    {done && (
      <svg width={CHECK} height={CHECK} viewBox="0 0 24 24">
        <path
          d="M4.5 12.5l4.8 4.8L19.5 7"
          fill="none"
          stroke={COLORS.paper}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
    <div
      style={{
        fontFamily: FONT.ui,
        fontWeight: 800,
        fontSize: 44,
        letterSpacing: LABEL.letterSpacing,
        whiteSpace: 'pre',
        color: done ? alpha(COLORS.paper, 0.85) : '#FFFFFF',
      }}
    >
      {done ? CHANNEL.subscribed : CHANNEL.subscribe}
    </div>
  </div>
);

export const BELL_SIZE = 108;

export const BellButton: React.FC<{swing: number; badge: number}> = ({swing, badge}) => (
  <div
    style={{
      position: 'relative',
      width: BELL_SIZE,
      height: BELL_SIZE,
      borderRadius: BELL_SIZE / 2,
      background: alpha(COLORS.paper, 0.1),
      border: `3px solid ${alpha(COLORS.paper, 0.28)}`,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={56} height={56} viewBox="0 0 24 24" style={{transform: `rotate(${swing}deg)`, transformOrigin: '50% 12%'}}>
      <path
        d="M12 2.5c-.83 0-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v4.5l-2 2V19h16v-1.5l-2-2V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5zM10 20a2 2 0 0 0 4 0h-4z"
        fill={COLORS.paper}
      />
    </svg>
    {badge > 0 && (
      <div
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: COLORS.primary,
          border: `4px solid ${COLORS.ink}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.ui,
          fontWeight: 800,
          fontSize: 22,
          color: '#FFFFFF',
          transform: `scale(${badge})`,
        }}
      >
        1
      </div>
    )}
  </div>
);

/** Arrow pointer whose tip sits exactly at (x, y). */
export const Cursor: React.FC<{x: number; y: number; press: number}> = ({x, y, press}) => {
  const size = 66;
  const tipX = (4 / 24) * size;
  const tipY = (2.5 / 24) * size;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - tipX,
        top: y - tipY,
        transform: `scale(${1 - 0.16 * press})`,
        transformOrigin: `${tipX}px ${tipY}px`,
        filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.45))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" style={{overflow: 'visible'}}>
        <path
          d="M4 2.5 L4 19.6 L8.7 15.4 L11.7 22.2 L14.8 20.8 L11.8 14.2 L18 14.2 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/** Expanding ring, e.g. for a click or a bell ring. `t` = frames since it started. */
export const Ring: React.FC<{x: number; y: number; t: number; radius?: number; color?: string; life?: number}> = ({
  x,
  y,
  t,
  radius = 150,
  color = COLORS.paper,
  life = 22,
}) => {
  if (t < 0 || t > life) return null;
  const r = tween(t, 0, life, 20, radius);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `${tween(t, 0, life, 8, 1, linear)}px solid ${color}`,
        opacity: tween(t, 0, life, 0.9, 0, linear),
        boxSizing: 'border-box',
      }}
    />
  );
};

/** Burst of confetti from (x, y); `t` = frames since the burst. */
export const Confetti: React.FC<{x: number; y: number; t: number; count?: number; seed?: string}> = ({
  x,
  y,
  t,
  count = 70,
  seed = 'confetti',
}) => {
  if (t < 0) return null;
  const colors = [COLORS.primary, COLORS.accent, COLORS.paper, '#4DD8FF', '#7CF29A'];
  const drag = 0.055;
  const gravity = 0.55;
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const rnd = (k: string) => random(`${seed}-${k}-${i}`);
        const angle = ((-90 + (rnd('a') - 0.5) * 160) * Math.PI) / 180;
        const speed = 16 + rnd('v') * 26;
        const travel = (1 - Math.exp(-drag * t)) / drag;
        const px = x + Math.cos(angle) * speed * travel;
        const py = y + Math.sin(angle) * speed * travel + 0.5 * gravity * t * t * 0.35;
        const w = 10 + rnd('w') * 12;
        const round = rnd('s') < 0.3;
        const life = 60 + rnd('l') * 30;
        const o = tween(t, life - 20, life, 1, 0, linear);
        if (o <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: px - w / 2,
              top: py - w / 2,
              width: w,
              height: round ? w : w * 1.7,
              borderRadius: round ? '50%' : 2,
              background: colors[i % colors.length],
              opacity: o,
              transform: `rotate(${rnd('r') * 360 + t * (rnd('spin') - 0.5) * 30}deg) scaleX(${Math.cos(t * 0.25 + i)})`,
            }}
          />
        );
      })}
    </>
  );
};
