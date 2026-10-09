import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";

export type EditProps = {
  src: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  // Source ranges that survive the cuts. `from` is where each lands on the output timeline,
  // `trimBefore` where it starts in the source, both in frames.
  segments: { start: number; end: number; trimBefore: number; from: number; frames: number }[];
  // Already on the output timeline. props.py did the remapping.
  captions: { from: number; to: number; text: string }[];
  hook?: { text: string; frames: number };
};

export const Edit: React.FC<EditProps> = ({ src, width, height, segments, captions, hook }) => {
  const vertical = height > width;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {segments.map((s) => (
        <Sequence key={s.from} from={s.from} durationInFrames={s.frames} premountFor={30}>
          {/* cover crops a 16:9 source to the centre for 9:16. Off-centre subjects get cut: check it. */}
          <OffthreadVideo
            src={staticFile(src)}
            trimBefore={s.trimBefore}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Sequence>
      ))}
      {captions.map((c) => (
        <Sequence key={`${c.from}-${c.text}`} from={c.from} durationInFrames={c.to - c.from} layout="none">
          <Caption text={c.text} vertical={vertical} />
        </Sequence>
      ))}
      {hook ? (
        <Sequence from={0} durationInFrames={hook.frames} layout="none">
          <Hook text={hook.text} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// Lower third on 16:9; on 9:16 it sits above the bottom UI band, where the like and comment
// buttons and the channel name would otherwise cover it.
const Caption: React.FC<{ text: string; vertical: boolean }> = ({ text, vertical }) => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: vertical ? "32%" : "6%",
      paddingLeft: "8%",
      paddingRight: "8%",
    }}
  >
    <div
      style={{
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        fontWeight: 800,
        fontSize: vertical ? 78 : 52,
        lineHeight: 1.15,
        color: "white",
        textAlign: "center",
        WebkitTextStroke: vertical ? "3px black" : "2px black",
        paintOrder: "stroke fill",
        textShadow: "0 4px 12px rgba(0,0,0,0.6)",
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);

const Hook: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: "14%" }}>
    <div
      style={{
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        fontWeight: 900,
        fontSize: 84,
        lineHeight: 1.1,
        color: "black",
        backgroundColor: "white",
        padding: "18px 30px",
        borderRadius: 14,
        maxWidth: "84%",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </AbsoluteFill>
);
