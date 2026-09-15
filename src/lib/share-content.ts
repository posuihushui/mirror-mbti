import type { Locale } from "@/lib/i18n/locale";
import { profileMeta, type Profile } from "@/lib/personality";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicDimension, PublicShareSnapshot, ShareCandidate, ShareDimension } from "@/lib/share-types";

export const SHARE_CONTENT_VERSION = "share-v1" as const;
export const shareDimensions = ["EI", "SN", "TF", "JP"] as const;
const sentences = {
  zh: [
    ["我常在交流中整理想法，愿意听你一起讨论。", "我想聊天还是独处，会随当天的状态变化。", "我有时需要先独处整理，再把想法告诉你。"],
    ["说明一件事时，具体的例子会帮助我理解。", "我既需要具体例子，也想知道它与整体的联系。", "理解细节之前，我常想先知道整体的方向。"],
    ["面对分歧时，把理由和判断标准说清楚会帮助我。", "做决定时，我会同时留意理由与彼此的感受。", "讨论决定时，也请告诉我它会怎样影响彼此。"],
    ["重要安排提前说清楚，会让我更安心。", "重要的事我想先确定，其余安排可以留些弹性。", "安排留一点调整空间，会让我更自在。"],
  ],
  en: [
    ["Talking things through often helps me organize my thoughts.", "Whether I want company or time alone can change with my day.", "I sometimes need time alone to gather my thoughts before sharing."],
    ["A concrete example helps me understand what you mean.", "I value both concrete examples and how they fit into the bigger picture.", "I often want to see the bigger picture before exploring the details."],
    ["Clear reasons and criteria help me work through a disagreement.", "I consider both the reasoning and how people feel about a decision.", "When discussing a decision, I also want to understand its effect on people."],
    ["Knowing important plans in advance helps me feel at ease.", "I like to settle the important parts and keep some flexibility elsewhere.", "Leaving some room to adjust plans helps me feel comfortable."],
  ],
};
const labels = {
  zh: [["外向", "外向 / 内向 · 接近均衡", "内向"], ["感觉", "感觉 / 直觉 · 接近均衡", "直觉"], ["思考", "思考 / 情感 · 接近均衡", "情感"], ["判断", "判断 / 知觉 · 接近均衡", "知觉"]],
  en: [["Extraverted", "Extraversion / Introversion · Close to balanced", "Introverted"], ["Sensing", "Sensing / Intuition · Close to balanced", "Intuitive"], ["Thinking", "Thinking / Feeling · Close to balanced", "Feeling"], ["Judging", "Judging / Perceiving · Close to balanced", "Perceiving"]],
};
function stateIndex(profile: Profile, index: number): 0 | 1 | 2 {
  if (profile.balanced[index]) return 1;
  return profile.type[index] === shareDimensions[index][0] ? 0 : 2;
}
export function buildShareCandidates(profile: Profile, locale: Locale = "zh"): ShareCandidate[] {
  return shareDimensions.map((dimension, index) => {
    const state = stateIndex(profile, index);
    return { id: `${SHARE_CONTENT_VERSION}:${dimension}:${state === 1 ? "balanced" : dimension[state === 0 ? 0 : 1]}`, dimension, text: sentences[locale][index][state] };
  });
}
export function defaultShareSelection(profile: Profile): string[] {
  const candidates = buildShareCandidates(profile);
  const indices = [0, 1, 2, 3];
  if (!profile.balanced.every(Boolean)) indices.sort((a, b) => Number(profile.balanced[a]) - Number(profile.balanced[b]) || profile.values[b] - profile.values[a] || a - b);
  return indices.slice(0, 3).sort((a, b) => a - b).map(index => candidates[index].id);
}
export function buildPublicDimensions(profile: Profile, locale: Locale = "zh"): NonNullable<PublicShareSnapshot["dimensions"]> {
  return shareDimensions.map((dimension: ShareDimension, index): PublicDimension => {
    const state = stateIndex(profile, index);
    return { dimension, state: (["left", "balanced", "right"] as const)[state], label: labels[locale][index][state] };
  }) as NonNullable<PublicShareSnapshot["dimensions"]>;
}
export function buildPublicShareSnapshot(profile: Profile, locale: Locale, selectedIds: readonly string[], showType: boolean, showDimensions: boolean): PublicShareSnapshot {
  const candidates = buildShareCandidates(profile, locale);
  if (selectedIds.length !== 3 || new Set(selectedIds).size !== 3 || selectedIds.some(id => !candidates.some(candidate => candidate.id === id))) throw new Error("INVALID_SHARE_SELECTION");
  const t = shareMessages[locale];
  const snapshot: PublicShareSnapshot = { version: SHARE_CONTENT_VERSION, locale, lines: candidates.filter(candidate => selectedIds.includes(candidate.id)).map(candidate => candidate.text) as [string, string, string], disclaimer: t.disclaimer };
  if (showType) {
    snapshot.typeLabel = profileMeta(profile, locale).typeLabel;
    if (profile.balanced.some(Boolean) && !profile.balanced.every(Boolean)) snapshot.typeNote = t.partialBalanced;
  }
  if (showDimensions) snapshot.dimensions = buildPublicDimensions(profile, locale);
  return snapshot;
}
