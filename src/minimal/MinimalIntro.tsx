import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {CHANNEL} from '../config';
import {splitBeats} from '../lib/beat';
import {linear, tween} from '../lib/anim';
import {FontGate} from '../components/FontGate';
import {Grain, Vignette} from '../components/Overlays';
import {Soundtrack} from '../components/Soundtrack';
import {Backdrop} from './Backdrop';
import {EndCard} from './EndCard';
import {MINIMAL} from './config';
import {LINES_SECTION, TOTAL_FRAMES, bf, section} from './timing';
import {Caret, WordLine} from './WordLine';

/** Opening beat: an empty page and a blinking caret. */
const BlankPage: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: tween(f, 0, 12, 0, 1, linear)}}>
      <span style={{position: 'relative', width: 0, height: 112}}>
        <Caret size={112} blinkFrom={0} />
      </span>
    </AbsoluteFill>
  );
};

/** Calm, typographic version: English lines one at a time, then the channel name. */
export const MinimalIntro: React.FC = () => {
  const f = useCurrentFrame();
  const [start, end] = LINES_SECTION;
  const slots = splitBeats(end - start, MINIMAL.lines.length).map(([s, e]) => [bf(start + s), bf(start + e)]);
  return (
    <AbsoluteFill style={{fontSynthesis: 'none'}}>
      <Backdrop />
      <FontGate text={MINIMAL.lines.join(' ') + CHANNEL.name}>
        <AbsoluteFill style={{transform: `scale(${1 + (0.04 * f) / TOTAL_FRAMES})`}}>
          <Sequence {...section('open')} name="Blank page">
            <BlankPage />
          </Sequence>
          {slots.map(([from, to], i) => (
            <Sequence key={i} from={from} durationInFrames={to - from} name={`Line ${i + 1}`}>
              <WordLine line={MINIMAL.lines[i]} len={to - from} />
            </Sequence>
          ))}
          <Sequence {...section('end')} name="Name">
            <EndCard />
          </Sequence>
        </AbsoluteFill>
      </FontGate>
      <Vignette strength={0.1} />
      <Grain opacity={0.05} />
      <Soundtrack file="soundtrack-minimal.wav" />
    </AbsoluteFill>
  );
};
