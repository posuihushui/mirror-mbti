import { enPoles } from "@/lib/i18n/content/en/personality";
import { enDegrees, enInterpretation, enPreferenceDimensions, enPreferenceNotes } from "@/lib/i18n/content/en/preferences";
import type { Locale } from "@/lib/i18n/locale";
import { dimensions, poles, type Letter, type Profile } from "@/lib/personality";

export const preferenceDimensions = [
  { title: "精力与交流", pair: "外向 / 内向", description: "E 侧更容易借助交流整理思路；I 侧更常先独立消化。描述恢复精力的方式，不等于社交能力或害羞程度。", question: "热闹的交流之后，我想继续聊，还是需要一段独处？", balanced: "你可能在熟悉的人面前愿意分享，也会在信息密集后需要独处。分别观察活动前后的精力，不急着选定一端。" },
  { title: "信息与注意", pair: "实感 / 直觉", description: "S 侧先留意事实、实例和经验；N 侧先寻找联系与可能。两种方式都可以有创造力，也都需要核实信息。", question: "理解陌生的事情时，我先要一个实例，还是一张整体地图？", balanced: "你可能通过实例理解细节，再把细节连成整体。尝试先看一个具体案例，再画出它与其他事情的联系。" },
  { title: "判断与取舍", pair: "思考 / 情感", description: "T 侧先检验逻辑与一致标准；F 侧先考虑价值与人的处境。两端都能理性分析，也都能关心别人。", question: "面对两种可行方案时，我最先比较标准，还是它对人的影响？", balanced: "你可能同时看重理由是否一致、选择是否照顾具体处境。把两种标准分别写下来，再说明这次的优先顺序。" },
  { title: "安排与应变", pair: "判断 / 知觉", description: "J 侧喜欢提前确定安排；P 侧习惯留出调整空间。描述安排方式，不代表自律程度或办事能力。", question: "没有外部期限时，我愿意先定计划，还是边探索边决定？", balanced: "你可能对重要事项需要明确节点，对非紧急活动更愿意即兴。试着只固定必要的时间，把其余部分留白。" },
] as const;

export const preferenceNotes = [
  { title: "如何理解接近 50%？", body: "50% 表示本次该维度两侧回答相抵，并不证明你具有两侧同等能力。页面将 50%–60% 的较高侧分数作为“接近均衡”的展示区间；这是产品的解释规则，不是经过验证的统计置信区间。四维都在这个区间时暂不生成确定类型。" },
  { title: "复测时，先看发生了什么。", body: "近期的角色、精力、经历和对题意的理解都可能改变答案。记录测试版本、时间和具体情境，先比较维度变化，再看字母。百分比不是能力分、准确率或人群百分位；32 题与 64 题尚未做等值校准，不能把跨版本分数直接当成同一尺度。" },
] as const;

export function preferenceDimensionsFor(locale: Locale) {
  return locale === "en" ? enPreferenceDimensions : preferenceDimensions;
}

export function preferenceNotesFor(locale: Locale) {
  return locale === "en" ? enPreferenceNotes : preferenceNotes;
}

export function dimensionReading(profile: Profile, index: number, locale: Locale = "zh") {
  const dimension = dimensions[index];
  const letter = profile.type[index];
  const firstPercent = letter === dimension[0] ? profile.values[index] : 100 - profile.values[index];
  const balanced = profile.balanced[index];
  const strong = profile.values[index] >= 75;
  if (locale === "en") {
    const copy = enPreferenceDimensions[index];
    const pole = enPoles[letter as Letter];
    return { ...copy, dimension, letter, firstPercent, secondPercent: 100 - firstPercent,
      degree: balanced ? enDegrees.balanced : strong ? enDegrees.clear : enDegrees.slight,
      label: balanced ? copy.pair : `${pole.label} ${letter}`,
      interpretation: balanced ? copy.balanced : enInterpretation(pole.label, pole.need, strong),
    };
  }
  const degree = balanced ? "接近均衡" : strong ? "偏向较明显" : "有轻微偏向";
  return { ...preferenceDimensions[index], dimension, letter, firstPercent, secondPercent: 100 - firstPercent, degree,
    label: balanced ? preferenceDimensions[index].pair : `${poles[letter].label} ${letter}`,
    interpretation: balanced ? preferenceDimensions[index].balanced : `本次更偏向${poles[letter].label}一侧：${poles[letter].need}。${strong ? "这种方式可能是你较常使用的起点，但不代表另一端的能力较弱。" : "偏向幅度不大，换一个情境时，也可能使用另一种方式。"}`,
  };
}
