import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {CHANNEL, COLORS} from '../config';
import {DISPLAY, FONT} from '../theme';
import {FPB, HEIGHT, WIDTH, bf, splitBeats} from '../lib/beat';
import {inExpo, linear, outBack, tween} from '../lib/anim';
import {alpha} from '../lib/color';
import {fitSize} from '../lib/text';
import {Camera} from '../components/Camera';
import {Letters} from '../components/Letters';
import {Marquee} from '../components/Marquee';
import {MotionBlurX} from '../components/MotionBlurX';
import {Starburst} from '../components/Starburst';

const SCHEMES = [
  {bg: COLORS.paper, fg: COLORS.ink, accent: COLORS.primary, sticker: COLORS.paper},
  {bg: COLORS.primary, fg: COLORS.paper, accent: COLORS.accent, sticker: COLORS.ink},
  {bg: COLORS.ink, fg: COLORS.paper, accent: COLORS.accent, sticker: COLORS.ink},
  {bg: COLORS.accent, fg: COLORS.ink, accent: COLORS.primary, sticker: COLORS.paper},
];

/** Frames the incoming card's diagonal wipe takes; the outgoing card stays mounted underneath for this long. */
const WIPE = 12;
const SLANT = 260;
const LEFT = 140;

const TopicCard: React.FC<{index: number; total: number; title: string; caption: string; len: number}> = ({
  index,
  total,
  title,
  caption,
  len,
}) => {
  const t = useCurrentFrame();
  const s = SCHEMES[index % SCHEMES.length];
  const num = String(index + 1).padStart(2, '0');

  const edge = tween(t, 0, WIPE, WIDTH + SLANT + 120, -SLANT - 120);
  const panelClip =
    t < WIPE ? `polygon(${edge}px 0, ${WIDTH}px 0, ${WIDTH}px ${HEIGHT}px, ${edge - SLANT}px ${HEIGHT}px)` : undefined;
  const stripeEdge = edge - 90;
  const stripeClip = `polygon(${stripeEdge}px 0, ${WIDTH}px 0, ${WIDTH}px ${HEIGHT}px, ${stripeEdge - SLANT}px ${HEIGHT}px)`;

  const titleSize = fitSize(title, 1250, 330);
  const titleTop = HEIGHT / 2 - titleSize * 0.62;
  const exit = tween(t, len - bf(0.4), len, 0, 1, inExpo);
  const captionChars = Array.from(caption);
  const typed = Math.floor(tween(t, bf(1), bf(1.8), 0, captionChars.length, linear));
  const caretOn = Math.floor(t / (FPB / 2)) % 2 === 0;
  const pop = tween(t, bf(0.5), bf(0.5) + 16, 0, 1, outBack(2.2));
  const beatPulse = 1 + 0.06 * Math.exp(-((t % FPB) / 6));

  return (
    <AbsoluteFill>
      {t < WIPE && <AbsoluteFill style={{background: s.accent, clipPath: stripeClip}} />}
      <AbsoluteFill style={{background: s.bg, clipPath: panelClip, overflow: 'hidden'}}>
        <Marquee text={title} fontSize={300} y={-70} speed={2.6} stroke={alpha(s.fg, 0.1)} strokeWidth={3} />
        <Marquee
          text={title}
          fontSize={300}
          y={HEIGHT - 230}
          speed={-2.6}
          offset={500}
          stroke={alpha(s.fg, 0.1)}
          strokeWidth={3}
        />

        <Camera
          punches={[
            {at: 0, amount: 0.05, tau: 8},
            {at: bf(1), amount: 0.02},
            {at: bf(2), amount: 0.035},
            {at: bf(3), amount: 0.02},
          ]}
          seed={`topic${index}`}
        >
          <div
            style={{
              position: 'absolute',
              left: LEFT,
              top: 100,
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '0.2em',
              color: alpha(s.fg, 0.75),
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{width: 16, height: 16, borderRadius: 8, background: s.accent}} />
            {CHANNEL.topicsLabel}
          </div>

          <MotionBlurX amount={exit * 60}>
            <div style={{position: 'absolute', left: LEFT, top: titleTop, transform: `translateX(${-exit * 900}px)`}}>
              <Letters
                text={title.toUpperCase()}
                mask
                style={{...DISPLAY, fontSize: titleSize, lineHeight: 1.05, color: s.fg}}
                letter={(i) => ({transform: `translateY(${tween(t, 3 + i * 1.3, 16 + i * 1.3, 110, 0)}%)`})}
              />
              <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 18}}>
                <div style={{width: tween(t, bf(1) - 4, bf(1) + 8, 0, 80), height: 10, background: s.accent}} />
                <div
                  style={{
                    fontFamily: FONT.ui,
                    fontWeight: 700,
                    fontSize: 50,
                    color: s.fg,
                    whiteSpace: 'pre',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {captionChars.slice(0, typed).join('')}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 5,
                      height: 56,
                      marginLeft: 6,
                      background: s.accent,
                      opacity: t >= bf(1) - 4 && caretOn ? 1 : 0,
                    }}
                  />
                </div>
              </div>
            </div>
          </MotionBlurX>

          <div
            style={{
              position: 'absolute',
              left: 1640 - 190,
              top: HEIGHT / 2 - 190,
              transform: `scale(${pop * beatPulse * (1 - exit)}) rotate(${-24 + t * 0.6 + exit * 90}deg)`,
            }}
          >
            <Starburst size={380} color={s.accent} shadow={alpha(COLORS.ink, 0.25)}>
              <div
                style={{
                  ...DISPLAY,
                  fontSize: 150,
                  lineHeight: 1,
                  color: s.sticker,
                  transform: 'rotate(10deg)',
                }}
              >
                {num}
              </div>
            </Starburst>
          </div>

          <div
            style={{
              position: 'absolute',
              left: LEFT,
              bottom: 96,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {Array.from({length: total}, (_, j) => (
              <div key={j} style={{width: 90, height: 8, background: alpha(s.fg, 0.2)}}>
                <div
                  style={{
                    height: '100%',
                    width: `${j < index ? 100 : j > index ? 0 : tween(t, 0, len, 0, 100, linear)}%`,
                    background: s.fg,
                  }}
                />
              </div>
            ))}
            <div
              style={{
                marginLeft: 16,
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '0.15em',
                color: s.fg,
              }}
            >
              {num} / {String(total).padStart(2, '0')}
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              right: LEFT,
              bottom: 92,
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '0.1em',
              color: alpha(s.fg, 0.75),
            }}
          >
            {CHANNEL.handle || CHANNEL.subtitle}
          </div>
        </Camera>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Beats 16–32: one card per topic, each wiping in diagonally over the previous one. */
export const TopicsScene: React.FC = () => {
  const topics = CHANNEL.topics;
  const slots = splitBeats(16, topics.length);
  return (
    <AbsoluteFill>
      {slots.map(([s, e], i) => (
        <Sequence key={i} from={bf(s)} durationInFrames={bf(e) - bf(s) + WIPE}>
          <TopicCard
            index={i}
            total={topics.length}
            title={topics[i].title}
            caption={topics[i].caption}
            len={bf(e) - bf(s)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
