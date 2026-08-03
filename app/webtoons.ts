import type { GenreKey, Media } from "./discovery";

// Korean manhwa/webtoons snapshotted from the public MangaDex API at build time
// (see scripts/fetch-webtoons.mjs). MangaDex sends no CORS headers, so the
// static site cannot query it live; instead the snapshot ships as a plain asset
// that we fetch same-origin on demand and filter client-side.
//
// Records use short keys to keep ~1000 titles small over the wire.
type CompactWebtoon = {
  i: string;
  t: string;
  c: string;
  m: GenreKey[];
  n?: string;
  d?: string;
  s?: number;
  p?: number;
  ch?: number;
  g?: string[];
  st?: "c" | "o" | "h" | "x";
  y?: number;
};

export type WebtoonStatus = "completed" | "ongoing" | "hiatus" | "cancelled";
export type StatusFilter = "ALL" | "COMPLETED" | "ONGOING";
export type WebtoonSort = "SCORE" | "POPULAR" | "CHAPTERS" | "NEWEST";

export type Webtoon = Media & {
  moods: GenreKey[];
  searchText: string;
};

const UPLOADS = "https://uploads.mangadex.org/covers";

const STATUS_NAME: Record<string, WebtoonStatus> = {
  c: "completed",
  o: "ongoing",
  h: "hiatus",
  x: "cancelled",
};

let cache: Promise<Webtoon[]> | null = null;

function expand(record: CompactWebtoon): Webtoon {
  return {
    id: record.i,
    type: "MANGA",
    source: "mangadex",
    title: {
      english: record.t,
      romaji: null,
      native: record.n ?? null,
    },
    coverImage: {
      extraLarge: `${UPLOADS}/${record.i}/${record.c}.512.jpg`,
      large: `${UPLOADS}/${record.i}/${record.c}.256.jpg`,
      color: null,
    },
    description: record.d ?? null,
    format: null,
    averageScore: record.s ?? null,
    popularity: record.p ?? null,
    episodes: null,
    chapters: record.ch ?? null,
    genres: record.g ?? [],
    tags: [],
    siteUrl: `https://mangadex.org/title/${record.i}`,
    seasonYear: record.y ?? null,
    status: record.st ? STATUS_NAME[record.st] : null,
    bannerImage: null,
    trailer: null,
    moods: record.m,
    searchText: `${record.t} ${record.n ?? ""}`.toLowerCase(),
  };
}

export function loadWebtoons(): Promise<Webtoon[]> {
  if (cache) return cache;

  // Resolve against the document base so the GitHub Pages basePath
  // (/MangaMori/) and local development (/) both work.
  const url = new URL("webtoons.json", document.baseURI).toString();

  cache = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status}`);
      return response.json() as Promise<CompactWebtoon[]>;
    })
    .then((records) => records.map(expand))
    .catch(() => {
      cache = null;
      return [];
    });

  return cache;
}

const SORTERS: Record<WebtoonSort, (a: Webtoon, b: Webtoon) => number> = {
  SCORE: (a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0),
  POPULAR: (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  CHAPTERS: (a, b) => (b.chapters ?? 0) - (a.chapters ?? 0),
  NEWEST: (a, b) => (b.seasonYear ?? 0) - (a.seasonYear ?? 0),
};

export type ShelfQuery = {
  selected: GenreKey[];
  search: string;
  status: StatusFilter;
  sort: WebtoonSort;
};

export function queryWebtoons(webtoons: Webtoon[], query: ShelfQuery) {
  const term = query.search.trim().toLowerCase();
  const wanted = new Set(query.selected);

  const filtered = webtoons.filter((webtoon) => {
    if (term && !webtoon.searchText.includes(term)) return false;
    if (query.status === "COMPLETED" && webtoon.status !== "completed") {
      return false;
    }
    if (query.status === "ONGOING" && webtoon.status !== "ongoing") {
      return false;
    }
    // A title search is an explicit request, so it wins over the mood picks.
    if (!term && wanted.size) {
      return webtoon.moods.some((mood) => wanted.has(mood));
    }
    return true;
  });

  const byMoodHits = (webtoon: Webtoon) =>
    term || !wanted.size
      ? 0
      : webtoon.moods.filter((mood) => wanted.has(mood)).length;

  return [...filtered].sort(
    (a, b) => byMoodHits(b) - byMoodHits(a) || SORTERS[query.sort](a, b),
  );
}
