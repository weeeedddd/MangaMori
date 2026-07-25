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
};

export type Webtoon = Media & { moods: GenreKey[] };

const UPLOADS = "https://uploads.mangadex.org/covers";

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
    seasonYear: null,
    status: null,
    bannerImage: null,
    trailer: null,
    moods: record.m,
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

export function matchWebtoons(webtoons: Webtoon[], selected: GenreKey[]) {
  if (!selected.length) return webtoons;

  const wanted = new Set(selected);
  const ranked = webtoons
    .map((webtoon) => ({
      webtoon,
      hits: webtoon.moods.filter((mood) => wanted.has(mood)).length,
    }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || (b.webtoon.averageScore ?? 0) - (a.webtoon.averageScore ?? 0));

  return ranked.length ? ranked.map((entry) => entry.webtoon) : webtoons;
}
