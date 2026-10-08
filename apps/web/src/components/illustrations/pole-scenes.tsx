import type { Letter } from "@/lib/questionnaires";
import { loop, motion, outline, sparkle, stage, type Scene } from "./scene";

/**
 * One everyday picture for each end of the four pairs. They show where a preference starts, never
 * how much of it anyone has: a result draws its leaning end in full and the other end faded.
 */

/** E: energy from talking it through — voices overlapping, one after another. */
const extraversion: Scene = (p) => (
  <g>
    {stage(p, false)}
    <g {...motion("pop", 1)} {...loop("bob", 1)}>
      <path d="M34 34h44a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10H50l-9 8v-8h-7a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z" fill={p.light} {...outline(p)} />
      <circle cx="44" cy="51" r="2.2" fill={p.ink} {...loop("typing", 1)} />
      <circle cx="55" cy="51" r="2.2" fill={p.ink} {...loop("typing", 2)} />
      <circle cx="66" cy="51" r="2.2" fill={p.ink} {...loop("typing", 3)} />
    </g>
    <g {...motion("pop", 3)} {...loop("bob", 4)}>
      <path d="M86 52h38a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10h-4v8l-9-8H86a10 10 0 0 1-10-10V62a10 10 0 0 1 10-10z" fill={p.warm} {...outline(p)} />
      <path d="M88 63h32M88 71h20" stroke={p.light} strokeWidth={2} strokeLinecap="round" />
    </g>
    <g {...motion("pop", 5)} {...loop("bob", 7)}>
      <rect x="42" y="82" width="46" height="20" rx="10" fill={p.tone} {...outline(p)} />
      <path d="M52 92h26" stroke={p.ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  </g>
);

/** I: energy back in a quiet corner — an armchair under a lamp that warms up. */
const introversion: Scene = (p) => (
  <g>
    {stage(p)}
    <circle cx="118" cy="48" r="22" fill={p.glow} {...motion("glow")} {...loop("breathe")} />
    <path d="M118 44v60M110 104h16" {...outline(p)} />
    <path d="M108 46h20l-5-14h-10z" fill={p.warm} {...outline(p)} />
    <rect x="50" y="50" width="48" height="38" rx="10" fill={p.tone} {...outline(p)} />
    <rect x="54" y="78" width="40" height="12" rx="4" fill={p.light} {...outline(p)} />
    <rect x="41" y="66" width="14" height="28" rx="6" fill={p.tone} {...outline(p)} />
    <rect x="93" y="66" width="14" height="28" rx="6" fill={p.tone} {...outline(p)} />
    <path d="M48 94v10M100 94v10" {...outline(p)} />
    <path d="M20 92h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" fill={p.light} {...outline(p)} />
    <path d="M32 94h1.5a3 3 0 0 1 0 6H32" {...outline(p, 1.2)} />
    <path d="M24 88c-2.5-3 2.5-5 0-9M29 88c-2.5-3 2.5-5 0-9" {...outline(p, 1)} {...motion("steam", 2)} {...loop("steam", 2)} />
  </g>
);

/** S: facts close up — a magnifying glass comes to rest over a leaf. */
const sensing: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M34 94C38 62 64 44 104 44C102 78 76 98 34 94z" fill={p.tone} {...outline(p)} />
    <path d="M34 94C56 80 80 64 104 44" {...outline(p, 1.2)} />
    <path d="M54 82l-3-12M66 74l-2-13M78 66v-11M60 79l12 4M73 70l12 4M86 60l10 3" {...outline(p, 1)} />
    <g {...motion("glide")} {...loop("wander")}>
      <circle cx="96" cy="68" r="20" fill={p.light} fillOpacity={0.6} {...outline(p, 2)} />
      <path d="M110 82l16 16" stroke={p.ink} strokeWidth={9} strokeLinecap="round" />
      <path d="M110 82l16 16" stroke={p.warm} strokeWidth={6} strokeLinecap="round" />
    </g>
  </g>
);

/** N: connections and what might be — points joined into a constellation, line by line. */
const intuition: Scene = (p) => (
  <g>
    {stage(p, false)}
    <path d="M36 82L54 52L80 66L100 34" pathLength={1} {...outline(p, 1.2)} {...motion("draw")} />
    <path d="M80 66L124 58" pathLength={1} {...outline(p, 1.2)} {...motion("draw", 3)} />
    <path d="M80 66L92 94" pathLength={1} {...outline(p, 1.2)} {...motion("draw", 4)} />
    <path d="M124 58L134 88" stroke={p.ink} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="2 4" {...loop("flow-6")} />
    <circle cx="134" cy="88" r="3.5" fill={p.light} {...outline(p, 1.2)} />
    <circle cx="36" cy="82" r="3" fill={p.ink} />
    <circle cx="54" cy="52" r="3" fill={p.ink} />
    <circle cx="80" cy="66" r="3.5" fill={p.ink} />
    <circle cx="124" cy="58" r="3" fill={p.ink} />
    <circle cx="92" cy="94" r="3" fill={p.ink} />
    {sparkle(100, 32, 11, p.warm, p.ink, 5)}
    {sparkle(58, 26, 4, p.ink, undefined, 2)}
    {sparkle(128, 30, 3, p.ink, undefined, 6)}
    {sparkle(34, 56, 3, p.ink, undefined, 4)}
  </g>
);

