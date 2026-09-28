import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from '../config';
import {FONT} from '../theme';
import {FPB, FPS} from '../lib/beat';
import {alpha} from '../lib/color';

const pad = (n: number) => String(n).padStart(2, '0');

/** Camera-viewfinder overlay: corner brackets, blinking REC, running timecode. */
export const Hud: React.FC<{color: string}> = ({color}) => {
  const f = useCurrentFrame();
  const inset = 64;
  const arm = 70;
  const thick = 5;
  const corner = (key: string, pos: React.CSSProperties, h: 'left' | 'right', v: 'top' | 'bottom') => (
    <div key={key} style={{position: 'absolute', width: arm, height: arm, ...pos}}>
      <div style={{position: 'absolute', [v]: 0, [h]: 0, width: arm, height: thick, background: color}} />
      <div style={{position: 'absolute', [v]: 0, [h]: 0, width: thick, height: arm, background: color}} />
    </div>
  );
  const secs = Math.floor(f / FPS);
  const timecode = `00:${pad(Math.floor(secs / 60))}:${pad(secs % 60)}:${pad(f % FPS)}`;
  const recOn = f % FPB < FPB * 0.6;
  const label: React.CSSProperties = {
    position: 'absolute',
    fontFamily: FONT.mono,
    fontWeight: 700,
    fontSize: 30,
    letterSpacing: '0.12em',
    color,
  };
  return (
    <AbsoluteFill>
      {corner('tl', {left: inset, top: inset}, 'left', 'top')}
      {corner('tr', {right: inset, top: inset}, 'right', 'top')}
      {corner('bl', {left: inset, bottom: inset}, 'left', 'bottom')}
      {corner('br', {right: inset, bottom: inset}, 'right', 'bottom')}
      <div style={{...label, left: 110, top: 96, display: 'flex', alignItems: 'center', gap: 16}}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            background: COLORS.primary,
            opacity: recOn ? 1 : 0.15,
            boxShadow: `0 0 0 3px ${alpha(COLORS.paper, 0.15)}`,
          }}
        />
        REC
      </div>
      <div style={{...label, right: 110, top: 96}}>{timecode}</div>
      <div style={{...label, left: 110, bottom: 96, fontSize: 24, fontWeight: 500, opacity: 0.75}}>
        ISO 800 &nbsp; 1/120 &nbsp; F2.8 &nbsp; 4K
      </div>
      <div style={{position: 'absolute', right: 110, bottom: 98, display: 'flex', alignItems: 'center', gap: 4}}>
        <div style={{width: 58, height: 28, border: `3px solid ${color}`, borderRadius: 5, padding: 3, display: 'flex', gap: 3}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{flex: 1, background: color}} />
          ))}
        </div>
        <div style={{width: 5, height: 12, background: color, borderRadius: 2}} />
      </div>
    </AbsoluteFill>
  );
};
