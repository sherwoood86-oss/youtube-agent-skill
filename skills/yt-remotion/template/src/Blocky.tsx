// A blocky character, drawn rather than imported, so every episode can reuse the same cast.
// Original design: no Roblox assets, logo or name. Keep it that way if you publish.

export type Palette = { skin: string; shirt: string; pants: string; shade: number };

export const ZLYDEN: Palette = { skin: "#E8B07A", shirt: "#C62828", pants: "#263238", shade: 0.78 };
export const NOVICHOK: Palette = { skin: "#FFE0B2", shirt: "#1E88E5", pants: "#43A047", shade: 0.8 };

export type Pose = {
  x: number; // centre, px from the left of the frame
  y?: number; // px above the ground
  facing?: 1 | -1; // 1 = looking right
  scale?: number;
  rotate?: number; // degrees, whole body
  walk?: number; // phase in radians; legs and arms swing with sin(walk)
  punch?: number; // 0 rest, 1 arm fully out
  mood?: "angry" | "happy" | "hurt";
  bubble?: string;
  ground: number; // y of the ground line in the frame
};

const darker = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

// One block with a darker back side (left, before the facing flip), which is most of what makes it read as 3D.
const Block: React.FC<{ x: number; y: number; w: number; h: number; fill: string; k: number; r?: number }> = ({
  x, y, w, h, fill, k, r = 6,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
    <rect x={x} y={y} width={w * 0.28} height={h} rx={r} fill={darker(fill, k)} />
  </g>
);

export const Blocky: React.FC<{ pal: Palette; pose: Pose }> = ({ pal, pose }) => {
  const { x, y = 0, facing = 1, scale = 1, rotate = 0, walk = 0, punch = 0, mood = "angry", bubble, ground } = pose;
  const swing = Math.sin(walk) * 28;
  const W = 300, H = 560; // drawing box; feet at the bottom centre
  const k = pal.shade;
  const brow = mood === "angry" ? 22 : mood === "hurt" ? -14 : -6;
  return (
    <div
      style={{
        position: "absolute",
        left: x - (W * scale) / 2,
        top: ground - y - H * scale,
        width: W * scale,
        height: H * scale,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "50% 100%",
      }}
    >
      {bubble ? <Bubble text={bubble} /> : null}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
        <g transform={`translate(${W / 2} 0) scale(${facing} 1) translate(${-W / 2} 0)`}>
          {/* back arm */}
          <g transform={`rotate(${-swing} 95 225)`}>
            <Block x={60} y={215} w={50} h={150} fill={darker(pal.skin, 0.9)} k={k} />
          </g>
          {/* legs */}
          <g transform={`rotate(${swing} 120 390)`}>
            <Block x={95} y={385} w={52} h={170} fill={pal.pants} k={k} />
          </g>
          <g transform={`rotate(${-swing} 180 390)`}>
            <Block x={152} y={385} w={52} h={170} fill={pal.pants} k={k} />
          </g>
          {/* torso */}
          <Block x={85} y={210} w={130} h={180} fill={pal.shirt} k={k} />
          {/* front arm: swings when walking, swings forward to horizontal on a punch */}
          <g transform={`rotate(${swing * (1 - punch) - 95 * punch} 210 225)`}>
            <Block x={198} y={215} w={50} h={150 + 40 * punch} fill={pal.skin} k={k} />
            <rect x={196} y={330 + 40 * punch} width={54} height={46} rx={10} fill={darker(pal.skin, 0.85)} />
          </g>
          {/* head */}
          <Block x={78} y={60} w={144} h={150} fill={pal.skin} k={k} r={18} />
          {/* face, drawn toward the facing side */}
          <g>
            <rect x={150} y={118} width={18} height={22} fill="#111" />
            <rect x={190} y={118} width={18} height={22} fill="#111" />
            <g transform={`rotate(${brow} 159 104)`}>
              <rect x={140} y={98} width={38} height={10} fill="#111" />
            </g>
            <g transform={`rotate(${-brow} 199 104)`}>
              <rect x={180} y={98} width={38} height={10} fill="#111" />
            </g>
            {mood === "happy" ? (
              <path d="M160 160 Q180 182 205 160" stroke="#111" strokeWidth={9} fill="none" strokeLinecap="round" />
            ) : mood === "hurt" ? (
              <ellipse cx={182} cy={170} rx={14} ry={16} fill="#111" />
            ) : (
              <path d="M158 178 Q182 158 208 178" stroke="#111" strokeWidth={9} fill="none" strokeLinecap="round" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};

const Bubble: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      bottom: "100%",
      left: "50%",
      transform: "translate(-50%, -10px)",
      background: "white",
      color: "#111",
      border: "6px solid #111",
      borderRadius: 26,
      padding: "14px 26px",
      fontSize: 58,
      fontWeight: 900,
      whiteSpace: "nowrap",
      fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
      boxShadow: "0 8px 0 #111",
    }}
  >
    {text}
  </div>
);
