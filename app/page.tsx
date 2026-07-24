"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createDiscoverySeed,
  discoverStories,
  mediaKey,
  reasonsFor,
  type DiscoveryMode,
  type GenreKey,
  type Media,
  type Scope,
} from "./discovery";

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
  { key: "Psychological", label: "Psychological", hint: "Abgründe im Kopf" },
  { key: "Horror", label: "Horror", hint: "Grusel & Angst" },
  { key: "Thriller", label: "Thriller", hint: "Nervenkitzel" },
  { key: "Sci-Fi", label: "Sci-Fi", hint: "Zukunft & Technik" },
  { key: "Supernatural", label: "Übernatürlich", hint: "Geister & Kräfte" },
  { key: "Sports", label: "Sport", hint: "Ehrgeiz & Team" },
  { key: "Mecha", label: "Mecha", hint: "Roboter & Stahl" },
];

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

const SEEN_STORAGE_KEY = "mangamori-seen-stories";

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

function readSeenKeys() {
  try {
    const stored = window.localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((key): key is string => typeof key === "string")
        : [],
    );
  } catch {
    window.localStorage.removeItem(SEEN_STORAGE_KEY);
    return new Set<string>();
  }
}

function rememberStories(stories: Media[]) {
  const keys = [...readSeenKeys(), ...stories.map(mediaKey)];
  window.localStorage.setItem(
    SEEN_STORAGE_KEY,
    JSON.stringify([...new Set(keys)].slice(-600)),
  );
}

