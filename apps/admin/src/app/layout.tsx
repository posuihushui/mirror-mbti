import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
const manrope = localFont({ src: "./manrope.woff2", variable: "--font-manrope", display: "swap" });
export const metadata: Metadata = { title: { default: "观己 · 管理后台", template: "%s · 观己后台" }, robots: { index: false, follow: false } };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN" className={manrope.variable}><body>{children}</body></html>;
}
