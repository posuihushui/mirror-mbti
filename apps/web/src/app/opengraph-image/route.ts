import { connection } from "next/server";
import { homeOgImage } from "@/lib/og/home-image";

/** English home share card at the unprefixed image URL. */
export async function GET() {
  await connection();
  return homeOgImage("en");
}
