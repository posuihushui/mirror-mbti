# Design QA

## Evidence

- Source visual truth: `/Users/lake/.codex/generated_images/01a0c3e3-8005-7521-91ed-36d799439633/exec-ca4c14f7-6521-4006-ae8f-d62cb8d81687.png`
- Browser-rendered implementation: `docs/design-evidence/site-refresh/share-image-zh.png`
- Normalized full-view comparison: `docs/design-evidence/site-refresh/share-comparison.png` (source left, implementation right)
- Live implementation: `http://localhost:3000/`
- Source pixels: 1086 × 1448. Implementation pixels: 960 × 1280. Both are 3:4 portrait assets.
- Normalization: each artifact was downsampled with Lanczos to 480 × 640 and placed side by side in a 960 × 640 comparison. No crop or device frame was applied.
- Browser viewports checked: 393 × 852 phone and 1470 × 773 desktop. The generated share image is a fixed 960 × 1280 render, so CSS viewport and browser device scale do not affect its pixel dimensions.
- State: Chinese public single-person share with three selected prompts, no optional type or dimension fields. The preview dialog loaded the generated image and enabled its image actions.

## Findings

- No actionable P0, P1, or P2 differences remain.
- The source is an art-direction target rather than a literal data state. Its constructed display headline and three short advice rows differ from the real snapshot's three complete user-selected prompts. The implementation preserves the target's three material regions and hierarchy while keeping the published snapshot verbatim.

## Required Fidelity Surfaces

- Fonts and typography: the implementation uses the product's Manrope and CJK font assets, with a large first prompt on the cover, smaller supporting copy, and compact numbered body rows. Weight, leading, and wrapping stay readable in the saved 960 × 1280 artifact and at 393 px page width.
- Spacing and layout rhythm: the dark cover, paper body, and warm footer retain clear proportions; all copy and the QR stay inside safe margins. Page work uses Tailwind preset spacing and sizing where close (`p-6`, `p-8`, `gap-4`, `gap-6`, `text-3xl`, `max-w-5xl`) and keeps arbitrary values only where the existing visual specification requires them.
- Colors and visual tokens: the implementation consistently maps the target to existing product tokens: night `#121718`, paper `#edf2f3`, ink `#171b1c`, warm clay `#c49473`, and thin cool-gray rules. Contrast remains sufficient on each material block.
- Image quality and asset fidelity: the relief uses the existing vector `BrandMark`; the logo uses `BrandLogo`; the QR is generated from the public share URL. The browser surface texture uses the generated raster asset at `public/assets/surfaces/paper-grain.png`. No logo, illustration, or icon is approximated with CSS shapes.
- Copy and content: all public snapshot lines, disclaimer, scan instruction, and localized brand lockup remain unchanged and come from the existing localized content and stored snapshot.

## Full-view Comparison Evidence

The combined comparison shows the same charcoal/paper/clay progression, restrained mirror relief, large cover statement, fine separators, generous margins, and bottom-right QR. The implementation intentionally devotes more height to the paper body because its real prompts are longer; this does not weaken the cover focal point or cause clipping.

## Focused Region Evidence

- Cover: verified the first published prompt is the single dominant statement, the warm eyebrow is subordinate, and the low-contrast mirror relief does not reduce legibility.
- Body: verified prompts 02 and 03 align to a shared grid, keep complete copy, and retain thin rules at 960 × 1280.
- Footer: verified disclaimer, product note, scan instruction, and QR have adequate separation and safe margins.
- Page surfaces: visually checked the home, quiz version chooser, result, report, share management, type index/detail, preference guide, report archive, pairing, and payment pages at mobile and desktop widths. Dark editorial covers, paper reading cards, and warm action/practice panels remain consistent without changing information order.

## Primary Interactions Tested

- Opened the share preview dialog and waited for the generated image to load.
- Switched the mobile report to the relationship chapter and confirmed the selected tab, URL state, and chapter content changed together.
- Checked phone and desktop responsive layouts, including result two-column composition and phone report tabs.
- Console review found no product runtime failure in the verified states. Historical Turbopack hot-reload chunk messages were produced while CSS was being edited; the rendered pages recovered on reload. Browser-extension errors were unrelated to the app.

## Comparison History

1. Initial pass — **P1:** the Satori portrait output used Fragment children without an explicit flex-column wrapper, which collapsed the intended three-region layout. **Fix:** added explicit full-size flex-column wrappers to both portrait and OG branches. **Post-fix evidence:** `docs/design-evidence/site-refresh/share-image-zh.png` shows correct cover, body, footer, and QR placement.
2. Second pass — **P2:** all three prompts had equal weight in the paper area, leaving the share's main point weak. **Fix:** moved prompt 01 into the dark cover as the large headline and kept prompts 02/03 as numbered reading rows. **Post-fix evidence:** `docs/design-evidence/site-refresh/share-comparison.png` shows a clear cover focal point at normalized size.
3. User review — **P2:** after prompt 01 moved into the cover, its number was no longer visible, so the image could be read as containing only the two numbered items in the paper area. **Fix:** added an explicit warm `01` beside the cover statement in the web card, portrait image, and OG image. **Post-fix evidence:** `docs/design-evidence/site-refresh/share-image-zh.png` visibly presents the complete `01 / 02 / 03` sequence.
4. Final pass — no P0/P1/P2 finding. No further visual fix was required.

## Open Questions

- None.

## Implementation Checklist

- [x] Reuse the existing brand mark and logo assets.
- [x] Apply the approved night/paper/clay material system across primary public and post-result surfaces.
- [x] Preserve localized copy, consent, payment, authorization, and server-rendered report behavior.
- [x] Verify the real generated share image, responsive layouts, key report interaction, typecheck, lint, unit tests, and production build.

## Follow-up Polish

- No blocking polish remains. A later content-specific art direction pass could tune line breaks for a single campaign image, but automatic public snapshots should continue to prioritize verbatim copy and stable layout.

final result: passed
