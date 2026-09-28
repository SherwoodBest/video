import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DISPLAY} from '../theme';
import {HEIGHT, WIDTH} from '../lib/beat';
import {alpha} from '../lib/color';

/** Film-leader countdown: crosshair, rings, a sweeping wedge and a big number. */
export const Leader: React.FC<{fg: string; sweep: number; label: string; labelScale: number}> = ({
  fg,
  sweep,
  label,
  labelScale,
}) => {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const R = 300;
  const deg = Math.max(0, Math.min(1, sweep)) * 360;
  const ring = (r: number, width: number, color: string): React.CSSProperties => ({
    position: 'absolute',
    left: cx - r,
    top: cy - r,
    width: 2 * r,
    height: 2 * r,
    borderRadius: '50%',
    border: `${width}px solid ${color}`,
    boxSizing: 'border-box',
  });
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: WIDTH, top: cy - 2, height: 4, background: alpha(fg, 0.3)}} />
      <div style={{position: 'absolute', top: 0, height: HEIGHT, left: cx - 2, width: 4, background: alpha(fg, 0.3)}} />
      <div
        style={{
          ...ring(R, 0, 'transparent'),
          background: `conic-gradient(${alpha(fg, 0.24)} ${deg}deg, transparent ${deg}deg)`,
        }}
      />
      <div style={ring(R, 8, fg)} />
      <div style={ring(R + 42, 3, alpha(fg, 0.55))} />
      {Array.from({length: 24}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - 2,
            top: cy - R - 78,
            width: 4,
            height: i % 6 === 0 ? 26 : 14,
            background: alpha(fg, i % 6 === 0 ? 0.9 : 0.5),
            transformOrigin: `2px ${R + 78}px`,
            transform: `rotate(${i * 15}deg)`,
          }}
        />
      ))}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{...DISPLAY, fontSize: 420, lineHeight: 1, color: fg, transform: `scale(${labelScale})`}}>
          {label}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
