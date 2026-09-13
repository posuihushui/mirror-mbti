export type Dimension = "EI" | "SN" | "TF" | "JP";
export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type Question = { id: string; text: string; dimension: Dimension; reverse?: boolean };
export const dimensions: Dimension[] = ["EI", "SN", "TF", "JP"];
export const LEGACY_QUESTIONNAIRE_ID = "legacy32-v1";
export const STANDARD_QUESTIONNAIRE_ID = "standard64-v1";
export const SCORING_VERSION = "preference-v1";
export const REPORT_VERSION = "context-v2";

// Frozen legacy items and order. Edits belong to a new questionnaire version.
const legacyItems: Omit<Question, "id">[] = [
  { text: "和一群人相处之后，\n你通常觉得更有活力。", dimension: "EI" },
  { text: "面对新事物，你会先关注\n它能带来哪些可能性。", dimension: "SN", reverse: true },
  { text: "做重要决定时，你通常\n更看重逻辑是否说得通。", dimension: "TF" },
  { text: "提前安排好一天的事情，\n会让你感到安心。", dimension: "JP" },
  { text: "休息时，你更愿意\n一个人安静地待一会儿。", dimension: "EI", reverse: true },
  { text: "学习新技能时，你更喜欢\n清晰、具体的操作示范。", dimension: "SN" },
  { text: "朋友遇到难题时，你会先\n理解对方的感受。", dimension: "TF", reverse: true },
  { text: "旅行时，随兴改变计划\n会让你觉得很有趣。", dimension: "JP", reverse: true },
  { text: "在陌生的聚会中，\n你愿意主动开启对话。", dimension: "EI" },
  { text: "比起眼前的细节，你更容易\n想到事情背后的联系。", dimension: "SN", reverse: true },
  { text: "讨论分歧时，你会优先\n检查证据和推理。", dimension: "TF" },
  { text: "开始一项任务之前，\n你喜欢先列出步骤。", dimension: "JP" },
  { text: "表达重要想法之前，\n你需要独自整理思路。", dimension: "EI", reverse: true },
  { text: "比起抽象的理论，\n你更信任亲身验证的经验。", dimension: "SN" },
  { text: "即使方案很有效，你也会在意\n它给他人带来的感受。", dimension: "TF", reverse: true },
  { text: "为临时出现的新机会\n保留空间，让你感到自在。", dimension: "JP", reverse: true },
  { text: "和别人边聊边想，\n常常能帮你理清思路。", dimension: "EI" },
  { text: "你经常会想象，\n事情未来可能变成什么样。", dimension: "SN", reverse: true },
  { text: "评价一个方案时，你更重视\n标准一致，而非人情因素。", dimension: "TF" },
  { text: "比起临近截止才动手，\n你更愿意提前完成任务。", dimension: "JP" },
  { text: "比起认识很多新朋友，\n你更享受少数深入的交谈。", dimension: "EI", reverse: true },
  { text: "听别人描述一件事时，\n你会留意具体发生了什么。", dimension: "SN" },
  { text: "作出选择时，是否符合\n自己的价值观很重要。", dimension: "TF", reverse: true },
  { text: "事情尚未确定时，\n你也能轻松地继续探索。", dimension: "JP", reverse: true },
  { text: "遇到有趣的事情，\n你常常想马上和别人分享。", dimension: "EI" },
  { text: "你喜欢讨论那些\n暂时还不能实现的想法。", dimension: "SN", reverse: true },
  { text: "提供反馈时，你倾向于\n直接指出问题所在。", dimension: "TF" },
  { text: "将待办事项逐一完成，\n会给你明显的满足感。", dimension: "JP" },
  { text: "忙碌一周之后，你通常需要\n独处来恢复精力。", dimension: "EI", reverse: true },
  { text: "判断一个想法是否可行时，\n你会先考虑现实条件。", dimension: "SN" },
  { text: "团队里有人被忽略时，\n你会特别在意对方的处境。", dimension: "TF", reverse: true },
  { text: "比起固定的日程，\n你喜欢根据当下情况调整。", dimension: "JP", reverse: true },
];

export const questions: Question[] = legacyItems.map((q, i) => ({ ...q, id: `legacy32-q${String(i + 1).padStart(2, "0")}` }));
export const QUESTION_COUNT = questions.length;
export const ANSWER_VALUES = [2, 1, 0, -1, -2] as const;
export type AnswerValue = (typeof ANSWER_VALUES)[number];

