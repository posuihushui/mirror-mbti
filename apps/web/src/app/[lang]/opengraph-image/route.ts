import { connection } from "next/server";
import { homeOgImage } from "@/lib/og/home-image";

/** Chinese home share card at `/zh/opengraph-image`. */
export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  if (lang !== "zh") return new Response("Not found", { status: 404 });
  return homeOgImage("zh");
}
