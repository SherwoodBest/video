import React from 'react';

/** A spiky "sticker" badge with centered content. */
export const Starburst: React.FC<{
  size: number;
  color: string;
  points?: number;
  depth?: number;
  shadow?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({size, color, points = 14, depth = 0.8, shadow, children, style}) => {
  const r = size / 2;
  const verts = Array.from({length: points * 2}, (_, i) => {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * depth;
    return `${r + rad * Math.cos(a)},${r + rad * Math.sin(a)}`;
  }).join(' ');
  return (
    <div style={{position: 'relative', width: size, height: size, ...style}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {shadow ? <polygon points={verts} fill={shadow} transform="translate(10 10)" /> : null}
        <polygon points={verts} fill={color} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {children}
      </div>
    </div>
  );
};
