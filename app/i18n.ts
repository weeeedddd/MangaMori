import type { GenreKey, Lang } from "./discovery";

export type { Lang };

export const LANGS: Lang[] = ["de", "en"];

type FormatKey =
  | "TV"
  | "TV_SHORT"
  | "MOVIE"
  | "SPECIAL"
  | "OVA"
  | "ONA"
  | "MUSIC"
  | "MANGA"
  | "NOVEL"
  | "ONE_SHOT";

export type Translations = {
  htmlLang: string;
  localeCompact: string;
  langToggleLabel: string;
  langName: string;

  skipLink: string;
  brandHome: string;
  navMain: string;
  navCompass: string;
  navShelf: string;
  navAbout: string;

  viewSwitchAria: string;
  matchAria: string;
  coverAlt: (title: string) => string;

  heroEyebrow: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroLede: string;
  heroCta: string;
  panelQuote: string;

  compassEyebrow: string;
  compassTitle: string;
  compassIntro: string;
  scopeLegend: string;
  scopeBoth: string;
  scopeAnime: string;
  scopeManhwa: string;
  genreLegend: string;
  selectionNone: string;
  selectionSummary: (count: number, list: string) => string;
  surprise: string;
  surpriseLoading: string;
  submit: string;
  submitLoading: string;
  formError: string;

  resultsEyebrowFav: string;
  resultsEyebrowSurprise: string;
  resultsEyebrowHidden: string;
  favCountTitle: (count: number) => string;
  favEmptyHeading: string;
  loadingSurprise: string;
  loadingHidden: string;
  countSurprise: (count: number) => string;
  countHidden: (count: number) => string;
  readyTitle: string;
  viewRecommend: string;
  viewShelf: string;
  apiNote: string;
  apiDetailSurprise: string;
  apiDetailHidden: string;

  statusLoading: string;
  statusMore: string;
  statusLoaded: (count: number) => string;

  favEmptyEyebrow: string;
  favEmptyText: string;
  errorHeading: string;
  errorAdjust: string;
  moreEyebrow: string;
  moreText: (count: number) => string;
  resetSeen: string;
  resetSeenDone: string;
  loadMoreOpening: string;
  loadMore: string;
  shelfExhausted: string;
  emptyEyebrow: string;
  emptyTitle: string;
  emptyText: string;
  errNoMore: string;
  errRare: string;
  errGeneric: string;

  kickerSurprise: string;
  kickerHidden: string;
  kickerSaved: string;
  lists: string;
  niche: string;
  episodesLabel: (count: number) => string;
  chaptersLabel: (count: number) => string;
  scoreTitle: (score: number) => string;
  previewLabel: string;
  trailerTitle: (title: string) => string;
  original: string;
  noSynopsis: string;
  save: string;
  unsave: string;
  saveAria: (title: string) => string;
  unsaveAria: (title: string) => string;
  ratingLabel: string;
  viewOnAniList: string;

  aboutId: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutText: string;
  aboutQuote: string;
  aboutQuoteFooter: string;

  footerTagline: string;
  footerNote: string;
  backToTop: string;

  anime: string;
  manhwa: string;
  formats: Record<FormatKey, string>;

  genres: Record<GenreKey, { label: string; hint: string }>;
};

