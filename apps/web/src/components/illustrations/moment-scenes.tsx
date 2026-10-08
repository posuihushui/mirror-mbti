import type { CompareRelationship } from "@/lib/compare-types";
import { loop, motion, outline, sparkle, stage, type IllustrationPalette, type Scene } from "./scene";

/**
 * Scenes between two people, drawn as what they share rather than who they are: no faces, so a
 * forwarded invitation never looks like a compatibility test. Each relationship's scene is the
 * moment its example is about (the anniversary, the weekend plan, the trip home, the deadline).
 */

const table = (p: IllustrationPalette) => (
  <g>
    <rect x="22" y="84" width="116" height="4" rx="1.5" fill={p.light} {...outline(p)} />
    <path d="M30 88v16M130 88v16" {...outline(p)} />
  </g>
);

/** Two chairs turned toward each other under one lamp: a conversation, with nobody in it yet. */
export const pairScene: Scene = (p) => (
  <g>
    {stage(p)}
    <ellipse cx="80" cy="58" rx="32" ry="20" fill={p.glow} {...motion("glow", 3)} {...loop("breathe", 3)} />
    <g {...motion("hang")} {...loop("hang")}>
      <path d="M80 18v14" {...outline(p, 1)} />
      <path d="M70 42h20l-4-10h-12z" fill={p.warm} {...outline(p)} />
    </g>
    <path d="M80 78v24M72 104h16" {...outline(p)} />
    <path d="M67 78v-7h8v7z" fill={p.light} {...outline(p, 1.2)} {...motion("pop", 4)} />
    <path d="M85 78v-7h8v7z" fill={p.light} {...outline(p, 1.2)} {...motion("pop", 5)} />
    <path d="M63 78h34" {...outline(p, 2.5)} />
    <g {...motion("slide-l", 1)}>
      <rect x="30" y="50" width="7" height="42" rx="3.5" fill={p.tone} {...outline(p)} />
      <rect x="30" y="80" width="26" height="6" rx="2" fill={p.tone} {...outline(p)} />
      <path d="M34 86v18M52 86v18" {...outline(p)} />
    </g>
    <g {...motion("slide-r", 1)}>
      <rect x="123" y="50" width="7" height="42" rx="3.5" fill={p.light} {...outline(p)} />
      <rect x="104" y="80" width="26" height="6" rx="2" fill={p.light} {...outline(p)} />
      <path d="M108 86v18M126 86v18" {...outline(p)} />
    </g>
  </g>
);

/** Partners: two cups, and a date circled on the calendar. */
const partner: Scene = (p) => {
  const dot = (x: number, y: number) => <circle cx={x} cy={y} r="1.5" fill={p.ink} fillOpacity={0.45} />;
  return (
    <g>
      {stage(p)}
      <rect x="58" y="24" width="44" height="40" rx="3" fill={p.light} {...outline(p)} />
      <path d="M58 34v-7a3 3 0 0 1 3-3h38a3 3 0 0 1 3 3v7z" fill={p.tone} {...outline(p)} />
      <path d="M68 20v7M92 20v7" {...outline(p, 2)} />
      {dot(66, 42)}{dot(75, 42)}{dot(84, 42)}{dot(93, 42)}
      {dot(66, 50)}{dot(75, 50)}{dot(84, 50)}{dot(93, 50)}
      {dot(66, 58)}{dot(75, 58)}{dot(93, 58)}
      <circle cx="84" cy="57.5" r="4.5" fill={p.warm} {...outline(p, 1)} {...motion("pop", 5)} {...loop("pulse", 5)} />
      {table(p)}
      <g {...motion("slide-l", 1)}>
        <path d="M56 70h14v9a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" fill={p.light} {...outline(p)} />
        <path d="M70 73h2a3 3 0 0 1 0 6h-2" {...outline(p, 1.2)} />
      </g>
      <g {...motion("slide-r", 1)}>
        <path d="M90 70h14v9a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" fill={p.tone} {...outline(p)} />
        <path d="M90 73h-2a3 3 0 0 0 0 6h2" {...outline(p, 1.2)} />
      </g>
      <path d="M63 66c-2-3 2-4 0-7M97 66c-2-3 2-4 0-7" {...outline(p, 1)} {...motion("steam", 3)} {...loop("steam", 3)} />
      <path d="M118 84l-2-10h8l-2 10z" fill={p.tone} {...outline(p, 1.2)} />
      <path d="M120 74v-7" {...outline(p, 1)} />
      <circle cx="120" cy="64" r="3" fill={p.light} {...outline(p, 1)} />
    </g>
  );
};

