import React, {useId} from 'react';

/** Horizontal-only blur (a cheap directional motion blur) for fast sideways moves. */
export const MotionBlurX: React.FC<{amount: number; children: React.ReactNode}> = ({amount, children}) => {
  const id = `mbx${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (amount < 0.5) return <>{children}</>;
  return (
    <>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-50%" y="-20%" width="200%" height="140%">
          <feGaussianBlur stdDeviation={`${amount} 0`} />
        </filter>
      </svg>
      <div style={{filter: `url(#${id})`}}>{children}</div>
    </>
  );
};
