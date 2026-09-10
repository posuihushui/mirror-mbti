import type { Profile } from "@/lib/personality";
import { poles } from "@/lib/personality";

/**
 * Radar for satori. SVG `<text>` is unsupported there, so the grid/polygon is SVG and the
 * four labels are absolutely positioned HTML.
 */
export function OgRadar({ profile, size = 320 }: { profile: Profile; size?: number }) {
  const C = 150;
  const R = 110;
  const scale = size / 300;
  const polar = (value: number, i: number) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    const r = (R * value) / 100;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  };
  const pts = profile.values.map((v, i) => polar(v, i));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
  const letters = profile.type.split("");
  const labelBox = 96;
  const labels = [
    { left: (C - labelBox / 2) * scale, top: (C - R - 30) * scale, align: "center" },
    { left: (C + R + 10) * scale, top: (C - 10) * scale, align: "flex-start" },
    { left: (C - labelBox / 2) * scale, top: (C + R + 8) * scale, align: "center" },
    { left: (C - R - 10 - labelBox) * scale, top: (C - 10) * scale, align: "flex-end" },
  ] as const;
  return (
    <div style={{ position: "relative", display: "flex", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 300 300">
        {[25, 50, 75, 100].map((ring) => (
          <circle key={ring} cx={C} cy={C} r={(R * ring) / 100} fill="none" stroke="#d6dee0" strokeWidth={1} />
        ))}
        {letters.map((l, i) => {
          const e = polar(100, i);
          return <line key={l} x1={C} y1={C} x2={e.x} y2={e.y} stroke="#d6dee0" strokeWidth={1} />;
        })}
        <path d={d} fill="rgba(218,165,126,0.18)" stroke="#c49473" strokeWidth={1.6} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#c49473" />
        ))}
      </svg>
      {letters.map((l, i) => (
        <div
          key={l}
          style={{
            position: "absolute",
            left: labels[i].left,
            top: labels[i].top,
            width: labelBox,
            display: "flex",
            justifyContent: labels[i].align,
            fontSize: 15,
            color: "#303a3d",
          }}
        >
          {poles[l].label} {l}
        </div>
      ))}
    </div>
  );
}