/** Friends: two tickets for the weekend. */
const friend: Scene = (p) => (
  <g>
    {stage(p)}
    <g {...motion("slide-l")} {...loop("bob")}>
      <g transform="rotate(-12 66 60)">
        <path d="M42 46h48v9a5 5 0 0 0 0 10v9H42v-9a5 5 0 0 0 0-10z" fill={p.light} {...outline(p)} />
        <path d="M78 46v28" stroke={p.ink} strokeWidth={1} strokeDasharray="2 3" />
        <path d="M50 56h18M50 64h12" {...outline(p, 1.2)} />
      </g>
    </g>
    <g {...motion("slide-r", 2)} {...loop("bob", 5)}>
      <g transform="rotate(10 96 78)">
        <path d="M72 64h48v9a5 5 0 0 0 0 10v9H72v-9a5 5 0 0 0 0-10z" fill={p.warm} {...outline(p)} />
        <path d="M108 64v28" stroke={p.ink} strokeWidth={1} strokeDasharray="2 3" />
        <path d="M80 74h18M80 82h12" stroke={p.light} strokeWidth={1.5} strokeLinecap="round" />
      </g>
    </g>
    {sparkle(40, 32, 4, p.ink, undefined, 4)}
    {sparkle(124, 34, 5, p.ink, undefined, 5)}
    {sparkle(34, 90, 3, p.ink, undefined, 6)}
  </g>
);

/** Family: the trip home — a lit window and a suitcase at the door. */
const family: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M97 38c-3-4 3-6 0-10" {...outline(p, 1)} {...motion("steam", 4)} {...loop("steam", 4)} />
    <rect x="94" y="42" width="7" height="16" fill={p.tone} {...outline(p)} />
    <rect x="50" y="66" width="52" height="38" fill={p.light} {...outline(p)} />
    <path d="M44 68L76 40L108 68z" fill={p.tone} {...outline(p)} />
    <rect x="57" y="76" width="15" height="12" fill={p.warm} {...outline(p)} {...motion("light", 2)} {...loop("lamp", 2)} />
    <path d="M64.5 76v12M57 82h15" {...outline(p, 1)} />
    <rect x="81" y="80" width="13" height="24" fill={p.tone} {...outline(p)} />
    <circle cx="91" cy="92" r="1.2" fill={p.ink} />
    <g {...motion("slide-r", 3)}>
      <path d="M118 84v-4h10v4" {...outline(p)} />
      <rect x="110" y="84" width="26" height="20" rx="3" fill={p.tone} {...outline(p)} />
      <path d="M116 84v20M130 84v20" stroke={p.light} strokeWidth={2} />
    </g>
  </g>
);

/** Colleagues: two laptops at one desk, and the plan on the board between them. */
const colleague: Scene = (p) => (
  <g>
    {stage(p)}
    <rect x="52" y="24" width="56" height="34" rx="2" fill={p.light} {...outline(p)} />
    <rect x="60" y="44" width="7" height="9" fill={p.tone} {...outline(p, 1)} {...motion("grow-y", 2)} {...loop("bars", 2)} />
    <rect x="71" y="38" width="7" height="15" fill={p.tone} {...outline(p, 1)} {...motion("grow-y", 3)} {...loop("bars", 3)} />
    <rect x="82" y="32" width="7" height="21" fill={p.warm} {...outline(p, 1)} {...motion("grow-y", 4)} {...loop("bars", 4)} />
    <rect x="93" y="40" width="7" height="13" fill={p.tone} {...outline(p, 1)} {...motion("grow-y", 5)} {...loop("bars", 5)} />
    <path d="M58 53h44" {...outline(p, 1.2)} />
    {table(p)}
    <g {...motion("rise", 1)}>
      <rect x="32" y="62" width="28" height="19" rx="2" fill={p.tone} {...outline(p)} />
      <path d="M38 69h14M38 74h9" {...outline(p, 1.2)} />
      <path d="M28 84h36l-3-3H31z" fill={p.light} {...outline(p, 1.2)} />
    </g>
    <g {...motion("rise", 2)}>
      <rect x="100" y="62" width="28" height="19" rx="2" fill={p.deep} {...outline(p)} />
      <path d="M106 69h14M106 74h9" stroke={p.light} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M96 84h36l-3-3H99z" fill={p.light} {...outline(p, 1.2)} />
    </g>
    <path d="M76 84v-8h8v8z" fill={p.light} {...outline(p, 1.2)} />
  </g>
);

export const relationshipScenes: Record<CompareRelationship, Scene> = { partner, friend, family, colleague };
