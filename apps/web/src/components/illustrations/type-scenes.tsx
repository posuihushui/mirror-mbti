import type { PersonalityType } from "@/lib/personality";
import { loop, motion, outline, sparkle, stage, type IllustrationPalette, type Scene } from "./scene";

/**
 * One still life per type, drawn from the type's own line (INFJ “温柔地理解世界，坚定地走向自己”
 * becomes a desk by a window with a path over the hills). Objects only, never a person: a face
 * would give every type an age, a gender and a look, and the reader should see themselves instead.
 */

const desk = (p: IllustrationPalette) => (
  <g>
    <rect x="18" y="86" width="124" height="5" rx="1.5" fill={p.light} {...outline(p)} />
    <path d="M26 91v13M134 91v13" {...outline(p)} />
  </g>
);

/** INFJ — understanding the world gently, walking steadily toward yourself. */
const INFJ: Scene = (p) => (
  <g>
    {stage(p)}
    <circle cx="98" cy="44" r="8" fill={p.warm} {...outline(p, 1.2)} {...motion("sunrise")} {...loop("bob-slow")} />
    <path d="M40 74C54 64 66 66 78 71C92 62 106 62 120 70V86H40z" fill={p.tone} />
    <path d="M40 74C54 64 66 66 78 71C92 62 106 62 120 70" {...outline(p, 1.2)} />
    <path d="M60 86C66 82 72 80 78 76S90 70 96 68" stroke={p.light} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="2 3" {...motion("flow", 2)} {...loop("flow-5", 2)} />
    {desk(p)}
    <path d="M58 86V77c7-3 15-3 22 0v9c-7-3-15-3-22 0zM80 86V77c7-3 15-3 22 0v9c-7-3-15-3-22 0z" fill={p.light} {...outline(p)} />
    <path d="M63 80.5h12M85 80.5h12" {...outline(p, 1)} />
    <path d="M28 86l2-10h14l2 10z" fill={p.tone} {...outline(p)} />
    <path d="M37 76c-7-3-9-11-5-15 4 3 6 9 5 15zM37 76c2-7 8-10 14-9-1 5-7 8-14 9z" fill={p.light} {...outline(p)} />
    <path d="M120 78h11v6a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z" fill={p.tone} {...outline(p)} />
  </g>
);

/** INFP — letting the inner light show more of what could be. */
const INFP: Scene = (p) => (
  <g>
    {stage(p)}
    <circle cx="80" cy="62" r="30" fill={p.glow} {...motion("glow")} {...loop("breathe")} />
    <rect x="46" y="94" width="68" height="10" rx="2" fill={p.tone} {...outline(p)} />
    <rect x="52" y="84" width="58" height="10" rx="2" fill={p.light} {...outline(p)} />
    <path d="M58 84v10M104 94v10" {...outline(p, 1)} />
    <rect x="66" y="78" width="28" height="6" rx="2" fill={p.tone} {...outline(p)} />
    <rect x="68" y="54" width="24" height="24" fill={p.light} fillOpacity={0.85} {...outline(p)} />
    <path d="M74 54v24M86 54v24" {...outline(p, 1)} />
    <path d="M80 74c-5-4-5-10 0-15 5 5 5 11 0 15z" fill={p.warm} {...outline(p, 1)} {...motion("flicker")} {...loop("flicker")} />
    <path d="M64 54l6-8h20l6 8z" fill={p.tone} {...outline(p)} />
    <path d="M72 46a8 8 0 0 1 16 0" {...outline(p)} />
    {sparkle(46, 34, 4, p.ink, undefined, 2)}
    {sparkle(118, 30, 5, p.ink, undefined, 4)}
    {sparkle(128, 66, 3, p.ink, undefined, 6)}
    {sparkle(34, 64, 3, p.ink, undefined, 5)}
  </g>
);

