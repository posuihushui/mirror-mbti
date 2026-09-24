import type { Letter } from "@/lib/questionnaires";

type Scene = { scene: string; watch: string; phrase: string; work: string; experiment: string };

/** English mirror of the paid report scenes in `src/lib/report-content.ts`. */
export const enScenes: Record<Letter, Scene> = {
  E: {
    scene: "Facing a shared task with no clear direction, you may only see the way forward after voicing a draft and hearing responses. Splitting the discussion into a round for ideas and a round for decisions lets this way of thinking work better.",
    watch: "When someone is quiet, it does not necessarily mean they are uninterested. Invite them to add their thoughts in writing later, so speed of speaking is not mistaken for commitment.",
    phrase: "I’d like to talk it through for ten minutes to get clear — is now a good time? You can also reply once you’ve thought about it.",
    work: "Group collaborative tasks into one communication window, write down one question before the discussion, and end with a conclusion everyone confirms.",
    experiment: "For one short discussion, agree on a time and a single question beforehand; afterwards, write three sentences of conclusions on your own and compare how clear you felt before and after.",
  },
  I: {
    scene: "In discussions that require responding to a complex issue, you may first sort things out alone, then offer a fairly complete view. Getting the agenda in advance and preparing a few notes often suits you better than expecting yourself to improvise at any moment.",
    watch: "Waiting until an idea is fully formed can leave others unsure of your progress. Give a short interim response first, and agree on when you will talk next.",
    phrase: "I’m thinking this over seriously and want to sort it out first — could we talk again at eight tonight?",
    work: "Set aside quiet time for complex tasks and sync progress once at the start and once at the end, so independent work and teamwork both have clear boundaries.",
    experiment: "Before a discussion, spend fifteen minutes outlining, then share one unfinished idea and notice whether others find it easier to follow your thinking.",
  },
  S: {
    scene: "When you receive a vague request, you may first ask for examples, constraints and what finished looks like. Turning those questions into a short checklist reduces different ideas of what “done” means.",
    watch: "Familiar experience is valuable, but a new situation may have changed the conditions. Before reusing an old method, write down one thing that is different this time.",
    phrase: "Could you give me a concrete example? I’d like to confirm what’s happening now before we discuss possible changes.",
    work: "Before starting, agree on one visible deliverable and refine it after a rough version; also keep one question to check whether the original assumptions still hold.",
    experiment: "Pick a habitual way of doing something, list three known facts, write one condition that is different from before, and try a small adjustment.",
  },
  N: {
    scene: "When you see a new problem, you may first think of how it connects to other things. Sketching the connections, then adding one example from right now, makes your thinking easier for others to follow.",
    watch: "“I can see a possibility” and “there is evidence for it” are two different things. Write imagination, assumptions and known facts separately so they do not get mixed up when you act.",
    phrase: "I’ve thought of a possibility, though it isn’t tested yet. Let’s use this small example to see if it holds up.",
    work: "First write one sentence on why the task is worth doing, then turn the direction into a small prototype you can test that day, so the goal does not stay abstract.",
    experiment: "Pick a new idea, write down what you would expect to observe, and test it with one small attempt; note where the result differed from what you imagined.",
  },
  T: {
    scene: "When resources are limited or opinions differ, you may first look for a standard everyone can use. Explaining how the standard relates to the goal before discussing exceptions makes it easier for analysis to build agreement.",
    watch: "Consistent standards do not mean everyone bears the same cost. Before offering a conclusion, ask who will be affected and say which costs need extra care.",
    phrase: "My judgment rests on these two points — and I’d like to know, how would this approach affect you?",
    work: "When comparing options, list the shared goal, the criteria and the people affected; narrow down to workable options first, then talk through each one’s trade-offs.",
    experiment: "For a small decision, write down two criteria, then ask someone involved to add one effect you had not considered.",
  },
  F: {
    scene: "When deciding together, you may first notice who cares about what and which values need looking after. Turning different needs into conditions that can be discussed makes care concrete, rather than just trying to please everyone.",
    watch: "Sensing others’ expectations does not mean you have to carry them. Separate “I understand what you need” from “this is what I can agree to”, and be clear about the limits of your resources.",
    phrase: "I understand this matters a lot to you; I can take on this part, and we’ll need to work out the rest together.",
    work: "Be clear about who a task helps, and agree on a cap on effort and a finish standard, so looking after extra needs does not make it hard to wrap up.",
    experiment: "With a small request, first confirm what the other person needs, then say clearly what time or help you can offer, and notice whether the relationship still feels connected.",
  },
  J: {
    scene: "When several things move at once, you may find stability by setting the order and milestones first. Separating what must be fixed from what can change makes the plan better able to cope with reality.",
    watch: "A change of plan does not make earlier effort worthless. Build in buffers, and agree ahead of time on what new information would be enough to change the schedule.",
    phrase: "Let’s fix the time things must be done by, and adjust the details before then. If conditions change, we’ll revise the plan together.",
    work: "Fix only one most important delivery point each day, keep buffers for the rest, and at the end of the day check whether the plan still serves the goal.",
    experiment: "Leave a small blank slot in a day’s plan; when something changes, note how you adjusted, not just whether you followed the original plan.",
  },
  P: {
    scene: "When a situation keeps changing, you may like to keep options open and adjust as you go. Setting a small scope and an end condition for exploring keeps flexibility while letting others know when to expect a conclusion.",
    watch: "Continually finding new options can delay a necessary wrap-up. Separate decisions that are easy to change from ones that must be delivered on time, and agree on a provisional answer for the latter.",
    phrase: "I’d like to compare two more options, but I’ll give a provisional decision by Friday; if new information comes up, we’ll adjust.",
    work: "Break tasks into short cycles, each with one clear output and a feedback time, allowing methods to change while keeping reliable delivery boundaries.",
    experiment: "Pick a small thing you keep wanting to explore, set a time for a provisional decision, and when it arrives, finish a version you can still revise.",
  },
};

