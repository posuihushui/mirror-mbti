import type { Letter } from "@/lib/questionnaires";

/**
 * English type copy. There are deliberately no nicknames: the display name is the four
 * preference labels, so nothing borrows another publisher's type names.
 */
export const enTypeCopy: Record<string, [line: string, summary: string]> = {
  INFJ: ["Understand the world gently,\nmove toward yourself steadily.", "You tend to sort out your thoughts in quiet and look for meaning in genuine connection. You care whether a decision fits your inner values, and you hope to turn your picture of the future into reality, little by little."],
  INFP: ["Let your inner light\nshow more of what is possible.", "You value real feelings and inner values, and like to find deeper meaning in life. Time alone helps you hear yourself, while open space lets your imagination grow."],
  INTJ: ["In the quiet,\nimagine a future further out.", "You tend to think independently, using logic to connect scattered information into a whole. A long-term direction and a clear plan help you turn ideas into reality step by step."],
  INTP: ["Stay curious,\nsee the other side of the question.", "You like to ask why things are the way they are, and you are happy to explore different explanations on your own. Rather than reaching conclusions early, you enjoy keeping ideas open."],
  ENFJ: ["When people see each other,\nchange can happen.", "You draw energy from exchanges with others and care about people’s growth and a shared direction. You are willing to bring people together and help meaningful things get done."],
  ENFP: ["Meet the world,\nand let possibilities grow.", "New people, new ideas and honest conversation easily spark your enthusiasm. You value inner conviction and like to leave room in life for spontaneous exploration."],
  ENTJ: ["See the direction clearly,\nand move ideas into reality.", "You are willing to drive things forward through conversation, and you tend to understand problems as a whole. Logic, goals and workable plans are the tools you reach for when organizing action."],
  ENTP: ["From one question,\nopen a new possibility.", "Conversation and the clash of ideas easily spark your curiosity. You are good at trying out different explanations, testing ideas with logic, and leaving room for new routes."],
  ISFJ: ["Put small acts of care\ninto every day.", "You value reliable experience and concrete action, and you pay close attention to what the people around you need. A calm environment and orderly plans often help you do your best."],
  ISFP: ["Feel the present,\nlive in your own colors.", "You like to understand the world through real experience and treasure your inner feelings. Some time alone and the freedom to choose let you live at your own pace."],
  ISTJ: ["With steady action,\nbuild a reliable order.", "You tend to judge by concrete facts and handle things with clear standards and steps. Finishing tasks independently and quietly often puts you in a steady rhythm."],
  ISTP: ["Explore hands-on,\nfind your own answers.", "You like to understand things by trying them out, and you solve the problem in front of you with logic. Room to act independently and adjust flexibly helps your powers of observation shine."],
  ESFJ: ["Make every time together\nfeel warm.", "You gain energy from conversation and notice the concrete needs of others. You like turning care into action and looking after shared life with well-organized plans."],
  ESFP: ["Be fully in the moment,\nmeet life as it is.", "You are drawn to real experiences and connections between people. You value feelings and are happy to adjust what you do as things change around you."],
  ESTJ: ["Do what is in front of you,\none step at a time.", "You tend to organize action through communication and judge by facts and clear standards. Clear roles and plans help you move things steadily to completion."],
  ESTP: ["Step into the real world,\nfind answers in action.", "You are willing to approach new people and things, looking for opportunities in concrete experience. You are used to making quick calls with logic and adjusting to what is happening on the ground."],
};

export const enPoles: Record<Letter, { label: string; need: string; strength: string; growth: string }> = {
  E: { label: "Extraverted", need: "Gains energy through interaction", strength: "Willing to start conversations and let ideas grow clearer through discussion.", growth: "Before you respond, give yourself ten seconds to notice what you have not said yet." },
  I: { label: "Introverted", need: "Recharges through time alone", strength: "Keeps room for depth and can sort through complex feelings and information independently.", growth: "Turn “I need some time alone” into a concrete plan, so the people who matter know when you will be back." },
  S: { label: "Sensing", need: "Understands the world through concrete experience", strength: "Notices facts and details, helping ideas land in reality.", growth: "After solving the immediate problem, ask once more: what else could this become?" },
  N: { label: "Intuitive", need: "Draws inspiration from connections and possibilities", strength: "Sees links between scattered information and finds long-term meaning in what is at hand.", growth: "For one big idea, plan a small step you can finish today." },
  T: { label: "Thinking", need: "Decides with logic and consistent standards", strength: "Separates fact from assumption and stays clear-headed in disagreements.", growth: "Before offering a solution, ask: do you want advice, or someone to listen?" },
  F: { label: "Feeling", need: "Weighs values and feelings in choices", strength: "Understands the people behind a choice and notices the feelings and values in relationships.", growth: "Before looking after others, write down one need of your own and say it clearly." },
  J: { label: "Judging", need: "Feels settled with plans and certainty", strength: "Breaks goals into steps and keeps things moving in a clear direction.", growth: "Leave a small blank space in your plan, and treat changes as information, not failure." },
  P: { label: "Perceiving", need: "Stays at ease through flexibility and exploration", strength: "Adjusts quickly to new information and keeps room for different choices.", growth: "Set a light finish point for the one thing that matters most." },
};

export const enProfileCopy = {
  evenLine: "You hold your balance\nbetween both sides.",
  evenSummary:
    "All four dimensions sit close to the middle this time. The reference type follows the small differences between them and is only a point of comparison — the dimension scores and readings below say more. Sitting near the middle may mean you switch between both approaches depending on the situation, not that you lack traits.",
} as const;
