import type { Locale } from "@/lib/i18n/locale";
import { profileMeta, type Profile } from "@/lib/personality";
import { shareMessages } from "@/lib/i18n/messages/share";
import type { PublicDimension, PublicShareSnapshot, ShareCandidate, ShareDimension } from "@/lib/share-types";

export const SHARE_CONTENT_VERSION = "share-v1" as const;
export const shareDimensions = ["EI", "SN", "TF", "JP"] as const;
/**
 * Three interchangeable wordings per dimension and state. One card is the site's most forwarded
 * artifact, so two people with the same lean must not post the same sentence; which wording a
 * result gets is fixed by its id, so a card never changes wording under its owner.
 */
const sentences = {
  zh: [
    [
      ["我常在交流中整理想法，愿意听你一起讨论。", "一起说出来，我通常更快想明白。", "我习惯在对话里把事情捋顺，随时可以找我聊。"],
      ["我想聊天还是独处，会随当天的状态变化。", "有时候很想聊，有时候只想安静一会儿。", "问我一句现在想不想聊，比猜更准。"],
      ["我有时需要先独处整理，再把想法告诉你。", "我需要一点安静的时间，那不是在生气。", "给我一会儿自己想，我再来跟你说。"],
    ],
    [
      ["说明一件事时，具体的例子会帮助我理解。", "举一个具体例子，我会更快明白你的意思。", "先说清楚发生了什么，我就能接上。"],
      ["我既需要具体例子，也想知道它与整体的联系。", "有时想听细节，有时想听大方向，可以先问我。", "例子和全局我都需要，先说哪个都行。"],
      ["理解细节之前，我常想先知道整体的方向。", "先告诉我这件事要去哪里，细节我再跟上。", "我习惯先看整体，再回头看具体怎么做。"],
    ],
    [
      ["面对分歧时，把理由和判断标准说清楚会帮助我。", "把判断的理由讲清楚，我会更容易接受。", "我不是想争对错，是想弄明白依据是什么。"],
      ["做决定时，我会同时留意理由与彼此的感受。", "道理和感受我都会看，只是顺序不一定。", "决定之前，我想听听理由，也想听听影响。"],
      ["讨论决定时，也请告诉我它会怎样影响彼此。", "告诉我这件事对人的影响，我会更放在心上。", "我常先想到，这对我们各自意味着什么。"],
    ],
    [
      ["重要安排提前说清楚，会让我更安心。", "时间定下来，我才能安心去做别的事。", "早一点说好安排，我会轻松很多。"],
      ["重要的事我想先确定，其余安排可以留些弹性。", "关键的几件我想定下来，其余的随时再说。", "定几件必要的就够了，剩下的我不介意变。"],
      ["安排留一点调整空间，会让我更自在。", "别把每一格都排满，我需要一点余地。", "临时调整对我很正常，提前说一声就好。"],
    ],
  ],
  en: [
    [
      ["Talking things through often helps me organize my thoughts.", "Saying it out loud with you is usually how I get there faster.", "I sort things out in conversation, so reach out any time."],
      ["Whether I want company or time alone can change with my day.", "Some days I really want to talk; some days I just want quiet.", "Asking whether I feel like talking works better than guessing."],
      ["I sometimes need time alone to gather my thoughts before sharing.", "I need a little quiet sometimes, and it does not mean I am upset.", "Give me a moment to think it through and I will come to you."],
    ],
    [
      ["A concrete example helps me understand what you mean.", "One specific example and I will follow you much faster.", "Tell me what actually happened and I can pick it up from there."],
      ["I value both concrete examples and how they fit into the bigger picture.", "Some days I want the detail, some days the direction. Just ask.", "I need the example and the big picture; either order is fine."],
      ["I often want to see the bigger picture before exploring the details.", "Tell me where this is going and I will catch up on the details.", "I tend to start from the whole, then work back to the steps."],
    ],
    [
      ["Clear reasons and criteria help me work through a disagreement.", "Walk me through the reasoning and I find it much easier to accept.", "I am not trying to win; I want to understand what it rests on."],
      ["I consider both the reasoning and how people feel about a decision.", "I weigh the reasons and the feelings, though not always in that order.", "Before deciding, I want to hear the reasons and the effects."],
      ["When discussing a decision, I also want to understand its effect on people.", "Tell me how it affects people and it will stay with me.", "I usually think first about what this means for each of us."],
    ],
    [
      ["Knowing important plans in advance helps me feel at ease.", "Once the time is set, I can settle into everything else.", "Agreeing on plans early makes the rest much lighter for me."],
      ["I like to settle the important parts and keep some flexibility elsewhere.", "I want the few key things fixed; the rest can stay open.", "Settling what matters is enough, and I do not mind the rest changing."],
      ["Leaving some room to adjust plans helps me feel comfortable.", "Please do not fill every slot; I need a little room to breathe.", "Changing plans is normal for me, just let me know beforehand."],
    ],
  ],
};
export const SHARE_VARIANTS = 3;
/**
 * Stable per-result wording. A seed of the result id keeps a published card's sentences identical
 * every time they are rebuilt (preview, publish, re-open), while two results rarely coincide.
 * Without a seed the first wording is used, so callers with no result in hand stay deterministic.
 */
function variantIndex(seed: string | undefined, dimension: ShareDimension): number {
  if (!seed) return 0;
  let hash = 0x811c9dc5;
  for (const character of `${seed}:${dimension}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % SHARE_VARIANTS;
}
const labels = {
  zh: [["外向", "外向 / 内向 · 接近均衡", "内向"], ["感觉", "感觉 / 直觉 · 接近均衡", "直觉"], ["思考", "思考 / 情感 · 接近均衡", "情感"], ["判断", "判断 / 知觉 · 接近均衡", "知觉"]],
  en: [["Extraverted", "Extraversion / Introversion · Close to balanced", "Introverted"], ["Sensing", "Sensing / Intuition · Close to balanced", "Intuitive"], ["Thinking", "Thinking / Feeling · Close to balanced", "Feeling"], ["Judging", "Judging / Perceiving · Close to balanced", "Perceiving"]],
};
function stateIndex(profile: Profile, index: number): 0 | 1 | 2 {
  if (profile.balanced[index]) return 1;
  return profile.type[index] === shareDimensions[index][0] ? 0 : 2;
}
export function buildShareCandidates(profile: Profile, locale: Locale = "zh", seed?: string): ShareCandidate[] {
  return shareDimensions.map((dimension, index) => {
    const state = stateIndex(profile, index);
    return { id: `${SHARE_CONTENT_VERSION}:${dimension}:${state === 1 ? "balanced" : dimension[state === 0 ? 0 : 1]}`, dimension, text: sentences[locale][index][state][variantIndex(seed, dimension)] };
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
export function buildPublicShareSnapshot(profile: Profile, locale: Locale, selectedIds: readonly string[], showType: boolean, showDimensions: boolean, seed?: string): PublicShareSnapshot {
  const candidates = buildShareCandidates(profile, locale, seed);
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
