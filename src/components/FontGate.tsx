import React, {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {CHANNEL} from '../config';
import {loadFonts} from '../theme';

/** Holds rendering until every font (including the Chinese glyphs used in the config) is loaded. */
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadFonts(JSON.stringify(CHANNEL))
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return ready ? <>{children}</> : null;
};
