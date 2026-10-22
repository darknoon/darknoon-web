# Portrait Gaussian splat — findings and handoff

Updated October 22, 2026, before Andrew archives the originating thread.

## Outcome: technically working, not accepted

Andrew's latest feedback is the acceptance criterion:

> I thought it was just gonna stay in the existing site sort of layout.
> It doesn't really seem that exciting. Can't really tell. It's not like that 3D.

The goal is a recognizable, high-quality B/W portrait **inside the existing
personal-site layout**, with immediately perceptible camera parallax on mouse
and mobile touch. It must be an actual Gaussian splat, not just a flat image
tilt or a depth mesh described as a splat.

I interpreted “finely crafted/designy” as permission to redesign the presentation.
That was wrong. `/splat/color/` became a standalone warm-paper, large-headline
composition instead of an enhancement to the existing portrait slot. Do not
treat this design as approved or carry it forward as the site's new direction.
No production deployment or merge was performed by this work.

The final pipeline does reconstruct from the supplied higher-quality color
photograph and separately paint monochrome appearance onto native Gaussians.
That technical milestone did **not** deliver the desired perceptual result.
Earlier `design-qa.md` passes covered rendering/layout/interaction checks, not
Andrew's acceptance. Its current status has been corrected to blocked.

## What was tried

| Experiment | What it actually is | Finding |
| --- | --- | --- |
| Original-photo SHARP | Native learned Gaussians, with source-photo colors reprojected afterward | Genuine splat; limited convincing side travel. Still the default model on this branch's homepage. |
| TRELLIS | Generated full-head/bust Gaussians | More obvious rotation, but altered likeness/mannequin appearance; Andrew rejected it. Do not return to it as the accepted direction. |
| MoGe-2 / Depth Anything V2 | Photo-textured depth meshes; separate MoGe variants sample flattened Gaussians from depth | Photo detail was retained better in the mesh, but this was not the requested native reconstruction. Larger moves exposed gaps or stretched edges. |
| Color-first native SHARP | Full 1034×1124 color input → native Gaussians → photo reprojection and B/W tone transfer | Latest artifact is real native splat geometry; Andrew still finds the depth insufficient and rejects the separate page design. |

The latest native SHARP run used the RTX 4090 on `ml-dev-box3`, official source
revision `aed6527499ef91cba3b54c18d49a870f25947190`, and the official
2,809,738,232-byte checkpoint. Process/model startup plus prediction took 14.52s;
this is not a pure inference benchmark or a VRAM measurement. The photograph had
no EXIF focal length, so SHARP used its 30mm default. No comparison establishes
that color alone improved inference: the old and new photographs have different
expressions and framing.

Native output: 1,179,648 Gaussians, 66,061,086-byte PLY. The presented foreground
has 397,568 retained Gaussians in a 5,621,695-byte SPZ. Conversion preserves the
retained centers, rotations and scales; it changes color and uses opacity for
foreground isolation/edge feathering. The older smiling B/W photograph supplies
tone, **not** a smile or facial texture warped onto the new neutral-expression
head. The raw reconstruction remains available for revisiting those choices.

## Why it may read as insufficiently 3D

Verified implementation facts:

- Camera translation stays in the source image plane and continually looks at
  a fixed face target, holding the face in frame.
- The latest view is constrained to absolute horizontal limits of ±6° relative
  to the source camera. Larger travel has not been established as clean.
- A later “more face-on” correction rests at -4°. This leaves only 2° of travel
  toward the -6° endpoint, versus 10° toward +6°; interaction is not balanced
  around the resting view.
- The room/background is removed, shoulder boundaries are feathered, and the
  presentation uses a high-key monochrome grade. The intro runs for three
  seconds once; subsequent movement is input-driven and rendering settles.
- Reduced-motion and failed-load states intentionally show a static poster.
  I have not verified which state Andrew actually saw on his physical phone.

Working hypotheses to test, not established diagnoses: the short travel in one
direction, fixed framing, and removed background reference may weaken depth
cues. The native facial geometry itself may also be insufficient. No measured
facial-depth audit, physical-phone frame-rate test, or perceptual comparison
separates those possibilities yet. Raising the splat count or swapping a model
name is not evidence of a better result.

## Next steps, in order

1. **Return to the existing site layout.** Read the current main-branch layout
   before porting; other homepage work has happened since this branch began.
   Limit changes to the portrait slot and its interaction. Preserve typography,
   text, selected-work list, page colors, spacing and responsive composition.
   This branch's homepage uses the older SHARP model, not the new `color-sharp`
   result: merely linking `/` does not demonstrate the latest reconstruction.
2. **Verify what the phone is rendering.** Inspect `splat-portrait`'s model and
   `data-state`, reduced-motion setting, WebGL errors, asset completion, and
   actual camera response on iPhone Safari. Keep diagnostics out of the final
   design. A visible poster and an HTTP 200 do not prove working parallax.
3. **Make a controlled, small comparison in that same portrait slot.** Use the
   same asset/grade/scale. Compare the current camera with balanced movement
   about a selected resting pose. Record both extremes and a touch drag; assess
   nose/ear/cheek displacement, likeness, silhouette gaps, and texture stretching.
   Audit the native depth before increasing travel. Any stronger camera range
   must be visually checked; ±6° is a current choice, not a proven optimum.
4. **Separate appearance from geometry.** Compare the retained foreground
   against the raw reconstruction to identify whether isolation, feathering or
   tone grading removed useful depth cues. Do not change the site design to
   disguise an unsatisfactory reconstruction. Do not warp the old expression
   over the new face or relabel a depth mesh as native splats.
