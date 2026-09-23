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

/** One half: a flat inner edge and a curved outer edge, like the logo's `D` contours. */
function halfPath(side: -1 | 1, inner: number, depth: number, height: number, closed: boolean) {
  const top = 32 - height / 2;
  const bottom = 32 + height / 2;
  const outer = inner + side * depth;
  // Control points follow the logo's curve (10.5/18 across, 9.5/23 down).
  const cx = inner + side * depth * 0.583;
  const cy = (height / 2) * 0.413;
  const d = `M${round(inner)} ${round(top)}C${round(cx)} ${round(top)} ${round(outer)} ${round(top + cy)} ${round(outer)} 32`
    + `S${round(cx)} ${round(bottom)} ${round(inner)} ${round(bottom)}`;
  return closed ? `${d}Z` : d;
}

export function mirrorGeometry(profile: MirrorProfile) {
  const [ei, sn, tf, jp] = leans(profile);
  // E/I: the logo's gap is 14; introversion (negative) widens it to 20, extraversion narrows it to 10.
  const gap = 14 - ei * (ei > 0 ? 4 : 6);
  // S/N: sensing (positive) sits lower and wider, intuition taller and narrower.
  const height = 46 - sn * 10;
  const depth = Math.min(18 + sn * 3, (56 - gap) / 2);
  // The centre never touches the inner edges, however close an extraverted pair sits.
  const dot = Math.min(2.5 + Math.abs(tf) * 1.5, gap / 2 - 1.8);
  return {
    left: halfPath(-1, 32 - gap / 2, depth, height, jp >= 0),
    right: halfPath(1, 32 + gap / 2, depth, height, jp >= 0),
    // A near-even J/P closes with a dashed edge rather than choosing a side.
    innerDash: Math.abs(jp) < 0.2,
    ring: tf > 0,
    dot,
    gap,
    height,
  };
}

export function MirrorMark({ profile, size = 96, tone = "ink", className, style }: Props) {
  const color = BRAND_COLORS[tone];
  const g = mirrorGeometry(profile);
  // About 1.3px on screen at any size: thin at display sizes, the logo's weight at icon sizes.
  const stroke = Math.min(Math.max(150 / size, 1.3), 2.6);
  const top = 32 - g.height / 2;
  const bottom = 32 + g.height / 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        {g.innerDash ? (
          <>
            <path d={g.left.replace(/Z$/, "")} />
            <path d={g.right.replace(/Z$/, "")} />
            {/* Round dots, one stroke wide, so the open edge reads the same at every size. */}
            <path d={`M${32 - g.gap / 2} ${top}V${bottom}M${32 + g.gap / 2} ${top}V${bottom}`} strokeDasharray={`0.01 ${round(stroke * 2.4)}`} />
          </>
        ) : (
          <>
            <path d={g.left} />
            <path d={g.right} />
          </>
        )}
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
