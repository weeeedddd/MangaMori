export type Scope = "ALL" | "ANIME" | "MANHWA";
export type AniListMediaType = "ANIME" | "MANGA";
export type DiscoveryMode = "HIDDEN" | "SURPRISE";
export type GenreKey =
  | "Action"
  | "Adventure"
  | "Isekai"
  | "Romance"
  | "Slice of Life"
  | "Fantasy"
  | "Mystery"
  | "Comedy"
  | "Drama"
  | "Murim"
  | "Psychological"
  | "Horror"
  | "Thriller"
  | "Sci-Fi"
  | "Supernatural"
  | "Sports"
  | "Mecha";

export type Media = {
  id: number;
  type: AniListMediaType;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    color: string | null;
  };
  description: string | null;
  format: string | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  siteUrl: string;
  seasonYear: number | null;
  status: string | null;
};

type QueryTarget = {
  type: AniListMediaType;
  country?: "KR";
};

type QueryFilters = {
  genres?: string[];
  tags?: string[];
};

type DiscoveryProfile = {
  averageScoreGreater: number;
  popularityGreater: number;
  popularityLesser: number;
};

type QuerySpec = {
  target: QueryTarget;
  filters: QueryFilters;
  maxPage: number;
};

type AniListPayload = {
  data?: {
    Page?: {
      media?: Media[];
    };
  };
  errors?: Array<{ message: string }>;
};

export type DiscoveryRequest = {
  scope: Scope;
  selected: GenreKey[];
  mode: DiscoveryMode;
  seed: number;
  batch: number;
  excludeKeys?: ReadonlySet<string>;
  signal: AbortSignal;
};

export type DiscoveryBatch = {
  items: Media[];
  hasMore: boolean;
  candidateCount: number;
};

const PAGE_SIZE = 25;
const BATCH_SIZE = 12;

const GENRE_MAP: Partial<Record<GenreKey, string>> = {
  Action: "Action",
  Adventure: "Adventure",
  Romance: "Romance",
  "Slice of Life": "Slice of Life",
  Fantasy: "Fantasy",
  Mystery: "Mystery",
  Comedy: "Comedy",
  Drama: "Drama",
  Psychological: "Psychological",
  Horror: "Horror",
  Thriller: "Thriller",
  "Sci-Fi": "Sci-Fi",
  Supernatural: "Supernatural",
  Sports: "Sports",
  Mecha: "Mecha",
};

const TAG_MAP: Partial<Record<GenreKey, string[]>> = {
  Isekai: ["Isekai", "Reincarnation"],
  Murim: ["Cultivation", "Martial Arts", "Wuxia"],
};

const HIDDEN_GEM_PROFILES: Record<AniListMediaType, DiscoveryProfile> = {
  ANIME: {
    averageScoreGreater: 68,
    popularityGreater: 800,
    popularityLesser: 45_000,
  },
  MANGA: {
    averageScoreGreater: 68,
    popularityGreater: 150,
    popularityLesser: 18_000,
  },
};

const SURPRISE_PROFILES: Record<AniListMediaType, DiscoveryProfile> = {
  ANIME: {
    averageScoreGreater: 72,
    popularityGreater: 500,
    popularityLesser: 90_000,
  },
  MANGA: {
    averageScoreGreater: 72,
    popularityGreater: 100,
    popularityLesser: 35_000,
  },
};

const ANILIST_QUERY = `
  query DiscoverHiddenGems(
    $page: Int
    $perPage: Int
    $type: MediaType
    $country: CountryCode
    $genres: [String]
    $tags: [String]
    $minimumTagRank: Int
    $averageScoreGreater: Int
    $popularityGreater: Int
    $popularityLesser: Int
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: $type
        countryOfOrigin: $country
        isAdult: false
        genre_in: $genres
        tag_in: $tags
        minimumTagRank: $minimumTagRank
        averageScore_greater: $averageScoreGreater
        popularity_greater: $popularityGreater
        popularity_lesser: $popularityLesser
        sort: $sort
      ) {
        id
        type
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          color
        }
        description(asHtml: false)
        format
        averageScore
        popularity
        genres
        tags {
          name
          rank
        }
        siteUrl
        seasonYear
        status
      }
    }
  }
`;

function unique(values: string[]) {
  return [...new Set(values)];
}

