# darknoon.com

A static Astro site. Content and original images live in Git; no database, CMS,
server adapter, or runtime API is required. React and GraphQL have been removed.

## Develop and build

Use Node 22.12 or newer and npm:

```sh
npm ci
npm run dev
npm run check
npm run build
python3 scripts/check-static.py
npm run preview
```

`npm run build` generates `dist/`: 15 dated articles, home, projects, CV, blog index,
and a 404 page, plus the `/splat/` and `/splat/color/` portrait experiments. Image resizing and WebP
encoding run at build time. The GAN article's image selector and the portrait
splat use browser JavaScript; both keep their images readable without it.

## Portrait splat experiment

The home portrait loads its 3D version on hover or keyboard focus, or when it
becomes visible on a touch device so the first drag is ready. `/splat/`
loads a photo-preserving MoGe-2 depth surface immediately. Its selector compares
MoGe-2 photo + depth, MoGe-2 photo-colored Gaussians, Depth Anything V2 photo +
depth, and the original SHARP reconstruction. All are displayed in black and
white. Photo/3D/structure views and adjustable viewing angle are available.
The home page still uses SHARP pending review. The camera translates parallel to the
original image plane, looking at a fixed point on the face. On mobile, drag one
finger in either direction on the portrait; releasing keeps the view, and a tap
recenters it. Swipes outside the portrait scroll normally, and pinch zoom stays
available. The static photo and loading state also allow normal scrolling.
Rendering sleeps
once the camera settles, when offscreen, or when the tab is hidden. Reduced
motion, unavailable WebGL, or failed loading retain the ordinary photograph.

### Color-first, wider source (September 29, 2026)

The initial MoGe comparison below was rejected. `/splat/color/` now uses the
native SHARP reconstruction and a designed, control-free portrait composition.
The old MoGe assets remain as experiment records, not the presented result.

#### Native reconstruction and appearance transfer

SHARP ran on `ml-dev-box3`'s RTX 4090 using the full 1034×1124 color JPEG, with
the official 2,809,738,232-byte checkpoint and source revision
`aed6527499ef91cba3b54c18d49a870f25947190`. The input hash is
`f08aa314bb02f2bd50e29b62f2c268d2e7ba022e2285cdb905189703dfaa55a4`.
This used an isolated environment under `/home/andrew/.bb/portrait-sharp-20260929`,
not the hosted Space, and did not install inference dependencies on the Mac.

The exported PLY contains **1,179,648 native learned Gaussians**, SHA-256
`5ba3e282a459f0f4d473ea58a6b7c6ada4046ec8e5d800e3b890aaced8c9ec52`.
Prediction plus process/model startup took 14.52 seconds; this is not a pure
inference benchmark. SHARP's log reports no EXIF focal length, so it used its
30mm default. The saved camera has vertical FOV 55.91°.

`scripts/prepare-art-portrait.mjs` preserves the retained Gaussians' learned
centers, rotations and scales, isolates the foreground by distance, and feathers
the shirt boundary using opacity. It does **not** create Gaussians from a depth
grid. The retained 397,568 primitives compress to 5,621,695 bytes.

Appearance is processed separately: the HQ photograph is projected onto those
native Gaussians through the reconstruction camera. Its monochrome curve is
matched to face-region quantiles in the earlier B/W portrait, with shadow/detail
refinement. The earlier photo supplies the tonal reference, not a different
expression warped over the new face. Tone anchors, hashes and the transfer method
are recorded in `public/splats/color-sharp/portrait-camera.json`.

The presentation uses warm paper, a floating portrait, quiet site typography,
a one-time three-second camera introduction, and bounded ±6° pointer/touch
movement. The resting view is shifted 4° left from the source camera to make
the source photograph's turned head more face-on. Pointer and drag movement
still use the original absolute ±6° envelope; the correction does not expand it.
User input interrupts the introduction. Drag holds, tap or Recenter
returns to that corrected view; reduced motion and failures show a high-resolution rendering of the
same splat instead. No model selector or reconstruction controls remain here.

```sh
node scripts/prepare-art-portrait.mjs /path/to/native.ply /path/to/color-original.jpg public/splats/color-sharp portrait
node scripts/review-native-portrait.mjs ws://isolated-chromium-cdp-endpoint
```

