import { poles, typeMeta } from "@/lib/personality";
import { blindspotTitles } from "@/lib/site";

export type Insight = { title: string; body: string };

/** Chapter 02 — strengths and blind spots, one per dimension letter. */
export function strengthInsights(letters: string[]): Insight[] {
  return letters.map((l) => ({ title: poles[l].need, body: poles[l].strength }));
}

export function blindspotInsights(letters: string[]): Insight[] {
  return letters.map((l, i) => ({ title: blindspotTitles[i], body: poles[l].growth }));
}

/** Chapter 03 — relationships and communication. */
export function relationshipInsights(letters: string[]): Insight[] {
  return [
    {
      title: "让精力的需要变得可见",
      body:
        letters[0] === "I"
          ? "你可能需要独处来恢复精力。提前告诉对方“我想安静一会儿，晚饭后再聊”，比突然沉默更容易被理解。"
          : "你可能通过交谈整理感受。先问对方现在是否方便，再分享你想讨论的内容，为彼此的精力留出空间。",
    },
    {
      title: "先确认对方需要什么",
      body:
        letters[2] === "F"
          ? "你很容易注意到对方的情绪，但不需要替对方承担所有感受。倾听之后，可以问：“你希望我接下来怎么陪你？”"
          : "你可能很快看见解决问题的办法。在给建议之前，先回应对方的感受，会让你的分析更容易被接住。",
    },
  ];
}

/** Chapter 04 — work and growth. */
export function workInsights(letters: string[]): Insight[] {
  const rhythm =
    (letters[0] === "I"
      ? "为需要专注的任务留出不被打断的时间，再安排集中交流。"
      : "通过定期讨论保持进展，同时为独立思考安排完整时段。") +
    (letters[3] === "J"
      ? "清晰的目标和节点会让你更安心，也别忘了为变化留一点余地。"
      : "灵活的任务安排能激发你的主动性，重要节点仍需要提前约定。");
  return [
    { title: "适合你的工作节奏", body: rhythm },
    { title: "这一周，试着做一件小事", body: poles[letters[2]].growth },
  ];
}

export function reportSummary(type: string) {
  const { name, line, summary, letters } = typeMeta(type);
  return { name, line, summary, letters };
}
