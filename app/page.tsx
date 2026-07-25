"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createDiscoverySeed,
  discoverStories,
  mediaKey,
  reasonsFor,
  type DiscoveryMode,
  type GenreKey,
  type Lang,
  type Media,
  type Scope,
} from "./discovery";
import { genreDisplay, translations, type Translations } from "./i18n";
import { matchWebtoons } from "./webtoons";

const GENRE_ORDER: GenreKey[] = [
  "Action",
  "Adventure",
  "Isekai",
  "Romance",
  "Slice of Life",
  "Fantasy",
  "Mystery",
  "Comedy",
  "Drama",
  "Murim",
  "Psychological",
  "Horror",
  "Thriller",
  "Sci-Fi",
  "Supernatural",
  "Sports",
  "Mecha",
  "Mahou Shoujo",
  "Music",
  "Historical",
  "Military",
  "School",
  "Harem",
  "Vampire",
  "Magic",
  "Super Power",
  "Villainess",
  "Revenge",
  "Post-Apocalyptic",
];

const SEEN_STORAGE_KEY = "mangamori-seen-stories";
const LANG_STORAGE_KEY = "mangamori-lang";

function plainText(value: string | null, t: Translations) {
  if (!value) {
    return t.noSynopsis;
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

function compactNumber(value: number | null, t: Translations) {
  if (!value) return t.niche;
  return new Intl.NumberFormat(t.localeCompact, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatLabel(media: Media, t: Translations) {
  if (media.type === "MANGA") return t.manhwa;
  const formats = t.formats as Record<string, string>;
  return formats[media.format ?? ""] || media.format || t.anime;
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
  lang,
  t,
}: {
  media: Media;
  index: number;
  selected: GenreKey[];
  mode: DiscoveryMode;
  saved: boolean;
  onToggleSave: () => void;
  kickerLabel?: string;
  lang: Lang;
  t: Translations;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const reasons = mode === "HIDDEN" ? reasonsFor(media, selected) : [];
  const title = media.title.english || media.title.romaji || media.title.native;
  const originalTitle = media.title.native || media.title.romaji || title;
  const cover = media.coverImage.extraLarge || media.coverImage.large || "";
  const format = formatLabel(media, t);
  const tags = reasons.length ? reasons : media.genres.slice(0, 2);
  const unit =
    media.type === "MANGA"
      ? media.chapters
        ? t.chaptersLabel(media.chapters)
        : ""
      : media.episodes
        ? t.episodesLabel(media.episodes)
        : "";
  const trailerId = media.trailer?.site === "youtube" ? media.trailer.id : null;
  const hasPreview = Boolean(trailerId || media.bannerImage);

  return (
    <article className="recommendation-frame" style={{ "--order": index } as React.CSSProperties}>
      <div className="recommendation-card">
        <div
          className="cover-wrap"
          onMouseEnter={hasPreview ? () => setShowPreview(true) : undefined}
          onMouseLeave={hasPreview ? () => setShowPreview(false) : undefined}
        >
          {/* AniList liefert die Cover-URL erst zur Laufzeit; das native Bild
              funktioniert identisch im Worker- und im statischen Pages-Build. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={t.coverAlt(title ?? "")}
            width="460"
            height="650"
            loading={index < 4 ? "eager" : "lazy"}
          />
          {showPreview && trailerId ? (
            <iframe
              className="cover-preview"
              src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerId}&modestbranding=1&rel=0&playsinline=1`}
              title={t.trailerTitle(title ?? "")}
              allow="autoplay; encrypted-media"
              loading="lazy"
            />
          ) : showPreview && media.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cover-preview" src={media.bannerImage} alt="" />
          ) : null}
          <div className="cover-shade" />
          <button
            type="button"
            className="fav-button"
            aria-pressed={saved}
            onClick={onToggleSave}
            title={saved ? t.unsave : t.save}
          >
            <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
            <span className="visually-hidden">
              {saved ? t.unsaveAria(title ?? "") : t.saveAria(title ?? "")}
            </span>
          </button>
          {hasPreview ? (
            <button
              type="button"
              className="preview-toggle"
              aria-pressed={showPreview}
              onClick={() => setShowPreview((value) => !value)}
              title={t.previewLabel}
            >
              <span aria-hidden="true">▶</span>
              <span className="visually-hidden">{t.previewLabel}</span>
            </button>
          ) : null}
          <div className="cover-meta">
            <span>{format}</span>
            {media.averageScore ? (
              <span title={t.scoreTitle(media.averageScore)}>
                <span aria-hidden="true">★ </span>
                <span className="visually-hidden">{t.ratingLabel}</span>
                {media.averageScore}/100
              </span>
            ) : null}
          </div>
        </div>

        <div className="card-copy">
          <div className="card-kicker">
            <span>
              {kickerLabel ??
                (mode === "SURPRISE" ? t.kickerSurprise : t.kickerHidden)}
            </span>
            <span>
              {unit ? `${unit} · ` : ""}
              {compactNumber(media.popularity, t)} {t.lists}
            </span>
          </div>

          <h3>{title}</h3>
          <p className="original-title" lang={media.type === "MANGA" ? "ko" : "ja"}>
            {t.original} {originalTitle}
          </p>
          <p className="synopsis">{plainText(media.description, t)}</p>

          <div className="match-row" role="list" aria-label={t.matchAria}>
            {tags.map((reason) => (
              <span role="listitem" key={reason}>
                {genreDisplay(reason, lang)}
              </span>
            ))}
          </div>

          <a href={media.siteUrl} target="_blank" rel="noreferrer">
            {t.viewOnAniList}
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
  const [lang, setLang] = useState<Lang>("de");
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
  const langRef = useRef<Lang>("de");
  const loading = loadingMode !== null;
  const initialLoading =
    loadingMode === "initial" || loadingMode === "surprise";
  const t = translations[lang];

  useEffect(() => {
    langRef.current = lang;
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    const restoreLang = window.setTimeout(() => {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "de" || stored === "en") setLang(stored);
    }, 0);

    return () => window.clearTimeout(restoreLang);
  }, []);

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

  function changeLang(next: Lang) {
    setLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  }

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
    () => selected.map((key) => t.genres[key].label).join(", "),
    [selected, t],
  );

  const webtoonMatches = useMemo(() => matchWebtoons(selected, 6), [selected]);

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
      setFormError(t.formError);
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
      setViewingFavorites(false);

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
        lang: langRef.current,
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
          lang: langRef.current,
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
        setError(append ? t.errNoMore : t.errRare);
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (!append) setResults([]);
      setError(caught instanceof Error ? caught.message : t.errGeneric);
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
        {t.skipLink}
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.brandHome}>
          <span className="brand-mark" aria-hidden="true">
            MM
          </span>
          <span>
            <strong>MangaMori</strong>
            <small lang="ja">物語の森</small>
          </span>
        </a>
        <div className="header-actions">
          <nav aria-label={t.navMain}>
            <a href="#genre-kompass">{t.navCompass}</a>
            <a href="#empfehlungen">{t.navShelf}</a>
            <a href="#webtoon-regal">{t.navWebtoon}</a>
            <a href="#ueber-uns">{t.navAbout}</a>
          </nav>
          <div className="lang-switch" role="group" aria-label={t.langToggleLabel}>
            <button
              type="button"
              className="lang-button"
              aria-pressed={lang === "de"}
              onClick={() => changeLang("de")}
            >
              DE
            </button>
            <button
              type="button"
              className="lang-button"
              aria-pressed={lang === "en"}
              onClick={() => changeLang("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h1 id="hero-title">
              {t.heroTitleLead}
              <span>{t.heroTitleAccent}</span>
            </h1>
            <p className="hero-lede">{t.heroLede}</p>
            <a className="primary-link" href="#genre-kompass">
              {t.heroCta}
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-panels" aria-hidden="true">
            <div className="panel panel-quote">
              <span className="panel-number">01</span>
              <p>{t.panelQuote}</p>
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
            <p className="eyebrow">{t.compassEyebrow}</p>
            <h2>{t.compassTitle}</h2>
            <p>{t.compassIntro}</p>
          </div>

          <form className="compass-frame" onSubmit={handleSubmit}>
            <div className="compass-inner">
              <fieldset className="scope-fieldset">
                <legend>
                  <span>01</span> {t.scopeLegend}
                </legend>
                <div className="scope-switch">
                  <ScopeButton active={scope === "ALL"} onClick={() => setScope("ALL")}>
                    {t.scopeBoth}
                  </ScopeButton>
                  <ScopeButton
                    active={scope === "ANIME"}
                    onClick={() => setScope("ANIME")}
                  >
                    {t.scopeAnime}
                  </ScopeButton>
                  <ScopeButton
                    active={scope === "MANHWA"}
                    onClick={() => setScope("MANHWA")}
                  >
                    {t.scopeManhwa}
                  </ScopeButton>
                </div>
              </fieldset>

              <fieldset className="genre-fieldset">
                <legend>
                  <span>02</span> {t.genreLegend}
                </legend>
                <div className="genre-grid">
                  {GENRE_ORDER.map((key, index) => {
                    const active = selected.includes(key);
                    const genre = t.genres[key];
                    return (
                      <button
                        type="button"
                        className="genre-button"
                        aria-pressed={active}
                        onClick={() => toggleGenre(key)}
                        key={key}
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
                    ? t.selectionSummary(selected.length, selectionSummary)
                    : t.selectionNone}
                </p>
                <div className="action-cluster">
                  <button
                    className="surprise-button"
                    type="button"
                    disabled={loading}
                    onClick={handleSurprise}
                  >
                    <span>
                      {loadingMode === "surprise" ? t.surpriseLoading : t.surprise}
                    </span>
                    <span className="surprise-mark" aria-hidden="true">
                      {loadingMode === "surprise" ? "…" : "?"}
                    </span>
                  </button>
                  <button className="submit-button" type="submit" disabled={loading}>
                    <span>
                      {loadingMode === "initial" ? t.submitLoading : t.submit}
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
                  ? t.resultsEyebrowFav
                  : resultMode === "SURPRISE"
                    ? t.resultsEyebrowSurprise
                    : t.resultsEyebrowHidden}
              </p>
              <h2 id="results-title">
                {viewingFavorites
                  ? favorites.length
                    ? t.favCountTitle(favorites.length)
                    : t.favEmptyHeading
                  : initialLoading
                    ? loadingMode === "surprise"
                      ? t.loadingSurprise
                      : t.loadingHidden
                    : results.length
                      ? resultMode === "SURPRISE"
                        ? t.countSurprise(results.length)
                        : t.countHidden(results.length)
                      : t.readyTitle}
              </h2>
              <div className="view-switch" role="group" aria-label={t.viewSwitchAria}>
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={!viewingFavorites}
                  onClick={() => setViewingFavorites(false)}
                >
                  {t.viewRecommend}
                </button>
                <button
                  type="button"
                  className="view-button"
                  aria-pressed={viewingFavorites}
                  onClick={() => setViewingFavorites(true)}
                >
                  {t.viewShelf}
                  {favorites.length ? ` (${favorites.length})` : ""}
                </button>
              </div>
            </div>
            <p className="api-note">
              {t.apiNote}
              <span>
                {resultMode === "SURPRISE"
                  ? t.apiDetailSurprise
                  : t.apiDetailHidden}
              </span>
            </p>
          </div>

          <div className="results-status" aria-live="polite" aria-atomic="true">
            {initialLoading ? t.statusLoading : null}
            {loadingMode === "more" ? t.statusMore : null}
            {!loading && !viewingFavorites && results.length
              ? t.statusLoaded(results.length)
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
                    kickerLabel={t.kickerSaved}
                    saved
                    onToggleSave={() => toggleFavorite(media)}
                    lang={lang}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-shelf">
                <span className="empty-number" aria-hidden="true">
                  ♡
                </span>
                <div>
                  <p className="eyebrow">{t.favEmptyEyebrow}</p>
                  <h3>{t.favEmptyHeading}</h3>
                  <p>{t.favEmptyText}</p>
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
                    <h3>{t.errorHeading}</h3>
                    <p>{error}</p>
                    <a href="#genre-kompass">{t.errorAdjust}</a>
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
                        lang={lang}
                        t={t}
                      />
                    ))}
                  </div>

                  <div className="results-actions">
                    <div>
                      <p className="eyebrow">{t.moreEyebrow}</p>
                      <p>{t.moreText(results.length)}</p>
                      <button
                        type="button"
                        className="reset-seen"
                        onClick={resetSeen}
                      >
                        {seenReset ? t.resetSeenDone : t.resetSeen}
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
                          ? t.loadMoreOpening
                          : hasMore
                            ? t.loadMore
                            : t.shelfExhausted}
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
                    <p className="eyebrow">{t.emptyEyebrow}</p>
                    <h3>{t.emptyTitle}</h3>
                    <p>{t.emptyText}</p>
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

        {scope !== "ANIME" ? (
          <section
            className="webtoon-section"
            id="webtoon-regal"
            aria-labelledby="webtoon-title"
          >
            <div className="section-heading">
              <p className="eyebrow">{t.webtoonEyebrow}</p>
              <h2 id="webtoon-title">{t.webtoonTitle}</h2>
              <p>{t.webtoonIntro}</p>
            </div>
            <div className="results-grid">
              {webtoonMatches.map((webtoon, index) => (
                <RecommendationCard
                  key={mediaKey(webtoon)}
                  media={webtoon}
                  index={index}
                  selected={resultGenres}
                  mode="SURPRISE"
                  kickerLabel={t.webtoonKicker}
                  saved={favoriteKeys.has(mediaKey(webtoon))}
                  onToggleSave={() => toggleFavorite(webtoon)}
                  lang={lang}
                  t={t}
                />
              ))}
            </div>
            <p className="webtoon-note">{t.webtoonSource}</p>
          </section>
        ) : null}

        <section className="about-section" id="ueber-uns">
          <div className="about-index">{t.aboutId}</div>
          <div className="about-copy">
            <p className="eyebrow">{t.aboutEyebrow}</p>
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutText}</p>
          </div>
          <blockquote>
            <p>{t.aboutQuote}</p>
            <footer>{t.aboutQuoteFooter}</footer>
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
            <small>{t.footerTagline}</small>
          </span>
        </a>
        <p>{t.footerNote}</p>
        <a href="#top">{t.backToTop}</a>
      </footer>
    </>
  );
}
