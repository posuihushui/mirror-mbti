import { dimensions, poles, profileMeta, type Letter, type Profile } from "@/lib/personality";
import { dimensionReading } from "@/lib/preference-content";
import { blindspotTitles } from "@/lib/site";

export type Insight = { title: string; body: string };

// Paid reading is contextual editorial guidance, separate from the public type encyclopedia.
const scenes: Record<Letter, { scene: string; watch: string; phrase: string; work: string; experiment: string }> = {
  E: {
    scene: "面对一项没有头绪的共同任务，你可能在说出草案、听到回应后才逐渐看清方向。把讨论分成提出想法和做决定两轮，会更容易让这种思考方式发挥作用。",
    watch: "对方安静时，不一定是没有兴趣。邀请对方稍后用文字补充，避免把当场发言的速度误当作投入程度。",
    phrase: "我想先聊十分钟理清思路，你现在方便吗？你也可以想好后再回复。",
    work: "把需要协作的任务集中在一个沟通时段，讨论前写下一个问题，结束时留一份共同确认的结论。",
    experiment: "找一次短讨论，先约定时间与一个问题；结束后独自写下三句结论，比较交流前后的清晰度。",
  },
  I: {
    scene: "在需要回应复杂问题的讨论中，你可能先独立整理，再给出相对完整的观点。提前获取议题、准备几条笔记，往往比要求自己随时即兴发言更合适。",
    watch: "等待想法完全成熟再表达，可能让别人不知道你的进度。先给一个简短的阶段性回应，并约定下一次沟通时间。",
    phrase: "我在认真考虑这件事，想先整理一下；我们今晚八点再聊，可以吗？",
    work: "为复杂任务安排一段安静时间，在开始和结束各同步一次进度，让独立处理与团队协作都有明确边界。",
    experiment: "在一次讨论前预留十五分钟写提纲，主动分享一个未完成的想法，观察别人是否更容易接住你的思路。",
  },
  S: {
    scene: "接到模糊的需求时，你可能先追问例子、限制和完成标准。把这些问题整理成一张小清单，能减少双方对“完成”的不同理解。",
    watch: "熟悉的经验很有用，但新情境可能已经改变条件。复用旧方法前，单独写出这一次与过去不同的一个地方。",
    phrase: "能给我一个具体例子吗？我想先确认现在发生了什么，再一起讨论可能的变化。",
    work: "开始任务前明确一份可见的交付物，做出小样后再完善；同时留一个问题，检查原来的假设是否仍成立。",
    experiment: "选一个习惯做法，列出三个已知事实，再写一个与过去不同的条件，尝试一个小调整。",
  },
  N: {
    scene: "看到新问题时，你可能先想到它与其他事情的联系。用一张简图表达关联，再补上一个眼前的例子，会让别人更容易跟上你的思路。",
    watch: "“我看到了可能性”与“已有证据证明”是两件事。把想象、假设和已知事实分开写，避免在行动时混用。",
    phrase: "我想到一种可能，不过它还没有验证。我们先用这个小例子看看它是否说得通。",
    work: "先用一句话写明任务为什么值得做，再把方向转成一个当天可验证的小样，防止目标停留在抽象层面。",
    experiment: "挑一个新想法，写出可观察的预期，并用一次小尝试检验；记录结果与设想不同的地方。",
  },
  T: {
    scene: "资源有限或意见不同时，你可能先寻找能共同使用的判断标准。先解释标准为何与目标有关，再讨论例外，能让分析更容易形成共识。",
    watch: "标准一致不等于每个人承担的代价相同。提出结论前，询问谁会受到影响，并说明哪些代价需要额外照顾。",
    phrase: "我的判断依据是这两点；我也想知道，这个做法会给你带来什么影响？",
    work: "比较方案时列出共同目标、判断依据和受影响的人；先筛出可行选项，再沟通每个选项的取舍。",
    experiment: "做一次小决定时，写出两条判断标准，再请相关的人补充一个你没有考虑到的影响。",
  },
  F: {
    scene: "共同做决定时，你可能先留意谁在意什么、哪些价值需要被照顾。把不同需要转成可讨论的条件，可以让关心更具体，而非只停留在让所有人满意。",
    watch: "察觉他人的期待，不等于必须替他们承担。区分“我理解你的需要”与“这件事我能答应”，并说清自己的资源边界。",
    phrase: "我理解这对你很重要；我能做到的是这一部分，其余部分需要我们再一起安排。",
    work: "明确任务对谁有帮助，同时约定投入上限和完成标准，减少因为不断照顾额外需求而难以结束的情况。",
    experiment: "在一个小请求中先确认对方需要，再清楚说出自己能提供的时间或帮助，观察关系是否仍然可以保持连接。",
  },
  J: {
    scene: "当几件事同时推进时，你可能通过先排顺序、确定节点获得稳定感。把必须确定的部分与可以调整的部分分开，会让计划更能应对现实。",
    watch: "计划改变并不等于之前的努力无效。给任务留出缓冲，并提前约定什么新信息足以让你修改安排。",
    phrase: "我们先定好必须完成的时间，其余细节留到那之前调整。若条件变了，再一起改计划。",
    work: "每天只固定一个最重要的交付节点，给其他工作保留缓冲，并在结束时检查计划是否仍符合目标。",
    experiment: "给一天的计划预留一小段空白，出现变化时记录自己如何调整，而不只记录是否按原计划完成。",
  },
  P: {
    scene: "情况不断变化时，你可能愿意保留选项并边做边调整。为探索设置一个小范围和结束条件，可以保留灵活，也让共同参与的人知道何时能得到结论。",
    watch: "继续发现新选项有时会推迟必要的收尾。区分还能轻易修改的决定与必须按时交付的决定，为后者约定一个暂定答案。",
    phrase: "我还想再比较两个选项，但会在周五前给出暂定决定；之后有新信息我们再调整。",
    work: "把任务拆成短周期尝试，每轮明确一个输出和反馈时间，允许方法改变，同时保留可靠的交付边界。",
    experiment: "选一件总想继续探索的小事，约定一个暂定决定的时间，到时先完成一个可修改的版本。",
  },
};