function targetsFor(scope: Scope): QueryTarget[] {
  if (scope === "ANIME") return [{ type: "ANIME" }];
  if (scope === "MANHWA") return [{ type: "MANGA", country: "KR" }];
  return [{ type: "ANIME" }, { type: "MANGA", country: "KR" }];
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffled<T>(items: T[], seed: number) {
  const random = mulberry32(seed);
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

function pageFor(seed: number, batch: number, requestIndex: number, maxPage: number) {
  const mixedSeed =
    (seed + (batch + 1) * 7_919 + (requestIndex + 1) * 104_729) >>> 0;
  return (mixedSeed % maxPage) + 1;
}

function querySpecsFor(
  scope: Scope,
  selected: GenreKey[],
  mode: DiscoveryMode,
) {
  const targets = targetsFor(mode === "SURPRISE" ? "ALL" : scope);

  if (mode === "SURPRISE") {
    return targets.map<QuerySpec>((target) => ({
      target,
      filters: {},
      maxPage: 20,
    }));
  }

  const genres = unique(
    selected.flatMap((key) => (GENRE_MAP[key] ? [GENRE_MAP[key]!] : [])),
  );
  const tags = unique(selected.flatMap((key) => TAG_MAP[key] ?? []));

  return targets.flatMap<QuerySpec>((target) => {
    const specs: QuerySpec[] = [];
    if (genres.length) {
      specs.push({ target, filters: { genres }, maxPage: 8 });
    }
    if (tags.length) {
      specs.push({ target, filters: { tags }, maxPage: 4 });
    }
    return specs;
  });
}

function profileFor(type: AniListMediaType, mode: DiscoveryMode) {
  return mode === "SURPRISE"
    ? SURPRISE_PROFILES[type]
    : HIDDEN_GEM_PROFILES[type];
}

async function queryAniList(
  spec: QuerySpec,
  mode: DiscoveryMode,
  page: number,
  signal: AbortSignal,
) {
  const profile = profileFor(spec.target.type, mode);
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: {
        page,
        perPage: PAGE_SIZE,
        type: spec.target.type,
        country: spec.target.country,
        genres: spec.filters.genres,
        tags: spec.filters.tags,
        minimumTagRank: spec.filters.tags?.length ? 60 : undefined,
        averageScoreGreater: profile.averageScoreGreater,
        popularityGreater: profile.popularityGreater,
        popularityLesser: profile.popularityLesser,
        sort: ["SCORE_DESC", "POPULARITY"],
      },
    }),
    signal,
  });

  if (response.status === 429) {
    throw new Error(
      "AniList bekommt gerade sehr viele Anfragen. Gönn dem Regal einen kurzen Moment und versuche es gleich noch einmal.",
    );
  }

  if (!response.ok) {
    throw new Error(
      "Die Geschichten konnten gerade nicht aus dem Archiv geladen werden. Bitte prüfe deine Verbindung und versuche es erneut.",
    );
  }

  const payload = (await response.json()) as AniListPayload;
  if (payload.errors?.length) {
    throw new Error(
      "Das Anime-Archiv hat die Geheimtipp-Suche abgelehnt. Bitte ändere deine Auswahl und probiere es erneut.",
    );
  }

  const items = (payload.data?.Page?.media ?? []).filter(
    (item) =>
      Boolean(item.coverImage.extraLarge || item.coverImage.large) &&
      Boolean(item.siteUrl),
  );

  // Sehr schmale Tags (z. B. Murim + nur Manhwa) haben nicht immer genug
  // Seiten für den Zufallssprung. Dann bleibt die Nischenfilterung bestehen,
  // aber wir greifen auf die bestbewertete erste Seite zurück.
  if (!items.length && page > 1) {
    return queryAniList(spec, mode, 1, signal);
  }

  return items;
}

function interleave(groups: Media[][], limit: number) {
  const output: Media[] = [];
  const seen = new Set<string>();
  let index = 0;

  while (output.length < limit && groups.some((group) => index < group.length)) {
    for (const group of groups) {
      const item = group[index];
      if (!item) continue;
      const key = mediaKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        output.push(item);
      }
      if (output.length === limit) break;
    }
    index += 1;
  }

  return output;
}

export function mediaKey(media: Pick<Media, "id" | "type">) {
  return `${media.type}-${media.id}`;
}

export function createDiscoverySeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 4_294_967_295);
}

export function reasonsFor(media: Media, selected: GenreKey[]) {
  return selected.filter((key) => {
    const genre = GENRE_MAP[key];
    const tags = TAG_MAP[key];
    return (
      (genre ? media.genres.includes(genre) : false) ||
      (tags ? media.tags.some((tag) => tags.includes(tag.name)) : false)
    );
  });
}

export async function discoverStories({
  scope,
  selected,
  mode,
  seed,
  batch,
  excludeKeys = new Set<string>(),
  signal,
}: DiscoveryRequest): Promise<DiscoveryBatch> {
  const specs = querySpecsFor(scope, selected, mode);
  const responses = await Promise.all(
    specs.map((spec, index) =>
      queryAniList(
        spec,
        mode,
        pageFor(seed, batch, index, spec.maxPage),
        signal,
      ),
    ),
  );

  const targetGroups = targetsFor(mode === "SURPRISE" ? "ALL" : scope).map(
    (target, targetIndex) => {
      const deduplicated = new Map<string, Media>();

      specs.forEach((spec, specIndex) => {
        if (
          spec.target.type === target.type &&
          spec.target.country === target.country
        ) {
          responses[specIndex].forEach((item) => {
            const key = mediaKey(item);
            if (!excludeKeys.has(key)) deduplicated.set(key, item);
          });
        }
      });

      const candidates = [...deduplicated.values()];
      if (mode === "SURPRISE") {
        return shuffled(candidates, seed + batch * 31 + targetIndex * 997);
      }

      return shuffled(candidates, seed + batch * 31 + targetIndex * 997).sort(
        (a, b) =>
          reasonsFor(b, selected).length - reasonsFor(a, selected).length,
      );
    },
  );

  const candidateCount = targetGroups.reduce(
    (count, group) => count + group.length,
    0,
  );
  const items = interleave(targetGroups, BATCH_SIZE);

  return {
    items,
    candidateCount,
    hasMore: items.length === BATCH_SIZE,
  };
}
