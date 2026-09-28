import React from 'react';
import {Composition} from 'remotion';
import {ChannelIntro} from './ChannelIntro';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './lib/beat';
import {MinimalIntro} from './minimal/MinimalIntro';
import minimal from './minimal/timeline.json';
import {TOTAL_FRAMES as MINIMAL_FRAMES} from './minimal/timing';
import {CinematicIntro} from './cinematic/CinematicIntro';
import cinematic from './cinematic/timeline.json';
import {TOTAL_FRAMES as CINEMATIC_FRAMES} from './cinematic/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ChannelIntro"
      component={ChannelIntro}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="MinimalIntro"
      component={MinimalIntro}
      durationInFrames={MINIMAL_FRAMES}
      fps={minimal.fps}
      width={minimal.width}
      height={minimal.height}
    />
    <Composition
      id="CinematicIntro"
      component={CinematicIntro}
      durationInFrames={CINEMATIC_FRAMES}
      fps={cinematic.fps}
      width={cinematic.width}
      height={cinematic.height}
    />
  </>
);
