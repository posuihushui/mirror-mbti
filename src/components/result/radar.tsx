import { cn } from "cn";
import { poles, type Profile } from "@/lib/personality";
import { dimensions } from "@/lib/questionnaires";

/**
 * Pure-SVG radar chart replicating the Chart.js configuration used in the prototype:
 * four axes starting at the top and going clockwise, four circular grid rings
 * (25 / 50 / 75 / 100), #d6dee0 grid, warm fill and 1.4px stroke, 2px points,
 * 12px point labels. Renders on the server; no client JS.
 */
const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 118;
const LABEL_OFFSET = 18;
const RINGS = [25, 50, 75, 100];

function polar(value: number, index: number) {
  const angle = -Math.PI / 2 + (index * Math.PI) / 2;
  const r = (RADIUS * value) / 100;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

const LABEL_ANCHORS: Array<{ anchor: "middle" | "start" | "end"; dx: number; dy: number }> = [
  { anchor: "middle", dx: 0, dy: -6 },
  { anchor: "start", dx: 4, dy: 4 },
  { anchor: "middle", dx: 0, dy: 14 },
  { anchor: "end", dx: -4, dy: 4 },
];

export function Radar({ profile, height = 310, className }: { profile: Profile; height?: number; className?: string }) {
  const letters = profile.type.split("");
  const points = profile.values.map((v, i) => polar(v, i));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
  const label = letters.map((l, i) => profile.balanced[i] ? `${dimensions[i]} 接近均衡 ${profile.values[i]}%` : `${poles[l].label}偏好 ${profile.values[i]}%`).join("，");

  return (
    <div className={cn("relative mx-auto w-full", className)} style={{ height }}>
      {/* The 内向/直觉/情感/判断 labels sit just outside the outer ring, so the SVG must not
          clip them at the viewBox edge — on a 393px phone that cut off the side labels. */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label={label}>
        {RINGS.map((ring) => (
          <circle key={ring} cx={CENTER} cy={CENTER} r={(RADIUS * ring) / 100} fill="none" stroke="#d6dee0" strokeWidth={1} />
        ))}
        {letters.map((l, i) => {
          const end = polar(100, i);
          return <line key={l} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#d6dee0" strokeWidth={1} />;
        })}
        <path d={path} fill="rgba(218,165,126,0.14)" stroke="#c49473" strokeWidth={1.4} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="#c49473" />
        ))}
        {letters.map((l, i) => {
          const pos = polar(100 + (LABEL_OFFSET / RADIUS) * 100, i);
          const a = LABEL_ANCHORS[i];
          return (
            <text
              key={l}
              x={pos.x + a.dx}
              y={pos.y + a.dy}
              textAnchor={a.anchor}
              fontSize={12}
              fill="#303a3d"
              fontFamily="inherit"
            >
              {profile.balanced[i] ? dimensions[i].split("").join(" / ") : `${poles[l].label} ${l}`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
