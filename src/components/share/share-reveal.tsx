"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./share-motion.module.css";

/** Content-only shell. CTAs, fixed docks and QR codes belong outside it. */
export function ShareReveal({ children, className = "", mode = "entry" }: { children: ReactNode; className?: string; mode?: "entry" | "card" | "static" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || root.dataset.shareMotion === "done" || mode === "static") return;
    if (typeof window.matchMedia !== "function") { root.dataset.shareMotion = "done"; return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    if (!reduce.addEventListener || !print.addEventListener) { root.dataset.shareMotion = "done"; return; }
    let observer: IntersectionObserver | undefined;
    const animations: Animation[] = [];
    const finish = () => {
      root.dataset.shareMotion = "done";
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      root.querySelectorAll<HTMLElement>("[data-share-reveal]").forEach(node => node.getAnimations?.().forEach(animation => animation.cancel()));
    };
    const change = () => { if (reduce.matches || print.matches) finish(); };
    if (reduce.matches || print.matches) { finish(); return; }
    reduce.addEventListener("change", change);
    print.addEventListener("change", change);
    window.addEventListener("beforeprint", finish);
    const start = () => {
      if (root.dataset.shareMotion) return;
      root.dataset.shareMotion = "running";
      observer?.disconnect();
      root.querySelectorAll<HTMLElement>("[data-share-reveal]").forEach((node, index) => {
        const delay = mode === "card" ? Math.max(0, index - 1) * 60 : index * 60;
        if (node.animate) animations.push(node.animate([{ opacity: .4, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 280, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
      });
      void Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
    };
    if (mode === "card") start();
    else if (typeof IntersectionObserver === "undefined") finish();
    else { observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }); observer.observe(root); }
    return () => {
      observer?.disconnect();
      reduce.removeEventListener("change", change);
      print.removeEventListener("change", change);
      window.removeEventListener("beforeprint", finish);
      if (animations.length) finish();
    };
  }, [mode]);
  return <div ref={ref} className={`${styles.reveal} ${mode === "card" ? styles.card : ""} ${className}`}>{children}</div>;
}