/** ENFJ — when people see each other, change can happen: a lighthouse for others to steer by. */
const ENFJ: Scene = (p) => (
  <g>
    {stage(p, false)}
    <path d="M88 41L138 26V56z" fill={p.glow} {...motion("beam-r", 2)} {...loop("beam")} />
    <path d="M72 41L22 26V56z" fill={p.glow} {...motion("beam-l", 2)} {...loop("beam-late")} />
    <path d="M16 98c5-3 11-3 16 0s11 3 16 0 11-3 16 0 11 3 16 0 11-3 16 0 11 3 16 0 11-3 16 0 11 3 16 0V104H16z" fill={p.tone} />
    <path d="M56 100c2-8 8-12 14-12h20c6 0 12 4 14 12z" fill={p.tone} {...outline(p)} />
    <path d="M68 90l4-44h16l4 44z" fill={p.light} {...outline(p)} />
    <path d="M69.1 78L69.8 70H90.2L90.9 78zM70.5 62L71.1 56H88.9L89.5 62z" fill={p.tone} {...outline(p, 1)} />
    <path d="M77 90v-7a3 3 0 0 1 6 0v7" fill={p.tone} {...outline(p, 1.2)} />
    <rect x="72" y="36" width="16" height="10" fill={p.warm} {...outline(p)} {...motion("light")} {...loop("lamp")} />
    <path d="M66 46h28" {...outline(p, 2)} />
    <path d="M69 36l11-9 11 9z" fill={p.tone} {...outline(p)} />
  </g>
);

/** ENFP — meeting the world and letting possibilities grow: a kite over a meadow. */
const ENFP: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M94 66C82 80 62 92 46 104" {...outline(p, 1)} />
    <path d="M94 66c-4 6 4 10 0 16s4 10 0 14" {...outline(p, 1)} />
    <path d="M90 74l4 3 4-3v6l-4-3-4 3zM91 87l4 3 4-3v6l-4-3-4 3z" fill={p.light} {...outline(p, 1)} />
    <g {...motion("sway")} {...loop("sway")}>
      <path d="M94 24L110 44L94 66L78 44z" fill={p.warm} {...outline(p)} />
      <path d="M94 24v42M78 44h32" {...outline(p, 1)} />
    </g>
    <path d="M30 104V90M122 104V86M134 104V93M60 104c0-4-2-6-4-8M64 104c0-5 2-7 4-9" {...outline(p, 1.2)} />
    <path d="M122 97c4-2 7-1 8 2-4 1-6 0-8-2z" fill={p.tone} {...outline(p, 1)} />
    <circle cx="30" cy="87" r="4" fill={p.light} {...outline(p, 1.2)} {...motion("pop", 3)} />
    <circle cx="122" cy="82" r="5" fill={p.tone} {...outline(p, 1.2)} {...motion("pop", 4)} />
    <circle cx="134" cy="90" r="3.5" fill={p.light} {...outline(p, 1.2)} {...motion("pop", 5)} />
    {sparkle(52, 36, 4, p.ink, undefined, 2)}
  </g>
);

/** INTJ — in the quiet, picturing a farther future: a telescope over a drafting grid. */
const INTJ: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M60 24V104M80 18V104M100 24V104M44 40H116M40 60H120M40 80H120" stroke={p.ground} strokeWidth={0.8} />
    {sparkle(112, 30, 10, p.warm, p.ink, 4)}
    {sparkle(56, 30, 3, p.ink, undefined, 2)}
    {sparkle(126, 58, 3, p.ink, undefined, 6)}
    <path d="M76 70L58 104M76 70L94 104M76 70V104" {...outline(p)} />
    <g {...motion("tilt")} {...loop("scan")}>
      <g transform="rotate(-42 76 68)">
        <rect x="50" y="62" width="50" height="13" rx="3" fill={p.light} {...outline(p)} />
        <rect x="42" y="65" width="9" height="7" rx="2" fill={p.tone} {...outline(p)} />
        <rect x="98" y="60" width="9" height="17" rx="2" fill={p.tone} {...outline(p)} />
        <path d="M66 62v13" {...outline(p, 1)} />
      </g>
    </g>
    <circle cx="76" cy="69" r="3.5" fill={p.ink} />
  </g>
);