Raw inference output is preserved on the GPU box and in thread artifacts.
The private HTTPS preview described below is unchanged; production is untouched.
See `design-qa.md` for the visual review, test evidence, and remaining device-test gap.

#### Earlier depth-sampling comparison (rejected)

The initial `/splat/color/` used the newly supplied 1034×1124 color photograph, including its
room background and uncropped aspect ratio. It is a different expression from
the earlier smiling portrait, so this is **not** a controlled test of whether
color alone improves inference. The original comparison and home are unchanged.

MoGe-2 Ultra successfully ran on an sRGB PNG of the full color input (no upscale,
masking and edge removal disabled), reporting a 53.1° vertical FOV. Only afterward
was the source photograph converted to grayscale for display. The hosted Space
revision was `76f895ef4449102ee1f95d9f35ef144d8cb56b61`.

- The default uses 376,960 flattened Gaussians sampled from the inferred depth
  and grayscale photo: 2,836,256 bytes of SPZ. This is a depth-to-Gaussian
  conversion, not native learned Gaussian inference.
- The sharper mesh comparison uses a 589×640 depth grid (1,507,840 bytes) with
  the full-resolution photo texture. It bridges depth discontinuities: cutting
  them left a visible white halo even at the source camera. Bridging removes
  that halo but stretches existing edge pixels when viewed from the side.
- Both start at ±2° travel, adjustable to ±6°. Background surfaces hidden by
  the face were not reconstructed; large offsets remain an explicit stress test.
- At that stage, a new SHARP run was refused by hosted GPU quota: it reserved
  180 seconds with 177 seconds remaining. The subsequent native run above
  succeeded on the GPU box.

The original color attachment, exact uploaded PNG, returned EXR and inference
result are preserved in thread storage. Generated camera JSON records source
and depth hashes; only grayscale assets are included in the website.

Mobile Chromium emulation verified horizontal/vertical touch movement, holding
after release, tap reset, outside scrolling, both representations, grayscale
output, uncropped aspect ratio, structure/photo views, rapid switching, and
reduced-motion fallback. Neutral-view channel difference against the B/W photo
was 1.77/255 for the continuous mesh and 8.14/255 for sampled Gaussians; the latter
looks softer. These are rendering checks, not geometry-quality metrics or a
physical iPhone test. The ±6° stress test still exposes silhouette/outer-frame
gaps in the splats. The default remains ±2°.

```sh
node scripts/prepare-depth-portrait.mjs moge /path/to/color-depth.exr public/splats/color-moge /path/to/color-original.jpg 53.1
node scripts/check-portrait-browser.mjs ws://isolated-chromium-cdp-endpoint http://127.0.0.1:5961 color
```

The preview runs privately on prefix-mini; it is not deployed to production.

Private mobile preview on prefix-mini: use
`https://prefix-mini.tail06618c.ts.net:5960/splat/color/`, not HTTPS on port 5961.
The existing Tailscale Serve listener on 5960 terminates TLS and forwards to the
Astro HTTP server at `127.0.0.1:5961`. The app is loopback-only; no public Funnel
is enabled. Restart this worktree's app with:

```sh
bb dev-servers start --command 'npm run dev -- --host 127.0.0.1 --port {port+1}'
```

The 5960→5961 private proxy persists across app restarts. Port 5960 is occupied
by that proxy, so the app must use its allocated offset slot rather than trying
to bind the HTTPS listener's port itself.

### Photo-preserving alternatives (September 17, 2026)

TRELLIS was rejected: its inferred full head changed the likeness. It is no
longer offered in the comparison UI; its original artifacts remain preserved.
Three new variants instead use the original photograph for all facial texture:

