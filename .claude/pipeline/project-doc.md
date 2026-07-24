# MangaMori Project Scan

Last scanned: 2026-07-24

## Stack and dependencies

- TypeScript 5.9, React 19.2, React DOM 19.2, Next.js 16.2 App Router
- `vinext` 0.0.50 and Vite 8 for the Cloudflare-compatible production runtime
- Next static export for GitHub Pages
- Tailwind PostCSS is installed; the current interface is authored primarily in
  `app/globals.css`
- AniList GraphQL is the only runtime content API and requires no API key
- Drizzle/D1 scaffolding exists but is not part of the MangaMori discovery flow

## Architecture

The single-page client application is server-rendered initially and hydrates in
the browser. `app/page.tsx` owns preferences, request state, result batching,
local seen-history, and the page composition. `app/discovery.ts` owns all AniList
query construction and result selection. GraphQL calls run from the browser
directly to `https://graphql.anilist.co`.

Two delivery targets share the source:

1. `vinext build` creates the Sites/Cloudflare worker runtime in `dist`.
2. `GITHUB_PAGES=true next build` creates the `/MangaMori` static export in
   `out`.

## Folder structure

- `app/`: application code, layout, discovery algorithm, and global styling
- `public/`: static social image
- `tests/`: rendered HTML smoke test
- `worker/`, `build/`: vinext/Sites runtime integration
- `.github/workflows/`: GitHub Pages CI/CD
- `.openai/hosting.json`: connected Sites project identifier
- `examples/d1/`, `db/`, `drizzle/`: optional starter persistence scaffolding

## UI conventions

- Warm paper surfaces, near-black ink, muted red blossoms, hard manga-panel
  borders, square controls, serif display type, and subtle print texture
- Responsive grid: three result columns on desktop, two on tablet, one on mobile
- Real AniList imagery only
- German interface copy with original Japanese/Korean titles retained
- Focus-visible outlines, semantic fieldsets, live loading status, and 44px+
  interactive targets

## Data and API behavior

- Hidden gems require `averageScore_greater: 68`
- Anime popularity window: 800–45,000
- Korean Manhwa popularity window: 150–18,000
- Surprise mode requires `averageScore_greater: 72`
- Surprise Anime window: 500–90,000; Manhwa: 100–35,000
- Sort order: `SCORE_DESC`, then ascending `POPULARITY`
- Genre pools sample pages 1–8; tag pools 1–4; surprise pools 1–20
- Narrow empty pages retry page 1 without relaxing quality/popularity filters
- Results are shuffled deterministically per discovery seed and batch, then
  deduplicated against visible and locally remembered media IDs

## Testing and quality gates

- `npm run lint`: ESLint and React/Next rules
- `npm test`: vinext build plus server-render smoke test
- `npm run build:pages`: static export used by GitHub Pages
- Browser validation covers live AniList responses, batch deduplication,
  surprise mixing, narrow Murim fallback, console errors, mobile overflow, and
  touch target sizes

## Key entry points

- `app/page.tsx`
- `app/discovery.ts`
- `app/globals.css`
- `app/layout.tsx`
- `next.config.ts`
- `vite.config.ts`
- `.github/workflows/deploy-pages.yml`