/** INTP — staying curious, seeing the other side of a question: light split by a prism. */
const INTP: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M20 56L68 64" pathLength={1} {...outline(p)} {...motion("draw")} />
    <path d="M88 60L138 44" pathLength={1} stroke={p.tone} strokeWidth={3.5} strokeLinecap="round" {...motion("draw", 3)} {...loop("glint", 3)} />
    <path d="M89 63L140 60" pathLength={1} stroke={p.warm} strokeWidth={3.5} strokeLinecap="round" {...motion("draw", 4)} {...loop("glint", 5)} />
    <path d="M89 66L136 78" pathLength={1} stroke={p.deep} strokeWidth={3.5} strokeLinecap="round" {...motion("draw", 5)} {...loop("glint", 7)} />
    <path d="M80 34L100 76H60z" fill={p.light} fillOpacity={0.92} {...outline(p)} />
    <rect x="54" y="76" width="52" height="9" rx="2" fill={p.tone} {...outline(p)} />
    <rect x="48" y="85" width="62" height="9" rx="2" fill={p.light} {...outline(p)} />
    <rect x="56" y="94" width="50" height="10" rx="2" fill={p.tone} {...outline(p)} />
    {sparkle(40, 34, 3, p.ink, undefined, 2)}
    {sparkle(124, 28, 4, p.ink, undefined, 6)}
  </g>
);

/** ENTJ — seeing the direction and carrying the idea into the world: a flag on the summit. */
const ENTJ: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M28 104L56 66L84 104z" fill={p.ground} {...outline(p, 1.2)} />
    <path d="M50 104L92 34L138 104z" fill={p.tone} {...outline(p)} />
    <path d="M83 49L92 34L101 49l-4.5 4-4.5-4-4.5 4z" fill={p.light} {...outline(p, 1.2)} />
    <path d="M76 104L100 90L82 78L98 66L90 56" stroke={p.light} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2.5 3" {...motion("flow")} {...loop("flow-5-5")} />
    <path d="M92 34V16" {...outline(p)} />
    <path d="M92 16h16l-4 5 4 5H92z" fill={p.warm} {...outline(p)} {...motion("wave", 2)} {...loop("wave", 2)} />
    <path d="M34 44h14a4 4 0 0 0 0-8 6 6 0 0 0-11-2 4 4 0 0 0-3 10z" fill={p.light} {...outline(p, 1)} {...motion("slide-l", 1)} {...loop("drift", 1)} />
  </g>
);

/** ENTP — from one question, a door opens onto new possibilities. */
const ENTP: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M60 104h40l22 12H70z" fill={p.glow} {...motion("light")} />
    <rect x="60" y="36" width="40" height="68" fill={p.warm} {...outline(p)} {...motion("light")} {...loop("lamp")} />
    {sparkle(76, 58, 4, p.light, undefined, 3)}
    {sparkle(88, 80, 3, p.light, undefined, 5)}
    <path d="M84 66c6-2 12-8 18-14" stroke={p.ink} strokeWidth={1} strokeLinecap="round" strokeDasharray="2 3" {...motion("flow", 4)} {...loop("flow-5", 4)} />
    <g {...motion("door")}>
      <path d="M60 36L44 42V100L60 104z" fill={p.tone} {...outline(p)} />
      <circle cx="49" cy="72" r="2" fill={p.ink} />
    </g>
    <g {...motion("fly", 4)} {...loop("bob", 4)}>
      <path d="M104 48l22-10-8 20-5-7z" fill={p.light} {...outline(p)} />
      <path d="M113 51l13-13" {...outline(p, 1)} />
    </g>
  </g>
);

/** ISFJ — small care, tucked into every day: an umbrella keeping the rain off a plant. */
const ISFJ: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M50 26l-2 6M64 20l-2 6M100 22l-2 6M114 30l-2 6M40 44l-2 6M126 48l-2 6M30 70l-2 6M136 74l-2 6" stroke={p.ground} strokeWidth={1.5} strokeLinecap="round" {...motion("rain")} {...loop("rain")} />
    <ellipse cx="130" cy="104" rx="9" ry="2" fill={p.tone} />
    <path d="M80 62v32a4 4 0 0 1-8 0" {...outline(p)} />
    <g {...motion("open", 2)} {...loop("hang", 2)}>
      <path d="M44 62a36 30 0 0 1 72 0c-6-4-12-4-18 0-6-4-12-4-18 0-6-4-12-4-18 0-6-4-12-4-18 0z" fill={p.warm} {...outline(p)} />
      <path d="M80 32v-5" {...outline(p)} />
    </g>
    <path d="M88 104l-2-12h18l-2 12z" fill={p.tone} {...outline(p)} />
    <path d="M95 92c-8-4-10-12-6-17 5 3 7 10 6 17zM95 92c2-8 8-12 15-12-1 6-7 10-15 12z" fill={p.light} {...outline(p)} />
  </g>
);

