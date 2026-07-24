# MangaMori Agent Guide

## Project shape

- React 19 + Next.js 16 App Router application.
- `vinext` builds the Cloudflare/Sites runtime.
- `next build` with `GITHUB_PAGES=true` creates the static GitHub Pages export.
- The browser calls AniList GraphQL directly; no API key or server-side secret is
  required.

## Main entry points

- `app/page.tsx`: client state, interaction flow, and rendered discovery UI.
- `app/discovery.ts`: AniList query, niche filters, deterministic pagination,
  randomization, ranking, and deduplication helpers.
- `app/globals.css`: the manga-panel visual system and responsive behavior.
- `app/layout.tsx`: fonts and metadata.
- `tests/rendered-html.test.mjs`: server-render smoke test.

## Working conventions

- Preserve the warm paper, ink, blossom, and manga-panel visual language. Avoid
  neon, glassmorphism, sci-fi, cyberpunk, and overly rounded controls.
- Keep AniList calls public and client-side. Never introduce a secret for this
  integration.
- Results must use real AniList covers, titles, original titles, descriptions,
  scores, and links. Do not add placeholder cover art.
- New discovery paths must deduplicate by `mediaKey()` and respect `isAdult:
  false`.
- Keep interactive controls keyboard accessible, at least 44px tall, and usable
  at 320px viewport width.
- Prefer pure helpers in `app/discovery.ts`; keep rendering and UI state in
  `app/page.tsx`.

## Validation

Run before shipping:

```bash
npm run lint
npm test
npm run build:pages
```

For discovery changes, also exercise one broad genre search, one narrow
Manhwa/Murim search, “Mehr laden”, and “Überrasch mich” against the live AniList
API.

## Deployment

- Push to `main` to trigger `.github/workflows/deploy-pages.yml`.
- The public URL is `https://weeeedddd.github.io/MangaMori/`.
- `.openai/hosting.json` links the same source to the private Sites deployment;
  reuse its opaque `project_id`.
