import "server-only";
import { cookies } from "next/headers";
import { sessionSecret } from "@/lib/env";
import { verifyVisitorToken, VISITOR_COOKIE } from "@/lib/visitor-token";

/** Visitor id from the signed cookie, or null when the request carries none. */
export async function getVisitorId(): Promise<string | null> {
  const store = await cookies();
  return verifyVisitorToken(store.get(VISITOR_COOKIE)?.value, sessionSecret());
}

export class NoVisitorError extends Error {
  constructor() {
    super("Missing visitor session");
  }
}

export async function requireVisitorId(): Promise<string> {
  const id = await getVisitorId();
  if (!id) throw new NoVisitorError();
  return id;
}
