import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CHANNEL, COLORS} from './config';
import {bf, section} from './lib/beat';
import {FontGate} from './components/FontGate';
import {Flash, Grain, Vignette} from './components/Overlays';
import {Soundtrack} from './components/Soundtrack';
import {IntroScene} from './scenes/Intro';
import {NameScene} from './scenes/Name';
import {TopicsScene} from './scenes/Topics';
import {SloganScene} from './scenes/Slogan';
import {HypeScene} from './scenes/Hype';
import {OutroScene} from './scenes/Outro';

/** Frames a scene stays mounted after its section ends, so the next scene's wipe can reveal over it. */
const OVERLAP = 14;

const extend = (s: {from: number; durationInFrames: number}) => ({...s, durationInFrames: s.durationInFrames + OVERLAP});

export const ChannelIntro: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: COLORS.ink, fontSynthesis: 'none'}}>
    <FontGate text={JSON.stringify(CHANNEL)}>
      <Sequence {...section('intro')} name="Intro">
        <IntroScene />
      </Sequence>
      <Sequence {...extend(section('name'))} name="Name">
        <NameScene />
      </Sequence>
      <Sequence {...section('topics')} name="Topics">
        <TopicsScene />
      </Sequence>
      <Sequence {...section('slogan')} name="Slogan">
        <SloganScene />
      </Sequence>
      <Sequence {...section('hype')} name="Hype">
        <HypeScene />
      </Sequence>
      <Sequence {...section('outro')} name="Outro">
        <OutroScene />
      </Sequence>
      <Vignette />
      <Grain />
      <Flash at={bf(8)} />
      <Flash at={bf(40)} />
    </FontGate>
    <Soundtrack file="soundtrack.wav" />
  </AbsoluteFill>
);