/** ISTJ — building dependable order through steady work: a tidy shelf and a clock. */
const ISTJ: Scene = (p) => (
  <g>
    {stage(p)}
    <circle cx="80" cy="33" r="11" fill={p.light} {...outline(p)} />
    <path d="M80 33l5 3" {...outline(p)} {...motion("tick", 6)} />
    <path d="M80 33v-7" {...outline(p)} {...motion("tick", 6)} {...loop("tick", 6)} />
    <rect x="46" y="46" width="8" height="24" fill={p.tone} {...outline(p, 1.2)} {...motion("grow-y", 1)} />
    <rect x="55" y="44" width="8" height="26" fill={p.light} {...outline(p, 1.2)} {...motion("grow-y", 2)} />
    <rect x="64" y="48" width="8" height="22" fill={p.tone} {...outline(p, 1.2)} {...motion("grow-y", 3)} />
    <rect x="73" y="44" width="9" height="26" fill={p.warm} {...outline(p, 1.2)} {...motion("grow-y", 4)} />
    <rect x="83" y="46" width="8" height="24" fill={p.light} {...outline(p, 1.2)} {...motion("grow-y", 5)} />
    <rect x="96" y="56" width="18" height="14" fill={p.tone} {...outline(p, 1.2)} {...motion("grow-y", 6)} />
    <rect x="40" y="70" width="80" height="3" fill={p.tone} {...outline(p, 1.2)} />
    <rect x="46" y="76" width="13" height="22" fill={p.light} {...outline(p, 1.2)} />
    <rect x="60" y="76" width="13" height="22" fill={p.tone} {...outline(p, 1.2)} />
    <rect x="74" y="76" width="13" height="22" fill={p.light} {...outline(p, 1.2)} />
    <path d="M49 80h7M63 80h7M77 80h7" {...outline(p, 1)} />
    <path d="M98 98l-1-10h14l-1 10z" fill={p.tone} {...outline(p, 1.2)} />
    <path d="M104 88c-5-3-6-9-3-12 3 3 4 7 3 12zM104 88c2-5 6-7 10-6-1 4-5 6-10 6z" fill={p.light} {...outline(p, 1.2)} />
    <rect x="40" y="98" width="80" height="3" fill={p.tone} {...outline(p, 1.2)} />
  </g>
);

/** ESFJ — warmth in every get-together: a pot on the table and bowls for everyone. */
const ESFJ: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M70 52c-4-6 4-8 0-14M80 50c-4-6 4-8 0-14M90 52c-4-6 4-8 0-14" {...outline(p, 1.2)} {...motion("steam", 2)} {...loop("steam", 2)} />
    <path d="M58 62h44v12a12 12 0 0 1-12 12H70a12 12 0 0 1-12-12z" fill={p.warm} {...outline(p)} />
    <path d="M55 62h50" {...outline(p, 2)} />
    <path d="M58 66h-6M102 66h6" {...outline(p, 2.5)} />
    {desk(p)}
    <g {...motion("rise", 1)}>
      <path d="M26 76h24a12 10 0 0 1-24 0z" fill={p.light} {...outline(p)} />
      <path d="M30 76a4 3 0 0 1 8 0a4 3 0 0 1 8 0" {...outline(p, 1)} />
    </g>
    <g {...motion("rise", 3)}>
      <path d="M110 76h24a12 10 0 0 1-24 0z" fill={p.tone} {...outline(p)} />
      <path d="M112 70l24 5M113 67l24 5" {...outline(p, 1.2)} />
    </g>
  </g>
);

