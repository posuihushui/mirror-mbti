import type { CSSProperties } from "react";
import { GUANJI_WORDMARK_PATHS, MIRROR_WORDMARK_PATHS } from "./wordmark-paths";

export const BRAND_COLORS = {
  ink: "#171b1c",
  paper: "#edf2f3",
  night: "#121718",
  warm: "#c49473",
} as const;

type BrandProps = {
  className?: string;
  style?: CSSProperties;
  tone?: "ink" | "paper";
  monochrome?: boolean;
};

/** Two facing mirror contours leave a quiet space for the self at the centre. */
function MirrorContours({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <path
        d="M25 9C14.5 9 7 18.5 7 32s7.5 23 18 23V9ZM39 9c10.5 0 18 9.5 18 23s-7.5 23-18 23V9Z"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3" fill={accent} />
    </>
  );
}

/** Decorative by default: the surrounding link or image supplies the accessible name. */
export function BrandMark({ className, style, tone = "ink", monochrome = false, size = 64 }: BrandProps & { size?: number }) {
  const color = BRAND_COLORS[tone];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      <MirrorContours color={color} accent={monochrome ? color : BRAND_COLORS.warm} />
    </svg>
  );
}

/** All lettering is outlined, so the same artwork works in browsers, SVG exports and Satori. */
export function BrandLogo({ className, style, tone = "ink", monochrome = false, width = 194 }: BrandProps & { width?: number }) {
  const color = BRAND_COLORS[tone];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={width * 40 / 194} viewBox="0 0 194 40" fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      <g transform="translate(0 4) scale(.5)">
        <MirrorContours color={color} accent={monochrome ? color : BRAND_COLORS.warm} />
      </g>
      <g transform="translate(42 0)" fill={color}>
        {MIRROR_WORDMARK_PATHS.map((glyph, index) => <path key={index} {...glyph} />)}
        <path d="M104 14v13" stroke={color} strokeWidth=".65" opacity=".5" />
        {GUANJI_WORDMARK_PATHS.map((glyph, index) => <path key={index} {...glyph} />)}
      </g>
    </svg>
  );
}

/** Full-bleed paper background; artwork fits inside the central maskable safe area. */
export function BrandAppIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_COLORS.paper }}>
      <BrandMark size={size * 0.75} />
    </div>
  );
}
