import { loop, motion, outline, stage, type Scene } from "./scene";

/* Its own module so the quiz's client bundle carries this one scene and nothing else. */

/** A pause between parts of the long questionnaire: a cup of tea, still steaming. */
export const restScene: Scene = (p) => (
  <g>
    {stage(p, false)}
    <path d="M70 60c-5-7 5-9 0-18M82 58c-5-7 5-9 0-18M94 60c-4-6 4-8 0-14" {...outline(p, 1.2)} {...motion("steam", 2)} {...loop("steam", 2)} />
    <ellipse cx="80" cy="100" rx="34" ry="5" fill={p.light} {...outline(p)} />
    <path d="M104 72h4a7 7 0 0 1 0 14h-6" {...outline(p, 1.8)} />
    <path d="M56 66h48v14c0 10-8 18-18 18h-12c-10 0-18-8-18-18z" fill={p.light} {...outline(p)} />
    <g {...motion("hang", 1)} {...loop("hang", 1)}>
      <path d="M64 66c-2 8-6 10-8 16" {...outline(p, 1)} />
      <rect x="50" y="82" width="10" height="11" rx="1.5" fill={p.warm} {...outline(p, 1)} />
    </g>
  </g>
);
