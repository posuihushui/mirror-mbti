import type { CSSProperties } from "react";
import { BRAND_COLORS } from "./brand-logo";

/**
 * A result's own mirror: the brand's two facing contours, reshaped by the four preferences.
 * - E/I sets the space between the halves (introversion leaves more room at the centre).
 * - S/N sets their proportion (intuition reaches taller, sensing sits lower and wider).
 * - T/F sets the centre (thinking a ring, feeling a filled dot).
 * - J/P sets closure (judging closes each half, perceiving leaves it open).
 * Near-balanced dimensions stay close to the logo's own geometry, so an all-balanced result
 * looks like the brand mark. It is decorative: the type and scores are always stated in text.
 */
export type MirrorProfile = { type: string; values: number[] };

/** The four pairs in scoring order; kept local so the mark never pulls question text into a bundle. */
const PAIRS = ["EI", "SN", "TF", "JP"] as const;

type Props = {
  profile: MirrorProfile;
  size?: number;
  tone?: "ink" | "paper";
  className?: string;
  style?: CSSProperties;
};

/** 0 at an even split, 1 at a full lean. */
function strength(value: number) {
  return Math.min(Math.max((value - 50) / 50, 0), 1);
}

/** A signed lean per dimension: positive toward the first letter of the pair (E, S, T, J). */
function leans(profile: MirrorProfile) {
  return PAIRS.map((pair, i) => {
    const letter = profile.type[i];
    const s = strength(profile.values[i] ?? 50);
    return letter === pair[0] ? s : -s;
  });
}

const round = (n: number) => Math.round(n * 100) / 100;

/** One half's outer curve, open at the inner edge (drawn separately), like the logo's `D` contours. */
function curvePath(side: -1 | 1, inner: number, depth: number, height: number) {
  const top = 32 - height / 2;
  const bottom = 32 + height / 2;
  const outer = inner + side * depth;
  // Control points follow the logo's curve (10.5/18 across, 9.5/23 down).
  const cx = inner + side * depth * 0.583;
  const cy = (height / 2) * 0.413;
  return `M${round(inner)} ${round(top)}C${round(cx)} ${round(top)} ${round(outer)} ${round(top + cy)} ${round(outer)} 32`
    + `S${round(cx)} ${round(bottom)} ${round(inner)} ${round(bottom)}`;
}

function edgePath(x: number, height: number) {
  return `M${round(x)} ${round(32 - height / 2)}V${round(32 + height / 2)}`;
}

export type MirrorGeometry = {
  left: string;
  right: string;
  /** Both inner edges as one path. */
  edges: string;
  /** Judging closes each half, perceiving leaves it open, a near-even pair draws it dotted. */
  edge: "solid" | "dotted" | "none";
  ring: boolean;
  dot: number;
};

function geometry(gap: number, height: number, depth: number, edge: MirrorGeometry["edge"], ring: boolean, dot: number): MirrorGeometry {
  return {
    left: curvePath(-1, 32 - gap / 2, depth, height),
    right: curvePath(1, 32 + gap / 2, depth, height),
    edges: `${edgePath(32 - gap / 2, height)}${edgePath(32 + gap / 2, height)}`,
    edge,
    ring,
    dot,
  };
}

export function mirrorGeometry(profile: MirrorProfile): MirrorGeometry {
  const [ei, sn, tf, jp] = leans(profile);
  // E/I: the logo's gap is 14; introversion (negative) widens it to 20, extraversion narrows it to 10.
  const gap = 14 - ei * (ei > 0 ? 4 : 6);
  // S/N: sensing (positive) sits lower and wider, intuition taller and narrower.
  const height = 46 - sn * 10;
  const depth = Math.min(18 + sn * 3, (56 - gap) / 2);
  // The centre never touches the inner edges, however close an extraverted pair sits.
  const dot = Math.min(2.5 + Math.abs(tf) * 1.5, gap / 2 - 1.8);
  const edge = Math.abs(jp) < 0.2 ? "dotted" : jp > 0 ? "solid" : "none";
  return geometry(gap, height, depth, edge, tf > 0, dot);
}

/** The brand mark's own geometry: where every reveal starts. */
export const LOGO_GEOMETRY = geometry(14, 46, 18, "solid", false, 3);

/** About 1.3px on screen at any size: thin at display sizes, the logo's weight at icon sizes. */
export function mirrorStroke(size: number) {
  return Math.min(Math.max(150 / size, 1.3), 2.6);
}

/** Round dots, one stroke wide, so an open edge reads the same at every size. */
export function dottedEdge(stroke: number) {
  return `0.01 ${round(stroke * 2.4)}`;
}

export function MirrorMark({ profile, size = 96, tone = "ink", className, style }: Props) {
  const color = BRAND_COLORS[tone];
  const g = mirrorGeometry(profile);
  const stroke = mirrorStroke(size);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d={g.left} />
        <path d={g.right} />
        {g.edge !== "none" && <path d={g.edges} strokeDasharray={g.edge === "dotted" ? dottedEdge(stroke) : undefined} />}
      </g>
      {g.ring ? (
        <circle cx="32" cy="32" r={g.dot} stroke={BRAND_COLORS.warm} strokeWidth={Math.max(stroke, 1.4)} />
      ) : (
        <circle cx="32" cy="32" r={g.dot} fill={BRAND_COLORS.warm} />
      )}
    </svg>
  );
}

/** The canonical mark for a type page or card: every dimension at a clear, even lean. */
export function typeMirrorProfile(type: string): MirrorProfile {
  return { type, values: [75, 75, 75, 75] };
}

/**
 * A mark from qualitative categories (a pair guide or a public card never carries scores): a clear
 * side draws at the canonical lean, a near-even pair (anything that is not one of its letters) at the midpoint.
 */
export function categoryMirrorProfile(categories: readonly (string | null | undefined)[]): MirrorProfile {
  const side = (i: number) => {
    const c = categories[i];
    return c && c.length === 1 && PAIRS[i].includes(c) ? c : null;
  };
  return {
    type: PAIRS.map((pair, i) => side(i) ?? pair[0]).join(""),
    values: PAIRS.map((_, i) => (side(i) ? 75 : 50)),
  };
}