function compactNumber(value: number | null) {
  if (!value) return "Nische";
  return new Intl.NumberFormat("de-DE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
  mode,
  saved,
  onToggleSave,
  kickerLabel,
}: {
  media: Media;
  index: number;
  selected: GenreKey[];
  mode: DiscoveryMode;
  saved: boolean;
  onToggleSave: () => void;
  kickerLabel?: string;
}) {
  const reasons = mode === "HIDDEN" ? reasonsFor(media, selected) : [];
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
          {/* AniList liefert die Cover-URL erst zur Laufzeit; das native Bild
              funktioniert identisch im Worker- und im statischen Pages-Build. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={`Cover von ${title}`}
            width="460"
            height="650"
            loading={index < 4 ? "eager" : "lazy"}
          />
          <div className="cover-shade" />
          <button
            type="button"
            className="fav-button"
            aria-pressed={saved}
            onClick={onToggleSave}
            title={saved ? "Aus Merkliste entfernen" : "Merken"}
          >
            <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
            <span className="visually-hidden">
              {saved ? `${title} aus Merkliste entfernen` : `${title} merken`}
            </span>
          </button>
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
            <span>
              {kickerLabel ?? (mode === "SURPRISE" ? "Zufallsfund" : "Geheimtipp")}{" "}
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{compactNumber(media.popularity)} Listen</span>
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
  const [resultGenres, setResultGenres] = useState<GenreKey[]>([]);
  const [resultMode, setResultMode] = useState<DiscoveryMode>("HIDDEN");
  const [loadingMode, setLoadingMode] = useState<
    "initial" | "more" | "surprise" | null
  >(null);
  const [hasMore, setHasMore] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<Media[]>([]);
  const [viewingFavorites, setViewingFavorites] = useState(false);
  const [seenReset, setSeenReset] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const seedRef = useRef(0);
  const batchRef = useRef(0);
  const activeScopeRef = useRef<Scope>("ALL");
  const activeSelectionRef = useRef<GenreKey[]>([]);
  const loading = loadingMode !== null;
  const initialLoading =
    loadingMode === "initial" || loadingMode === "surprise";

  useEffect(() => {
    const restorePreferences = window.setTimeout(() => {
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
    }, 0);

    return () => window.clearTimeout(restorePreferences);
  }, []);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const restoreFavorites = window.setTimeout(() => {
      const saved = window.localStorage.getItem("mangamori-favorites");
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) setFavorites(parsed as Media[]);
      } catch {
        window.localStorage.removeItem("mangamori-favorites");
      }
    }, 0);

    return () => window.clearTimeout(restoreFavorites);
  }, []);

  const favoriteKeys = useMemo(
    () => new Set(favorites.map(mediaKey)),
    [favorites],
  );

  function toggleFavorite(media: Media) {
    setFavorites((current) => {
      const key = mediaKey(media);
      const next = current.some((item) => mediaKey(item) === key)
        ? current.filter((item) => mediaKey(item) !== key)
        : [media, ...current];
      const trimmed = next.slice(0, 300);
      window.localStorage.setItem(
        "mangamori-favorites",
        JSON.stringify(trimmed),
      );
      return trimmed;
    });
  }

  function resetSeen() {
    window.localStorage.removeItem(SEEN_STORAGE_KEY);
    setSeenReset(true);
    window.setTimeout(() => setSeenReset(false), 4000);
  }

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
    setFormError(null);
    setError(null);
  }

  async function runDiscovery(mode: DiscoveryMode, append: boolean) {
    const discoveryScope = append
      ? activeScopeRef.current
      : mode === "SURPRISE"
        ? "ALL"
        : scope;
    const discoveryGenres = append
      ? activeSelectionRef.current
      : mode === "SURPRISE"
        ? []
        : selected;

    if (mode === "HIDDEN" && !discoveryGenres.length) {
      setFormError(
        "Wähle mindestens eine Stimmung, damit wir dein Regal füllen können.",
      );
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoadingMode(append ? "more" : mode === "SURPRISE" ? "surprise" : "initial");
    setFormError(null);
    setError(null);
    setHasSearched(true);

    if (!append) {
      seedRef.current = createDiscoverySeed();
      batchRef.current = 0;
      activeScopeRef.current = discoveryScope;
      activeSelectionRef.current = discoveryGenres;
      setResultMode(mode);
      setResultGenres(discoveryGenres);
      setResults([]);
      setHasMore(false);

      if (mode === "HIDDEN") {
        window.localStorage.setItem(
          "mangamori-preferences",
          JSON.stringify({ scope, genres: selected }),
        );
      }
    } else {
      batchRef.current += 1;
    }

    const visibleKeys = new Set(results.map(mediaKey));
    const previouslySeen = readSeenKeys();
    const excludedKeys = new Set([
      ...previouslySeen,
      ...(append ? visibleKeys : []),
    ]);

    try {
      let batch = await discoverStories({
        scope: discoveryScope,
        selected: discoveryGenres,
        mode,
        seed: seedRef.current,
        batch: batchRef.current,
        excludeKeys: excludedKeys,
        signal: controller.signal,
      });

      // Falls ein Stammgast bereits sehr viele Titel gesehen hat, öffnen wir
      // bei einer neuen Suche dasselbe Archiv noch einmal ohne den Merkzettel.
      if (!append && !batch.items.length && previouslySeen.size) {
        batch = await discoverStories({
          scope: discoveryScope,
          selected: discoveryGenres,
          mode,
          seed: seedRef.current,
          batch: batchRef.current,
          signal: controller.signal,
        });
      }

      if (append) {
        setResults((current) => {
          const combined = new Map(current.map((item) => [mediaKey(item), item]));
          batch.items.forEach((item) => combined.set(mediaKey(item), item));
          return [...combined.values()];
        });
      } else {
        setResults(batch.items);
      }

      rememberStories(batch.items);
      setHasMore(batch.hasMore && batch.items.length > 0);

      if (!batch.items.length) {
        setError(
          append
            ? "Für diese Richtung haben wir gerade keine weiteren unbekannten Titel gefunden."
            : "Diese Mischung ist selten. Nimm eine Stimmung heraus oder öffne die Suche für Anime und Manhwa.",
        );
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (!append) setResults([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Beim Öffnen des Archivs ist etwas schiefgegangen.",
      );
    } finally {
      if (controllerRef.current === controller) {
        setLoadingMode(null);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runDiscovery("HIDDEN", false);
  }

  async function handleSurprise() {
    await runDiscovery("SURPRISE", false);
  }

  async function handleLoadMore() {
    await runDiscovery(resultMode, true);
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
              Geheimtipps jenseits der üblichen Bestseller.
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
                <div className="action-cluster">
                  <button
                    className="surprise-button"
                    type="button"
                    disabled={loading}
                    onClick={handleSurprise}
                  >
                    <span>
                      {loadingMode === "surprise"
                        ? "Wir würfeln …"
                        : "Überrasch mich"}
                    </span>
                    <span className="surprise-mark" aria-hidden="true">
                      {loadingMode === "surprise" ? "…" : "?"}
                    </span>
                  </button>
                  <button className="submit-button" type="submit" disabled={loading}>
                    <span>
                      {loadingMode === "initial"
                        ? "Geheimtipps werden gesucht …"
                        : "Geheimtipps finden"}
                    </span>
                    <span className="button-mark" aria-hidden="true">
                      {loadingMode === "initial" ? "…" : "→"}
                    </span>
                  </button>
                </div>
              </div>

              {formError ? (
                <p className="inline-error" role="alert">
                  {formError}
                </p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="results-section" id="empfehlungen" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow">
                {viewingFavorites
                  ? "Deine Merkliste · lokal gespeichert"
                  : resultMode === "SURPRISE"
                    ? "Dein persönliches Regal · außerhalb deiner Bubble"
                    : "Dein persönliches Regal · Geheimtipps"}
              </p>
              <h2 id="results-title">
                {viewingFavorites
                  ? favorites.length
                    ? `${favorites.length} Titel gemerkt`
                    : "Deine Merkliste"
                  : initialLoading
                    ? loadingMode === "surprise"
                      ? "Wir würfeln neue Welten …"
                      : "Wir blättern abseits der Bestseller …"
                    : results.length
                      ? `${results.length} ${
                          resultMode === "SURPRISE" ? "Zufallsfunde" : "Geheimtipps"
                        }`
                      : "Bereit für deine Auswahl"}
              </h2>
              <div className="view-switch" role="group" aria-label="Ansicht wechseln">
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={!viewingFavorites}
                  onClick={() => setViewingFavorites(false)}
                >
                  Empfehlungen
                </button>
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={viewingFavorites}
                  onClick={() => setViewingFavorites(true)}
                >
                  Merkliste{favorites.length ? ` (${favorites.length})` : ""}
                </button>
              </div>
            </div>
            <p className="api-note">
              Live-Daten & echte Cover
              <span>
              {resultMode === "SURPRISE"
                ? "73+ Punkte · genre-frei · zufällige AniList-Seiten"
                : "69+ Punkte · Mainstream gefiltert · zufällige AniList-Seiten"}
              </span>
            </p>
          </div>

          <div className="results-status" aria-live="polite" aria-atomic="true">
            {initialLoading ? "Neue Empfehlungen werden geladen." : null}
            {loadingMode === "more" ? "Weitere Empfehlungen werden geladen." : null}
            {!loading && !viewingFavorites && results.length
              ? `${results.length} Empfehlungen wurden geladen.`
              : null}
          </div>

          {viewingFavorites ? (
            favorites.length ? (
              <div className="results-grid">
                {favorites.map((media, index) => (
                  <RecommendationCard
                    key={mediaKey(media)}
                    media={media}
                    index={index}
                    selected={resultGenres}
                    mode="SURPRISE"
                    kickerLabel="Gemerkt"
                    saved
                    onToggleSave={() => toggleFavorite(media)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-shelf">
                <span className="empty-number" aria-hidden="true">
                  ♡
                </span>
                <div>
                  <p className="eyebrow">Merkliste ist leer</p>
                  <h3>Noch nichts gemerkt.</h3>
                  <p>
                    Tippe bei einer Empfehlung auf das Herz, um sie hier zu
                    sammeln. Deine Merkliste bleibt in diesem Browser
                    gespeichert – auch nach dem Neuladen.
                  </p>
                </div>
                <div className="empty-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )
          ) : (
            <>
              {initialLoading ? <LoadingShelf /> : null}

              {!initialLoading && error && hasSearched && !results.length ? (
                <div className="error-panel" role="alert">
                  <span className="error-number">!</span>
                  <div>
                    <h3>Das Regal klemmt gerade</h3>
                    <p>{error}</p>
                    <a href="#genre-kompass">Auswahl anpassen</a>
                  </div>
                </div>
              ) : null}

              {!initialLoading && results.length ? (
                <>
                  <div className="results-grid">
                    {results.map((media, index) => (
                      <RecommendationCard
                        key={mediaKey(media)}
                        media={media}
                        index={index}
                        selected={resultGenres}
                        mode={resultMode}
                        saved={favoriteKeys.has(mediaKey(media))}
                        onToggleSave={() => toggleFavorite(media)}
                      />
                    ))}
                  </div>

                  <div className="results-actions">
                    <div>
                      <p className="eyebrow">Noch ein Kapitel?</p>
                      <p>
                        Bereits {results.length} einzigartige Titel im Regal. Wir
                        merken uns, was du schon gesehen hast.
                      </p>
                      <button
                        type="button"
                        className="reset-seen"
                        onClick={resetSeen}
                      >
                        {seenReset
                          ? "✓ Merkzettel geleert"
                          : "Gesehene Titel zurücksetzen"}
                      </button>
                    </div>
                    <button
                      className="load-more-button"
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loading || !hasMore}
                    >
                      <span>
                        {loadingMode === "more"
                          ? "Weitere Seiten öffnen …"
                          : hasMore
                            ? "Mehr laden"
                            : "Regal ausgeschöpft"}
                      </span>
                      <span className="button-mark" aria-hidden="true">
                        {loadingMode === "more" ? "…" : "↓"}
                      </span>
                    </button>
                  </div>

                  {error ? (
                    <p className="load-more-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                </>
              ) : null}

              {!loading && !error && !results.length ? (
                <div className="empty-shelf">
                  <span className="empty-number">00</span>
                  <div>
                    <p className="eyebrow">Noch unbeschrieben</p>
                    <h3>Dein Regal wartet auf eine Richtung.</h3>
                    <p>
                      Wähle oben deine Lieblingsgenres und öffne das Archiv.
                      Deine unbekannteren Empfehlungen erscheinen hier als
                      persönliche Manga-Panels – oder lass dich direkt
                      überraschen.
                    </p>
                  </div>
                  <div className="empty-lines" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="about-section" id="ueber-uns">
          <div className="about-index">余白</div>
          <div className="about-copy">
            <p className="eyebrow">Warum MangaMori?</p>
            <h2>Weniger scrollen. Mehr fühlen.</h2>
            <p>
              Keine erfundenen Titel, keine Platzhalter-Cover: MangaMori liest
              deine Genre-Auswahl, filtert Mainstream aus AniList, prüft eine
              Mindestbewertung und öffnet zufällige Archivseiten voller echter
              Anime und koreanischer Manhwa.
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