function context(profile: Profile, index: number) {
  const reading = dimensionReading(profile, index);
  const scene = scenes[profile.type[index] as Letter];
  const qualifier = reading.degree === "偏向较明显" ? "这次偏向较明显，可以优先观察以下情境。" : "这次只有轻微偏向，以下情境只是可对照的一种可能。";
  return { reading, scene, qualifier };
}

export function buildReportData(profile: Profile, options: { sample: boolean; demo: boolean }) {
  const { name, line, summary, typeLabel } = profileMeta(profile);
  const contexts = dimensions.map((_, i) => context(profile, i));
  const strengths = contexts.map(({ reading, scene, qualifier }, i) => ({
    title: profile.balanced[i] ? `观察${reading.pair}两种需要` : poles[profile.type[i]].need,
    body: profile.balanced[i] ? `${reading.balanced}这不是“两边都擅长”的能力结论；请用不同情境的实际经历检验。` : `${qualifier}${scene.scene}`,
  }));
  const blindspots = contexts.map(({ reading, scene, qualifier }, i) => ({
    title: blindspotTitles[i], body: profile.balanced[i] ? `当${reading.pair}接近均衡时，不必为自己选定一个固定标签。${reading.question}分别写出两种答案对应的场景，看看改变的是任务、角色还是精力。` : `${qualifier}${scene.watch}`,
  }));
  const relationshipTitles = ["让精力的需要变得可见", "把彼此理解的起点说清楚", "一起说明决定背后的取舍", "约定稳定部分与可变部分"];
  const relationships = contexts.map(({ reading, scene, qualifier }, i) => ({
    title: relationshipTitles[i], body: profile.balanced[i] ? `${reading.balanced}可以这样开始：“我在不同情境下会有不同需要，这一次我更希望……你呢？”` : `${qualifier}可以尝试这样说：“${scene.phrase}”然后邀请对方用自己的话回应，避免用类型猜测对方。`,
  }));
  const work = contexts.map(({ reading, scene, qualifier }, i) => ({
    title: ["适合你的工作节奏", "让理解变成可见的成果", "给选择设定可讨论的条件", "兼顾推进与调整"][i],
    body: profile.balanced[i] ? `${reading.balanced}在学习或工作中各试用一次，记录哪种安排更适合当前任务，而非为自己选择固定职业标签。` : `${qualifier}${scene.work}`,
  }));
  const actionPlan: Insight[] = [
    { title: "第 1 天 · 留下一次真实记录", body: "选一个今天发生的小情境，记下当时的任务、与你互动的人、你的第一反应和精力变化。先描述事实，暂时不套用人格标签。" },
    ...contexts.map(({ reading, scene }, i) => ({ title: `第 ${i + 2} 天 · ${reading.title}`, body: profile.balanced[i] ? `${reading.question}找出两种不同表现的例子，分别记录它们出现的条件。` : scene.experiment })),
    { title: "第 6 天 · 换一种方式试试", body: "从前几天挑一个最熟悉的反应，在低风险的小事上试一次不同做法。记录它是否带来新信息；不需要强迫自己长期使用不合适的方式。" },
    { title: "第 7 天 · 保留一个小调整", body: "回看这一周：哪项描述有具体经历支持？哪项不符合？选一个确实有帮助的安排保留一周。复测前先看这些记录，不追求得到某一种类型。" },
  ];
  return { profile, name, line, summary, typeLabel, sample: options.sample, demo: options.demo, strengths, blindspots, relationships, work, actionPlan };
}