5. **Use a go/no-go checkpoint before more model work.** If the existing geometry
   cannot deliver obvious, clean movement in the original portrait slot, show
   that limitation honestly. Propose a short multi-view capture or additional
   views for a new experiment, subject to Andrew's willingness; don't promise
   that another single-photo model will solve it. Benchmark any candidate on
   this actual face and phone before presenting it as an upgrade.
6. **Ask for acceptance on the actual outcome.** On the existing site, the first
   natural mouse movement or finger drag should visibly reveal depth without
   explanation, retain recognizable likeness/B&W treatment, and avoid distracting
   gaps or distortions. Confirm reset, outside scrolling, reduced motion and
   failure fallback. Do not merge or deploy until Andrew approves the result.

## Code and reproducibility map

- `src/pages/index.astro`: original-layout homepage integration, older SHARP.
- `src/pages/splat/color.astro`: **unapproved standalone redesign**, latest model.
- `src/pages/splat.astro` and `src/components/PortraitStudy.astro`: earlier lab UI.
- `src/components/SplatPortrait.astro`: loading, poster, accessibility, lifecycle.
- `src/scripts/portrait-splat.ts`: Spark/Three Gaussian renderer, camera/input,
  resting-angle bias, introductory motion and fallback behavior.
- `scripts/prepare-art-portrait.mjs`: native PLY → foreground SPZ + B/W reprojection;
  its face-region tone samples are specific to these photographs, not generic.
- `public/splats/color-sharp/`: latest SPZ, poster, full provenance/camera JSON.
- `scripts/review-native-portrait.mjs`: browser captures and interaction checks;
  **also rewrites the poster**, so run deliberately, not as a read-only test.
- `scripts/check-portrait-browser.mjs`: older comparisons/home regression checks.
- `README.md`: detailed experiment history and conversion commands.

Preserved files under `/Users/andrew/.bb/thread-storage/thr_db4bfshps9/`:

- `Attachments/Screen-Shot-2022-01-30-at-2.51.29-PM-1790706267474-gw1im2.jpg`: supplied color original.
- `artifacts/portrait-color-sharp-native.ply`: raw native reconstruction, verified
  present at handoff. SHA-256 `5ba3e282a459f0f4d473ea58a6b7c6ada4046ec8e5d800e3b890aaced8c9ec52`.
- `artifacts/run-native-sharp.sh`: exact remote setup/run script, verified present.
- `artifacts/native-review/` and `artifacts/rest-pose-review/`: saved visual evidence.

Old B/W source: `src/assets/resources/wubba-lubba-dub-dub.jpg`.
Remote experiment location: `/home/andrew/.bb/portrait-sharp-20260929` on
`ml-dev-box3`, including isolated environment, source, checkpoint and raw output.
That remote directory was not rechecked at this handoff. No inference is running
as part of the web preview; inference dependencies were not installed on the Mac.

## Validation and its limits

Prior checks passed: Astro diagnostics/build; 22 static pages with no missing
local references; Chromium-emulated pointer/touch, held drag, tap/Recenter,
reduced-motion, failed-model loading and narrow layouts; no captured JS runtime
exceptions. The post-resting-angle test measured movement 4.771/255, hold delta
0 and reset delta 0.050/255. These prove pixels change/reset, **not** compelling
3D, facial accuracy, or performance on physical iPhone Safari. The design and
perceived-depth requirements remain unmet despite those checks.

## Running preview and archive handoff

Preview: <https://prefix-mini.tail06618c.ts.net:6362/splat/color/>.
It is the **unapproved standalone composition**, preserved for reference.

- Persistent BB server name: `portrait splat`; checked running/healthy at handoff.
- Independent checkout: `/Users/andrew/.bb/thread-storage/thr_db4bfshps9/portrait-preview-checkout`.
- Saved static build from code commit `7d2a55084203ce73358e0f319ff9a2ae2f6ab37a`.
- Foreground command: `/usr/bin/python3 -u -m http.server 6362 --bind 127.0.0.1 --directory dist`.
- Private HTTPS is plugin-managed. No public Funnel or production deployment.
- Health checks require `/splat/color/`, HTML 200, and `data-model="color-sharp"`.
- It is machine-scoped, not a thread terminal. Archiving this thread is not a
  stop command for it. It remains enabled unless explicitly stopped; no service
  state was changed during this documentation handoff.
- Stop intentionally with `bb dev-servers persist stop 'portrait splat'`; restart
  with `bb dev-servers persist restart 'portrait splat'`. Refreshing this static
  build is separate from editing the worktree. Keep it out of managed worktrees.
- Retired port 5960 was reassigned to another project. Do not reclaim it, modify
  its proxy, or use the old links. Earlier outages involved a disconnected
  thread-server session and later port reassignment, not lost reconstruction files.

Repository: `https://github.com/darknoon/darknoon-web`.
Feature branch: `bb/create-3d-gaussian-splat-thr_db4bfshps9`.
Implementation commits `c5d03b6`, `7d2a550`, and preview documentation `e796e16`
were verified pushed before this handoff. This report and the corrected QA
status are saved in the next commit on that branch, with a separate report copy
in thread artifacts. Nothing is approved for production.

Suggested next-agent brief: **Keep Andrew's existing website layout. Reuse the
native color-first SHARP artifact, verify actual iPhone rendering, and establish
visibly convincing, clean parallax in the existing portrait slot before doing
more styling or claiming higher quality. Read this report before repeating prior
model experiments.**
