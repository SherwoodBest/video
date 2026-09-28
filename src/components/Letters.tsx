import React from 'react';

/**
 * Renders text one glyph per inline-block so each letter can animate on its own.
 * With `mask`, every letter is clipped to its own box (for rise/drop reveals).
 */
export const Letters: React.FC<{
  text: string;
  style?: React.CSSProperties;
  letter: (index: number, count: number) => React.CSSProperties;
  mask?: boolean;
}> = ({text, style, letter, mask = false}) => {
  const chars = Array.from(text);
  return (
    <div style={{display: 'flex', whiteSpace: 'pre', ...style}}>
      {chars.map((c, i) => {
        const glyph = (
          <span style={{display: 'inline-block', ...letter(i, chars.length)}}>{c === ' ' ? ' ' : c}</span>
        );
        return mask ? (
          <span
            key={i}
            style={{display: 'inline-block', overflow: 'hidden', padding: '0.08em 0.02em', margin: '-0.08em -0.02em'}}
          >
            {glyph}
          </span>
        ) : (
          <React.Fragment key={i}>{glyph}</React.Fragment>
        );
      })}
    </div>
  );
};
