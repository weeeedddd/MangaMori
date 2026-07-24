"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Scope = "ALL" | "ANIME" | "MANHWA";
type AniListMediaType = "ANIME" | "MANGA";
type GenreKey =
  | "Action"
  | "Adventure"
  | "Isekai"
  | "Romance"
  | "Slice of Life"
  | "Fantasy"
  | "Mystery"
  | "Comedy"
  | "Drama"
  | "Murim";

type Media = {
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

const GENRES: Array<{
  key: GenreKey;
  label: string;
  hint: string;
}> = [
  { key: "Action", label: "Action", hint: "Tempo & Kämpfe" },
  { key: "Adventure", label: "Abenteuer", hint: "Ferne Welten" },
  { key: "Isekai", label: "Isekai", hint: "Neu geboren" },
  { key: "Romance", label: "Romance", hint: "Herzklopfen" },
  { key: "Slice of Life", label: "Slice of Life", hint: "Leise Momente" },
  { key: "Fantasy", label: "Fantasy", hint: "Magie & Mythen" },
  { key: "Mystery", label: "Mystery", hint: "Rätsel & Schatten" },
  { key: "Comedy", label: "Comedy", hint: "Leicht & witzig" },
  { key: "Drama", label: "Drama", hint: "Große Gefühle" },
  { key: "Murim", label: "Murim", hint: "Clans & Kultivierung" },
];

const GENRE_MAP: Partial<Record<GenreKey, string>> = {
  Action: "Action",
  Adventure: "Adventure",
  Romance: "Romance",
  "Slice of Life": "Slice of Life",
  Fantasy: "Fantasy",
  Mystery: "Mystery",
  Comedy: "Comedy",
  Drama: "Drama",
};

const TAG_MAP: Partial<Record<GenreKey, string[]>> = {
  Isekai: ["Isekai", "Reincarnation"],
  Murim: ["Cultivation", "Martial Arts", "Wuxia"],
};

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV-Serie",
  TV_SHORT: "Kurzserie",
  MOVIE: "Film",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Musik",
  MANGA: "Manhwa",
  NOVEL: "Novel",
  ONE_SHOT: "One Shot",
};