- **MoGe-2 photo + depth (default):** the public
  [MoGe-2 Space](https://huggingface.co/spaces/Ruicheng/MoGe-2) ran Ultra inference
  on an sRGB-normalized 1280px-high input, with masking/edge removal disabled.
  Native depth and its reported 37.2° vertical FOV define a textured surface.
  Depth discontinuities are cut rather than stretching triangles across them.
  This is a mesh, not a learned Gaussian reconstruction or complete head.
- **MoGe-2 photo-colored splats:** 307,840 flattened Gaussians sampled from that
  depth and the original grayscale pixels, compressed to 2,020,472 bytes.
  Texture is softer than the mesh version. No generative appearance model is
  used in this conversion.
- **Depth Anything V2 photo + depth:** the official
  [DAV2 Space](https://huggingface.co/spaces/depth-anything/Depth-Anything-V2)
  ran its Large model on the same image. Relative inverse depth is explicitly
  mapped to 3.65–5.7 display units and uses the MoGe FOV for comparison; those
  units are not metric measurements.

The new views default to ±4° lateral camera travel, adjustable to ±10° for
inspection. Larger offsets show stretched edges or missing surfaces, not an
accurate unseen profile. At this point only the monochrome original was
available; the separate September 29 experiment above adds a color-first test.

```sh
node scripts/prepare-depth-portrait.mjs moge /path/to/depth.exr public/splats/moge
node scripts/prepare-depth-portrait.mjs dav2 /path/to/normalized-grayscale-depth.png public/splats/dav2
node scripts/check-portrait-browser.mjs ws://isolated-chromium-cdp-endpoint
```

The converter writes source hashes and method descriptions in each camera JSON.
The original photo supplies the full-resolution grayscale texture, independent
of mesh resolution. No AI inference runs in visitors' browsers. Mesh variants
load a 1.23 MB depth buffer plus the shared photo texture.

Mobile Chromium emulation passed touch movement, held pose, tap reset, scroll
outside the image, four model selections, structure/photo views, rapid switching,
and reduced-motion fallback. Screenshot RGB-channel spread verifies B/W output.
Neutral-view mean absolute channel difference versus the on-page original was
2.70/255 (MoGe mesh), 3.22/255 (DAV2 mesh), and 6.12/255 (MoGe splats). This is a
rendering comparison, not a metric for identity, geometry quality, or performance
on a physical phone. These experiments have not been deployed to production.

### TRELLIS comparison (September 12, 2026)

Historical rejected experiment, not the current preview default:

The public [community TRELLIS Space](https://huggingface.co/spaces/trellis-community/TRELLIS)
successfully reconstructed the same portrait using `TRELLIS-image-large`, seed
42, 25 sparse-structure steps and 25 structured-latent steps (guidance 7.5 / 3).
The image was converted to sRGB PNG at 1536 pixels high, then passed through the
Space's background-removal preprocessing. The returned turntable and browser
render show a complete bust, including nose profile, ears and back of the head.
The stronger depth comes with softer/altered facial detail and inferred unseen
sides; this is not a faithful scan or a demonstrated identity-quality upgrade.

The Gaussian export contains 682,112 primitives; filtering seven near-invisible
ones leaves 682,105. The browser SPZ is 9,898,828 bytes, with native model colors
and geometry, not reprojected photograph colors. Default lateral movement gives
a maximum 28° horizontal view from the center, versus about 5° for SHARP. Scale
is arbitrary, so the control uses degrees rather than claiming centimeters.

```sh
node scripts/prepare-trellis-splat.mjs /path/to/trellis-head.ply
```

`public/splats/trellis/portrait-camera.json` records source revision, parameters,
PLY hash, bounds and fitting camera. The converter centers the PLY and writes
SPZ; it does not generate geometry, alter identity, or recolor the model.
Original exported PLY and turntable are preserved as thread artifacts. No
inference model was downloaded to this Mac; nothing new has been deployed.

LAM's portrait-specific hosted H5 export was also attempted, but its inference
endpoint returned `success: false` with `error: null`; no LAM reconstruction was
obtained. The official Microsoft TRELLIS Space reported a Torch/ZeroGPU
configuration error, so the functioning community Space was used.

Mobile Chromium checks cover horizontal/vertical touch, holding after release,
tap reset, scrolling outside the portrait, both model selections, Gaussian/photo
views, rapid model changes, and reduced-motion fallback. These are emulated
touch tests, not a physical-phone performance measurement.

### Original SHARP experiment

The source PLY was generated by the public
[SHARP Space](https://huggingface.co/spaces/gagndeep/Apple-Sharp-Image-to-3D-View-Synthesis)
from `src/assets/resources/wubba-lubba-dub-dub.jpg` with video rendering disabled.
No model runs on the web server or in visitors' browsers. The raw output has
1,179,648 Gaussians and loses the dark hair in its predicted colors. The conversion
script projects the original photograph's sRGB colors onto that inferred
geometry; it does not infer new geometry. The head outline remains soft and
large camera offsets expose single-view reconstruction artifacts. This is an
exploration, not a finished portrait reconstruction.

Regenerate the browser assets from a downloaded SHARP PLY:

```sh
node scripts/prepare-portrait-splat.mjs /path/to/portrait.ply
```

The script preserves the camera calibration and both Gaussian layers, filters
only near-invisible splats, and quantizes/compresses to SPZ using Spark's writer.
`public/splats/portrait-camera.json` records the source PLY hash, camera, color
method, splat count and asset size. The SPZ is approximately 13 MiB; the renderer
is also a substantial lazy-loaded chunk. Neither is requested on the home page
until the portrait is engaged (or visible on a touch device). They are self-hosted
once built.

The model's [license](https://github.com/apple/ml-sharp/blob/main/LICENSE_MODEL)
limits model use to research; this experiment has not been deployed. The Space
also enforces GPU quotas: a follow-up request was refused because it reserves
180 seconds while the anonymous session had 172 seconds remaining.

For a framework-independent hosting check:

```sh
python3 -m http.server 4321 --directory dist
```

A static host should serve directory `index.html` files and use `404.html` for
unknown paths. Deploy `dist/` to any static host. Vercel's build/output settings
are in `vercel.json`; no Vercel adapter or functions are used. On other hosts,
serve `/sw.js` with `Cache-Control: no-cache` during the transition from Gatsby.

## Content

- `src/_posts/*.{md,mdx}`: articles. Filenames determine the existing
  `/YYYY/MM/DD/slug/` URLs. Frontmatter supplies the title and optional date.
- `src/_posts/images/`: original article images; relative Markdown images are
  optimized during builds.
- `public/images/`: original images referenced by legacy raw HTML tags
  and image links. These keep their public paths and are served unchanged; they
  are not duplicated under `src/_posts/images/`.
- `src/data/projects.js`: existing project entries.
- `src/pages/`: Astro pages; `src/layouts/Layout.astro` and `src/styles/` preserve
  the Gatsby site's layout and colors.
- `src/components/MultiImage.astro`: progressively enhanced image selector,
  supporting mouse, touch, keyboard, and a readable no-JavaScript fallback.
- `public/sw.js`: one-time retirement of Gatsby's existing offline worker.
  The new site never registers it for new visitors.

## Compare with production

The BB Dev Servers plugin keeps persistent comparison servers associated with
this worktree. Start static output on one slot and the live-site proxy on another:

```sh
bb dev-servers start --command 'python3 -m http.server {port+2} --bind 0.0.0.0 --directory dist'
bb dev-servers start --command 'node scripts/live-proxy.mjs {port+1}'
```

The proxy reads the deployed https://darknoon.com site; it is a comparison tool,
not a local Gatsby rebuild and not part of the deployed output. It needs internet
access. Rebuild Astro after edits to update the static preview.

## Migration findings

- The Classics article references `a-christmas-carolclassic-1.png`, missing from
  Git and broken in production. The Astro version displays an explicit unavailable
  screenshot note. Restore the original if it can be recovered.
- Fixed a legacy GitHub URL missing its `https://` scheme in the Mac UI article.
- Images now use modern Sharp/WebP output. Resampling, compression, and color
  rendition can differ from the historical Gatsby JPEG output. The project and
  portrait comparison screenshots show this even where page geometry matches.
- Blog excerpts are generated without Gatsby; some word cutoffs differ slightly.
- YouTube/Vimeo embeds still depend on their external providers, as before.
- Offline caching is intentionally retired. The worker upgrade was tested in an
  isolated browser scope: it removes only `gatsby-plugin-offline*` caches,
  unregisters itself, and leaves unrelated caches intact.

Validation: static build (20 pages), Astro diagnostics (0 errors/warnings/hints),
npm audit (0 vulnerabilities), local generated links/assets, and desktop/mobile/
dark-mode browser comparisons. All eight GAN selectors initialized; mouse-event
and keyboard selection were exercised. The Astro migration is deployed to https://darknoon.com; the www domain
redirects there. Canonical URLs use the same apex host.
