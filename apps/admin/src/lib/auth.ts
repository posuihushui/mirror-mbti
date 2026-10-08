import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminConfig, ADMIN_COOKIE, validAdminSession } from "./auth-policy";
export async function requireAdmin() {
  // Read runtime state before configuration, so absent build-time credentials cannot prerender a permanent redirect.
  const store = await cookies();
  let config;
  try { config = adminConfig(); } catch { redirect("/login?error=config"); }
  if (!validAdminSession(store.get(ADMIN_COOKIE)?.value, config)) redirect("/login");
  return config;
}
