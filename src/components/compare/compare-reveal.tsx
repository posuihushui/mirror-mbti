"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./compare-motion.module.css";

export function CompareReveal({ children, mode }: { children: ReactNode; mode: "panels" | "sections" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || root.dataset.motion || typeof window.matchMedia !== "function" || typeof IntersectionObserver === "undefined") return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const print = matchMedia("print");
    if (!reduce.addEventListener || !print.addEventListener) return;
    const animations: Animation[] = [];
    const stopObserving = { current: () => {} };
    const finish = () => { root.dataset.motion = "done"; stopObserving.current(); animations.forEach((animation) => animation.cancel()); };
    const preference = () => { if (reduce.matches || print.matches) finish(); };
    if (reduce.matches || print.matches) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || root.dataset.motion) return;
      root.dataset.motion = "running"; stopObserving.current();
      root.querySelectorAll<HTMLElement>("[data-compare-motion]").forEach((node, index) => {
        if (!node.animate) return;
        const part = node.dataset.compareMotion;
        const frames = mode === "sections" ? [{ opacity: .5, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }] : part === "dot" ? [{ opacity: .4 }, { opacity: 1 }] : [{ opacity: .5, transform: `translateX(${part === "host" ? -8 : 8}px)` }, { opacity: 1, transform: "none" }];
        animations.push(node.animate(frames, { duration: mode === "sections" ? 280 : part === "dot" ? 160 : 360, delay: mode === "sections" ? index * 60 : part === "dot" ? 120 : 0, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
      });
      void Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
    });
    stopObserving.current = () => observer.disconnect();
    observer.observe(root); reduce.addEventListener("change", preference); print.addEventListener("change", preference); window.addEventListener("beforeprint", finish);
    return () => { if (root.dataset.motion === "running") finish(); else stopObserving.current(); reduce.removeEventListener("change", preference); print.removeEventListener("change", preference); window.removeEventListener("beforeprint", finish); };
  }, [mode]);
  return <div ref={ref} className={`${styles.shell} ${mode === "panels" ? styles.panels : "space-y-6"}`}>{children}</div>;
}
