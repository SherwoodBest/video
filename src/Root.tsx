import React from 'react';
import {Composition} from 'remotion';
import {ChannelIntro} from './ChannelIntro';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './lib/beat';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ChannelIntro"
    component={ChannelIntro}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
