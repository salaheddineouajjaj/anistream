/**
 * Episodes API Service
 * 
 * Multi-source aggregator for anime episode data.
 * Sources:
 *  1. Jikan (MAL API v4) — episode metadata: title, thumbnail, air date, filler/recap flags
 *  2. AniList GraphQL — streamingEpisodes: official links (Crunchyroll, Funimation, etc.)
 * 
 * All responses are cached in localStorage for 24h to respect rate limits.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface EpisodeDetail {
    number: number;
    title: string;
    titleJapanese?: string;
    aired?: string;
    score?: number;
    filler: boolean;
    recap: boolean;
    thumbnail?: string;
    url?: string; // MAL episode URL
    streamingLinks: StreamingLink[];
    // Derived
    durationEstimate: string;
}

export interface StreamingLink {
    title: string;
    thumbnail?: string;
    url: string;
    site: string;
}

export interface EpisodesResponse {
    animeId: number;
    malId?: number;
    totalEpisodes: number;
    episodes: EpisodeDetail[];
    streamingEpisodes: StreamingLink[];
    sources: string[]; // which APIs contributed
    cached: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const JIKAN_BASE = 'https://api.jikan.moe/v4';
const ANILIST_URL = 'https://graphql.anilist.co';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const JIKAN_RATE_LIMIT_MS = 400; // Jikan allows ~3 req/s

// ─── Cache helpers ──────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

function getCached<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCache<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage might be full — silently fail
    }
}

// ─── Throttle for Jikan ─────────────────────────────────────────────────────────

let lastJikanCall = 0;

async function jikanFetch<T>(url: string): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, JIKAN_RATE_LIMIT_MS - (now - lastJikanCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastJikanCall = Date.now();

    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 429) {
            // Rate limited — wait and retry once
            await new Promise(r => setTimeout(r, 1500));
            lastJikanCall = Date.now();
            const retryRes = await fetch(url);
            if (!retryRes.ok) throw new Error(`Jikan error: ${retryRes.status}`);
            return retryRes.json();
        }
        throw new Error(`Jikan error: ${res.status}`);
    }
    return res.json();
}

// ─── Jikan: Fetch episode list for a MAL ID ────────────────────────────────────

interface JikanEpisode {
    mal_id: number;
    url: string;
    title: string;
    title_japanese?: string;
    title_romanji?: string;
    aired?: string;
    score?: number;
    filler: boolean;
    recap: boolean;
    forum_url?: string;
}

interface JikanEpisodesResponse {
    data: JikanEpisode[];
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
    };
}

async function fetchJikanEpisodes(malId: number): Promise<JikanEpisode[]> {
    const cacheKey = `jikan_eps_${malId}`;
    const cached = getCached<JikanEpisode[]>(cacheKey);
    if (cached) return cached;

    const allEpisodes: JikanEpisode[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const resp = await jikanFetch<JikanEpisodesResponse>(
            `${JIKAN_BASE}/anime/${malId}/episodes?page=${page}`
        );
        allEpisodes.push(...resp.data);
        hasMore = resp.pagination.has_next_page;
        page++;

        // Safety: cap at 10 pages (1000 episodes)
        if (page > 10) break;
    }

    setCache(cacheKey, allEpisodes);
    return allEpisodes;
}

// ─── Jikan: Fetch episode thumbnails (pictures) ────────────────────────────────

interface JikanPicture {
    jpg: { image_url: string; small_image_url?: string; large_image_url?: string };
}

async function fetchJikanAnimePictures(malId: number): Promise<string | undefined> {
    try {
        const resp = await jikanFetch<{ data: JikanPicture[] }>(
            `${JIKAN_BASE}/anime/${malId}/pictures`
        );
        return resp.data?.[0]?.jpg?.large_image_url || resp.data?.[0]?.jpg?.image_url;
    } catch {
        return undefined;
    }
}

// ─── AniList: Fetch streaming episodes ──────────────────────────────────────────

const STREAMING_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      idMal
      episodes
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
    }
  }
`;

interface AniListStreamingResult {
    data: {
        Media: {
            idMal: number | null;
            episodes: number | null;
            streamingEpisodes: StreamingLink[];
        };
    };
}

async function fetchAniListStreaming(anilistId: number): Promise<{
    malId: number | null;
    totalEpisodes: number | null;
    streamingEpisodes: StreamingLink[];
}> {
    const cacheKey = `al_streaming_${anilistId}`;
    const cached = getCached<{ malId: number | null; totalEpisodes: number | null; streamingEpisodes: StreamingLink[] }>(cacheKey);
    if (cached) return cached;

    const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: STREAMING_QUERY, variables: { id: anilistId } }),
    });

    const json: AniListStreamingResult = await res.json();
    const result = {
        malId: json.data.Media.idMal,
        totalEpisodes: json.data.Media.episodes,
        streamingEpisodes: json.data.Media.streamingEpisodes || [],
    };

    setCache(cacheKey, result);
    return result;
}

// ─── Main: Get all episodes for an anime ────────────────────────────────────────

/**
 * Fetch all episodes for an anime by AniList ID.
 * Aggregates data from Jikan (MAL) and AniList streaming episodes.
 * 
 * @param anilistId - The AniList anime ID
 * @param options.forceRefresh - Skip cache and fetch fresh data
 * @returns EpisodesResponse with merged episode data
 */