// New original editorial items. Balanced coverage is a design constraint, not evidence of validity.
const additions: Omit<Question, "id">[] = [
  { text: "有一段自由时间时，\n我通常会主动找人一起度过。", dimension: "EI" },
  { text: "阅读一份陌生的介绍时，\n我先寻找可以核实的具体信息。", dimension: "SN" },
  { text: "分配有限的公共资源时，\n我倾向于先确定统一的分配标准。", dimension: "TF" },
  { text: "没有外部截止时间的事情，\n我也喜欢给自己定一个完成日期。", dimension: "JP" },
  { text: "在线上讨论里，\n我更喜欢想清楚后再发出完整回复。", dimension: "EI", reverse: true },
  { text: "接触一个新主题时，\n我通常先想它与其他事情有什么联系。", dimension: "SN", reverse: true },
  { text: "面对一项规则的例外请求时，\n我会先考虑当事人的具体处境。", dimension: "TF", reverse: true },
  { text: "周末没有必须完成的安排时，\n我更愿意当天再决定做什么。", dimension: "JP", reverse: true },
  { text: "独立做事一段时间后，\n找人聊一聊常能让我恢复精神。", dimension: "EI" },
  { text: "接到一个不熟悉的任务时，\n我希望先看到一个完成后的实例。", dimension: "SN" },
  { text: "比较两个都能接受的方案时，\n我通常先逐项比较成本与收益。", dimension: "TF" },
  { text: "和别人约定活动时，\n我倾向于尽早确定时间和地点。", dimension: "JP" },
  { text: "参加热闹活动之前，\n我会希望留出一段安静的准备时间。", dimension: "EI", reverse: true },
  { text: "观察重复出现的现象时，\n我喜欢尝试找出一个整体解释。", dimension: "SN", reverse: true },
  { text: "给别人分配任务时，\n我会先了解对方愿意投入什么。", dimension: "TF", reverse: true },
  { text: "作出非紧急的选择时，\n我喜欢让几个选项多保留一阵。", dimension: "JP", reverse: true },
  { text: "有一个尚未成形的想法时，\n我愿意先说出来和别人一起推敲。", dimension: "EI" },
  { text: "复述一次经历时，\n我通常先讲事情发生的具体过程。", dimension: "SN" },
  { text: "出现意见分歧时，\n我喜欢先约定怎样判断哪种方案更合适。", dimension: "TF" },
  { text: "同时有几件事需要处理时，\n我喜欢先排好处理顺序。", dimension: "JP" },
  { text: "学习或工作间隙，\n我更愿意自己散步来放松。", dimension: "EI", reverse: true },
  { text: "面对熟悉的做法时，\n我经常会想它还能怎样改变。", dimension: "SN", reverse: true },
  { text: "协商共同安排时，\n我通常先确认每个人最在意的需要。", dimension: "TF", reverse: true },
  { text: "在尝试一种新爱好时，\n我更喜欢先探索，再决定是否长期坚持。", dimension: "JP", reverse: true },
  { text: "进入一个新的小组时，\n我倾向于通过主动交流熟悉大家。", dimension: "EI" },
  { text: "选择接下来怎么做时，\n过去可重复的经验对我很有说服力。", dimension: "SN" },
  { text: "评价一个自己喜欢的想法时，\n我仍会先找出它不成立的条件。", dimension: "TF" },
  { text: "一件事已经有可行方案时，\n我愿意先定下来再按步骤推进。", dimension: "JP" },
  { text: "需要梳理复杂感受时，\n我通常先自己写下来，而不是马上找人聊。", dimension: "EI", reverse: true },
  { text: "阅读一个故事时，\n我常会想到它没有直接说出的含义。", dimension: "SN", reverse: true },
  { text: "两个方案效果接近时，\n我更愿意选择让参与者感到被尊重的方式。", dimension: "TF", reverse: true },
  { text: "发现新的信息后，\n我通常愿意重新打开已经讨论过的选项。", dimension: "JP", reverse: true },
];

// Reduce broad value statements in the new version without changing historical scoring.
const revised: Record<number, string> = {
  14: "决定如何回应朋友的请求时，\n我会先考虑对方此刻的感受。",
  22: "面对几种可行的选择时，\n我会先看哪一种更符合参与者重视的事情。",
  26: "提供反馈时，\n我倾向于先说明判断所依据的事实。",
  30: "小组出现分歧时，\n我倾向于先听清各方在意的需要。",
};
const standardQuestions = [...legacyItems.map((q, i) => ({ ...q, text: revised[i] ?? q.text })), ...additions]
  .map((q, i) => ({ ...q, id: `standard64-q${String(i + 1).padStart(2, "0")}` }));

export const questionnaires = [
  { id: LEGACY_QUESTIONNAIRE_ID, name: "轻量版", count: 32, duration: "约 5 分钟", description: "先认识四维偏好，适合时间有限的第一次探索。", questions },
  { id: STANDARD_QUESTIONNAIRE_ID, name: "标准版", count: 64, duration: "约 8–10 分钟", description: "覆盖更多生活情境，适合愿意多花一点时间观察自己。", questions: standardQuestions },
] as const;
export type QuestionnaireId = (typeof questionnaires)[number]["id"];
export type Questionnaire = (typeof questionnaires)[number];

export function getQuestionnaire(id: string): Questionnaire | undefined {
  return questionnaires.find((q) => q.id === id);
}

export type ResponseItem = { questionId: string; value: number };
export function parseSubmission(input: unknown): { questionnaire: Questionnaire; answers: number[]; responses: ResponseItem[] } | null {
  if (!input || typeof input !== "object" || !("answers" in input) || !Array.isArray(input.answers)) return null;
  const suppliedAnswers: unknown[] = input.answers;
  const version = "questionnaireId" in input ? input.questionnaireId : LEGACY_QUESTIONNAIRE_ID;
  if (typeof version !== "string") return null;
  const questionnaire = getQuestionnaire(version);
  if (!questionnaire || input.answers.length !== questionnaire.count) return null;
  const isAnswer = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= -2 && v <= 2;
  // Numeric arrays are supported only for the frozen 32-item API used by old clients.
  if (version === LEGACY_QUESTIONNAIRE_ID && suppliedAnswers.every(isAnswer)) {
    return { questionnaire, answers: suppliedAnswers, responses: questionnaire.questions.map((q, i) => ({ questionId: q.id, value: suppliedAnswers[i] })) };
  }
  const byId = new Map<string, number>();
  for (const item of input.answers) {
    if (!item || typeof item !== "object" || typeof item.questionId !== "string" || !isAnswer(item.value) || byId.has(item.questionId)) return null;
    byId.set(item.questionId, item.value);
  }
  if (!questionnaire.questions.every((q) => byId.has(q.id))) return null;
  const responses = questionnaire.questions.map((q) => ({ questionId: q.id, value: byId.get(q.id)! }));
  return { questionnaire, answers: responses.map((r) => r.value), responses };
}
