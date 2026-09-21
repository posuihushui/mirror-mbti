import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hostNoteSchema, invitationInputSchema } from "@/lib/share-policy";
import { COMPARE_HOST_CONSENT_VERSION, HOST_NOTE_MAX } from "@/lib/compare-types";

const parse = (value: string) => hostNoteSchema.safeParse(value);
const NUL = String.fromCharCode(0);
const RTL_OVERRIDE = String.fromCharCode(0x202e);

describe("host note on an invitation", () => {
  it("rides only on the consent version whose copy says it is published", () => {
    expect(COMPARE_HOST_CONSENT_VERSION).toBe("compare-host-v3");
    const base = { resultId: "abcdefghijkl", requestId: randomUUID() };
    expect(invitationInputSchema.safeParse({ ...base, consentVersion: "compare-host-v3", hostNote: "一起看看" }).success).toBe(true);
    expect(invitationInputSchema.safeParse({ ...base, consentVersion: "compare-host-v3" }).success).toBe(true);
    // Earlier consent copy never mentioned a note, so it cannot carry one.
    for (const stale of ["compare-host-v1", "compare-host-v2"]) {
      expect(invitationInputSchema.safeParse({ ...base, consentVersion: stale, hostNote: "一起看看" }).success).toBe(false);
      expect(invitationInputSchema.safeParse({ ...base, consentVersion: stale, hostNote: "   " }).success).toBe(true);
    }
  });
  it("normalises a note to one printable line and keeps it optional", () => {
    expect(parse("  想和你一起看看  ").data).toBe("想和你一起看看");
    expect(parse("想和你\n一起\t看看").data).toBe("想和你 一起 看看");
    for (const empty of ["", "   ", "\n\n", "\t"]) expect(parse(empty).data).toBeUndefined();
  });
  it("refuses control characters and anything over the published limit", () => {
    expect(parse(`hello${NUL}world`).success).toBe(false);
    expect(parse(`a${RTL_OVERRIDE}b`).success).toBe(false);
    expect(parse("字".repeat(HOST_NOTE_MAX)).success).toBe(true);
    expect(parse("字".repeat(HOST_NOTE_MAX + 1)).success).toBe(false);
    // An oversized body is rejected before normalising, so padding cannot smuggle one through.
    expect(parse(`${" ".repeat(HOST_NOTE_MAX * 4)}字`).success).toBe(false);
  });
  it("leaves markup as text for the renderer to escape", () => {
    // React escapes on render; the schema's job is one printable line, not sanitising HTML.
    expect(parse("<b>hi</b>").data).toBe("<b>hi</b>");
  });
  it("rejects a note on a request that does not otherwise validate", () => {
    expect(invitationInputSchema.safeParse({ requestId: randomUUID(), consentVersion: "compare-host-v3", hostNote: "hi" }).success).toBe(false);
    expect(invitationInputSchema.safeParse({ resultId: "abcdefghijkl", requestId: randomUUID(), consentVersion: "compare-host-v3", hostNote: "x".repeat(200) }).success).toBe(false);
  });
});
