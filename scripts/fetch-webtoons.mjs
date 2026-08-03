// Build-time fetch of Korean manhwa from the public MangaDex API.
//
// MangaDex does not send CORS headers, so the browser cannot call it directly
// from the static GitHub Pages build. Instead we snapshot a large set here (at
// build/deploy time) into public/webtoons.json, which the app fetches
// same-origin on demand and filters client-side.
//
// Records are stored in a compact shape (short keys, cover file name only) so
// the shelf can hold ~1000 titles without a heavy payload.
// Run with: npm run fetch:webtoons
//
// The script never fails the build: on any network/parse error it keeps the
// existing snapshot so deploys stay green even if MangaDex is down.

import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://api.mangadex.org";
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "webtoons.json",
);
const PAGES = 10;
const PER_PAGE = 100;
const UA = "MangaMori-build/1.0 (+https://github.com/weeeedddd/MangaMori)";

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

// Publication status, stored as a single letter to keep the snapshot small.
const STATUS_CODE = {
  completed: "c",
  ongoing: "o",
  hiatus: "h",
  cancelled: "x",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempt = 0) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (response.status === 429 || response.status >= 500) {
      throw new Error(String(response.status));
    }
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
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
  const cleaned = text
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length <= 190) return cleaned;
  return `${cleaned.slice(0, 187).replace(/\s+\S*$/, "")}…`;
}

function englishTitle(attributes) {
  if (attributes.title.en) return attributes.title.en;
  const alt = (attributes.altTitles || []).find((entry) => entry.en);
  if (alt) return alt.en;
  return attributes.title["ko-ro"] || Object.values(attributes.title)[0] || null;
}

function chapterCount(attributes) {
  const raw = attributes.lastChapter;
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = Number.parseInt(String(raw).split(".")[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchManga() {
  const manga = [];
  for (let page = 0; page < PAGES; page += 1) {
    const params = new URLSearchParams();
    params.set("limit", String(PER_PAGE));
    params.set("offset", String(page * PER_PAGE));
    params.append("originalLanguage[]", "ko");
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    params.append("includes[]", "cover_art");
    params.set("hasAvailableChapters", "true");
    params.set("order[followedCount]", "desc");
    const data = await getJson(`${API}/manga?${params.toString()}`);
    const batch = data.data ?? [];
    manga.push(...batch);
    if (batch.length < PER_PAGE) break;
    await sleep(300);
  }
  return manga;
}

async function fetchStatistics(ids) {
  const statistics = {};
  for (let index = 0; index < ids.length; index += 80) {
    const params = new URLSearchParams();
    ids.slice(index, index + 80).forEach((id) => params.append("manga[]", id));
    try {
      const data = await getJson(`${API}/statistics/manga?${params.toString()}`);
      Object.assign(statistics, data.statistics ?? {});
    } catch {
      // Ratings are a nice-to-have; a missing batch just means no score.
    }
    await sleep(300);
  }
  return statistics;
}

async function main() {
  const manga = await fetchManga();
  const statistics = await fetchStatistics(manga.map((entry) => entry.id));

  const seen = new Set();
  const webtoons = [];

  for (const entry of manga) {
    const attributes = entry.attributes;
    const title = englishTitle(attributes);
    if (!title) continue;

    const key = title.toLowerCase().trim();
    if (seen.has(key)) continue;

    const cover = (entry.relationships || []).find(
      (relation) => relation.type === "cover_art",
    );
    const fileName = cover?.attributes?.fileName;
    if (!fileName) continue;

    const tagNames = (attributes.tags || []).map(
      (tag) => tag.attributes.name.en,
    );
    const moods = [
      ...new Set(tagNames.map((name) => TAG_TO_MOOD[name]).filter(Boolean)),
    ];
    // Without a mood the entry can never match a reader's genre picks.
    if (!moods.length) continue;

    const genres = (attributes.tags || [])
      .filter((tag) => tag.attributes.group === "genre")
      .map((tag) => tag.attributes.name.en)
      .slice(0, 3);

    const rating = statistics[entry.id]?.rating;
    const score = rating?.bayesian || rating?.average;
    const follows = statistics[entry.id]?.follows;
    const native =
      (attributes.altTitles || []).find((alt) => alt.ko)?.ko ||
      attributes.title.ko ||
      null;
    const description = cleanDescription(attributes.description?.en);
    const chapters = chapterCount(attributes);

    seen.add(key);
    const record = { i: entry.id, t: title, c: fileName, m: moods };
    if (native) record.n = native;
    if (description) record.d = description;
    if (score) record.s = Math.round(score * 10);
    if (follows) record.p = follows;
    if (chapters) record.ch = chapters;
    if (genres.length) record.g = genres;
    if (STATUS_CODE[attributes.status]) record.st = STATUS_CODE[attributes.status];
    if (attributes.year) record.y = attributes.year;
    webtoons.push(record);
  }

  if (!webtoons.length) throw new Error("no webtoons fetched");

  writeFileSync(OUT, `${JSON.stringify(webtoons)}\n`);
  console.log(`Wrote ${webtoons.length} webtoons to public/webtoons.json`);
}

main().catch((error) => {
  console.error(`fetch-webtoons failed: ${error.message}`);
  if (existsSync(OUT)) {
    console.error("Keeping existing public/webtoons.json");
    process.exit(0);
  }
  writeFileSync(OUT, "[]\n");
  process.exit(0);
});
