/** No 0/O, 1/I or L: a code is read aloud and retyped as often as it is tapped. */
export const INVITE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const INVITE_CODE_LENGTH = 6;
const pattern = new RegExp(`^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`);

/** The cookie an invite link leaves, read when an order is priced. The code itself grants nothing. */
export const INVITE_COOKIE = "minv";
export const INVITE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/** A well-formed code in its canonical (upper-case) form, or null. */
export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase();
  return code && pattern.test(code) ? code : null;
}
