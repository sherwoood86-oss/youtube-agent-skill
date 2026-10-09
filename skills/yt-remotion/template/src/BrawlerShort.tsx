import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Blocky, NOVICHOK, ZLYDEN } from "./Blocky";

// Episode 1 of Злыдень, the blocky one who picks a fight with everything. 20s at 30fps.
// The timeline is hand-keyed rather than props-driven: an episode is choreography, not a script.
// The last line ("А ты чё смотришь?!") leads back into the first ("Кто тут?!") so it loops.

export const BRAWLER_FRAMES = 600;
const GROUND = 1500;

const ip = (f: number, a: [number, number], b: [number, number], ease = Easing.inOut(Easing.quad)) =>
  interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const between = (f: number, a: number, b: number) => f >= a && f < b;

export const BrawlerShort: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif" }}>
    <Sequence durationInFrames={90}>
      <Intro />
    </Sequence>
    <Sequence from={90} durationInFrames={170}>
      <RoundNewbie />
    </Sequence>
    <Sequence from={260} durationInFrames={180}>
      <RoundWall />
    </Sequence>
    <Sequence from={440} durationInFrames={160}>
      <RoundYou />
    </Sequence>
  </AbsoluteFill>
);

const World: React.FC<{ shake?: number; children: React.ReactNode }> = ({ shake = 0, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ transform: `translate(${Math.sin(f * 2.3) * shake}px, ${Math.cos(f * 3.1) * shake}px)` }}
    >
      {/* Oversized so a screen shake never shows the edge of the world. */}
      <div style={{ position: "absolute", inset: -60, background: "linear-gradient(#5BB8F5, #CDEBFF)" }} />
      {/* A studded baseplate: the generic look of every block-building game. */}
      <div
        style={{
          position: "absolute",
          top: GROUND,
          left: -40,
          right: -40,
          bottom: -40,
          backgroundColor: "#4CAF50",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.22) 22%, transparent 24%)",
          backgroundSize: "64px 64px",
          borderTop: "10px solid #388E3C",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ kicker?: string; text: string }> = ({ kicker, text }) => {
  const f = useCurrentFrame();
  const pop = ip(f, [0, 8], [0.6, 1], Easing.out(Easing.back(2)));
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        left: 70,
        right: 70,
        textAlign: "center",
        transform: `scale(${pop})`,
        color: "white",
        WebkitTextStroke: "4px #111",
        paintOrder: "stroke fill",
        fontWeight: 900,
        textShadow: "0 8px 0 #111",
      }}
    >
      {kicker ? <div style={{ fontSize: 56, color: "#FFD43B", marginBottom: 12 }}>{kicker}</div> : null}
      <div style={{ fontSize: 88, lineHeight: 1.08 }}>{text}</div>
    </div>
  );
};

const Stars: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = f * 0.25 + (i * Math.PI) / 2;
        return (
          <svg
            key={i}
            width={70}
            height={70}
            viewBox="-10 -10 20 20"
            style={{ position: "absolute", left: x + Math.cos(a) * 90 - 35, top: y + Math.sin(a) * 40 - 35 }}
          >
            <polygon
              points="0,-9 2.6,-3 9,-3 4,1.5 6,8 0,4.2 -6,8 -4,1.5 -9,-3 -2.6,-3"
              fill="#FFD43B"
              stroke="#111"
              strokeWidth={1}
            />
          </svg>
        );
      })}
    </>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const x = ip(f, [0, 45], [-200, 540], Easing.out(Easing.quad));
  return (
    <World>
      <Title text="Он лезет в драку с КАЖДЫМ" />
      <Blocky
        pal={ZLYDEN}
        pose={{ x, ground: GROUND, walk: f < 45 ? f * 0.55 : 0, bubble: f >= 45 ? "КТО ТУТ?!" : undefined }}
      />
    </World>
  );
};

