import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {linear, tween} from '../lib/anim';
import {Vignette} from '../components/Overlays';
import {f} from './timing';

/** Cold open: Earth's night side with the glowing airglow limb, fading up from black. */
export const Opening: React.FC<{len: number}> = ({len}) => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${1.08 + (0.05 * t) / len})`}}>
        <OffthreadVideo
          src={staticFile('footage/airglow.mp4')}
          trimBefore={f(5.5)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      <Vignette strength={0.35} />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: tween(t, 0, 14, 1, 0, linear)}} />
    </AbsoluteFill>
  );
};
