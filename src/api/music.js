// ─── iTunes Search API Integration ──────────────────────────────────────────
// Free, CORS-friendly, no auth required. Returns album art + 30s previews.

const ITUNES_BASE = "https://itunes.apple.com";

/**
 * Search iTunes for tracks matching a query string.
 * @param {string} term - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Normalized track objects
 */
export async function searchTracks(term, limit = 10) {
  const url = `${ITUNES_BASE}/search?${new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: String(limit),
  })}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const data = await res.json();

  return data.results.map(normalizeiTunesTrack);
}

/**
 * Search for tracks by a specific artist.
 */
export async function searchByArtist(artist, limit = 10) {
  return searchTracks(artist, limit);
}

/**
 * Get the top songs for a genre using iTunes RSS feeds.
 * @param {string} genreId - iTunes genre ID
 * @param {number} limit - Max results
 */
export async function getTopByGenre(genreId, limit = 10) {
  const url = `${ITUNES_BASE}/search?${new URLSearchParams({
    term: GENRE_SEARCH_TERMS[genreId] || "music",
    media: "music",
    entity: "song",
    limit: String(limit),
  })}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
  const data = await res.json();

  return data.results.map(normalizeiTunesTrack);
}

/**
 * Build search queries from user quiz answers and fetch recommendations.
 * This is the main entry point for the recommendation engine.
 *
 * @param {Array} userAnswers - Array of { question, category, answer }
 * @param {Set} blacklistedIds - Track IDs to exclude
 * @returns {Promise<Object>} { tracks, profile }
 */
export async function getRecommendations(userAnswers, blacklistedIds = new Set()) {
  const profile = buildTasteProfile(userAnswers);
  const queries = buildSearchQueries(profile);

  // Fire all searches in parallel for speed
  const allResults = await Promise.allSettled(
    queries.map((q) => searchTracks(q.term, q.limit))
  );

  // Flatten, deduplicate, and filter blacklisted
  const seen = new Set();
  const tracks = [];

  for (const result of allResults) {
    if (result.status !== "fulfilled") continue;
    for (const track of result.value) {
      const key = `${track.artist}-${track.title}`.toLowerCase();
      if (!seen.has(key) && !blacklistedIds.has(track.id)) {
        seen.add(key);
        tracks.push(track);
      }
    }
  }

  // Score and sort tracks by relevance to the taste profile
  const scored = tracks.map((track) => ({
    ...track,
    _score: scoreTrack(track, profile),
  }));
  scored.sort((a, b) => b._score - a._score);

  return {
    tracks: scored.slice(0, 5),
    profile,
    _allTracks: scored, // Keep full pool for replacements
  };
}

/**
 * Fetch a replacement track when user clicks "I already listen to that".
 * Searches for similar content while excluding blacklisted items.
 */
