import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
async function Protected({ children }: { children: ReactNode }) {
  const config = await requireAdmin();
  return <div className="shell"><header className="topbar"><Link className="brand" href="/">mirror / 观己<small>管理后台</small></Link><form action="/api/logout" method="post"><button>退出 {config.username}</button></form></header>
    <nav className="nav" aria-label="后台导航"><Link href="/">经营概览</Link><Link href="/orders">订单情况</Link><Link href="/traffic">浏览情况</Link><Link href="/visitors">匿名访客</Link></nav><main>{children}</main></div>;
}
export default function Layout({ children }: { children: ReactNode }) { return <Suspense fallback={<main className="shell"><p className="muted">正在验证访问权限…</p></main>}><Protected>{children}</Protected></Suspense>; }
