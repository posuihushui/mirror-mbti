import { categoryMirrorProfile, typeMirrorProfile, type MirrorProfile } from "@/components/brand/mirror-mark";
import type { PublicShareSnapshot } from "@/lib/share-types";

/**
 * A public card's mark, drawn only from what the sharer chose to publish: the reference type, the four
 * qualitative sides, or both. No scores exist in a public snapshot, so a clear side draws at the
 * canonical lean and a near-even one at the midpoint. Nothing published, no mark.
 */
export function shareMirrorProfile(snapshot: PublicShareSnapshot): MirrorProfile | null {
  if (snapshot.dimensions) return categoryMirrorProfile(snapshot.dimensions.map((d) => (d.state === "left" ? d.dimension[0] : d.state === "right" ? d.dimension[1] : null)));
  return snapshot.typeLabel ? typeMirrorProfile(snapshot.typeLabel) : null;
}
