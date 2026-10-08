"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "cn";
import styles from "./radar-motion.module.css";

/** Optional motion around server-rendered SVG; the underlying chart is always complete. */
export function RadarReveal({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || root.dataset.radarMotion === "done") return;

    const outline = root.querySelector<SVGPathElement>("[data-radar-outline]");
    const fill = root.querySelector<SVGPathElement>("[data-radar-fill]");
    if (!outline || !fill) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    const animations: Animation[] = [];
    let observer: IntersectionObserver | undefined;

    const finish = () => {
      // Disables the initial CSS too, so revealing a hidden chapter cannot replay it.
      root.dataset.radarMotion = "done";
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
    };

    if (reducedMotion.matches || print.matches || !outline.getAnimations) {
      finish();
      return;
    }

    const finishInitial = (event: AnimationEvent) => {
      if (event.target === outline && !root.dataset.radarMotion) finish();
    };
    const finishIfMotionDisabled = () => {
      if (reducedMotion.matches || print.matches) finish();
    };
    outline.addEventListener("animationend", finishInitial);
    outline.addEventListener("animationcancel", finishInitial);
    reducedMotion.addEventListener("change", finishIfMotionDisabled);
    print.addEventListener("change", finishIfMotionDisabled);
    window.addEventListener("beforeprint", finish);

    const bounds = root.getBoundingClientRect();
    const visible = bounds.width > 0 && bounds.height > 0
      && bounds.bottom > 0 && bounds.top < window.innerHeight
      && bounds.right > 0 && bounds.left < window.innerWidth;

    if (visible) {
      // CSS starts at first paint. Hydration only observes it, never resets it.
      // A slow script may arrive after it has finished; keep that complete chart.
      if (!outline.getAnimations().some((animation) => animation.playState === "running")) finish();
    } else if (typeof IntersectionObserver === "undefined" || !outline.animate) {
      finish();
    } else {
      // Only an unseen chart is deferred. No hiding styles are applied, so a lost
      // observer or interrupted script still leaves the complete SVG readable.
      root.dataset.radarMotion = "deferred";
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || root.dataset.radarMotion === "done") return;
        observer?.disconnect();
        animations.push(
          outline.animate(
            [{ strokeDasharray: "1", strokeDashoffset: "1" }, { strokeDasharray: "1", strokeDashoffset: "0" }],
            { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          ),
          fill.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 440, delay: 240, easing: "ease-out", fill: "backwards" },
          ),
        );
        void Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
      }, { threshold: 0, rootMargin: "24px" });
      observer.observe(root);
    }

    return () => {
      observer?.disconnect();
      outline.removeEventListener("animationend", finishInitial);
      outline.removeEventListener("animationcancel", finishInitial);
      reducedMotion.removeEventListener("change", finishIfMotionDisabled);
      print.removeEventListener("change", finishIfMotionDisabled);
      window.removeEventListener("beforeprint", finish);
      // Leave initial CSS running through Strict Mode's effect replay.
      if (animations.length) finish();
    };
  }, []);

  return <div ref={rootRef} className={cn(styles.radar, className)} style={style}>{children}</div>;
}
