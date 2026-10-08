import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { GUANJI_WORDMARK_PATHS, LOOK_WITHIN_WORDMARK_PATHS, MIRROR_WORDMARK_PATHS } from "./wordmark-paths";

/** Lockup artwork width per locale: `mirror | 观己` and the longer `mirror | look within`, both 40 tall. */
const LOGO_VIEWBOX_WIDTH: Record<Locale, number> = { zh: 194, en: 232 };
/** Without the divider and tagline the artwork ends just after the wordmark (x 123.5), identical in both locales. */
const WORDMARK_VIEWBOX_WIDTH = 126;
const TAGLINE_PATHS: Record<Locale, readonly { d: string; transform: string }[]> = { zh: GUANJI_WORDMARK_PATHS, en: LOOK_WITHIN_WORDMARK_PATHS };

function logoViewBoxWidth(locale: Locale, tagline: boolean) {
  return tagline ? LOGO_VIEWBOX_WIDTH[locale] : WORDMARK_VIEWBOX_WIDTH;
}

/**
 * Rendered width at the glyph scale a Chinese lockup of `zhWidth` has: a locale's lockup (e.g. OG images),
 * or with `tagline` false the mark and wordmark that phone headers share across locales.
 */
export function brandLogoWidth(locale: Locale, zhWidth: number, tagline = true) {
  return Math.round((zhWidth * logoViewBoxWidth(locale, tagline)) / LOGO_VIEWBOX_WIDTH.zh);
}

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
    <g>
      <path
        d="M25 9C14.5 9 7 18.5 7 32s7.5 23 18 23V9ZM39 9c10.5 0 18 9.5 18 23s-7.5 23-18 23V9Z"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3" fill={accent} />
    </g>
  );
}

/** Decorative by default: the surrounding link or image supplies the accessible name. */
export function BrandMark({ className, style, tone = "ink", monochrome = false, size = 64 }: BrandProps & { size?: number }) {
  const color = BRAND_COLORS[tone];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      {MirrorContours({ color, accent: monochrome ? color : BRAND_COLORS.warm })}
    </svg>
  );
}

/**
 * All lettering is outlined, so the same artwork works in browsers, SVG exports and Satori.
 * The tagline after the divider follows the locale: 观己 in Chinese, "look within" in English.
 * `tagline={false}` drops the divider and tagline (phone headers); the mark and wordmark keep their place and scale.
 */
export function BrandLogo({ className, style, tone = "ink", monochrome = false, locale = "zh", tagline = true, width }: BrandProps & { locale?: Locale; tagline?: boolean; width?: number }) {
  const color = BRAND_COLORS[tone];
  const viewBoxWidth = logoViewBoxWidth(locale, tagline);
  const renderedWidth = width ?? viewBoxWidth;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={renderedWidth} height={renderedWidth * 40 / viewBoxWidth} viewBox={`0 0 ${viewBoxWidth} 40`} fill="none" className={className} style={style} aria-hidden="true" focusable="false">
      <g transform="translate(0 4) scale(.5)">
        {MirrorContours({ color, accent: monochrome ? color : BRAND_COLORS.warm })}
      </g>
      <g transform="translate(42 0)" fill={color}>
        {MIRROR_WORDMARK_PATHS.map((glyph, index) => <path key={index} {...glyph} />)}
        {tagline ? <path d="M104 14v13" stroke={color} strokeWidth=".65" opacity=".5" /> : null}
        {tagline ? TAGLINE_PATHS[locale].map((glyph, index) => <path key={index} {...glyph} />) : null}
      </g>
    </svg>
  );
}

/** Full-bleed paper background; artwork fits inside the central maskable safe area. */
export function BrandAppIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: BRAND_COLORS.paper }}>
      {BrandMark({ size: size * 0.75 })}
    </div>
  );
}