const ANILIST_QUERY = `
  query DiscoverStories(
    $page: Int
    $type: MediaType
    $country: CountryCode
    $genres: [String]
    $tags: [String]
  ) {
    Page(page: $page, perPage: 18) {
      media(
        type: $type
        countryOfOrigin: $country
        isAdult: false
        genre_in: $genres
        tag_in: $tags
        sort: [POPULARITY_DESC, SCORE_DESC]
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

function plainText(value: string | null) {
  if (!value) {
    return "Für diesen Titel ist derzeit noch keine Kurzbeschreibung verfügbar.";
  }

  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function targetsFor(scope: Scope): QueryTarget[] {
  if (scope === "ANIME") return [{ type: "ANIME" }];
  if (scope === "MANHWA") return [{ type: "MANGA", country: "KR" }];
  return [{ type: "ANIME" }, { type: "MANGA", country: "KR" }];
}

function reasonsFor(media: Media, selected: GenreKey[]) {
  return selected.filter((key) => {
    const genre = GENRE_MAP[key];
    const tags = TAG_MAP[key];
    return (
      (genre ? media.genres.includes(genre) : false) ||
      (tags ? media.tags.some((tag) => tags.includes(tag.name)) : false)
    );
  });
}

function rankMedia(media: Media[], selected: GenreKey[]) {
  return [...media].sort((a, b) => {
    const aMatches = reasonsFor(a, selected).length;
    const bMatches = reasonsFor(b, selected).length;
    const aQuality = (a.averageScore ?? 0) + Math.log10(a.popularity ?? 1) * 3;
    const bQuality = (b.averageScore ?? 0) + Math.log10(b.popularity ?? 1) * 3;
    return bMatches - aMatches || bQuality - aQuality;
  });
}

function interleave(groups: Media[][], limit: number) {
  const output: Media[] = [];
  const seen = new Set<string>();
  let index = 0;

  while (output.length < limit && groups.some((group) => index < group.length)) {
    for (const group of groups) {
      const item = group[index];
      if (!item) continue;
      const key = `${item.type}-${item.id}`;
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

async function queryAniList(
  target: QueryTarget,
  filters: { genres?: string[]; tags?: string[] },
  signal: AbortSignal,
) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ANILIST_QUERY,
      variables: {
        page: 1,
        type: target.type,
        country: target.country,
        genres: filters.genres,
        tags: filters.tags,
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

  const payload = (await response.json()) as {
    data?: { Page?: { media?: Media[] } };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(
      "Das Anime-Archiv hat die Suche abgelehnt. Bitte ändere deine Auswahl und probiere es erneut.",
    );
  }

  return (payload.data?.Page?.media ?? []).filter(
    (item) =>
      Boolean(item.coverImage.extraLarge || item.coverImage.large) &&
      Boolean(item.siteUrl),
  );
}

async function discover(
  scope: Scope,
  selected: GenreKey[],
  signal: AbortSignal,
) {
  const genres = unique(
    selected.flatMap((key) => (GENRE_MAP[key] ? [GENRE_MAP[key]!] : [])),
  );
  const tags = unique(selected.flatMap((key) => TAG_MAP[key] ?? []));
  const targets = targetsFor(scope);

  const groups = await Promise.all(
    targets.map(async (target) => {
      const requests: Array<Promise<Media[]>> = [];
      if (genres.length) {
        requests.push(queryAniList(target, { genres }, signal));
      }
      if (tags.length) {
        requests.push(queryAniList(target, { tags }, signal));
      }

      const batches = await Promise.all(requests);
      const deduplicated = new Map<string, Media>();
      batches.flat().forEach((item) => {
        deduplicated.set(`${item.type}-${item.id}`, item);
      });

      return rankMedia([...deduplicated.values()], selected);
    }),
  );

  return interleave(groups, 12);
}

function ScopeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="scope-button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span aria-hidden="true" className="scope-mark" />
      {children}
    </button>
  );
}

function RecommendationCard({
  media,
  index,
  selected,
}: {
  media: Media;
  index: number;
  selected: GenreKey[];
}) {
  const reasons = reasonsFor(media, selected);
  const title = media.title.english || media.title.romaji || media.title.native;
  const originalTitle = media.title.native || media.title.romaji || title;
  const cover = media.coverImage.extraLarge || media.coverImage.large || "";
  const format =
    media.type === "MANGA"
      ? "Manhwa"
      : FORMAT_LABELS[media.format ?? ""] || media.format || "Anime";

  return (
    <article className="recommendation-frame" style={{ "--order": index } as React.CSSProperties}>
      <div className="recommendation-card">
        <div className="cover-wrap">
          <img
            src={cover}
            alt={`Cover von ${title}`}
            width="460"
            height="650"
            loading={index < 4 ? "eager" : "lazy"}
          />
          <div className="cover-shade" />
          <div className="cover-meta">
            <span>{format}</span>
            {media.averageScore ? (
              <span>
                <span className="visually-hidden">Bewertung </span>
                {media.averageScore}/100
              </span>
            ) : null}
          </div>
        </div>

        <div className="card-copy">
          <div className="card-kicker">
            <span>Kapitel {String(index + 1).padStart(2, "0")}</span>
            {media.seasonYear ? <span>{media.seasonYear}</span> : null}
          </div>

          <h3>{title}</h3>
          <p className="original-title" lang={media.type === "MANGA" ? "ko" : "ja"}>
            Original: {originalTitle}
          </p>
          <p className="synopsis">{plainText(media.description)}</p>

          <div className="match-row" role="list" aria-label="Passende Vorlieben">
            {(reasons.length ? reasons : media.genres.slice(0, 2)).map((reason) => (
              <span role="listitem" key={reason}>
                {reason === "Adventure" ? "Abenteuer" : reason}
              </span>
            ))}
          </div>

          <a href={media.siteUrl} target="_blank" rel="noreferrer">
            Auf AniList ansehen
            <span className="link-mark" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}

function LoadingShelf() {
  return (
    <div className="results-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="skeleton-frame" key={index}>
          <div className="skeleton-cover" />
          <div className="skeleton-copy">
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [scope, setScope] = useState<Scope>("ALL");
  const [selected, setSelected] = useState<GenreKey[]>(["Fantasy", "Romance"]);
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("mangamori-preferences");
    if (!saved) return;

    try {
      const preferences = JSON.parse(saved) as {
        scope?: Scope;
        genres?: GenreKey[];
      };
      if (preferences.scope) setScope(preferences.scope);
      if (preferences.genres?.length) setSelected(preferences.genres);
    } catch {
      window.localStorage.removeItem("mangamori-preferences");
    }
  }, []);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const selectionSummary = useMemo(
    () =>
      selected
        .map((key) => GENRES.find((genre) => genre.key === key)?.label ?? key)
        .join(", "),
    [selected],
  );

  function toggleGenre(key: GenreKey) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) {
      setError("Wähle mindestens eine Stimmung, damit wir dein Regal füllen können.");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    window.localStorage.setItem(
      "mangamori-preferences",
      JSON.stringify({ scope, genres: selected }),
    );

    try {
      const stories = await discover(scope, selected, controller.signal);
      setResults(stories);
      if (!stories.length) {
        setError(
          "Diese Mischung ist selten. Nimm eine Stimmung heraus oder öffne die Suche für Anime und Manhwa.",
        );
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setResults([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Beim Öffnen des Archivs ist etwas schiefgegangen.",
      );
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
      }
    }
  }

  return (
    <>
      <a className="skip-link" href="#genre-kompass">
        Direkt zum Genre-Kompass
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="MangaMori Startseite">
          <span className="brand-mark" aria-hidden="true">
            MM
          </span>
          <span>
            <strong>MangaMori</strong>
            <small lang="ja">物語の森</small>
          </span>
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="#genre-kompass">Kompass</a>
          <a href="#empfehlungen">Dein Regal</a>
          <a href="#ueber-uns">Über MangaMori</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Anime & Manhwa · persönlich entdeckt</p>
            <h1 id="hero-title">
              Dein nächstes
              <span>Kapitel wartet.</span>
            </h1>
            <p className="hero-lede">
              Sag uns, welche Welten dich fesseln. MangaMori öffnet dir ein
              handverlesenes Regal mit echten Covern, Originaltiteln und
              Geschichten, die zu deiner Stimmung passen.
            </p>
            <a className="primary-link" href="#genre-kompass">
              Genre-Kompass öffnen
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-panels" aria-hidden="true">
            <div className="panel panel-quote">
              <span className="panel-number">01</span>
              <p>Manche Geschichten finden uns genau im richtigen Moment.</p>
              <span className="brush-line" />
            </div>
            <div className="panel panel-japanese" lang="ja">
              <span>次</span>
              <span>の</span>
              <span>物</span>
              <span>語</span>
            </div>
            <div className="ink-stamp">
              <span>FIND</span>
              <span>YOUR STORY</span>
            </div>
          </div>

          <div className="petal petal-one" aria-hidden="true" />
          <div className="petal petal-two" aria-hidden="true" />
          <div className="petal petal-three" aria-hidden="true" />
        </section>

        <section className="compass-section" id="genre-kompass">
          <div className="section-heading">
            <p className="eyebrow">Dein Genre-Kompass</p>
            <h2>Welche Geschichte ruft nach dir?</h2>
            <p>
              Wähle mehrere Stimmungen. Je klarer dein Geschmack, desto besser
              passt dein persönliches Regal.
            </p>
          </div>

          <form className="compass-frame" onSubmit={handleSubmit}>
            <div className="compass-inner">
              <fieldset className="scope-fieldset">
                <legend>
                  <span>01</span> Wo möchtest du lesen oder schauen?
                </legend>
                <div className="scope-switch">
                  <ScopeButton active={scope === "ALL"} onClick={() => setScope("ALL")}>
                    Beides
                  </ScopeButton>
                  <ScopeButton
                    active={scope === "ANIME"}
                    onClick={() => setScope("ANIME")}
                  >
                    Anime
                  </ScopeButton>
                  <ScopeButton
                    active={scope === "MANHWA"}
                    onClick={() => setScope("MANHWA")}
                  >
                    Manhwa
                  </ScopeButton>
                </div>
              </fieldset>

              <fieldset className="genre-fieldset">
                <legend>
                  <span>02</span> Was darf nicht fehlen?
                </legend>
                <div className="genre-grid">
                  {GENRES.map((genre, index) => {
                    const active = selected.includes(genre.key);
                    return (
                      <button
                        type="button"
                        className="genre-button"
                        aria-pressed={active}
                        onClick={() => toggleGenre(genre.key)}
                        key={genre.key}
                      >
                        <span className="genre-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="genre-label">{genre.label}</span>
                        <span className="genre-hint">{genre.hint}</span>
                        <span className="genre-check" aria-hidden="true">
                          {active ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="form-footer">
                <p>
                  {selected.length
                    ? `${selected.length} ${
                        selected.length === 1 ? "Stimmung" : "Stimmungen"
                      } gewählt: ${selectionSummary}`
                    : "Noch keine Stimmung ausgewählt"}
                </p>
                <button className="submit-button" type="submit" disabled={loading}>
                  <span>
                    {loading ? "Regal wird kuratiert …" : "Mein Regal kuratieren"}
                  </span>
                  <span className="button-mark" aria-hidden="true">
                    {loading ? "…" : "→"}
                  </span>
                </button>
              </div>

              {error && !hasSearched ? (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="results-section" id="empfehlungen" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Dein persönliches Regal</p>
              <h2 id="results-title">
                {loading
                  ? "Wir blättern für dich …"
                  : results.length
                    ? `${results.length} Geschichten für dich`
                    : "Bereit für deine Auswahl"}
              </h2>
            </div>
            <p className="api-note">
              Live-Daten & echte Cover
              <span>über AniList</span>
            </p>
          </div>

          <div className="results-status" aria-live="polite" aria-atomic="true">
            {loading ? "Empfehlungen werden geladen." : null}
            {!loading && results.length
              ? `${results.length} Empfehlungen wurden geladen.`
              : null}
          </div>

          {loading ? <LoadingShelf /> : null}

          {!loading && error && hasSearched ? (
            <div className="error-panel" role="alert">
              <span className="error-number">!</span>
              <div>
                <h3>Das Regal klemmt gerade</h3>
                <p>{error}</p>
                <a href="#genre-kompass">Auswahl anpassen</a>
              </div>
            </div>
          ) : null}

          {!loading && !error && results.length ? (
            <div className="results-grid">
              {results.map((media, index) => (
                <RecommendationCard
                  key={`${media.type}-${media.id}`}
                  media={media}
                  index={index}
                  selected={selected}
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && !results.length ? (
            <div className="empty-shelf">
              <span className="empty-number">00</span>
              <div>
                <p className="eyebrow">Noch unbeschrieben</p>
                <h3>Dein Regal wartet auf eine Richtung.</h3>
                <p>
                  Wähle oben deine Lieblingsgenres und öffne das Archiv. Deine
                  Empfehlungen erscheinen hier als persönliche Manga-Panels.
                </p>
              </div>
              <div className="empty-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
        </section>

        <section className="about-section" id="ueber-uns">
          <div className="about-index">余白</div>
          <div className="about-copy">
            <p className="eyebrow">Warum MangaMori?</p>
            <h2>Weniger scrollen. Mehr fühlen.</h2>
            <p>
              Keine erfundenen Titel, keine Platzhalter-Cover: MangaMori liest
              deine Genre-Auswahl, durchsucht AniList und ordnet echte Anime und
              koreanische Manhwa nach Passung und Beliebtheit.
            </p>
          </div>
          <blockquote>
            <p>„Die beste Empfehlung fühlt sich nicht wie ein Treffer an, sondern wie eine Einladung.“</p>
            <footer>— Das Prinzip hinter deinem Regal</footer>
          </blockquote>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            MM
          </span>
          <span>
            <strong>MangaMori</strong>
            <small>Dein nächstes Kapitel.</small>
          </span>
        </a>
        <p>
          Datenquelle: AniList. MangaMori ist ein unabhängiges
          Empfehlungsprojekt.
        </p>
        <a href="#top">Zurück nach oben ↑</a>
      </footer>
    </>
  );
}
