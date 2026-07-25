import type { GenreKey, Media } from "./discovery";
import data from "./webtoons.json";

// Curated Korean manhwa/webtoons snapshotted from the public MangaDex API at
// build time (see scripts/fetch-webtoons.mjs). MangaDex does not send CORS
// headers, so the static site cannot query it live; instead we bake this set
// and filter it client-side by the reader's genre picks.
export type Webtoon = Media & { moods: GenreKey[] };

export const WEBTOONS = data as unknown as Webtoon[];

export function matchWebtoons(selected: GenreKey[], limit: number): Webtoon[] {
  if (!selected.length) return WEBTOONS.slice(0, limit);

  const wanted = new Set(selected);
  const ranked = WEBTOONS.map((webtoon) => ({
    webtoon,
    hits: webtoon.moods.filter((mood) => wanted.has(mood)).length,
  }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const source = ranked.length ? ranked.map((entry) => entry.webtoon) : WEBTOONS;
  return source.slice(0, limit);
}
