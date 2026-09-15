import type { Letter } from "@/lib/questionnaires";

export const enEveryday: Record<Letter, string> = {
  E: "When an idea first comes to you, you may clarify it gradually by talking it through.",
  I: "When you need to express a complex view, you may first take time to sort it out on your own.",
  S: "When learning something unfamiliar, you may first look for examples and practical steps.",
  N: "When meeting something new, you may first think of how it connects to other experiences.",
  T: "When discussing a choice, you may first ask what the conclusion rests on and how it is judged.",
  F: "When deciding plans together, you may first find out what matters to each person.",
  J: "Facing several to-dos, you may first write down their order and milestones.",
  P: "When arranging non-urgent activities, you may leave room for last-minute changes.",
};

export const enMisconceptions: Record<Letter, string> = {
  E: "An extraverted preference does not mean always having energy, or having to enjoy every social event.",
  I: "An introverted preference is not the same as being shy, poor at communicating, or not needing relationships.",
  S: "A sensing preference does not mean lacking imagination; valuing examples and proposing new ideas can go together.",
  N: "An intuitive preference does not guarantee more creativity, and it does not replace checking the facts.",
  T: "A thinking preference does not mean having no feelings, or being free to ignore how a decision affects people.",
  F: "A feeling preference is not a lack of logic, and it does not mean everyone’s wishes must come first.",
  J: "A judging preference does not make someone more disciplined or reliable; plans still need adjusting to reality.",
  P: "A perceiving preference is not procrastination or irresponsibility; flexible plans can still keep commitments.",
};

export const enCommunication = {
  introverted: "If I don’t reply right away, I may still be sorting out my thoughts.",
  extraverted: "Sometimes I need to talk things through to get clear, so there is no rush to give me a conclusion.",
  judging: "Let’s agree on when we will talk next.",
  perceiving: "Let’s try one approach first, then adjust together as things go.",
} as const;

/** `labels` are e.g. `["Introverted (I)", …]`; `needs` are the four pole needs. */
export function enDefinition(type: string, labels: string[], needs: string[]): string {
  const joined = `${labels.slice(0, 3).join(", ")} and ${labels[3]}`;
  const lowered = needs.map((need) => need.charAt(0).toLowerCase() + need.slice(1)).join("; ");
  return `${type} is one of the 16 personality types, combining four preferences — ${joined}: ${lowered}. It describes a lean in how you answered, not ability, career fit or a psychological diagnosis.`;
}
