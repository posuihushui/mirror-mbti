"use client";

import { useEffect, useRef } from "react";
import { BRAND_COLORS } from "./brand-logo";
import { dottedEdge, LOGO_GEOMETRY, mirrorGeometry, mirrorStroke, type MirrorProfile } from "./mirror-mark";

/**
 * The brand mark reshaping itself into a result's mark, once. SMIL rather than CSS so the path
 * morph also runs in WeChat's iOS WebKit, which cannot animate `d` in CSS. Every `<animate>` starts
 * from the logo and freezes on the result, and each element's own attributes are the result, so a
 * stopped or unsupported animation still shows the final mark. Mounted only when motion is welcome.
 */
export function MirrorMorph({ profile, size, duration = 900 }: { profile: MirrorProfile; size: number; duration?: number }) {
  const root = useRef<SVGSVGElement>(null);
  const from = LOGO_GEOMETRY;
  const to = mirrorGeometry(profile);
  const stroke = mirrorStroke(size);
  const ring = Math.max(stroke, 1.4);
  const ease = { calcMode: "spline", keyTimes: "0;1", keySplines: "0.22 1 0.36 1", fill: "freeze", begin: "indefinite", dur: `${duration}ms` } as const;

  useEffect(() => {
    for (const animation of root.current?.querySelectorAll("animate") ?? []) (animation as SVGAnimationElement).beginElement();
  }, []);

  return (
    <svg ref={root} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <g stroke={BRAND_COLORS.paper} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d={to.left}><animate attributeName="d" from={from.left} to={to.left} {...ease} /></path>
        <path d={to.right}><animate attributeName="d" from={from.right} to={to.right} {...ease} /></path>
        {/* The logo's closed edges move with the halves, then give way to open or dotted edges. */}
        <path d={to.edges} opacity={to.edge === "solid" ? 1 : 0}>
          <animate attributeName="d" from={from.edges} to={to.edges} {...ease} />
          <animate attributeName="opacity" from="1" to={to.edge === "solid" ? "1" : "0"} {...ease} />
        </path>
        {to.edge === "dotted" && (
          <path d={to.edges} strokeDasharray={dottedEdge(stroke)}>
            <animate attributeName="opacity" from="0" to="1" {...ease} />
          </path>
        )}
      </g>
      <circle cx="32" cy="32" r={to.dot} fill={BRAND_COLORS.warm} fillOpacity={to.ring ? 0 : 1} stroke={BRAND_COLORS.warm} strokeWidth={to.ring ? ring : 0}>
        <animate attributeName="r" from={String(from.dot)} to={String(to.dot)} {...ease} />
        {to.ring && <animate attributeName="fill-opacity" from="1" to="0" {...ease} />}
        {to.ring && <animate attributeName="stroke-width" from="0" to={String(ring)} {...ease} />}
      </circle>
    </svg>
  );
}