/** T: one standard for both sides — a balance that tips and settles level. */
const thinking: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M80 38v58" {...outline(p, 1.8)} />
    <path d="M66 104l4-8h20l4 8z" fill={p.tone} {...outline(p)} />
    <g {...motion("tip")} {...loop("tip")}>
      <path d="M44 44h72" {...outline(p, 2)} />
      <path d="M44 44L34 72M44 44L54 72M116 44L106 72M116 44L126 72" {...outline(p, 1)} />
      <rect x="38" y="60" width="12" height="12" rx="1" fill={p.tone} {...outline(p)} />
      <path d="M30 72h28a14 7 0 0 1-28 0z" fill={p.light} {...outline(p)} />
      <circle cx="116" cy="65" r="7" fill={p.warm} {...outline(p)} />
      <path d="M102 72h28a14 7 0 0 1-28 0z" fill={p.light} {...outline(p)} />
    </g>
    <circle cx="80" cy="37" r="3.5" fill={p.light} {...outline(p)} />
  </g>
);

/** F: what matters to the people involved — two cups, and a heart that beats between them. */
const feeling: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M42 72h28v24a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8z" fill={p.light} {...outline(p)} />
    <path d="M42 78h-3a6 6 0 0 0 0 12h3" {...outline(p)} />
    <path d="M90 72h28v24a8 8 0 0 1-8 8H98a8 8 0 0 1-8-8z" fill={p.tone} {...outline(p)} />
    <path d="M118 78h3a6 6 0 0 1 0 12h-3" {...outline(p)} />
    <path d="M56 66c-4-6 4-8 0-14M104 66c4-6-4-8 0-14" {...outline(p, 1.2)} {...motion("steam", 1)} {...loop("steam", 1)} />
    <path d="M80 58c-13-7-16-16-11-21 3.5-3.5 9-2.5 11 2 2-4.5 7.5-5.5 11-2 5 5 2 14-11 21z" fill={p.warm} {...outline(p)} {...motion("beat")} {...loop("beat")} />
  </g>
);

/** J: settled ahead of time — a calendar ticked off day by day, the date circled. */
const judging: Scene = (p) => {
  const check = (x: number, y: number, step: number) => <path d={`M${x - 4} ${y}l3 3 6-6`} pathLength={1} {...outline(p, 1.5)} {...motion("draw", step)} />;
  const dot = (x: number, y: number) => <circle cx={x} cy={y} r="1.6" fill={p.ink} fillOpacity={0.45} />;
  return (
    <g>
      {stage(p, false)}
      <rect x="38" y="32" width="84" height="70" rx="6" fill={p.light} {...outline(p)} />
      <path d="M38 48V38a6 6 0 0 1 6-6h72a6 6 0 0 1 6 6v10z" fill={p.tone} {...outline(p)} />
      <path d="M58 26v12M102 26v12" {...outline(p, 3)} />
      {check(52, 60, 1)}{check(70, 60, 2)}{check(88, 60, 3)}{check(106, 60, 4)}
      {check(52, 74, 5)}{check(70, 74, 6)}{dot(88, 74)}{dot(106, 74)}
      {dot(52, 88)}{dot(70, 88)}
      <circle cx="88" cy="88" r="6" fill={p.warm} {...outline(p, 1.2)} {...motion("pop", 7)} {...loop("pulse", 7)} />
      {dot(106, 88)}
    </g>
  );
};

/** P: room to adjust — a fork in the road, and a signpost swinging both ways. */
const perceiving: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M76 106C76 94 78 86 80 78C72 64 56 54 46 38M80 78C90 64 106 56 116 38" stroke={p.tone} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M76 106C76 94 78 86 80 78C72 64 56 54 46 38M80 78C90 64 106 56 116 38" stroke={p.light} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="3 5" {...motion("flow")} {...loop("flow-8")} />
    <path d="M98 104V58" {...outline(p, 1.8)} />
    <path d="M98 60h18l5 5-5 5H98z" fill={p.warm} {...outline(p)} {...motion("swing")} {...loop("swing")} />
    <path d="M98 74H82l-5 5 5 5h16z" fill={p.light} {...outline(p)} {...motion("swing-r", 2)} {...loop("swing-r", 2)} />
    <path d="M22 104a8 8 0 0 1 16 0z" fill={p.tone} {...outline(p)} />
    <path d="M128 104a6 6 0 0 1 12 0z" fill={p.tone} {...outline(p)} />
  </g>
);

export const poleScenes: Record<Letter, Scene> = {
  E: extraversion,
  I: introversion,
  S: sensing,
  N: intuition,
  T: thinking,
  F: feeling,
  J: judging,
  P: perceiving,
};
