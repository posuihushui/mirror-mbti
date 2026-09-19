/** English mirror of the shared copy in `src/lib/site.ts`. MBTI is a trademark of its owner; this site is independent. */
export const enSite = {
  name: "mirror",
  tagline: "See your true self from within",
  title: "Free MBTI®-style personality test · 16 types · mirror",
  description: "mirror is an original MBTI®-style personality test with 32- or 64-item versions. Explore your four preferences for free. Not the official MBTI® instrument.",
  locale: "en_US",
  trademark: "MBTI and Myers-Briggs Type Indicator are trademarks of The Myers-Briggs Company. mirror is independent and not affiliated with or endorsed by it.",
} as const;

export const enChoices = ["Strongly agree", "Somewhat agree", "Not sure", "Somewhat disagree", "Strongly disagree"] as const;

export const enChapterLabels = ["Overview", "Strengths & blind spots", "Relationships & communication", "Work & growth"] as const;

export const enUnlockBullets = [
  "Scenarios read by the strength of each preference, including near-balanced ones",
  "Strengths, blind spots, communication examples and work routines",
  "A seven-day practice with reflection questions",
] as const;

export function enFaqs(): [string, string][] {
  return [
    ["How long does the test take?", "The 32-item Quick version takes about 5 minutes; the 64-item Standard version covers more situations and takes about 8–10 minutes. Times are rough estimates, and more items do not mean more accuracy."],
    ["What should I keep in mind when answering?", "Think about your everyday life lately, not your ideal self. There are no good or bad answers; if a situation feels unfamiliar, choose “Not sure” — you can always go back and check."],
    ["Can I pause or start over?", "Progress for each version is saved separately in this browser, so you can pause, review answered questions or start over. If your browser cannot save, you will see a notice; you can still finish on this page, but closing or refreshing may lose your draft."],
    ["Does my result define me?", "No. Personality preferences shift with situations and experience. Results are for self-exploration — not for diagnosis, hiring decisions or labelling other people."],
    ["Is this the official MBTI® assessment?", "No. It is an independent experience inspired by the four preference pairs, using original items. It is not the official MBTI® instrument and has not been psychometrically validated."],
    ["Why didn’t I get a definite type?", "When all four dimensions sit near the middle, your answers have not formed a clear lean this time. You can review your answers or retake later."],
    ["What do percentages and retest changes mean?", "Percentages only show where your answers fell on this questionnaire — not ability, accuracy or a population percentile. Mood and circumstances affect answers, so look at dimension changes first; scores from different versions are not directly equivalent."],
    ["How do I get back to earlier reports?", "“My reports” lists every test from the same visitor. If you switch devices or clear browser data, you can recover them with any full order number from this site. Recovery only restores that visitor’s tests; it never changes what any report shows."],
  ];
}