export async function fetchAllEpisodes(
    anilistId: number,
    options: { forceRefresh?: boolean } = {}
): Promise<EpisodesResponse> {
    // Check full response cache
    const fullCacheKey = `episodes_full_${anilistId}`;
    if (!options.forceRefresh) {
        const cached = getCached<EpisodesResponse>(fullCacheKey);
        if (cached) return { ...cached, cached: true };
    }

    const sources: string[] = [];

    // Step 1: Get MAL ID + streaming episodes from AniList
    const anilistData = await fetchAniListStreaming(anilistId);
    sources.push('AniList');

    const totalEpisodes = anilistData.totalEpisodes || 0;

    // Step 2: If we have a MAL ID, fetch detailed episodes from Jikan
    let jikanEpisodes: JikanEpisode[] = [];
    if (anilistData.malId) {
        try {
            jikanEpisodes = await fetchJikanEpisodes(anilistData.malId);
            sources.push('Jikan/MAL');
        } catch (err) {
            console.warn('Jikan episodes fetch failed:', err);
        }
    }

    // Step 3: Merge episodes
    const episodes: EpisodeDetail[] = [];
    const numEps = Math.max(totalEpisodes, jikanEpisodes.length, 1);

    // Match AniList streaming episodes to episode numbers by index
    const streamingByIndex = anilistData.streamingEpisodes.reduce((acc, link, i) => {
        // Try to extract episode number from title like "Episode 1 - Title"
        const match = link.title?.match(/(?:Episode|Ep\.?)\s*(\d+)/i);
        const epNum = match ? parseInt(match[1]) : i + 1;
        if (!acc[epNum]) acc[epNum] = [];
        acc[epNum].push(link);
        return acc;
    }, {} as Record<number, StreamingLink[]>);

    for (let i = 0; i < numEps; i++) {
        const jikanEp = jikanEpisodes[i];
        const epNumber = jikanEp?.mal_id || i + 1;
        const streamLinks = streamingByIndex[epNumber] || [];

        episodes.push({
            number: epNumber,
            title: jikanEp?.title || `Episode ${epNumber}`,
            titleJapanese: jikanEp?.title_japanese,
            aired: jikanEp?.aired || undefined,
            score: jikanEp?.score || undefined,
            filler: jikanEp?.filler || false,
            recap: jikanEp?.recap || false,
            thumbnail: streamLinks[0]?.thumbnail || undefined,
            url: jikanEp?.url || undefined,
            streamingLinks: streamLinks,
            durationEstimate: '24 min', // default for TV anime
        });
    }

    const response: EpisodesResponse = {
        animeId: anilistId,
        malId: anilistData.malId || undefined,
        totalEpisodes: numEps,
        episodes,
        streamingEpisodes: anilistData.streamingEpisodes,
        sources,
        cached: false,
    };

    setCache(fullCacheKey, response);
    return response;
}

// ─── Single episode fetch ───────────────────────────────────────────────────────

/**
 * Fetch a single episode's details.
 * Uses the full episodes cache if available, otherwise fetches everything.
 */
export async function fetchEpisode(
    anilistId: number,
    episodeNumber: number
): Promise<EpisodeDetail | null> {
    const response = await fetchAllEpisodes(anilistId);
    return response.episodes.find(ep => ep.number === episodeNumber) || null;
}

// ─── Search for episodes across multiple anime ─────────────────────────────────

/**
 * Fetch episodes for multiple anime at once.
 * Useful for building a "recent episodes" feed across multiple shows.
 * Rate-limited automatically to respect Jikan's limits.
 */
export async function fetchEpisodesForMultiple(
    anilistIds: number[]
): Promise<Map<number, EpisodesResponse>> {
    const results = new Map<number, EpisodesResponse>();

    for (const id of anilistIds) {
        try {
            const eps = await fetchAllEpisodes(id);
            results.set(id, eps);
        } catch (err) {
            console.warn(`Failed to fetch episodes for anime ${id}:`, err);
        }
    }

    return results;
}

// ─── Utility: Get recently aired episodes from a list of anime ──────────────────

export function getRecentlyAiredEpisodes(
    episodesMap: Map<number, EpisodesResponse>,
    limit: number = 20
): (EpisodeDetail & { animeId: number })[] {
    const allEps: (EpisodeDetail & { animeId: number })[] = [];

    episodesMap.forEach((response, animeId) => {
        response.episodes.forEach(ep => {
            if (ep.aired) {
                allEps.push({ ...ep, animeId });
            }
        });
    });

    // Sort by aired date descending
    allEps.sort((a, b) => {
        const dateA = new Date(a.aired!).getTime();
        const dateB = new Date(b.aired!).getTime();
        return dateB - dateA;
    });

    return allEps.slice(0, limit);
}
