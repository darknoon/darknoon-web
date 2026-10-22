# Portrait design QA — September 29, 2026

## Acceptance update — October 22, 2026

**Superseded by user feedback: not accepted.** Andrew expected the portrait to
remain in the existing site layout and reports that the depth is still not
readily perceptible. The standalone redesign was a scope mistake. The historical
technical checks below do not establish a successful design or 3D effect.
See `PORTRAIT_HANDOFF.md` for findings, preserved artifacts and next steps.

- **P1: Layout diverges from the intended integration.** Return to the existing
  portrait slot; preserve the surrounding site design.
- **P1: Perceived depth does not meet the brief.** Verify actual phone rendering
  and compare camera/geometry choices before claiming success or changing style.

## Findings

The historical review reported no actionable P0/P1/P2 findings; that assessment
did not capture the intended layout or perceptual-depth acceptance criteria and
is superseded by the update above. This is a new
portrait composition, not a pixel clone of a supplied UI mockup. The source
photographs define likeness and B/W art direction; the existing site's name,
headline, and restrained typography supply the content context.

## Source and rendered evidence

- Geometry and photographic detail: `/Users/andrew/.bb/thread-storage/thr_db4bfshps9/Attachments/Screen-Shot-2022-01-30-at-2.51.29-PM-1790706267474-gw1im2.jpg`, 1034×1124 pixels.
- Monochrome tonal reference: `src/assets/resources/wubba-lubba-dub-dub.jpg`, 1422×1894 pixels.
- Implementation: `https://prefix-mini.tail06618c.ts.net:5960/splat/color/`.
- Desktop: `.comparison/native/desktop.png`, CSS viewport 1440×1000, device scale factor 2, screenshot 2880×2000 pixels.
- Mobile: `.comparison/native/mobile.png` and `mobile-drag.png`, CSS viewport 390×844, device scale factor 2, screenshots 780×1688 pixels.
- Additional layouts: `.comparison/native/layout-320.png` and `layout-768.png`, CSS viewports 320×740 and 768×1024, device scale factor 1.
- Camera extrema: `.comparison/native/left.png`, `right.png`, `left-seven.png`, and `right-seven.png`.
- Fallbacks: `.comparison/native/mobile-reduced.png` and `failed-load.png`.
- Combined focused comparison: `.comparison/native/fidelity-comparison.png`, 1112×496 pixels. Left is the new source in grayscale; center is the native rendered portrait; right is the older B/W tonal reference.

The neutral rendered portrait clip is 1378×1498 pixels, normalized to the
1034×1124 source dimensions before cropping. Source and rendered face crops use
the same 465×620 region at (290,170), each resized to 360×480. The older B/W
photograph uses a separate face crop, also 360×480. It shows a different
expression and head pose: only tone, background treatment, and detail are
compared to it, not expression or pixel alignment. Whole-page captures are
browser content without device chrome. Full-view review checked the portrait
against the intended high-key art direction and assessed the new composition;
the combined focused comparison checked likeness and facial detail.

Generated screenshots are ignored in Git and preserved separately with the
thread's `artifacts/native-review` files. Regenerate with
`scripts/review-native-portrait.mjs` against an isolated Chromium CDP session.

## Required fidelity surfaces

- **Fonts and typography:** system sans-serif stack, with no claim that an
  unavailable custom font is loaded. Large, close-set headline; smaller name
  and quiet secondary labels. Tracking was opened to -.045em with .018em word
  spacing. Desktop and mobile wrapping were inspected without clipping or
  collisions, including the narrow 320px layout. Content remains live text.
- **Spacing and layout rhythm:** desktop has a two-column portrait/headline
  composition; mobile puts the portrait above the headline. The portrait's
  original aspect ratio is retained. No rounded image card, heavy framing, or
  model-comparison controls remain. Soft shoulder edges join the paper surface;
  bottom edges remain feathered in the tested camera positions. All reviewed
  widths have no horizontal page overflow.
- **Colors and tokens:** paper #f4f3ef, ink #252523, secondary labels #6b6b64.
  The portrait is monochrome, with high-key skin and preserved dark beard/hair
  detail. The paper is intentionally warmer than the original photograph's
  white background. Secondary-label contrast was increased during refinement.
- **Image quality:** actual SHARP Gaussian geometry from the supplied color
  original, with photo-derived monochrome colors. No inferred replacement face,
  flat depth-grid Gaussian conversion, CSS illustration, or synthetic avatar.
  Eye, mouth, beard, ear, and hair detail were checked in the combined face
  comparison. Foreground isolation removes the room; learned means, rotations,
  and scales remain intact for retained Gaussians. A same-render transparent
  WebP provides the static fallback without a change of likeness or framing.
- **Copy and content:** the site's existing “Teaching artificial minds how to
  design.” headline is retained. Interaction copy changes between pointer and
  touch. Reduced-motion and failed-load states say only “A portrait of Andrew.”
  There is no model jargon, quality claim, or prompt-like explanatory paragraph
  in the composition. No decorative icons are required or substituted.

