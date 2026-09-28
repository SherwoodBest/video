import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha} from '../lib/color';
import {MINIMAL} from './config';

const C = MINIMAL.colors;

/** Warm paper with two soft tints drifting slowly across it. */
export const Backdrop: React.FC = () => {
  const s = useCurrentFrame() / useVideoConfig().fps;
  const a = {x: 28 + 7 * Math.sin(s * 0.31), y: 36 + 6 * Math.cos(s * 0.23)};
  const b = {x: 74 + 6 * Math.cos(s * 0.19), y: 68 + 7 * Math.sin(s * 0.27)};
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <AbsoluteFill
        style={{background: `radial-gradient(circle at ${a.x}% ${a.y}%, ${alpha(C.glowA, 0.34)}, ${alpha(C.glowA, 0)} 52%)`}}
      />
      <AbsoluteFill
        style={{background: `radial-gradient(circle at ${b.x}% ${b.y}%, ${alpha(C.glowB, 0.3)}, ${alpha(C.glowB, 0)} 48%)`}}
      />
    </AbsoluteFill>
  );
};
