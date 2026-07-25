// Build-time fetch of curated Korean manhwa from the public MangaDex API.
//
// MangaDex does not send CORS headers, so the browser cannot call it directly
// from the static GitHub Pages build. Instead we snapshot a curated set here
// (at build/deploy time) into app/webtoons.json, which the app imports and
// filters client-side. Run with: npm run fetch:webtoons
//
// The script never fails the build: on any network/parse error it keeps the
// existing app/webtoons.json so deploys stay green even if MangaDex is down.

import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://api.mangadex.org";
const UPLOADS = "https://uploads.mangadex.org";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "webtoons.json");
const WANT = 48;

// MangaDex tag name -> our GenreKey (mirrors GENRE_MAP / TAG_MAP in discovery.ts)
const TAG_TO_MOOD = {
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
  "Magical Girls": "Mahou Shoujo",
  Music: "Music",
  Isekai: "Isekai",
  Reincarnation: "Isekai",
  "Martial Arts": "Murim",
  Historical: "Historical",
  Military: "Military",
  "School Life": "School",
  Harem: "Harem",
  Vampires: "Vampire",
  Magic: "Magic",
  Superhero: "Super Power",
  Villainess: "Villainess",
  "Post-Apocalyptic": "Post-Apocalyptic",
};

const UA = "MangaMori-build/1.0 (+https://github.com/weeeedddd/MangaMori)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (res.status === 429 || res.status >= 500) {
      throw new Error(`${res.status}`);
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  } catch (error) {
    if (attempt < 4) {
      await sleep(1000 * 2 ** attempt);
      return getJson(url, attempt + 1);
    }
    throw error;
  }
}

function cleanDescription(text) {
  if (!text) return "";
  return text
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_>`~]/g, " ")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const manga = [];
  for (let page = 0; page < 3 && manga.length < WANT * 2; page += 1) {
    const params = new URLSearchParams();
    params.set("limit", "60");
    params.set("offset", String(page * 60));
    params.append("originalLanguage[]", "ko");
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    params.append("includes[]", "cover_art");
    params.set("hasAvailableChapters", "true");
    params.set("order[followedCount]", "desc");
    const data = await getJson(`${API}/manga?${params.toString()}`);
    manga.push(...(data.data ?? []));
  }

  // Ratings via the statistics endpoint (batched).
  const ids = manga.map((m) => m.id);
  const stats = {};
  for (let i = 0; i < ids.length; i += 90) {
    const slice = ids.slice(i, i + 90);
    const params = new URLSearchParams();
    slice.forEach((id) => params.append("manga[]", id));
    try {
      const data = await getJson(`${API}/statistics/manga?${params.toString()}`);
      Object.assign(stats, data.statistics ?? {});
    } catch {
      // ratings are optional
    }
  }

  const seen = new Set();
  const webtoons = [];
  for (const m of manga) {
    const at = m.attributes;
    const title =
      at.title.en ||
      (at.altTitles.find((t) => t.en) || {}).en ||
      at.title["ko-ro"] ||
      Object.values(at.title)[0];
    if (!title || seen.has(title)) continue;

    const cover = (m.relationships || []).find((r) => r.type === "cover_art");
    const fileName = cover?.attributes?.fileName;
    if (!fileName) continue;

    const tagNames = (at.tags || []).map((t) => t.attributes.name.en);
    const genreNames = (at.tags || [])
      .filter((t) => t.attributes.group === "genre")
      .map((t) => t.attributes.name.en);
    const moods = [
      ...new Set(tagNames.map((n) => TAG_TO_MOOD[n]).filter(Boolean)),
    ];

    const rating = stats[m.id]?.rating?.bayesian ?? stats[m.id]?.rating?.average;
    const averageScore = rating ? Math.round(rating * 10) : null;
    const chaptersRaw = at.lastChapter ? parseInt(at.lastChapter, 10) : NaN;

    seen.add(title);
    webtoons.push({
      id: m.id,
      type: "MANGA",
      source: "mangadex",
      title: {
        english: at.title.en || null,
        romaji: at.title["ko-ro"] || null,
        native:
          (at.altTitles.find((t) => t.ko) || {}).ko ||
          at.title.ko ||
          null,
      },
      coverImage: {
        extraLarge: `${UPLOADS}/covers/${m.id}/${fileName}.512.jpg`,
        large: `${UPLOADS}/covers/${m.id}/${fileName}.256.jpg`,
        color: null,
      },
      description: cleanDescription(at.description?.en).slice(0, 320) || null,
      format: null,
      averageScore,
      popularity: stats[m.id]?.follows ?? null,
      episodes: null,
      chapters: Number.isFinite(chaptersRaw) ? chaptersRaw : null,
      genres: genreNames,
      tags: tagNames.map((name) => ({ name, rank: 0 })),
      siteUrl: `https://mangadex.org/title/${m.id}`,
      seasonYear: at.year ?? null,
      status: at.status ?? null,
      bannerImage: null,
      trailer: null,
      moods,
    });
    if (webtoons.length >= WANT) break;
  }

  if (!webtoons.length) throw new Error("no webtoons fetched");

  writeFileSync(OUT, `${JSON.stringify(webtoons, null, 2)}\n`);
  console.log(`Wrote ${webtoons.length} webtoons to app/webtoons.json`);
}

main().catch((error) => {
  console.error(`fetch-webtoons failed: ${error.message}`);
  if (existsSync(OUT)) {
    console.error("Keeping existing app/webtoons.json");
    process.exit(0);
  }
  // No snapshot at all: still don't break the build, write an empty array.
  writeFileSync(OUT, "[]\n");
  process.exit(0);
});
