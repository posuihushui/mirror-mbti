import { describe, expect, it } from "vitest";
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH, normalizeInviteCode } from "@/lib/invite-code-format";

describe("invite code format", () => {
  it("leaves out characters that are easy to misread", () => {
    for (const confusing of ["0", "O", "1", "I", "L"]) expect(INVITE_CODE_ALPHABET).not.toContain(confusing);
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(INVITE_CODE_ALPHABET.length);
    expect(INVITE_CODE_LENGTH).toBe(6);
  });

  it("accepts a code in any case and returns it upper-case", () => {
    expect(normalizeInviteCode("k7mq2x")).toBe("K7MQ2X");
    expect(normalizeInviteCode(" K7MQ2X ")).toBe("K7MQ2X");
  });

  it("rejects anything else, including order-number-like strings", () => {
    for (const raw of [null, undefined, "", "K7MQ2", "K7MQ2XX", "K7MQ2O", "K7-Q2X", "M20260926ABCDEF"]) expect(normalizeInviteCode(raw)).toBeNull();
  });
});