## Comparison and correction history

1. **P1 — wrong reconstruction/presentation.** The earlier depth-sampling
   comparison and technical controls did not satisfy the genuine splat and
   crafted presentation request. Replaced this route with native SHARP output
   from the full color source, separate photo reprojection/B/W grading, and the
   new composition. Native PLY provenance and processing parameters are recorded
   in `public/splats/color-sharp/portrait-camera.json`. Post-fix evidence:
   `desktop.png`, `mobile.png`, `structure.png`, and the focused comparison.
2. **P2 — washed-out beard and soft texture.** Initial monochrome transfer lost
   too much shadow separation. Added controlled source-detail sharpening and
   an 18-level shadow adjustment before painting the Gaussians. Post-fix
   evidence: `fidelity-comparison.png`, reviewed beside both source faces.
3. **P2 — headline spacing.** Initial -.058em tracking looked cramped. Changed
   to -.045em plus .018em word spacing. Post-fix evidence: desktop, mobile,
   320px and 768px captures, with all headline words readable and unclipped.
4. **P1 — reduced-motion blank portrait.** The ready-state image hiding rule
   overrode the static fallback. Matched the override's specificity inside the
   reduced-motion media query. Post-fix browser assertion verifies canvas
   display:none and poster opacity:1; `mobile-reduced.png` shows the portrait.
5. **P2 — small reset target.** Increased Recenter to a minimum 44px height and
   70px width. Post-fix evidence: mobile reset interaction and screenshot.
6. **P2 — lower shirt edge at camera limits.** Expanded the opacity feather to
   normalized y .82–.96 and side margins .065, removing the near-frame cutoff.
   Regenerated the asset and poster, then repeated the browser captures and
   tests. Final desktop, mobile-drag, extrema, narrow-layout, and failed-load
   images were opened and inspected after this fix.

## Interaction and failure checks

`scripts/review-native-portrait.mjs` passed against the real private HTTPS origin:

- Native model loaded and completed its one-time three-second introduction.
- Desktop pointer movement at default ±6°; additional ±7° visual stress checks.
- Mobile touch drag changed the rendered image (mean channel difference 3.516
  on a 0–255 scale), with no page scroll during the drag.
- Release held the view: mean difference 0 after settling.
- Tap returned to neutral: mean difference 0.085 from the original neutral view.
- Keyboard arrow input and Recenter returned to the neutral composition.
- Reduced-motion setting kept the static portrait visible.
- Blocked SPZ request produced the static portrait, not a blank page.
- No horizontal overflow at 320px, 390px, 768px, or 1440px.
- Zero captured JavaScript runtime exceptions.
- Existing comparison and homepage regression checks also passed: touch in both
  axes, scroll outside the portrait, model/view changes, and reduced motion.

These image differences are interaction assertions, not measures of identity,
reconstruction quality, or physical-phone frame rate. TLS and page/model/poster
responses were verified separately. The preview is private; production is
unchanged.

## Open questions and residual test gaps

### Resting-pose correction after user feedback

Andrew identified that the default view looked slightly turned away. The
previous neutral camera exactly matched the source camera; its photo already
has a slightly turned head. Added a -4° neutral yaw, visually checked against
the former resting view in `.comparison/rest-pose/before-after.png` (932×500,
equal-scale portrait crops; before on the left). The new view looks more
face-on without changing the splat geometry, appearance, typography, or layout.
The first rendered frame, completed introduction, and reset all use the new
neutral camera. Movement interpolates from that rest point to the existing
absolute ±6° limits rather than extending the reconstruction's viewing envelope.
The static poster was re-exported at the corrected angle. Desktop/mobile,
touch/hold/tap, Recenter, reduced-motion, failed-load, and narrow-layout checks
were rerun using `scripts/review-native-portrait.mjs`.

- Physical iPhone Safari performance has not been measured; touch tests use
  Chromium emulation. Full Safari/VoiceOver and browser zoom testing remain
  device-level follow-up checks, not claimed results.
- This is a near-frontal reconstruction from one photograph, not a scanned head.
  Camera travel is deliberately bounded; unseen profiles are not promised.
- The older smiling expression is not painted onto the new neutral-expression
  geometry. It supplies tonal direction only.

## Implementation checklist

- [x] Reconstruct native Gaussians from the supplied high-quality color source.
- [x] Preserve native geometry and paint the source appearance in monochrome.
- [x] Review facial detail and source-to-result tone together.
- [x] Remove technical experiment UI from the presented route.
- [x] Verify pointer, touch, reset, reduced-motion, and failed-load behavior.
- [x] Recapture and inspect all corrected visual states.
- [ ] Validate physical iPhone Safari performance when a device is available.

## Follow-up polish

The two P1 findings above take priority over further polish. Do not interpret
the earlier test passes as user acceptance or a reason to ship this design.

final result: blocked