export const translations: Record<Lang, Translations> = {
  de: {
    htmlLang: "de",
    localeCompact: "de-DE",
    langToggleLabel: "Sprache wechseln",
    langName: "Deutsch",

    skipLink: "Direkt zum Genre-Kompass",
    brandHome: "MangaMori Startseite",
    navMain: "Hauptnavigation",
    navCompass: "Kompass",
    navShelf: "Dein Regal",
    navAbout: "Über MangaMori",

    viewSwitchAria: "Ansicht wechseln",
    matchAria: "Passende Vorlieben",
    coverAlt: (title) => `Cover von ${title}`,

    heroEyebrow: "Anime & Manhwa · persönlich entdeckt",
    heroTitleLead: "Dein nächstes",
    heroTitleAccent: "Kapitel wartet.",
    heroLede:
      "Sag uns, welche Welten dich fesseln. MangaMori öffnet dir ein handverlesenes Regal mit echten Covern, Originaltiteln und Geheimtipps jenseits der üblichen Bestseller.",
    heroCta: "Genre-Kompass öffnen",
    panelQuote: "Manche Geschichten finden uns genau im richtigen Moment.",

    compassEyebrow: "Dein Genre-Kompass",
    compassTitle: "Welche Geschichte ruft nach dir?",
    compassIntro:
      "Wähle mehrere Stimmungen. Je klarer dein Geschmack, desto besser passt dein persönliches Regal.",
    scopeLegend: "Wo möchtest du lesen oder schauen?",
    scopeBoth: "Beides",
    scopeAnime: "Anime",
    scopeManhwa: "Manhwa",
    genreLegend: "Was darf nicht fehlen?",
    selectionNone: "Noch keine Stimmung ausgewählt",
    selectionSummary: (count, list) =>
      `${count} ${count === 1 ? "Stimmung" : "Stimmungen"} gewählt: ${list}`,
    surprise: "Überrasch mich",
    surpriseLoading: "Wir würfeln …",
    submit: "Geheimtipps finden",
    submitLoading: "Geheimtipps werden gesucht …",
    formError:
      "Wähle mindestens eine Stimmung, damit wir dein Regal füllen können.",

    resultsEyebrowFav: "Deine Merkliste · lokal gespeichert",
    resultsEyebrowSurprise: "Dein persönliches Regal · außerhalb deiner Bubble",
    resultsEyebrowHidden: "Dein persönliches Regal · Geheimtipps",
    favCountTitle: (count) => `${count} Titel gemerkt`,
    favEmptyHeading: "Deine Merkliste",
    loadingSurprise: "Wir würfeln neue Welten …",
    loadingHidden: "Wir blättern abseits der Bestseller …",
    countSurprise: (count) => `${count} Zufallsfunde`,
    countHidden: (count) => `${count} Geheimtipps`,
    readyTitle: "Bereit für deine Auswahl",
    viewRecommend: "Empfehlungen",
    viewShelf: "Merkliste",
    apiNote: "Live-Daten & echte Cover",
    apiDetailSurprise: "73+ Punkte · genre-frei · zufällige AniList-Seiten",
    apiDetailHidden:
      "69+ Punkte · Mainstream gefiltert · zufällige AniList-Seiten",

    statusLoading: "Neue Empfehlungen werden geladen.",
    statusMore: "Weitere Empfehlungen werden geladen.",
    statusLoaded: (count) => `${count} Empfehlungen wurden geladen.`,

    favEmptyEyebrow: "Merkliste ist leer",
    favEmptyText:
      "Tippe bei einer Empfehlung auf das Herz, um sie hier zu sammeln. Deine Merkliste bleibt in diesem Browser gespeichert – auch nach dem Neuladen.",
    errorHeading: "Das Regal klemmt gerade",
    errorAdjust: "Auswahl anpassen",
    moreEyebrow: "Noch ein Kapitel?",
    moreText: (count) =>
      `Bereits ${count} einzigartige Titel im Regal. Wir merken uns, was du schon gesehen hast.`,
    resetSeen: "Gesehene Titel zurücksetzen",
    resetSeenDone: "✓ Merkzettel geleert",
    loadMoreOpening: "Weitere Seiten öffnen …",
    loadMore: "Mehr laden",
    shelfExhausted: "Regal ausgeschöpft",
    emptyEyebrow: "Noch unbeschrieben",
    emptyTitle: "Dein Regal wartet auf eine Richtung.",
    emptyText:
      "Wähle oben deine Lieblingsgenres und öffne das Archiv. Deine unbekannteren Empfehlungen erscheinen hier als persönliche Manga-Panels – oder lass dich direkt überraschen.",
    errNoMore:
      "Für diese Richtung haben wir gerade keine weiteren unbekannten Titel gefunden.",
    errRare:
      "Diese Mischung ist selten. Nimm eine Stimmung heraus oder öffne die Suche für Anime und Manhwa.",
    errGeneric: "Beim Öffnen des Archivs ist etwas schiefgegangen.",

    kickerSurprise: "Zufallsfund",
    kickerHidden: "Geheimtipp",
    kickerSaved: "Gemerkt",
    lists: "Listen",
    niche: "Nische",
    episodesLabel: (count) => `${count} ${count === 1 ? "Folge" : "Folgen"}`,
    chaptersLabel: (count) => `${count} ${count === 1 ? "Kapitel" : "Kapitel"}`,
    scoreTitle: (score) => `AniList-Bewertung: ${score}/100`,
    previewLabel: "Vorschau",
    trailerTitle: (title) => `Trailer: ${title}`,
    original: "Original:",
    noSynopsis:
      "Für diesen Titel ist derzeit noch keine Kurzbeschreibung verfügbar.",
    save: "Merken",
    unsave: "Aus Merkliste entfernen",
    saveAria: (title) => `${title} merken`,
    unsaveAria: (title) => `${title} aus Merkliste entfernen`,
    ratingLabel: "Bewertung ",
    viewOnAniList: "Auf AniList ansehen",

    aboutId: "余白",
    aboutEyebrow: "Warum MangaMori?",
    aboutTitle: "Weniger scrollen. Mehr fühlen.",
    aboutText:
      "Keine erfundenen Titel, keine Platzhalter-Cover: MangaMori liest deine Genre-Auswahl, filtert Mainstream aus AniList, prüft eine Mindestbewertung und öffnet zufällige Archivseiten voller echter Anime und koreanischer Manhwa.",
    aboutQuote:
      "„Die beste Empfehlung fühlt sich nicht wie ein Treffer an, sondern wie eine Einladung.“",
    aboutQuoteFooter: "— Das Prinzip hinter deinem Regal",

    footerTagline: "Dein nächstes Kapitel.",
    footerNote:
      "Datenquelle: AniList. MangaMori ist ein unabhängiges Empfehlungsprojekt.",
    backToTop: "Zurück nach oben ↑",

    anime: "Anime",
    manhwa: "Manhwa",
    formats: {
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
    },

    genres: {
      Action: { label: "Action", hint: "Tempo & Kämpfe" },
      Adventure: { label: "Abenteuer", hint: "Ferne Welten" },
      Isekai: { label: "Isekai", hint: "Neu geboren" },
      Romance: { label: "Romance", hint: "Herzklopfen" },
      "Slice of Life": { label: "Slice of Life", hint: "Leise Momente" },
      Fantasy: { label: "Fantasy", hint: "Magie & Mythen" },
      Mystery: { label: "Mystery", hint: "Rätsel & Schatten" },
      Comedy: { label: "Comedy", hint: "Leicht & witzig" },
      Drama: { label: "Drama", hint: "Große Gefühle" },
      Murim: { label: "Murim", hint: "Clans & Kultivierung" },
      Psychological: { label: "Psychological", hint: "Abgründe im Kopf" },
      Horror: { label: "Horror", hint: "Grusel & Angst" },
      Thriller: { label: "Thriller", hint: "Nervenkitzel" },
      "Sci-Fi": { label: "Sci-Fi", hint: "Zukunft & Technik" },
      Supernatural: { label: "Übernatürlich", hint: "Geister & Kräfte" },
      Sports: { label: "Sport", hint: "Ehrgeiz & Team" },
      Mecha: { label: "Mecha", hint: "Roboter & Stahl" },
      "Mahou Shoujo": { label: "Magical Girl", hint: "Magische Mädchen" },
      Music: { label: "Musik", hint: "Töne & Bühne" },
      Historical: { label: "Historisch", hint: "Vergangene Zeiten" },
      Military: { label: "Militär", hint: "Krieg & Armee" },
      School: { label: "Schule", hint: "Schulalltag" },
      Harem: { label: "Harem", hint: "Viele Verehrer" },
      Vampire: { label: "Vampire", hint: "Blut & Nacht" },
      Magic: { label: "Magie", hint: "Zauber & Sprüche" },
      "Super Power": { label: "Superkräfte", hint: "Übermenschlich" },
      Villainess: { label: "Villainess", hint: "Die Bösewichtin" },
      Revenge: { label: "Rache", hint: "Vergeltung" },
      "Post-Apocalyptic": { label: "Endzeit", hint: "Nach dem Untergang" },
    },
  },

  en: {
    htmlLang: "en",
    localeCompact: "en-US",
    langToggleLabel: "Switch language",
    langName: "English",

    skipLink: "Skip to the genre compass",
    brandHome: "MangaMori home",
    navMain: "Main navigation",
    navCompass: "Compass",
    navShelf: "Your shelf",
    navAbout: "About MangaMori",

    viewSwitchAria: "Switch view",
    matchAria: "Matching tastes",
    coverAlt: (title) => `Cover of ${title}`,

    heroEyebrow: "Anime & Manhwa · personally discovered",
    heroTitleLead: "Your next",
    heroTitleAccent: "chapter awaits.",
    heroLede:
      "Tell us which worlds pull you in. MangaMori opens a hand-picked shelf with real covers, original titles and hidden gems far beyond the usual bestsellers.",
    heroCta: "Open the genre compass",
    panelQuote: "Some stories find us at exactly the right moment.",

    compassEyebrow: "Your genre compass",
    compassTitle: "Which story is calling you?",
    compassIntro:
      "Pick several moods. The clearer your taste, the better your personal shelf will fit.",
    scopeLegend: "Where do you want to read or watch?",
    scopeBoth: "Both",
    scopeAnime: "Anime",
    scopeManhwa: "Manhwa",
    genreLegend: "What can't be missing?",
    selectionNone: "No mood selected yet",
    selectionSummary: (count, list) =>
      `${count} ${count === 1 ? "mood" : "moods"} selected: ${list}`,
    surprise: "Surprise me",
    surpriseLoading: "Rolling the dice …",
    submit: "Find hidden gems",
    submitLoading: "Searching hidden gems …",
    formError: "Pick at least one mood so we can fill your shelf.",

    resultsEyebrowFav: "Your shelf · saved locally",
    resultsEyebrowSurprise: "Your personal shelf · outside your bubble",
    resultsEyebrowHidden: "Your personal shelf · hidden gems",
    favCountTitle: (count) => `${count} ${count === 1 ? "title saved" : "titles saved"}`,
    favEmptyHeading: "Your shelf",
    loadingSurprise: "Rolling up new worlds …",
    loadingHidden: "Flipping past the bestsellers …",
    countSurprise: (count) => `${count} ${count === 1 ? "random find" : "random finds"}`,
    countHidden: (count) => `${count} ${count === 1 ? "hidden gem" : "hidden gems"}`,
    readyTitle: "Ready for your picks",
    viewRecommend: "Recommendations",
    viewShelf: "Saved",
    apiNote: "Live data & real covers",
    apiDetailSurprise: "73+ score · genre-free · random AniList pages",
    apiDetailHidden: "69+ score · mainstream filtered · random AniList pages",

    statusLoading: "Loading new recommendations.",
    statusMore: "Loading more recommendations.",
    statusLoaded: (count) => `${count} recommendations loaded.`,

    favEmptyEyebrow: "Your shelf is empty",
    favEmptyText:
      "Tap the heart on any recommendation to collect it here. Your shelf stays saved in this browser — even after a reload.",
    errorHeading: "The shelf is stuck right now",
    errorAdjust: "Adjust your picks",
    moreEyebrow: "One more chapter?",
    moreText: (count) =>
      `Already ${count} unique titles on the shelf. We remember what you've already seen.`,
    resetSeen: "Reset seen titles",
    resetSeenDone: "✓ Memory cleared",
    loadMoreOpening: "Opening more pages …",
    loadMore: "Load more",
    shelfExhausted: "Shelf exhausted",
    emptyEyebrow: "Still blank",
    emptyTitle: "Your shelf is waiting for a direction.",
    emptyText:
      "Pick your favourite genres above and open the archive. Your lesser-known recommendations appear here as personal manga panels — or let us surprise you.",
    errNoMore:
      "We couldn't find any more unknown titles in this direction right now.",
    errRare:
      "This mix is rare. Remove a mood or open the search up to both anime and manhwa.",
    errGeneric: "Something went wrong while opening the archive.",

    kickerSurprise: "Random find",
    kickerHidden: "Hidden gem",
    kickerSaved: "Saved",
    lists: "lists",
    niche: "Niche",
    episodesLabel: (count) => `${count} ${count === 1 ? "episode" : "episodes"}`,
    chaptersLabel: (count) => `${count} ${count === 1 ? "chapter" : "chapters"}`,
    scoreTitle: (score) => `AniList score: ${score}/100`,
    previewLabel: "Preview",
    trailerTitle: (title) => `Trailer: ${title}`,
    original: "Original:",
    noSynopsis: "There's no short description available for this title yet.",
    save: "Save",
    unsave: "Remove from shelf",
    saveAria: (title) => `Save ${title}`,
    unsaveAria: (title) => `Remove ${title} from your shelf`,
    ratingLabel: "Score ",
    viewOnAniList: "View on AniList",

    aboutId: "余白",
    aboutEyebrow: "Why MangaMori?",
    aboutTitle: "Less scrolling. More feeling.",
    aboutText:
      "No made-up titles, no placeholder covers: MangaMori reads your genre picks, filters the mainstream out of AniList, checks a minimum score and opens random archive pages full of real anime and Korean manhwa.",
    aboutQuote:
      "“The best recommendation doesn't feel like a hit — it feels like an invitation.”",
    aboutQuoteFooter: "— The principle behind your shelf",

    footerTagline: "Your next chapter.",
    footerNote:
      "Data source: AniList. MangaMori is an independent recommendation project.",
    backToTop: "Back to top ↑",

    anime: "Anime",
    manhwa: "Manhwa",
    formats: {
      TV: "TV series",
      TV_SHORT: "Short series",
      MOVIE: "Movie",
      SPECIAL: "Special",
      OVA: "OVA",
      ONA: "ONA",
      MUSIC: "Music",
      MANGA: "Manhwa",
      NOVEL: "Novel",
      ONE_SHOT: "One Shot",
    },

    genres: {
      Action: { label: "Action", hint: "Pace & fights" },
      Adventure: { label: "Adventure", hint: "Distant worlds" },
      Isekai: { label: "Isekai", hint: "Reborn anew" },
      Romance: { label: "Romance", hint: "Heart-fluttering" },
      "Slice of Life": { label: "Slice of Life", hint: "Quiet moments" },
      Fantasy: { label: "Fantasy", hint: "Magic & myths" },
      Mystery: { label: "Mystery", hint: "Riddles & shadows" },
      Comedy: { label: "Comedy", hint: "Light & funny" },
      Drama: { label: "Drama", hint: "Big emotions" },
      Murim: { label: "Murim", hint: "Clans & cultivation" },
      Psychological: { label: "Psychological", hint: "Depths of the mind" },
      Horror: { label: "Horror", hint: "Dread & fear" },
      Thriller: { label: "Thriller", hint: "Edge of your seat" },
      "Sci-Fi": { label: "Sci-Fi", hint: "Future & tech" },
      Supernatural: { label: "Supernatural", hint: "Ghosts & powers" },
      Sports: { label: "Sports", hint: "Ambition & team" },
      Mecha: { label: "Mecha", hint: "Robots & steel" },
      "Mahou Shoujo": { label: "Magical Girl", hint: "Magical heroines" },
      Music: { label: "Music", hint: "Sound & stage" },
      Historical: { label: "Historical", hint: "Bygone eras" },
      Military: { label: "Military", hint: "War & army" },
      School: { label: "School", hint: "School days" },
      Harem: { label: "Harem", hint: "Many admirers" },
      Vampire: { label: "Vampire", hint: "Blood & night" },
      Magic: { label: "Magic", hint: "Spells & sorcery" },
      "Super Power": { label: "Super Power", hint: "Superhuman" },
      Villainess: { label: "Villainess", hint: "The villainess" },
      Revenge: { label: "Revenge", hint: "Payback" },
      "Post-Apocalyptic": { label: "Post-Apocalyptic", hint: "After the fall" },
    },
  },
};

export function genreDisplay(raw: string, lang: Lang) {
  const table = translations[lang].genres as Record<
    string,
    { label: string; hint: string }
  >;
  return table[raw]?.label ?? raw;
}
