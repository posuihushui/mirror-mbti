export type Dimension = 'EI' | 'SN' | 'TF' | 'JP';
export type Question = { text: string; dimension: Dimension; reverse?: boolean };
// Original demonstration items, not the licensed MBTI questionnaire.
export const questions: Question[] = [
  { text: '和一群人相处之后，\n你通常觉得更有活力。', dimension: 'EI' },
  { text: '面对新事物，你会先关注\n它能带来哪些可能性。', dimension: 'SN', reverse: true },
  { text: '做重要决定时，你通常\n更看重逻辑是否说得通。', dimension: 'TF' },
  { text: '提前安排好一天的事情，\n会让你感到安心。', dimension: 'JP' },
  { text: '休息时，你更愿意\n一个人安静地待一会儿。', dimension: 'EI', reverse: true },
  { text: '学习新技能时，你更喜欢\n清晰、具体的操作示范。', dimension: 'SN' },
  { text: '朋友遇到难题时，你会先\n理解对方的感受。', dimension: 'TF', reverse: true },
  { text: '旅行时，随兴改变计划\n会让你觉得很有趣。', dimension: 'JP', reverse: true },
  { text: '在陌生的聚会中，\n你愿意主动开启对话。', dimension: 'EI' },
  { text: '比起眼前的细节，你更容易\n想到事情背后的联系。', dimension: 'SN', reverse: true },
  { text: '讨论分歧时，你会优先\n检查证据和推理。', dimension: 'TF' },
  { text: '开始一项任务之前，\n你喜欢先列出步骤。', dimension: 'JP' },
  { text: '表达重要想法之前，\n你需要独自整理思路。', dimension: 'EI', reverse: true },
  { text: '比起抽象的理论，\n你更信任亲身验证的经验。', dimension: 'SN' },
  { text: '即使方案很有效，你也会在意\n它给他人带来的感受。', dimension: 'TF', reverse: true },
  { text: '为临时出现的新机会\n保留空间，让你感到自在。', dimension: 'JP', reverse: true },
  { text: '和别人边聊边想，\n常常能帮你理清思路。', dimension: 'EI' },
  { text: '你经常会想象，\n事情未来可能变成什么样。', dimension: 'SN', reverse: true },
  { text: '评价一个方案时，你更重视\n标准一致，而非人情因素。', dimension: 'TF' },
  { text: '比起临近截止才动手，\n你更愿意提前完成任务。', dimension: 'JP' },
  { text: '比起认识很多新朋友，\n你更享受少数深入的交谈。', dimension: 'EI', reverse: true },
  { text: '听别人描述一件事时，\n你会留意具体发生了什么。', dimension: 'SN' },
  { text: '作出选择时，是否符合\n自己的价值观很重要。', dimension: 'TF', reverse: true },
  { text: '事情尚未确定时，\n你也能轻松地继续探索。', dimension: 'JP', reverse: true },
  { text: '遇到有趣的事情，\n你常常想马上和别人分享。', dimension: 'EI' },
  { text: '你喜欢讨论那些\n暂时还不能实现的想法。', dimension: 'SN', reverse: true },
  { text: '提供反馈时，你倾向于\n直接指出问题所在。', dimension: 'TF' },
  { text: '将待办事项逐一完成，\n会给你明显的满足感。', dimension: 'JP' },
  { text: '忙碌一周之后，你通常需要\n独处来恢复精力。', dimension: 'EI', reverse: true },
  { text: '判断一个想法是否可行时，\n你会先考虑现实条件。', dimension: 'SN' },
  { text: '团队里有人被忽略时，\n你会特别在意对方的处境。', dimension: 'TF', reverse: true },
  { text: '比起固定的日程，\n你喜欢根据当下情况调整。', dimension: 'JP', reverse: true },
];
export const names: Record<string, [string, string, string]> = {
  INFJ: ['提倡者', '温柔地理解世界，\n坚定地走向自己。', '你倾向于在安静中整理想法，也在真实的连接里寻找意义。你关心一个决定是否符合内心的价值，并希望把对未来的想象慢慢变成现实。'],
  INFP: ['调停者', '让内心的光，\n照见更多可能。', '你重视真实的感受与内在价值，喜欢为生活寻找更深的意义。独处帮助你听见自己，而开放的空间让你的想象力慢慢生长。'],
  INTJ: ['建筑师', '在安静之中，\n构想更远的未来。', '你倾向于独立思考，用逻辑把零散信息连成整体。长远的方向和清晰的计划，能帮助你把想法一步步变成现实。'],
  INTP: ['逻辑学家', '保持好奇，\n看见问题的另一面。', '你喜欢追问事情为什么如此，也愿意独自探索不同的解释。比起过早下结论，你更享受为想法保留开放空间。'],
  ENFJ: ['主人公', '在彼此看见时，\n让改变发生。', '你从人与人的交流中获得能量，关注他人的成长与共同的方向。你愿意主动连接大家，并推动有意义的事情落地。'],
  ENFP: ['竞选者', '与世界相遇，\n让可能性生长。', '新的人、新的想法和真诚的交流容易点亮你的热情。你重视内心的认同，也喜欢为生活保留即兴探索的余地。'],
  ENTJ: ['指挥官', '看清方向，\n把想法推向现实。', '你愿意通过交流推动事情，倾向于从整体理解问题。逻辑、目标与可执行的计划，是你组织行动时常用的工具。'],
  ENTP: ['辩论家', '从一个问题，\n打开新的可能。', '交流和思想碰撞容易激发你的好奇心。你擅长尝试不同解释，用逻辑检验想法，同时为新路线留出空间。'],
  ISFJ: ['守卫者', '把细小的关心，\n放进每一天。', '你重视可靠的经验和具体的行动，也细心关注身边人的需要。安静的环境与有序的安排，常常让你更容易发挥所长。'],
  ISFP: ['探险家', '感受当下，\n活出自己的颜色。', '你愿意从真实的体验里认识世界，珍惜内心的感受。适度独处和自由选择的空间，让你更能按照自己的节奏生活。'],
  ISTJ: ['物流师', '用踏实的行动，\n建立可靠的秩序。', '你倾向于根据具体事实作判断，用明确的标准和步骤处理事情。独立、安静地完成任务，常常能让你进入稳定的状态。'],
  ISTP: ['鉴赏家', '亲手探索，\n找到自己的答案。', '你喜欢通过实际尝试理解事物，以逻辑解决眼前的问题。独立行动和灵活调整的空间，有助于发挥你的观察力。'],
  ESFJ: ['执政官', '让每一次相处，\n都有温度。', '你从交流中获取能量，也注意到他人具体的需求。你愿意把关心转化为行动，用有序的安排照顾共同的生活。'],
  ESFP: ['表演者', '投入此刻，\n与生活真实相遇。', '你容易被真实的体验和人与人的连接吸引。你重视感受，也乐于根据眼前的变化灵活调整自己的行动。'],
  ESTJ: ['总经理', '把眼前的事情，\n一步一步做好。', '你倾向于通过沟通组织行动，以事实和明确的标准作判断。清楚的分工与计划，帮助你推动事情稳步完成。'],
  ESTP: ['企业家', '走进真实世界，\n在行动中发现答案。', '你愿意主动接触新的人和事，在具体经验中寻找机会。你习惯结合逻辑快速判断，并根据现场情况调整行动。'],
};
export const poles: Record<string, { label: string; need: string; strength: string; growth: string }> = {
  E: { label:'外向', need:'在交流中获得能量', strength:'愿意主动发起交流，让想法在讨论中变得清晰。', growth:'在回应之前给自己十秒钟，留意尚未说出口的想法。' },
  I: { label:'内向', need:'在独处中恢复能量', strength:'为思考保留深度，能够独立整理复杂的感受和信息。', growth:'把“我需要独处”说成具体安排，让重要的人知道你何时会回来。' },
  S: { label:'实感', need:'从具体经验理解世界', strength:'留意事实与细节，帮助想法落到现实之中。', growth:'解决眼前问题后，再问一次：这件事还有什么可能？' },
  N: { label:'直觉', need:'从联系与可能性获得灵感', strength:'看见零散信息之间的联系，为眼前的事情找到长远意义。', growth:'为一个宏大的想法，安排一个今天就能完成的小动作。' },
  T: { label:'思考', need:'用逻辑与一致标准作判断', strength:'区分事实与推测，在分歧中保持清晰的分析。', growth:'给出解决方案前，先问对方：你更需要建议，还是倾听？' },
  F: { label:'情感', need:'在选择中照顾价值与感受', strength:'理解选择背后的人，留意关系中的感受与价值。', growth:'在照顾别人之前，先写下自己的一个需要，并清楚表达它。' },
  J: { label:'判断', need:'在计划与确定中感到安心', strength:'把目标拆成步骤，让事情沿着清晰的方向推进。', growth:'在计划里留出一小段空白，把变化视为信息，而非失败。' },
  P: { label:'知觉', need:'在灵活与探索中保持自在', strength:'根据新信息及时调整，为不同的选择保留空间。', growth:'给最重要的一件事设定一个轻量的完成节点。' },
};
export type Profile = { type: string; values: number[]; balanced: boolean[] };
export const sampleProfile: Profile = { type:'INFJ', values:[79,71,64,58], balanced:[false,false,false,true] };
export function calculate(answers: number[]): Profile {
  const dims: Dimension[] = ['EI','SN','TF','JP'];
  const raw = dims.map(dim => {
    const indices = questions.flatMap((q,i) => q.dimension === dim ? [i] : []);
    const sum = indices.reduce((acc,i) => acc + (questions[i].reverse ? -answers[i] : answers[i]),0);
    return Math.round(50 + sum / (indices.length * 2) * 50);
  });
  return { type: raw.map((n,i) => dims[i][n>=50?0:1]).join(''), values: raw.map(n=> Math.max(n,100-n)), balanced: raw.map(n=> Math.abs(n-50) <= 10) };
}
