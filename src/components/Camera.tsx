import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {pulse} from '../lib/anim';

/** A hit at local frame `at` with strength `amount` that decays with time constant `tau` (frames). */
export type Hit = {at: number; amount: number; tau?: number};

/**
 * Virtual camera for a scene: zoom punches (relative scale) and positional shake (px),
 * both decaying after each hit. Keep backgrounds outside the camera so shake never
 * reveals an edge.
 */
export const Camera: React.FC<{
  children: React.ReactNode;
  punches?: Hit[];
  shakes?: Hit[];
  zoom?: number;
  rotate?: number;
  seed?: string;
}> = ({children, punches = [], shakes = [], zoom = 1, rotate = 0, seed = 'camera'}) => {
  const f = useCurrentFrame();
  const punch = punches.reduce((sum, p) => sum + p.amount * pulse(f, p.at, p.tau ?? 8), 0);
  const shake = shakes.reduce((sum, s) => sum + s.amount * pulse(f, s.at, s.tau ?? 10), 0);
  const x = shake * noise2D(`${seed}x`, f * 0.45, 0);
  const y = shake * noise2D(`${seed}y`, f * 0.45, 0);
  const r = shake * 0.05 * noise2D(`${seed}r`, f * 0.3, 0);
  return (
    <AbsoluteFill
      style={{transform: `translate(${x}px, ${y}px) scale(${zoom * (1 + punch)}) rotate(${rotate + r}deg)`}}
    >
      {children}
    </AbsoluteFill>
  );
};
