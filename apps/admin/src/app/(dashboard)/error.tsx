"use client";
export default function Error({ reset }: { reset: () => void }) { return <section className="panel"><h1>暂时无法读取数据</h1><p>请确认后台数据库连接正常，并已执行最新迁移。</p><button className="pill" onClick={reset}>重新加载 →</button></section>; }
