import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CHANNEL} from '../config';
import {FontGate} from '../components/FontGate';
import {Grain} from '../components/Overlays';
import {Soundtrack} from '../components/Soundtrack';
import {CINEMATIC, SHOTS} from './config';
import {DomeShot} from './Dome';
import {EndCard} from './EndCard';
import {Opening} from './Opening';
import {Phrase} from './Phrase';
import {TL, f} from './timing';

/** Film-trailer style: cold open, match-cut dome montage under one phrase, then the name over Earth. */
export const CinematicIntro: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000', fontSynthesis: 'none'}}>
    <FontGate text={CINEMATIC.phrase.join(' ') + CINEMATIC.title + CHANNEL.name}>
      {TL.cuts.slice(0, -1).map((cut, i) => {
        const from = f(cut);
        const len = f(TL.cuts[i + 1]) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={len} name={i === 0 ? 'Opening' : `Shot ${i}`}>
            {i === 0 ? <Opening len={len} /> : <DomeShot shot={SHOTS[(i - 1) % SHOTS.length]} len={len} />}
          </Sequence>
        );
      })}
      <Sequence from={f(TL.end.cut)} name="End card">
        <EndCard />
      </Sequence>
      <Phrase />
      <Grain opacity={0.1} />
    </FontGate>
    <Soundtrack file="soundtrack-cinematic.wav" />
  </AbsoluteFill>
);
