import React from 'react';
import {Audio, getRemotionEnvironment, staticFile, useVideoConfig} from 'remotion';

/**
 * Plays a track from public/. Remotion's AAC export adds a 2048-sample (48 kHz) encoder delay that
 * the MP4 doesn't flag, so players start the audio ~43 ms late. Trimming that much off the front
 * when rendering puts every hit back on its frame; the Studio preview plays the track untouched.
 */
export const Soundtrack: React.FC<{file: string}> = ({file}) => {
  const {fps} = useVideoConfig();
  return <Audio src={staticFile(file)} trimBefore={getRemotionEnvironment().isRendering ? (2048 / 48000) * fps : 0} />;
};
