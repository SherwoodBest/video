// ─────────────────────────────────────────────────────────────────────────────
//  Edit this file to make the intro yours. Everything on screen comes from here.
//  Chinese and English can be mixed freely in any field.
//  Preview live with `npm run studio`, then export with `npm run render`.
// ─────────────────────────────────────────────────────────────────────────────

export const CHANNEL = {
  /** Big name reveal after the drop. */
  name: '轻松英语写作',
  /** English name: decodes during the countdown, sits under the name, fills the background. */
  subtitle: 'EASY ENGLISH WRITING',
  /** Your @handle, shown under the logo and on the topic cards. Leave empty to show the subtitle instead. */
  handle: '',
  /** 1–2 characters inside the round logo badge. */
  badge: '写',

  /** Opening words, one per beat (4 beats total, so 2–4 words work best). */
  greeting: ['HELLO', '你好', 'WELCOME', '欢迎'],

  /** What the channel covers. 4 is ideal (2 seconds each); 2–8 also work. */
  topicsLabel: '你将学到 · WHAT YOU WILL LEARN',
  topics: [
    {title: 'GRAMMAR', caption: '语法难点，一次讲透'},
    {title: 'VOCABULARY', caption: '高级词汇，轻松替换'},
    {title: 'SENTENCES', caption: '地道句型，学了就用'},
    {title: 'ESSAYS', caption: '作文提分，技巧满满'},
  ],

  /** Slogan, one line per beat. The last line gets the accent color. */
  slogan: ['WRITE', 'BETTER', 'ENGLISH'],
  /** Vertical line typed out next to the slogan (a translation, or your upload schedule). */
  sloganNote: '轻松写出地道英文',

  /** Build-up before the final drop, one per beat. */
  hype: ['READY?', '准备好了吗？', "LET'S", 'WRITE!'],

  subscribe: '订阅 SUBSCRIBE',
  subscribed: '已订阅 SUBSCRIBED',
  signoff: '下期见 · SEE YOU NEXT TIME',
};

export const COLORS = {
  /** Near-black used for dark backgrounds and text on light backgrounds. */
  ink: '#0E0E13',
  /** Warm off-white used for light backgrounds and text on dark backgrounds. */
  paper: '#F6F2EA',
  /** Main brand color. */
  primary: '#FF3347',
  /** Secondary pop color. */
  accent: '#FFD23F',
};
