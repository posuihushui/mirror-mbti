"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./pairing.module.css";

/** Complete server content is the default; this shell adds one finite reveal. Never wrap CTAs. */
export function PairingReveal({ children, stagger = false }: { children: ReactNode; stagger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || root.dataset.motion || typeof IntersectionObserver === "undefined") return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const print = matchMedia("print");
    if (reduce.matches || print.matches) return;
    const animations: Animation[] = [];
    const finish = () => { root.dataset.motion = "done"; observer.disconnect(); animations.forEach(a => a.cancel()); };
    const preference = () => { if (reduce.matches || print.matches) finish(); };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || root.dataset.motion) return;
      root.dataset.motion = "running";
      observer.disconnect();
      const nodes = stagger ? [...root.children] as HTMLElement[] : [root];
      nodes.forEach((node, index) => {
        if (node.animate) animations.push(node.animate([{ opacity: .5, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 240, delay: stagger ? index * 60 : 0, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
      });
      void Promise.all(animations.map(a => a.finished)).then(finish, finish);
    });
    observer.observe(root);
    reduce.addEventListener("change", preference); print.addEventListener("change", preference); window.addEventListener("beforeprint", finish);
    return () => { observer.disconnect(); animations.forEach(a => a.cancel()); reduce.removeEventListener("change", preference); print.removeEventListener("change", preference); window.removeEventListener("beforeprint", finish); };
  }, [stagger]);
  return <div ref={ref} className={styles.reveal} data-pairing-reveal>{children}</div>;
}
