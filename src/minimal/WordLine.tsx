import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FONT} from '../theme';
import {inCubic, linear, outCubic, tween} from '../lib/anim';
import {fitSize} from '../lib/text';
import {MINIMAL} from './config';
import {FPB} from './timing';

const C = MINIMAL.colors;
/** Frames between consecutive words starting. */
const STAGGER = 5;
/** Frames each word takes to settle. */
const IN = 22;
/** Frames the whole line takes to leave at the end of its slot. */
const OUT = 18;

type Segment = {text: string; em: boolean};

/** Splits a line into words; `*text*` spans become emphasized segments. */
const parseWords = (line: string): Segment[][] => {
  const words: Segment[][] = [[]];
  let em = false;
  for (const ch of Array.from(line)) {
    if (ch === '*') {
      em = !em;
      continue;
    }
    const word = words[words.length - 1];
    if (ch === ' ') {
      if (word.length) words.push([]);
      continue;
    }
    const last = word[word.length - 1];
    if (last && last.em === em) last.text += ch;
    else word.push({text: ch, em});
  }
  return words.filter((w) => w.length);
};

/** Blinking text cursor. Solid while typing; blinks once per beat when idle. */
export const Caret: React.FC<{size: number; blinkFrom: number}> = ({size, blinkFrom}) => {
  const f = useCurrentFrame();
  const on = f < blinkFrom || (f - blinkFrom) % FPB < FPB * 0.55;
  return (
    <span
      style={{
        position: 'absolute',
        left: '100%',
        top: '50%',
        marginLeft: size * 0.1,
        width: Math.max(4, size * 0.055),
        height: size * 0.95,
        transform: 'translateY(-50%)',
        borderRadius: 2,
        background: C.accent,
        opacity: on ? 1 : 0,
      }}
    />
  );
};

/** One sentence revealed word by word (fade, rise, un-blur) with a caret following the newest word. */
export const WordLine: React.FC<{line: string; len: number}> = ({line, len}) => {
  const f = useCurrentFrame();
  const words = parseWords(line);
  const size = fitSize(line.replace(/\*/g, ''), 1500, 112, {fontFamily: FONT.serif, fontWeight: 400, upper: false});
  const typedAt = (words.length - 1) * STAGGER + IN;
  // The caret trails the reveal: it sits after the newest word that is at least half visible.
  const newest = Math.max(0, Math.min(words.length - 1, Math.floor((f - IN * 0.35) / STAGGER)));
  const exit = tween(f, len - OUT, len, 0, 1, inCubic);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: '0.26em',
          maxWidth: 1500,
          fontFamily: FONT.serif,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: C.ink,
          opacity: 1 - exit,
          transform: `translateY(${-exit * size * 0.18}px)`,
          filter: exit > 0.01 ? `blur(${exit * 8}px)` : undefined,
        }}
      >
        {words.map((segments, i) => {
          const t = f - i * STAGGER;
          const blur = tween(t, 0, IN, 8, 0, outCubic);
          return (
            <span key={i} style={{position: 'relative', display: 'inline-block'}}>
              <span
                style={{
                  display: 'inline-block',
                  opacity: tween(t, 0, IN * 0.7, 0, 1, linear),
                  transform: `translateY(${tween(t, 0, IN, 0.3, 0, outCubic)}em)`,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                }}
              >
                {segments.map((s, j) => (
                  <span key={j} style={s.em ? {fontStyle: 'italic', color: C.accent} : undefined}>
                    {s.text}
                  </span>
                ))}
              </span>
              {i === newest && <Caret size={size} blinkFrom={typedAt} />}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
