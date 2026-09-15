import { enPoles } from "@/lib/i18n/content/en/personality";
import { enCommunication, enDefinition, enEveryday, enMisconceptions } from "@/lib/i18n/content/en/type-context";
import type { Locale } from "@/lib/i18n/locale";
import { dimensions, names, poles, type Letter } from "@/lib/personality";

const everyday: Record<Letter, string> = {
  E: "刚想到一个主意时，可能会在交谈中慢慢把它讲清楚。",
  I: "需要表达复杂观点时，可能会先留时间独立整理。",
  S: "学习陌生内容时，可能先寻找例子和实际步骤。",
  N: "接触新事物时，可能先想到它与其他经验的联系。",
  T: "讨论选择时，可能先追问结论依据和判断标准。",
  F: "共同决定安排时，可能先了解每个人在意的事情。",
  J: "面对几件待办时，可能先把次序和节点写下来。",
  P: "安排非紧急活动时，可能会为临时变化留出余地。",
};
const misconceptions: Record<Letter, string> = {
  E: "外向偏好不代表永远精力充沛，也不代表必须喜欢所有社交活动。",
  I: "内向偏好不等于害羞、不善交流或不需要关系。",
  S: "实感偏好不等于缺少想象力；重视实例与提出新想法可以同时存在。",
  N: "直觉偏好不保证更有创造力，也不能替代对事实的核实。",
  T: "思考偏好不意味着没有感受，或可以忽略决定对人的影响。",
  F: "情感偏好不等于缺少逻辑，也不意味着必须优先满足所有人。",
  J: "判断偏好不等于更自律或更可靠，计划也需要根据现实调整。",
  P: "知觉偏好不等于拖延或不负责任，灵活安排仍可遵守约定。",
};

export function typeContext(type: string, locale: Locale = "zh") {
  const letters = type.split("") as Letter[];
  const neighbors = dimensions.map((dimension, index) => ({ dimension, type: type.slice(0, index) + (type[index] === dimension[0] ? dimension[1] : dimension[0]) + type.slice(index + 1) }));
  if (locale === "en") {
    return {
      definition: enDefinition(type, letters.map((l) => `${enPoles[l].label} (${l})`), letters.map((l) => enPoles[l].need)),
      everyday: letters.map((letter) => enEveryday[letter]),
      misconceptions: letters.map((letter) => enMisconceptions[letter]),
      communication: `${letters[0] === "I" ? enCommunication.introverted : enCommunication.extraverted} ${letters[3] === "J" ? enCommunication.judging : enCommunication.perceiving}`,
      neighbors,
    };
  }
  return {
    /** A self-contained answer to "What does INFJ mean?" for search snippets and AI answers. */
    definition: `${type}（${names[type][0]}）是 16 型人格倾向之一，由${letters.map((l) => `${poles[l].label}（${l}）`).join("、")}四种偏好组合而成：${letters.map((l) => poles[l].need).join("，")}。它描述作答中的偏好倾向，不代表能力、职业适配或心理诊断。`,
    everyday: letters.map((letter) => everyday[letter]),
    misconceptions: letters.map((letter) => misconceptions[letter]),
    communication: `${letters[0] === "I" ? "如果我没有立即回复，我可能还在整理想法。" : "我有时需要边说边梳理，先不用急着给我一个结论。"}${letters[3] === "J" ? "我们可以先约定下一次沟通的时间。" : "我们可以先试一个方案，再根据情况一起调整。"}`,
    neighbors,
  };
}
