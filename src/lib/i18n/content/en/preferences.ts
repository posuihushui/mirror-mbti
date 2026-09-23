/** English mirror of `preferenceDimensions` and `preferenceNotes`, in dimension order EI, SN, TF, JP. */
export const enPreferenceDimensions = [
  {
    title: "Energy & interaction",
    pair: "Extraversion / Introversion",
    description: "The E side tends to sort out thinking through conversation; the I side more often processes on its own first. This describes how you recharge — not social skill or shyness.",
    question: "After a lively conversation, do I want to keep talking, or do I need some time alone?",
    balanced: "You may be happy to share around people you know, and still need time alone after a lot of input. Watch your energy before and after activities, without rushing to pick a side.",
  },
  {
    title: "Information & attention",
    pair: "Sensing / Intuition",
    description: "The S side first notices facts, examples and experience; the N side first looks for connections and possibilities. Both can be creative, and both need to check information.",
    question: "When I try to understand something unfamiliar, do I want an example first, or a map of the whole?",
    balanced: "You may understand details through examples and then connect them into a whole. Try starting from one concrete case, then sketch how it relates to other things.",
  },
  {
    title: "Judgment & trade-offs",
    pair: "Thinking / Feeling",
    description: "The T side first tests logic and consistent standards; the F side first considers values and people’s situations. Both sides can analyze rationally, and both can care about others.",
    question: "Facing two workable options, do I first compare standards, or how they affect people?",
    balanced: "You may care both about whether the reasons are consistent and whether a choice looks after people’s situations. Write each set of criteria down separately, then state this time’s priority.",
  },
  {
    title: "Planning & adapting",
    pair: "Judging / Perceiving",
    description: "The J side likes to settle plans ahead; the P side tends to leave room to adjust. This describes how you arrange things — not self-discipline or competence.",
    question: "Without an outside deadline, would I rather set a plan first, or decide as I explore?",
    balanced: "You may need clear milestones for important matters and prefer improvising for non-urgent ones. Try fixing only the times that must be fixed, and leave the rest open.",
  },
] as const;

export const enPreferenceNotes = [
  {
    title: "How to read results near 50%",
    body: "50% means your answers on both sides of that dimension balanced out this time — it does not prove equal ability on both sides. The site describes the higher-side score in four bands: 50–55% almost even, 56–60% close to balanced, 61–74% a slight lean, 75% and above a clear lean. That is a product display rule, not a validated statistical confidence interval. You always get four letters; when a dimension is close to balanced, they are only a point of comparison, and both sides are worth reading.",
  },
  {
    title: "When you retake, first look at what changed.",
    body: "Recent roles, energy, experiences and how you read the questions can all change your answers. Note the version, date and situation, compare changes in each dimension first, then the letters. Percentages are not ability scores, accuracy or population percentiles; the 32- and 64-item versions have not been equated, so scores across versions should not be treated as the same scale.",
  },
] as const;

export const enDegrees = { even: "Almost even", balanced: "Close to balanced", slight: "Slight lean", marked: "Clear lean" } as const;

export function enInterpretation(label: string, need: string, strong: boolean): string {
  const lowered = need.charAt(0).toLowerCase() + need.slice(1);
  return `This time you leaned toward the ${label.toLowerCase()} side: ${lowered}. ${strong ? "This may be a common starting point for you, but it does not mean the other side is weaker." : "The lean is small — in a different situation, you may well use the other approach."}`;
}
