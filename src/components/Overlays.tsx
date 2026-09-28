import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>`;
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`;

/** Subtle film grain that re-rolls every few frames. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const step = Math.floor(useCurrentFrame() / 3);
  const x = Math.floor(random(`grain-x-${step}`) * 240);
  const y = Math.floor(random(`grain-y-${step}`) * 240);
  return (
    <AbsoluteFill
      style={{backgroundImage: GRAIN, backgroundPosition: `${x}px ${y}px`, opacity, mixBlendMode: 'overlay'}}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.22}) => (
  <AbsoluteFill
    style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,${strength}) 100%)`}}
  />
);

/** Full-frame flash at frame `at`: holds `hold` frames at `peak`, then decays. */
export const Flash: React.FC<{at: number; color?: string; peak?: number; hold?: number; tau?: number}> = ({
  at,
  color = '#FFFFFF',
  peak = 1,
  hold = 2,
  tau = 5,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const o = f < at + hold ? peak : peak * Math.exp(-(f - at - hold) / tau);
  if (o < 0.01) return null;
  return <AbsoluteFill style={{backgroundColor: color, opacity: o}} />;
};