export const enReportCopy = {
  qualifierClear: "This lean is fairly clear this time, so start by watching for the situations below.",
  qualifierSlight: "This time the lean is slight, so the situations below are just one possibility to compare against.",
  strengthBalancedTitle: (pair: string) => `Notice both needs in ${pair}`,
  strengthBalancedBody: (balanced: string) => `${balanced} This is not a conclusion that you are “good at both”; test it against real experiences in different situations.`,
  blindspotTitles: ["Limits of energy", "Limits of perspective", "Limits of decisions", "Limits of pace"],
  blindspotBalancedBody: (pair: string, question: string) => `When ${pair} is close to balanced, there is no need to pick a fixed label. ${question} Write down the situations behind each answer and see whether what changes is the task, the role or your energy.`,
  relationshipTitles: ["Make your energy needs visible", "Say where each of you starts from", "Explain the trade-offs behind decisions together", "Agree on what is fixed and what can change"],
  relationshipBalancedBody: (balanced: string) => `${balanced} You could start with:`,
  relationshipBalancedSay: "I have different needs in different situations — this time I’d like… What about you?",
  relationshipBody: (qualifier: string) => `${qualifier} You could try opening with this, then invite the other person to respond in their own words, rather than guessing them from a type:`,
  workTitles: ["A work rhythm that suits you", "Turn understanding into visible results", "Set discussable conditions for choices", "Balance moving forward with adjusting"],
  workBalancedBody: (balanced: string) => `${balanced} Try each approach once in study or work, and note which suits the task at hand, rather than choosing a fixed career label.`,
  dayOne: { title: "Day 1 · Keep one honest record", body: "Pick a small situation from today and note the task, who you interacted with, your first reaction and how your energy shifted. Describe the facts first, without applying a personality label." },
  dayTitle: (day: number, title: string) => `Day ${day} · ${title}`,
  dayBalancedBody: (question: string) => `${question} Find examples of both responses and note the conditions each appeared in.`,
  daySix: { title: "Day 6 · Try a different way", body: "Pick your most familiar reaction from the past few days and try a different approach on something small and low-stakes. Note whether it brings new information; there is no need to force yourself into an approach that does not fit." },
  daySeven: { title: "Day 7 · Keep one small adjustment", body: "Look back over the week: which descriptions are backed by real experiences, and which do not fit? Keep one arrangement that genuinely helped for another week. Before retaking the test, read these notes first — the goal is not to land on a particular type." },
} as const;