/** ESTJ — doing what is in front of you well, one step at a time. */
const ESTJ: Scene = (p) => (
  <g>
    {stage(p)}
    <rect x="50" y="88" width="22" height="16" fill={p.tone} {...outline(p)} />
    <rect x="72" y="72" width="22" height="32" fill={p.light} {...outline(p)} />
    <rect x="94" y="56" width="22" height="48" fill={p.tone} {...outline(p)} />
    <path d="M61 82L83 66L98 55" stroke={p.ink} strokeWidth={1} strokeLinecap="round" strokeDasharray="2 3" {...motion("flow")} {...loop("flow-5")} />
    <circle cx="105" cy="49" r="7" fill={p.warm} {...outline(p)} {...motion("hop")} {...loop("hop")} />
    <rect x="18" y="64" width="26" height="40" rx="2" fill={p.tone} {...outline(p)} />
    <rect x="21" y="69" width="20" height="31" fill={p.light} {...outline(p, 1)} />
    <rect x="26" y="61" width="10" height="6" rx="1.5" fill={p.ink} />
    <path d="M24 77l2 2 4-4" pathLength={1} {...outline(p, 1.2)} {...motion("draw", 1)} />
    <path d="M24 86l2 2 4-4" pathLength={1} {...outline(p, 1.2)} {...motion("draw", 3)} />
    <path d="M24 95l2 2 4-4" pathLength={1} {...outline(p, 1.2)} {...motion("draw", 5)} />
    <path d="M33 77h5M33 86h5M33 95h5" {...outline(p, 1)} />
  </g>
);

/** ISFP — feeling the moment and living in your own colours: a painter's palette. */
const ISFP: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M32 80c0-16 18-28 42-28s40 10 40 24c0 8-8 11-15 9-6-2-10 2-8 8 2 9-6 15-22 15-21 0-37-11-37-28z" fill={p.light} {...outline(p)} />
    <circle cx="62" cy="85" r="4.5" fill={p.arch} {...outline(p, 1.2)} />
    <circle cx="50" cy="72" r="6" fill={p.warm} {...outline(p, 1)} {...motion("pop", 1)} />
    <circle cx="64" cy="63" r="6" fill={p.tone} {...outline(p, 1)} {...motion("pop", 2)} />
    <circle cx="82" cy="60" r="6" fill={p.deep} {...outline(p, 1)} {...motion("pop", 3)} />
    <circle cx="98" cy="67" r="5.5" fill={p.glow} {...outline(p, 1)} {...motion("pop", 4)} />
    <g {...motion("glide", 5)} {...loop("dab", 5)}>
      <path d="M50 101L88 83" {...outline(p, 2.5)} />
      <path d="M88 83l6-3" stroke={p.tone} strokeWidth={5} strokeLinecap="round" />
      <path d="M95 79.5l6-3" stroke={p.ink} strokeWidth={4} strokeLinecap="round" />
    </g>
    <path d="M124 104l-3-14h12l-3 14z" fill={p.tone} {...outline(p)} />
    <path d="M127 90V70" {...outline(p, 1.2)} />
    <g {...motion("pop", 6)}>
      <circle cx="127" cy="61" r="3.5" fill={p.light} {...outline(p, 1)} />
      <circle cx="131.8" cy="64.5" r="3.5" fill={p.light} {...outline(p, 1)} />
      <circle cx="130" cy="70" r="3.5" fill={p.light} {...outline(p, 1)} />
      <circle cx="124" cy="70" r="3.5" fill={p.light} {...outline(p, 1)} />
      <circle cx="122.2" cy="64.5" r="3.5" fill={p.light} {...outline(p, 1)} />
      <circle cx="127" cy="66" r="2.5" fill={p.warm} />
    </g>
  </g>
);

const GEAR_TEETH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SMALL_TEETH = [0, 1, 2, 3, 4, 5, 6, 7];

/** ISTP — hands on, finding your own answer: gears and a spanner. */
const ISTP: Scene = (p) => (
  <g>
    {stage(p)}
    <g {...motion("gear")} {...loop("gear")}>
      {GEAR_TEETH.map((k) => <rect key={k} x="67" y="36" width="6" height="8" rx="1" transform={`rotate(${k * 36} 70 62)`} fill={p.tone} {...outline(p, 1.2)} />)}
      <circle cx="70" cy="62" r="20" fill={p.tone} {...outline(p)} />
      <circle cx="70" cy="62" r="7" fill={p.arch} {...outline(p, 1.2)} />
    </g>
    <g {...motion("cog")} {...loop("cog")}>
      {SMALL_TEETH.map((k) => <rect key={k} x="102" y="26" width="4" height="6" rx="1" transform={`rotate(${k * 45} 104 40)`} fill={p.warm} {...outline(p, 1)} />)}
      <circle cx="104" cy="40" r="10" fill={p.warm} {...outline(p)} />
      <circle cx="104" cy="40" r="3.5" fill={p.light} {...outline(p, 1)} />
    </g>
    <g {...motion("wiggle", 4)}>
      <g transform="rotate(-35 100 88)">
        <rect x="78" y="84" width="38" height="8" rx="4" fill={p.light} {...outline(p)} />
        <circle cx="118" cy="88" r="9" fill={p.light} {...outline(p)} />
        <path d="M118 83.5l3.9 2.25v4.5L118 92.5l-3.9-2.25v-4.5z" fill={p.arch} {...outline(p, 1.2)} />
      </g>
    </g>
  </g>
);

