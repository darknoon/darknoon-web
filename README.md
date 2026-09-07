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
and a 404 page. Image resizing and WebP encoding run at build time. Only the GAN
article's image selector needs custom browser interaction; its images are still
readable with JavaScript disabled.

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
and keyboard selection were exercised. The Astro migration is deployed to https://www.darknoon.com; the apex domain
redirects there. Canonical URLs use the same www host.
