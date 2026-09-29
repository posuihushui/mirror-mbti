"use client";

import { useEffect, useRef, type SVGProps } from "react";

/**
 * The page's `<svg>` for a spot illustration. CSS (`app/illustration-motion.css`) starts every scene's
 * entrance and loops at first paint; once this island has hydrated it lets an on-screen scene carry
 * on, defers an off-screen one (which cancels its run) until it is seen, switches each to its loops
 * alone once the entrance has ended (so a chapter shown again never replays it), and holds a scene
 * still while it is off screen. It never hides anything: without it, scenes enter once on load and
 * loop, and every loop starts and ends at the drawing's own state.
 */
let viewObserver: IntersectionObserver | null | undefined;

function observer() {
  if (viewObserver === undefined) {
    viewObserver = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const scene = entry.target as SVGSVGElement;
        if (entry.isIntersecting) {
          delete scene.dataset.scenePaused;
          // An unseen scene waits until a little of it is in view, so its entrance is not missed.
          if (scene.dataset.sceneMotion === "deferred" && entry.intersectionRatio >= 0.15) play(scene);
        } else if (scene.dataset.sceneMotion !== "deferred") {
          scene.dataset.scenePaused = "";
        }
      }
    }, { threshold: [0, 0.15] });
  }
  return viewObserver;
}

const motionOff = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("print").matches;

/** Loops alone once the entrance (every finite animation) has ended. */
function settle(scene: SVGSVGElement) {
  const entering = scene.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  const live = () => {
    if (scene.dataset.sceneMotion !== "deferred") scene.dataset.sceneMotion = "live";
  };
  if (!entering.length) return live();
  void Promise.allSettled(entering.map((animation) => animation.finished)).then(live);
}

function play(scene: SVGSVGElement) {
  if (motionOff()) {
    scene.dataset.sceneMotion = "done";
    return;
  }
  scene.dataset.sceneMotion = "play";
  settle(scene);
}

export function SceneSvg({ children, ...props }: SVGProps<SVGSVGElement>) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const scene = ref.current;
    if (!scene || scene.dataset.sceneMotion) return;
    const view = observer();
    if (motionOff() || !view || !scene.getAnimations) {
      scene.dataset.sceneMotion = "done";
      return;
    }
    const bounds = scene.getBoundingClientRect();
    const visible = bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth;
    // On screen it has been entering since first paint; let it carry on.
    if (visible) settle(scene);
    else scene.dataset.sceneMotion = "deferred";
    view.observe(scene);
    return () => {
      view.unobserve(scene);
      // A remount (Strict Mode) must find the unseen scene again.
      if (scene.dataset.sceneMotion === "deferred") delete scene.dataset.sceneMotion;
    };
  }, []);
  return <svg ref={ref} {...props}>{children}</svg>;
}