export async function fetchReplacement(originalTrack, blacklistedIds, existingTrackIds) {
  const excludeIds = new Set([...blacklistedIds, ...existingTrackIds]);

  // Try multiple search strategies
  const strategies = [
    `${originalTrack.artist} music`,
    `${originalTrack.genre || ""} ${originalTrack.artist.split(" ")[0]}`,
    originalTrack.genre || originalTrack.artist,
  ];

  for (const term of strategies) {
    if (!term.trim()) continue;
    try {
      const results = await searchTracks(term, 20);
      const candidate = results.find(
        (t) => !excludeIds.has(t.id) && t.artist.toLowerCase() !== originalTrack.artist.toLowerCase()
      );
      if (candidate) return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function normalizeiTunesTrack(raw) {
  return {
    id: raw.trackId,
    title: raw.trackName,
    artist: raw.artistName,
    album: raw.collectionName,
    albumArt: raw.artworkUrl100?.replace("100x100", "300x300") || "",
    albumArtSmall: raw.artworkUrl60 || "",
    previewUrl: raw.previewUrl || "",
    genre: raw.primaryGenreName || "",
    releaseDate: raw.releaseDate || "",
    trackUrl: raw.trackViewUrl || "",
    durationMs: raw.trackTimeMillis || 0,
  };
}

// Maps quiz taste profile tags to iTunes search terms
const GENRE_SEARCH_TERMS = {
  electronic: "electronic dance music",
  "hip-hop": "hip hop rap",
  rnb: "r&b soul",
  rock: "alternative rock",
  indie: "indie alternative",
  jazz: "jazz fusion",
  pop: "pop hits",
  folk: "folk acoustic",
  classical: "classical",
  metal: "metal",
};

// Map mood keywords to search modifiers
const MOOD_TERMS = {
  moody: ["atmospheric", "ambient", "dream pop"],
  upbeat: ["upbeat", "dance", "feel good"],
  emotional: ["emotional", "ballad", "heartfelt"],
  energetic: ["energy", "power", "intense"],
  chill: ["chill", "lo-fi", "relaxing"],
  dark: ["dark", "brooding", "industrial"],
};

const ERA_TERMS = {
  "60s/70s": ["classic rock", "soul motown", "psychedelic"],
  "80s": ["synth pop", "new wave 80s", "80s hits"],
  "90s": ["90s alternative", "90s hip hop", "grunge"],
  "2000s": ["2000s indie", "2000s emo", "2000s alternative"],
  "2010s": ["2010s indie pop", "modern alternative", "bedroom pop"],
};

/**
 * Analyze quiz answers and build a structured taste profile.
 */
function buildTasteProfile(userAnswers) {
  const text = userAnswers.map((a) => a.answer.toLowerCase()).join(" ");
  const categories = {};
  for (const a of userAnswers) {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a.answer);
  }

  const tags = new Set();
  const searchSeeds = [];

  // Genre detection
  if (/(house|electronic|dance|synth|festival|dj|producer|808|edm)/.test(text)) {
    tags.add("electronic");
    searchSeeds.push("electronic music");
  }
  if (/(hip-hop|rap|bars|bass|kendrick|cordae|hip hop|rapper)/.test(text)) {
    tags.add("hip-hop");
    searchSeeds.push("hip hop");
  }
  if (/(r&b|soul|smooth|falsetto|neo-soul|silky|motown|rnb)/.test(text)) {
    tags.add("rnb");
    searchSeeds.push("r&b soul");
  }
  if (/(rock|guitar|grunge|punk|mosh|shred|distorted)/.test(text)) {
    tags.add("rock");
    searchSeeds.push("alternative rock");
  }
  if (/(indie|alternative|shoegaze|dream pop|bedroom)/.test(text)) {
    tags.add("indie");
    searchSeeds.push("indie alternative");
  }
  if (/(jazz|bossa|trio|fusion|instrumental)/.test(text)) {
    tags.add("jazz");
    searchSeeds.push("jazz");
  }
  if (/(pop|anthem|mainstream|singing|mirror)/.test(text)) {
    tags.add("pop");
    searchSeeds.push("pop");
  }
  if (/(folk|acoustic|singer-songwriter|cozy)/.test(text)) {
    tags.add("folk");
    searchSeeds.push("folk acoustic");
  }
  if (/(afrobeats|amapiano|tropical)/.test(text)) {
    tags.add("afrobeats");
    searchSeeds.push("afrobeats amapiano");
  }

  // Mood detection
  const moods = new Set();
  if (/(cinematic|atmospheric|ambient|2 am|alone|melanchol|dark ambient)/.test(text)) moods.add("moody");
  if (/(upbeat|energy|dance|party|going out|celebration|invincible)/.test(text)) moods.add("upbeat");
  if (/(emotional|sad|feelings|wallow|happy tears|nostalgic)/.test(text)) moods.add("emotional");
  if (/(loud|aggressive|fast|no brakes|angry|mosh)/.test(text)) moods.add("energetic");
  if (/(lo-fi|chill|relax|gentle|ease|study)/.test(text)) moods.add("chill");

  // Era detection
  let era = "2010s";
  if (/(60s|70s|classic rock|psychedelic|tie-dye|vinyl)/.test(text)) era = "60s/70s";
  else if (/(80s|synth-pop|new wave|power ballad|leather)/.test(text)) era = "80s";
  else if (/(90s|grunge|flannel|golden era)/.test(text)) era = "90s";
  else if (/(2000s|indie boom|emo|y2k)/.test(text)) era = "2000s";

  // Popularity preference
  let popularity = "mixed";
  if (/(hidden gem|underground|crates|deep|obscure|digging)/.test(text)) popularity = "deep";
  else if (/(popular|mainstream|hits|algorithm|biggest)/.test(text)) popularity = "popular";

  // If no genres detected, add some defaults
  if (tags.size === 0) {
    tags.add("indie");
    tags.add("pop");
    searchSeeds.push("indie pop", "alternative");
  }

  return {
    tags: [...tags],
    moods: [...moods],
    era,
    popularity,
    searchSeeds,
    profileName: generateProfileName([...tags], [...moods]),
    profileDescription: generateProfileDescription([...tags], [...moods], era),
  };
}

function generateProfileName(tags, moods) {
  const tagLabels = {
    electronic: "Digital",
    "hip-hop": "Rhythmic",
    rnb: "Soulful",
    rock: "Raw",
    indie: "Independent",
    jazz: "Harmonic",
    pop: "Melodic",
    folk: "Acoustic",
    afrobeats: "Global",
  };
  const moodLabels = {
    moody: "Nocturnal",
    upbeat: "Radiant",
    emotional: "Sentient",
    energetic: "Electric",
    chill: "Ambient",
  };

  const t = tagLabels[tags[0]] || "Eclectic";
  const m = moodLabels[moods[0]] || "Explorer";
  return `${t} ${m}`;
}

function generateProfileDescription(tags, moods, era) {
  const parts = [];
  if (tags.length > 0) parts.push(`drawn to ${tags.slice(0, 2).join(" and ")}`);
  if (moods.length > 0) parts.push(`with a ${moods[0]} edge`);
  parts.push(`influenced by the ${era} era`);

  return `Your sonic DNA suggests a listener ${parts.join(", ")}. You value authenticity and aren't afraid to dig deeper.`;
}

/**
 * Turn a taste profile into concrete search queries.
 */
function buildSearchQueries(profile) {
  const queries = [];

  // Genre-based queries
  for (const seed of profile.searchSeeds.slice(0, 3)) {
    queries.push({ term: seed, limit: 15 });
  }

  // Mood-based queries
  for (const mood of profile.moods.slice(0, 2)) {
    const terms = MOOD_TERMS[mood] || [];
    if (terms.length) {
      queries.push({ term: terms[0], limit: 10 });
    }
  }

  // Era-based queries
  const eraTerms = ERA_TERMS[profile.era] || [];
  if (eraTerms.length) {
    queries.push({ term: eraTerms[0], limit: 10 });
  }

  // Deep cuts for "hidden gem" seekers
  if (profile.popularity === "deep" && profile.tags.length > 0) {
    const deepTerm = GENRE_SEARCH_TERMS[profile.tags[0]] || profile.tags[0];
    queries.push({ term: `${deepTerm} underground`, limit: 10 });
  }

  return queries;
}

/**
 * Score how well a track matches the taste profile.
 */
function scoreTrack(track, profile) {
  let score = 0;
  const genre = (track.genre || "").toLowerCase();

  // Genre match
  for (const tag of profile.tags) {
    if (genre.includes(tag) || genre.includes(tag.replace("-", " "))) {
      score += 3;
    }
  }

  // Prefer tracks with previews
  if (track.previewUrl) score += 2;

  // Prefer tracks with album art
  if (track.albumArt) score += 1;

  // Slight randomization for variety
  score += Math.random() * 2;

  return score;
}
