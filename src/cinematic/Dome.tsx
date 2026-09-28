import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import type {Shot} from './config';
import {FPS} from './timing';

/** Every montage shot shares this circle, so consecutive shots match-cut on the same horizon. Apex at y = 520. */
export const DOME = {cx: 960, cy: 2020, r: 1500};

/** Perceived brightness check used to pick text and rim colors. */
export const isDark = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 140;
};

/** Footage masked into the dome over a flat backdrop, drifting slowly as if the sphere turns. */
export const DomeShot: React.FC<{shot: Shot; len: number}> = ({shot, len}) => {
  const t = useCurrentFrame();
  const p = t / Math.max(1, len);
  const {cx, cy, r} = DOME;
  const dark = isDark(shot.bg);
  const earth = shot.clip.startsWith('earth');
  return (
    <AbsoluteFill style={{backgroundColor: shot.bg}}>
      <AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>
        <AbsoluteFill style={{transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${1.2 * p - 0.6}deg)`}}>
          <AbsoluteFill
            style={{
              transform: `translate(${shot.x ?? 0}px, ${255 + (shot.y ?? 0)}px) scale(${(shot.zoom ?? 1.15) * (1 + 0.04 * p)})`,
            }}
          >
            <OffthreadVideo
              src={staticFile(`footage/${shot.clip}.mp4`)}
              trimBefore={Math.round(shot.from * FPS)}
              muted
              style={{width: '100%', height: '100%', objectFit: 'cover', filter: shot.look}}
            />
          </AbsoluteFill>
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${r - 320}px, rgba(0,0,0,${dark ? 0.45 : 0.22}) ${r}px)`,
          }}
        />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {earth && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(120,170,255,0.55)" strokeWidth={14} style={{filter: 'blur(10px)'}} />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.14)'}
          strokeWidth={1.5}
        />
      </svg>
    </AbsoluteFill>
  );
};