const RoundNewbie: React.FC = () => {
  const f = useCurrentFrame();
  const nx = ip(f, [0, 40], [1300, 790], Easing.out(Easing.quad));
  // Злыдень lunges; Новичок simply hops over him.
  const zx = ip(f, [108, 150], [300, 1500], Easing.in(Easing.quad));
  const hop = between(f, 106, 140) ? Math.sin(((f - 106) / 34) * Math.PI) * 300 : 0;
  return (
    <World>
      <Title kicker="Раунд 1" text="Новичок" />
      <Sequence from={108} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} />
      </Sequence>
      <Blocky
        pal={NOVICHOK}
        pose={{
          x: nx,
          y: hop,
          ground: GROUND,
          facing: -1,
          mood: "happy",
          walk: f < 40 ? f * 0.55 : 0,
          bubble: between(f, 40, 85) ? "Привет!" : f >= 145 ? "Эм… ладно" : undefined,
        }}
      />
      <Blocky
        pal={ZLYDEN}
        pose={{
          x: zx,
          ground: GROUND,
          punch: ip(f, [95, 108], [0, 1]),
          rotate: ip(f, [120, 150], [0, 25]),
          bubble: between(f, 70, 108) ? "ДРАКА!" : undefined,
        }}
      />
    </World>
  );
};

const RoundWall: React.FC = () => {
  const f = useCurrentFrame();
  const HIT = 105;
  const zx = f < 40 ? ip(f, [0, 40], [-200, 560], Easing.out(Easing.quad)) : ip(f, [95, HIT], [560, 600]);
  const shake = f >= HIT ? ip(f, [HIT, HIT + 18], [26, 0]) : 0;
  const hurt = f >= HIT;
  return (
    <World shake={shake}>
      <Title kicker="Раунд 2" text="Стена" />
      <Sequence from={HIT} layout="none">
        <Audio src={staticFile("sfx/thud.wav")} />
      </Sequence>
      {/* the wall, which wins */}
      <div
        style={{
          position: "absolute",
          left: 800,
          width: 240,
          top: GROUND - 640,
          height: 640,
          backgroundColor: "#8D6E63",
          backgroundImage:
            "linear-gradient(#5D4037 6px, transparent 6px), linear-gradient(90deg, #5D4037 6px, transparent 6px)",
          backgroundSize: "80px 60px",
          border: "6px solid #4E342E",
        }}
      />
      <Blocky
        pal={ZLYDEN}
        pose={{
          x: zx,
          y: hurt ? Math.abs(Math.sin((f - HIT) * 0.35)) * 70 : 0,
          ground: GROUND,
          walk: f < 40 ? f * 0.55 : 0,
          punch: hurt ? ip(f, [HIT, HIT + 10], [1, 0]) : ip(f, [95, HIT], [0, 1]),
          mood: hurt ? "hurt" : "angry",
          bubble: between(f, 42, 95) ? "ТЫ ЧЁ, СТЕНА?!" : hurt ? "АЙ-АЙ-АЙ!" : undefined,
        }}
      />
      {between(f, HIT, HIT + 50) ? <Stars x={790} y={GROUND - 330} /> : null}
    </World>
  );
};

const RoundYou: React.FC = () => {
  const f = useCurrentFrame();
  const scale = ip(f, [0, 50], [1, 1.9], Easing.out(Easing.cubic));
  return (
    <World>
      {f < 80 ? <Title kicker="Раунд 3" text="ТЫ" /> : <Title text="Подпишись… если не боишься" />}
      <Blocky
        pal={ZLYDEN}
        pose={{
          x: 540,
          ground: GROUND + 380 * (scale - 1),
          scale,
          // shaking a fist at the camera
          punch: f > 40 ? 0.45 + Math.sin(f * 0.9) * 0.12 : 0,
          bubble: f >= 35 ? "А ТЫ ЧЁ СМОТРИШЬ?!" : undefined,
        }}
      />
    </World>
  );
};
