import React from 'react';
import {AbsoluteFill, Audio, Sequence, getRemotionEnvironment, staticFile} from 'remotion';
import {COLORS} from './config';
import {FPS, bf, section} from './lib/beat';
import {FontGate} from './components/FontGate';
import {Flash, Grain, Vignette} from './components/Overlays';
import {IntroScene} from './scenes/Intro';
import {NameScene} from './scenes/Name';
import {TopicsScene} from './scenes/Topics';
import {SloganScene} from './scenes/Slogan';
import {HypeScene} from './scenes/Hype';
import {OutroScene} from './scenes/Outro';

/** Frames a scene stays mounted after its section ends, so the next scene's wipe can reveal over it. */
const OVERLAP = 14;

/**
 * Remotion's AAC export adds a 2048-sample (48 kHz) encoder delay that the MP4 doesn't flag, so
 * players start the audio ~43 ms late. Trimming that much off the front of the track when rendering
 * puts every hit back on its frame; the Studio preview plays the track untouched.
 */
const AAC_DELAY_FRAMES = (2048 / 48000) * FPS;

const extend = (s: {from: number; durationInFrames: number}) => ({...s, durationInFrames: s.durationInFrames + OVERLAP});

export const ChannelIntro: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: COLORS.ink, fontSynthesis: 'none'}}>
    <FontGate>
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
    <Audio
      src={staticFile('soundtrack.wav')}
      trimBefore={getRemotionEnvironment().isRendering ? AAC_DELAY_FRAMES : 0}
    />
  </AbsoluteFill>
);
