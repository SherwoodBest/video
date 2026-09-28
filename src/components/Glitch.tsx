import React from 'react';
import {random, useCurrentFrame} from 'remotion';

/**
 * While `active`, slices the children into horizontal bands with random offsets and
 * adds a chromatic split. Renders children untouched otherwise.
 */
export const Glitch: React.FC<{children: React.ReactNode; active: boolean; seed: string; strength?: number}> = ({
  children,
  active,
  seed,
  strength = 1,
}) => {
  const f = useCurrentFrame();
  if (!active) return <>{children}</>;
  const bands = 8;
  const split = 10 * strength;
  return (
    <div
      style={{
        position: 'relative',
        filter: `drop-shadow(${-split}px 0 0 rgba(0, 229, 255, 0.85)) drop-shadow(${split}px 0 0 rgba(255, 210, 63, 0.85))`,
      }}
    >
      <div style={{visibility: 'hidden'}}>{children}</div>
      {Array.from({length: bands}, (_, i) => {
        const r = random(`${seed}-${f}-${i}`);
        const dx = r < 0.45 ? 0 : (random(`${seed}-dx-${f}-${i}`) - 0.5) * 120 * strength;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: `inset(${(i / bands) * 100}% 0 ${100 - ((i + 1) / bands) * 100}% 0)`,
              transform: `translateX(${dx}px)`,
            }}
          >
            {children}
          </div>
        );
      })}
    </div>
  );
};
