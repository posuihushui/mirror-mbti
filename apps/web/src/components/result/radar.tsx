import { cn } from "cn";
import { resultMessages } from "@/lib/i18n/messages/result";
import { getLocale } from "@/lib/i18n/server";
import { polesFor, type Letter, type Profile } from "@/lib/personality";
import { RadarReveal } from "./radar-reveal";

/**
 * Pure-SVG radar chart replicating the Chart.js configuration used in the prototype:
 * four axes starting at the top and going clockwise, four circular grid rings
 * (25 / 50 / 75 / 100), #d6dee0 grid, warm fill and 1.4px stroke, 2px points,
 * 12px point labels. SVG and data render on the server; a small client shell
 * preserves the first-paint CSS drawing or draws once on entering the viewport.
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

export async function Radar({ profile, height = 310, className }: { profile: Profile; height?: number; className?: string }) {
  const locale = await getLocale();
  const t = resultMessages[locale].radar;
  const poles = polesFor(locale);
  const letters = profile.type.split("") as Letter[];
  const points = profile.values.map((v, i) => polar(v, i));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
  // Each axis names the side the answers leaned to; a near-even one says so rather than dropping the letter.
  const label = letters.map((l, i) => profile.balanced[i] ? t.balanced(poles[l].label, profile.values[i]) : t.pole(poles[l].label, profile.values[i])).join(t.separator);

  return (
    <RadarReveal className={cn("relative mx-auto w-full", className)} style={{ height }}>
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
        <path data-radar-fill d={path} fill="rgba(218,165,126,0.14)" />
        <path data-radar-outline d={path} pathLength={1} fill="none" stroke="#c49473" strokeWidth={1.4} strokeLinejoin="round" />
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
              fill={profile.balanced[i] ? "#5d696d" : "#171b1c"}
              fontFamily="inherit"
            >
              {`${poles[l].label} ${l}`}
            </text>
          );
        })}
      </svg>
    </RadarReveal>
  );
}
