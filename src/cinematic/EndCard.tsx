import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {CHANNEL} from '../config';
import {FONT} from '../theme';
import {inOutCubic, linear, outCubic, tween} from '../lib/anim';
import {Vignette} from '../components/Overlays';
import {CINEMATIC} from './config';
import {FPS, TL, f} from './timing';

/** Where the Earth footage's horizon sits: this footage point is rotated level and moved to (960, y). */
const EARTH = {pivotX: 960, pivotY: 108, rotate: 11, scale: 1.3, y: 842, rise: 260};

/** Dark space over Earth's limb: English title, then the channel name, then a tilt down into the planet. */
export const EndCard: React.FC = () => {
  const t = useCurrentFrame();
  const s = t / FPS + TL.end.cut;
  const tilt = tween(s, TL.end.tilt, TL.duration, 0, 1, inOutCubic);
  const y = EARTH.y - EARTH.rise * tilt;
  const titleOn = CINEMATIC.title ? tween(s, TL.end.title, TL.end.title + 0.4, 0, 1, linear) : 0;
  const titleOff = tween(s, TL.end.name - 0.35, TL.end.name - 0.05, 0, 1, linear);
  const nameIn = tween(s, TL.end.name, TL.end.name + 0.7, 0, 1, outCubic);
  const nameOut = tween(s, TL.end.tilt + 0.3, TL.duration - 0.1, 0, 1, inOutCubic);
  const text: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 470,
    textAlign: 'center',
    fontFamily: FONT.serif,
    color: '#F4F2EE',
    lineHeight: 1.2,
    whiteSpace: 'pre',
  };
  return (
    <AbsoluteFill style={{backgroundColor: '#03050A'}}>
      <AbsoluteFill
        style={{
          transformOrigin: `${EARTH.pivotX}px ${EARTH.pivotY}px`,
          transform: `translate(0px, ${y - EARTH.pivotY}px) rotate(${EARTH.rotate}deg) scale(${EARTH.scale})`,
          // Feather the footage's own sky into the backdrop so its edge never shows.
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 16%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 16%)',
        }}
      >
        <OffthreadVideo
          src={staticFile('footage/earth-limb.mp4')}
          trimBefore={f(1)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 30% at 50% ${(y / 1080) * 100}%, rgba(90,150,255,${0.22 + 0.18 * tilt}), rgba(90,150,255,0) 70%)`,
        }}
      />
      <Vignette strength={0.35} />
      <div style={{...text, fontWeight: 500, fontSize: 64, opacity: titleOn * (1 - titleOff)}}>{CINEMATIC.title}</div>
      <div
        style={{
          ...text,
          top: 458 - 150 * nameOut,
          fontWeight: 600,
          fontSize: 92,
          letterSpacing: '0.12em',
          marginRight: '-0.12em',
          opacity: nameIn * (1 - nameOut),
          filter: nameIn < 0.99 ? `blur(${(1 - nameIn) * 10}px)` : undefined,
        }}
      >
        {CHANNEL.name}
      </div>
      <AbsoluteFill style={{backgroundColor: '#000', opacity: tween(s, TL.end.fade, TL.duration, 0, 1, linear)}} />
    </AbsoluteFill>
  );
};