/** ESFP — all in, meeting life as it is: a record spinning and the music rising. */
const ESFP: Scene = (p) => (
  <g>
    {stage(p)}
    <rect x="30" y="78" width="100" height="24" rx="4" fill={p.light} {...outline(p)} />
    <circle cx="42" cy="90" r="3" fill={p.tone} {...outline(p, 1)} />
    <circle cx="52" cy="90" r="3" fill={p.tone} {...outline(p, 1)} />
    <ellipse cx="76" cy="76" rx="34" ry="9" fill={p.deep} {...outline(p)} />
    <ellipse cx="76" cy="76" rx="24" ry="6" stroke={p.light} strokeOpacity={0.5} strokeWidth={0.8} />
    <ellipse cx="76" cy="76" rx="8" ry="2.5" fill={p.warm} />
    <g {...motion("arm")}>
      <path d="M118 70L108 74L94 77" {...outline(p)} />
      <circle cx="118" cy="70" r="3.5" fill={p.tone} {...outline(p, 1)} />
    </g>
    <g {...motion("rise", 5)} {...loop("bob", 5)}>
      <ellipse cx="100" cy="44" rx="4.5" ry="3.2" fill={p.ink} transform="rotate(-20 100 44)" />
      <path d="M104 43V24c5 2 7 5 5 10" {...outline(p)} />
    </g>
    <g {...motion("rise", 3)} {...loop("bob", 1)}>
      <ellipse cx="54" cy="48" rx="4.5" ry="3.2" fill={p.ink} transform="rotate(-20 54 48)" />
      <ellipse cx="68" cy="44" rx="4.5" ry="3.2" fill={p.ink} transform="rotate(-20 68 44)" />
      <path d="M58 47V30M72 43V26" {...outline(p)} />
      <path d="M58 30L72 26" stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
    {sparkle(36, 34, 3, p.ink, undefined, 4)}
    {sparkle(124, 34, 4, p.ink, undefined, 6)}
  </g>
);

/** ESTP — out in the real world, finding answers on the move: a bicycle at speed. */
const ESTP: Scene = (p) => (
  <g>
    {stage(p)}
    <path d="M18 66h14M14 76h16M20 86h10" {...outline(p, 1.2)} {...motion("light", 3)} {...loop("speed")} />
    <g {...motion("roll")}>
      <path d="M56 70v32M40 86h32" stroke={p.ground} strokeWidth={0.8} {...motion("wheel-back")} {...loop("wheel-back")} />
      <path d="M110 70v32M94 86h32" stroke={p.ground} strokeWidth={0.8} {...motion("wheel-front")} {...loop("wheel-front")} />
      <circle cx="56" cy="86" r="16" {...outline(p, 2)} />
      <circle cx="110" cy="86" r="16" {...outline(p, 2)} />
      <circle cx="56" cy="86" r="2.5" fill={p.ink} />
      <circle cx="110" cy="86" r="2.5" fill={p.ink} />
      <path d="M56 86L74 62H102L110 86M74 62L82 86L56 86M82 86L102 62" stroke={p.warm} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M74 62l-1-6" {...outline(p)} />
      <path d="M67 56h12" {...outline(p, 3)} />
      <path d="M102 62l-3-8h9" {...outline(p, 2)} />
      <circle cx="82" cy="86" r="4" fill={p.light} {...outline(p, 1.2)} />
      <path d="M82 86l4 6" {...outline(p)} />
    </g>
  </g>
);

export const typeScenes: Record<PersonalityType, Scene> = {
  INFJ, INFP, ENFJ, ENFP, INTJ, INTP, ENTJ, ENTP, ISFJ, ISTJ, ESFJ, ESTJ, ISFP, ISTP, ESFP, ESTP,
};
