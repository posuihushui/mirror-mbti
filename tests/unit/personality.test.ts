import { describe, expect, it } from "vitest";
import { calculate, dimensions, isPersonalityType, QUESTION_COUNT, questions, TYPES, validateAnswers } from "@/lib/personality";

/** Builds an answer set that pushes every dimension to the requested pole. */
function answersFor(type: string): number[] {
  return questions.map((q) => {
    const dimIndex = dimensions.indexOf(q.dimension);
    const wantFirstPole = type[dimIndex] === q.dimension[0];
    const towardFirst = q.reverse ? -2 : 2;
    return wantFirstPole ? towardFirst : -towardFirst;
  });
}

describe("calculate", () => {
  it("has 32 questions, 8 per dimension, half reversed", () => {
    expect(QUESTION_COUNT).toBe(32);
    for (const d of dimensions) {
      const qs = questions.filter((q) => q.dimension === d);
      expect(qs).toHaveLength(8);
      expect(qs.filter((q) => q.reverse)).toHaveLength(4);
    }
  });

  it.each(TYPES)("recovers %s from extreme answers at 100%", (type) => {
    const p = calculate(answersFor(type));
    expect(p.type).toBe(type);
    expect(p.values).toEqual([100, 100, 100, 100]);
    expect(p.balanced).toEqual([false, false, false, false]);
  });

  it("scores all-neutral answers as 50% on every axis and flags them balanced", () => {
    const p = calculate(Array(QUESTION_COUNT).fill(0));
    expect(p.values).toEqual([50, 50, 50, 50]);
    expect(p.balanced).toEqual([true, true, true, true]);
    expect(p.type).toBe("ESTJ");
  });

  it("treats reverse items in the opposite direction", () => {
    const answers = questions.map((q) => (q.dimension === "EI" ? (q.reverse ? 2 : -2) : 0));
    const p = calculate(answers);
    expect(p.type[0]).toBe("I");
    expect(p.values[0]).toBe(100);
  });

  it("marks a mild preference as balanced", () => {
    const answers = questions.map((q) => (q.dimension === "SN" && !q.reverse ? 1 : 0));
    const p = calculate(answers);
    expect(p.values[1]).toBe(63);
    expect(p.balanced[1]).toBe(false);
    const soft = questions.map((q, i) => (q.dimension === "SN" && !q.reverse && i < 12 ? 1 : 0));
    expect(calculate(soft).balanced[1]).toBe(true);
  });
});

describe("validateAnswers", () => {
  it("accepts 32 integers in [-2, 2]", () => {
    expect(validateAnswers(Array(32).fill(1))).toHaveLength(32);
  });
  it("rejects wrong length, floats, out-of-range and non-arrays", () => {
    expect(validateAnswers(Array(31).fill(0))).toBeNull();
    expect(validateAnswers([...Array(31).fill(0), 0.5])).toBeNull();
    expect(validateAnswers([...Array(31).fill(0), 3])).toBeNull();
    expect(validateAnswers("x")).toBeNull();
  });
});

describe("isPersonalityType", () => {
  it("knows the 16 types and nothing else", () => {
    expect(TYPES).toHaveLength(16);
    expect(isPersonalityType("INFJ")).toBe(true);
    expect(isPersonalityType("infj")).toBe(false);
    expect(isPersonalityType("constructor")).toBe(false);
  });
});
