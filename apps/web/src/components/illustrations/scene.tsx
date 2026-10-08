import type { ReactElement } from "react";
import { SceneSvg } from "./scene-svg";

/**
 * The site's spot illustrations: small still lifes drawn as SVG, never photos of people. Each scene
 * stands in the brand's arch (a mirror seen from the front) on a 160×120 canvas, in a few cool tones,
 * ink outlines and one warm accent, so every picture belongs to the same paper-and-ink page.
 *
 * Scenes are plain functions of a palette that return one `<g>`: the same function draws on the page
 * (paper or night) and inside Satori's PNGs, which need literal colours and native SVG elements.
 * They are decorative: whatever a picture shows is always said in the text beside it.
 *
 * On the page a scene enters once when it is first seen, then keeps a small loop going while it is on
 * screen (`SceneSvg`, with the keyframes in `app/illustration-motion.css`). Parts carry `data-a` (their
 * entrance) with `data-d` (its step in a sequence), and `data-loop` (their loop) with `data-ld` (its
 * offset). Entrances only fill backwards and every loop starts and ends at rest, so the drawing's own
 * attributes are always a real frame; Satori and resvg ignore the hooks. Never put a hook on an element with a `transform`
 * attribute (a CSS transform would replace it): wrap it in a `<g>` and animate that.
 */
export type IllustrationPalette = {
  /** The arch behind every scene. */
  arch: string;
  /** Ground lines, rain, faint grids. */
  ground: string;
  /** The mid fill of most objects. */
  tone: string;
  /** Pages, cups, highlights. */
  light: string;
  /** The darkest fill (a record, a screen). */
  deep: string;
  /** Outlines. */
  ink: string;
  /** The one warm accent. */
  warm: string;
  /** Lamp light and glows around the accent. */
  glow: string;
};

export const ILLUSTRATION_PALETTES = {
  /** On paper `#edf2f3` and cards `#f2f6f7`. */
  paper: { arch: "#dfe8ea", ground: "#c3cfd3", tone: "#c9d5d9", light: "#f8fbfb", deep: "#3f4b50", ink: "#2a3235", warm: "#c49473", glow: "#ecdccf" },
  /** On the night surfaces (`#121718`): the same scene after dark, lit by its warm accent. */
  night: { arch: "#1c2427", ground: "#34403f", tone: "#2e3a3e", light: "#465459", deep: "#0c1011", ink: "#c3ced1", warm: "#c49473", glow: "#3d332c" },
} as const satisfies Record<string, IllustrationPalette>;

export type IllustrationTone = keyof typeof ILLUSTRATION_PALETTES;
export type Scene = (p: IllustrationPalette) => ReactElement;

export const VIEW_WIDTH = 160;
export const VIEW_HEIGHT = 120;

/** Entrance hook: the animation a part enters with (see `app/illustration-motion.css`) and its step in a sequence. */
export function motion(name: string, step?: number) {
  return step ? { "data-a": name, "data-d": String(step) } : { "data-a": name };
}

/** Loop hook: the small motion a part repeats after the entrance while the scene is on screen, and its offset. */
export function loop(name: string, step?: number) {
  return step ? { "data-loop": name, "data-ld": String(step) } : { "data-loop": name };
}

/** Outline props for a shape: ink, 1.5 units, round ends. */
export function outline(p: IllustrationPalette, width = 1.5) {
  return { stroke: p.ink, strokeWidth: width, strokeLinecap: "round", strokeLinejoin: "round" } as const;
}

/** The arch every scene stands in, and the ground line under it. */
export function stage(p: IllustrationPalette, ground = true) {
  return (
    <g>
      <path d="M40 104V58a40 40 0 0 1 80 0v46z" fill={p.arch} {...motion("stage")} />
      {ground && <path d="M16 104h128" stroke={p.ground} strokeWidth={1.5} strokeLinecap="round" />}
    </g>
  );
}

/** A four-pointed sparkle centred on (x, y). */
export function sparkle(x: number, y: number, r: number, fill: string, stroke?: string, step?: number) {
  const k = r * 0.3;
  return <path d={`M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : undefined} strokeLinejoin="round" {...motion("twinkle", step)} {...loop("twinkle", step)} />;
}

type Props = {
  scene: Scene;
  tone?: IllustrationTone;
  className?: string;
  /** Pixel size for Satori, which needs explicit dimensions and gets a still `<svg>`; the page sizes scenes with classes. */
  width?: number;
};

export function Illustration({ scene, tone = "paper", className, width }: Props) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`,
    width,
    height: width ? (width * VIEW_HEIGHT) / VIEW_WIDTH : undefined,
    fill: "none",
    className,
    "aria-hidden": true,
    focusable: "false",
    "data-scene": "",
  } as const;
  const content = <g {...motion("scene")}>{scene(ILLUSTRATION_PALETTES[tone])}</g>;
  // Satori is handed a plain `<svg>`; the page gets the island that plays the scene once.
  return width ? <svg {...props}>{content}</svg> : <SceneSvg {...props}>{content}</SceneSvg>;
}
