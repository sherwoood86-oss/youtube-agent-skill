import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A Short with no footage: one beat of on-screen text after another. The script is the props, so
// /yt-script or /yt-shorts writes it and nothing here changes between videos.
export type TextShortProps = {
  fps: number;
  scenes: {
    text: string;
    // Seconds on screen. Reading speed, not speaking speed: ~3 words a second, plus a beat.
    seconds: number;
    // Small label above the line, e.g. "Причина №1". Optional.
    kicker?: string;
    // Words wrapped in *asterisks* in `text` get this colour.
    accent?: string;
  }[];
  background: [string, string];
};

export const textShortFrames = (p: TextShortProps) =>
  p.scenes.reduce((n, s) => n + Math.round(s.seconds * p.fps), 0);

export const TextShort: React.FC<TextShortProps> = (p) => {
  const frame = useCurrentFrame();
  const total = textShortFrames(p);
  let at = 0;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${p.background[0]}, ${p.background[1]})`,
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {p.scenes.map((s, i) => {
        const frames = Math.round(s.seconds * p.fps);
        const from = at;
        at += frames;
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <Scene {...s} frames={frames} />
          </Sequence>
        );
      })}
      {/* A thin progress bar. On a Short it tells the viewer how little is left, which is the point. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 10,
          width: `${(frame / total) * 100}%`,
          backgroundColor: "rgba(255,255,255,0.85)",
        }}
      />
    </AbsoluteFill>
  );
};

const Scene: React.FC<TextShortProps["scenes"][number] & { frames: number }> = ({
  text,
  kicker,
  accent = "#FFD43B",
  frames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // *several words* stay highlighted from the opening asterisk to the closing one.
  let on = false;
  const words = text.split(" ").map((w) => {
    const opens = w.startsWith("*");
    const closes = w.endsWith("*") && (w.length > 1 || on);
    const hot = on || opens;
    on = hot && !closes;
    return { w: w.replace(/^\*|\*$/g, ""), hot };
  });
  const out = interpolate(frame, [frames - 6, frames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        // Clear of the Shorts UI: the top bar and the caption/buttons band at the bottom.
        padding: "18% 9% 30% 9%",
        opacity: out,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontSize: 46,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: accent,
            marginBottom: 36,
            opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div style={{ textAlign: "center", lineHeight: 1.12 }}>
        {words.map(({ w, hot }, i) => {
          // Words land one after another, about as fast as the eye reads them.
          const pop = spring({ frame: frame - i * 3, fps, config: { damping: 14, mass: 0.6 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                fontSize: 96,
                fontWeight: 900,
                color: hot ? accent : "white",
                transform: `translateY(${(1 - pop) * 40}px) scale(${0.85 + pop * 0.15})`,
                opacity: pop,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
