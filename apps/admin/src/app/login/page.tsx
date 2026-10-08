import { Suspense } from "react";
import { one, type Search } from "@/lib/filters";
const errors: Record<string,string> = { credentials: "账号或密码不正确。", rate: "登录尝试过多，请 15 分钟后重试。", config: "管理员账号尚未配置，请按项目说明设置登录信息。", unavailable: "暂时无法登录，请检查数据库连接和迁移。" };
async function LoginMessage({ searchParams }: { searchParams: Promise<Search> }) {
  const error = one((await searchParams).error);
  return errors[error] ? <p role="alert" className="error">{errors[error]}</p> : null;
}
export default function Login({ searchParams }: { searchParams: Promise<Search> }) {
  return <main className="login"><section className="panel"><p className="small muted">mirror / 观己</p><h1>管理后台</h1><p>查看订单、访问与匿名访客记录。</p>
    <Suspense><LoginMessage searchParams={searchParams} /></Suspense>
    <form action="/api/login" method="post"><label htmlFor="username">管理员账号<input id="username" name="username" autoComplete="username" maxLength={128} required /></label>
      <label htmlFor="password">密码<input id="password" name="password" type="password" autoComplete="current-password" maxLength={256} required /></label><button className="pill">登录 →</button></form>
  </section></main>;
}
