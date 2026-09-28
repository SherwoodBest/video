import React, {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {loadFonts} from '../theme';

/** Holds rendering until every font needed for `text` (including Chinese glyphs) is loaded. */
export const FontGate: React.FC<{text: string; children: React.ReactNode}> = ({text, children}) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadFonts(text)
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle, text]);
  return ready ? <>{children}</> : null;
};
