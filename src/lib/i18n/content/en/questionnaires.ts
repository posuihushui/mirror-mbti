/**
 * English item text for `en32-v1` / `en64-v1`. Order matches the Chinese sources exactly;
 * `dimension` and `reverse` are copied from them in `src/lib/questionnaires.ts`, never restated here.
 * Frozen once published: edits belong to a new questionnaire version.
 */

/** Mirrors `legacyItems` (32). */
export const enLegacyTexts = [
  "After spending time with a group,\nyou usually feel more energized.",
  "When something is new, you first notice\nthe possibilities it could open up.",
  "When making an important decision,\nyou care most whether the logic holds.",
  "Having your day planned in advance\nhelps you feel at ease.",
  "When you rest, you would rather\nspend some quiet time alone.",
  "When learning a new skill, you prefer\na clear, step-by-step demonstration.",
  "When a friend faces a problem,\nyou first try to understand how they feel.",
  "On a trip, changing plans on a whim\nfeels fun to you.",
  "At a gathering of strangers,\nyou are willing to start a conversation.",
  "Rather than the details in front of you,\nyou tend to see the connections behind things.",
  "When discussing a disagreement,\nyou check the evidence and reasoning first.",
  "Before starting a task,\nyou like to list the steps.",
  "Before sharing an important idea,\nyou need time alone to sort your thoughts.",
  "Rather than abstract theory,\nyou trust experience you have tested yourself.",
  "Even when a plan works well, you care\nhow it makes other people feel.",
  "Leaving room for new opportunities\nthat come up makes you feel comfortable.",
  "Thinking out loud with someone\noften helps you get clear.",
  "You often imagine\nwhat things could become in the future.",
  "When judging a proposal, you value\nconsistent standards over personal ties.",
  "Rather than starting near the deadline,\nyou would rather finish tasks early.",
  "Rather than meeting lots of new people,\nyou enjoy a few deep conversations.",
  "When someone describes an event,\nyou notice what concretely happened.",
  "When making a choice, whether it fits\nyour values matters a lot.",
  "When things are still uncertain,\nyou can keep exploring with ease.",
  "When something interesting happens,\nyou often want to share it right away.",
  "You enjoy discussing ideas\nthat cannot be realized just yet.",
  "When giving feedback, you tend to\npoint out the problem directly.",
  "Checking off tasks one by one\ngives you real satisfaction.",
  "After a busy week, you usually need\ntime alone to recharge.",
  "When judging whether an idea can work,\nyou consider real-world constraints first.",
  "When someone on a team is overlooked,\nyou pay close attention to their situation.",
  "Rather than a fixed schedule,\nyou like adjusting to the moment.",
] as const;

/** Mirrors `revised` (zero-based index into the first 32 items of the standard version). */
export const enRevisedTexts: Record<number, string> = {
  14: "When deciding how to respond to a friend’s request,\nI first consider how they feel right now.",
  22: "When facing several workable options,\nI first look at which fits what the people involved value.",
  26: "When giving feedback,\nI tend to start with the facts behind my judgment.",
  30: "When a group disagrees,\nI tend to first hear what each side cares about.",
};

/** Mirrors `additions` (32). */
export const enAdditionTexts = [
  "When I have free time,\nI usually look for people to spend it with.",
  "Reading an unfamiliar introduction,\nI look first for specific facts I can verify.",
  "When dividing limited shared resources,\nI first set one standard for everyone.",
  "Even without an outside deadline,\nI like to set a finish date for myself.",
  "In online discussions,\nI prefer to think it through before sending a full reply.",
  "When I meet a new topic,\nI first think about how it connects to other things.",
  "When someone asks for an exception to a rule,\nI first consider their particular situation.",
  "On a weekend with nothing I must do,\nI would rather decide on the day.",
  "After working alone for a while,\ntalking with someone usually refreshes me.",
  "When given an unfamiliar task,\nI want to see a finished example first.",
  "Comparing two acceptable options,\nI usually weigh costs and benefits item by item.",
  "When planning an activity with others,\nI like to fix the time and place early.",
  "Before a lively event,\nI like to have some quiet time to prepare.",
  "When I notice a pattern repeating,\nI like to look for an overall explanation.",
  "When assigning tasks to others,\nI first learn what they are willing to put in.",
  "For non-urgent choices,\nI like keeping a few options open a while longer.",
  "When an idea is still half-formed,\nI am happy to say it out loud and shape it with others.",
  "When retelling an experience,\nI usually start with what concretely happened.",
  "When opinions differ,\nI like to first agree on how we will judge which option fits better.",
  "When several things need handling,\nI like to put them in order first.",
  "During breaks from study or work,\nI would rather relax with a walk on my own.",
  "Faced with a familiar way of doing things,\nI often wonder how else it could change.",
  "When negotiating shared plans,\nI usually first check what each person cares about most.",
  "When trying a new hobby,\nI prefer to explore before deciding whether to stick with it.",
  "Joining a new group,\nI tend to get to know people by reaching out.",
  "When choosing what to do next,\nrepeatable past experience is persuasive to me.",
  "Even when evaluating an idea I like,\nI still look first for where it would fail.",
  "Once something has a workable plan,\nI am glad to settle it and move step by step.",
  "When I need to sort out complex feelings,\nI usually write them down before talking to anyone.",
  "Reading a story,\nI often think about what it implies but does not say.",
  "When two plans work about equally well,\nI would rather pick the one that leaves people feeling respected.",
  "After learning something new,\nI am usually willing to reopen options we had already discussed.",
] as const;

export const enQuestionnaireMeta = {
  quick: { name: "Quick", duration: "About 5 minutes", description: "Get to know your four preferences — a good fit for a first, time-limited exploration." },
  standard: { name: "Standard", duration: "About 8–10 minutes", description: "Covers more everyday situations, for when you would like to spend a little longer observing yourself." },
} as const;
