// ─────────────────────────────────────────────────────────────────────────────
//  Minimal version: a few calm English lines, then the channel name.
//  The name itself comes from `CHANNEL.name` in ../config.ts.
//  Preview with `npm run studio`, export with `npm run render:minimal`.
// ─────────────────────────────────────────────────────────────────────────────

export const MINIMAL = {
  /** One line on screen at a time, revealed word by word. Wrap words in *asterisks* for italic accent. */
  lines: [
    'Good writing isn’t about big words.',
    'It’s about *clear ideas*, simply said.',
    'Let’s make English writing *easy*.',
    'One sentence at a time.',
  ],
  colors: {
    /** Page background. */
    paper: '#F3EEE5',
    /** Text. */
    ink: '#201E1B',
    /** Caret, italic words and the underline on the end card. */
    accent: '#C4553B',
    /** Two soft tints that drift across the page. */
    glowA: '#E9B48F',
    glowB: '#CDBD93',
  },
};
