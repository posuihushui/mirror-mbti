import type { MetadataRoute } from "next";
import { TYPES } from "@/lib/personality";

const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const lastModified = new Date("2026-09-10");

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({
    url: `${APP_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });
  return [
    entry("/", 1, "weekly"),
    entry("/quiz", 0.9, "weekly"),
    entry("/result/sample", 0.8),
    entry("/report/sample", 0.7),
    entry("/about", 0.7),
    entry("/preferences", 0.7),
    entry("/help", 0.6),
    entry("/types", 0.8),
    ...TYPES.map((t) => entry(`/types/${t}`, 0.7)),
    entry("/privacy", 0.2, "yearly"),
    entry("/terms", 0.2, "yearly"),
  ];
}
