/**
 * Anime Streaming Service v3
 * 
 * Multi-provider embed system for actual anime episodes with Arabic subtitles.
 * 
 * Confirmed working servers (tested Feb 2025):
 * 
 * 1. VidSrc.cc      — Clean player, Arabic subs built-in, minimal ads
 * 2. VidSrc.xyz     — Alternative mirror of VidSrc, same quality
 * 3. MultiEmbed     — Aggregates multiple sources, good availability
 * 4. MoviesAPI      — Clean player, no sandbox allowed
 * 5. VidSrc.in      — Another VidSrc mirror
 * 6. 2Embed         — Large library, anime support
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface StreamServer {
    name: string;
    nameAr: string;               // Arabic name for the server
    quality: string;
    health: 'perfect' | 'stable' | 'legacy';
    arabicSubs: boolean;           // Has built-in Arabic subtitle support
    lowAds: boolean;               // Has minimal ads
    noSandbox?: boolean;           // If true, don't use sandbox attribute on iframe
    getEmbedUrl: (tmdbId: number, season: number, episode: number) => string;
}

// ─── Slug helper ────────────────────────────────────────────────────────────────

export function titleToSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/[&]/g, 'and')
        .replace(/[:;,!?.()\[\]{}"]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ─── Streaming Servers ──────────────────────────────────────────────────────────

export const ANIME_SERVERS: StreamServer[] = [
    {
        name: 'VIDSRC',
        nameAr: 'سيرفر ١',
        quality: 'HD',
        health: 'perfect',
        arabicSubs: true,
        lowAds: true,
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${ep}`,
    },
    {
        name: 'MULTI-SRC',
        nameAr: 'سيرفر ٢',
        quality: '1080P',
        health: 'perfect',
        arabicSubs: true,
        lowAds: true,
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${ep}`,
    },
    {
        name: 'MOVIES-API',
        nameAr: 'سيرفر ٣',
        quality: '1080P',
        health: 'stable',
        arabicSubs: true,
        lowAds: true,
        noSandbox: true,   // moviesapi.club blocks sandboxed iframes
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://moviesapi.club/tv/${tmdbId}-${season}-${ep}`,
    },
    {
        name: 'VIDSRC-2',
        nameAr: 'سيرفر ٤',
        quality: 'HD',
        health: 'stable',
        arabicSubs: true,
        lowAds: true,
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${ep}`,
    },
    {
        name: 'EMBED-2',
        nameAr: 'سيرفر ٥',
        quality: '720P',
        health: 'stable',
        arabicSubs: false,
        lowAds: false,
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${ep}`,
    },
    {
        name: 'VIDSRC-IN',
        nameAr: 'سيرفر ٦',
        quality: 'HD',
        health: 'legacy',
        arabicSubs: true,
        lowAds: true,
        getEmbedUrl: (tmdbId, season, ep) =>
            `https://vidsrc.in/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${ep}`,
    },
];

// ─── Popular anime TMDB ID mapping ──────────────────────────────────────────────
// Pre-populated with popular anime to avoid external API calls.

const POPULAR_ANIME_TMDB: Record<string, number> = {
    // ─── Shonen / Action ─────────────────────────────
    'one piece': 37854,
    'naruto': 46260,
    'naruto shippuden': 31910,
    'naruto shippuuden': 31910,
    'boruto': 75941,
    'boruto naruto next generations': 75941,
    'bleach': 30984,
    'bleach thousand-year blood war': 101759,
    'bleach sennen kessen-hen': 101759,
    'dragon ball z': 12971,
    'dragon ball super': 62715,
    'dragon ball': 12609,
    'dragon ball gt': 12609,
    'dragon ball daima': 244653,
    'hunter x hunter': 46298,
    'hunter x hunter 2011': 46298,
    'one punch man': 63926,
    'my hero academia': 65930,
    'boku no hero academia': 65930,
    'demon slayer': 85937,
    'kimetsu no yaiba': 85937,
    'jujutsu kaisen': 95479,
    'black clover': 73223,
    'fairy tail': 46261,
    'yu yu hakusho': 31588,
    'rurouni kenshin': 42351,
    'gintama': 34096,
    'world trigger': 61278,
    'dr stone': 86031,
    'dr. stone': 86031,
    'fire force': 77370,
    'enen no shouboutai': 77370,
    'blue exorcist': 46195,
    'ao no exorcist': 46195,
    'soul eater': 36511,
    'inuyasha': 31347,
    'd.gray-man': 34095,
    'assassination classroom': 61648,
    'ansatsu kyoushitsu': 61648,

    // ─── Modern Hits (2020-2025) ─────────────────────
    'attack on titan': 1429,
    'shingeki no kyojin': 1429,
    'chainsaw man': 114410,
    'spy x family': 130319,
    'solo leveling': 203624,
    'na honjaman level-up': 203624,
    'frieren': 209867,
    'sousou no frieren': 209867,
    'frieren beyond journeys end': 209867,
    'blue lock': 135583,
    'oshi no ko': 203737,
    'dandadan': 241213,
    'mushoku tensei': 98659,
    'vinland saga': 75662,
    'hells paradise': 140743,
    'jigokuraku': 140743,
    'undead unluck': 221007,
    'kaiju no 8': 244401,
    'wind breaker': 238804,
    'zom 100': 209188,
    'mashle': 206972,
    'mashle magic and muscles': 206972,
    'the apothecary diaries': 223340,
    'kusuriya no hitorigoto': 223340,
    'shangri-la frontier': 236253,

    // ─── Classics & Must-Watch ───────────────────────
    'death note': 13916,
    'fullmetal alchemist brotherhood': 31911,
    'fullmetal alchemist': 31910,
    'cowboy bebop': 30991,
    'steins gate': 62085,
    'steinsgate': 62085,
    'steins gate 0': 73048,
    'code geass': 37084,
    'code geass lelouch of the rebellion': 37084,
    'neon genesis evangelion': 890,
    'mob psycho 100': 63515,
    'tokyo ghoul': 61374,
    'tokyo ghoul re': 74852,
    'parasyte': 62195,
    'parasyte the maxim': 62195,
    'kiseijuu': 62195,
    'psycho-pass': 45601,
    'psycho pass': 45601,
    'samurai champloo': 30572,
    'trigun': 31420,
    'trigun stampede': 153312,
    'berserk': 31645,
    'monster': 13838,
    'ghost in the shell': 32636,
    'death parade': 62721,

    // ─── Isekai ──────────────────────────────────────
    'sword art online': 45782,
    'no game no life': 60863,
    'the promised neverland': 83097,
    'yakusoku no neverland': 83097,
    're zero': 63435,
    're:zero': 63435,
    'konosuba': 65740,
    'overlord': 64196,
    'that time i got reincarnated as a slime': 75694,
    'tensei shitara slime datta ken': 75694,
    'rising of the shield hero': 83095,
    'tate no yuusha no nariagari': 83095,
    'log horizon': 49875,
    'the beginning after the end': 224733,
    'mushoku tensei jobless reincarnation': 98659,

    // ─── Romance / Slice of Life ─────────────────────
    'your lie in april': 61663,
    'shigatsu wa kimi no uso': 61663,
    'toradora': 42705,
    'clannad': 34441,
    'clannad after story': 34441,
    'anohana': 46569,
    'violet evergarden': 70593,
    'horimiya': 96357,
    'kaguya-sama': 88987,
    'kaguya-sama love is war': 88987,
    'fruits basket': 77236,
    'my dress-up darling': 135726,
    'sono bisque doll wa koi wo suru': 135726,
    'bocchi the rock': 187974,

    // ─── Thriller / Mystery ──────────────────────────
    'tokyo revengers': 102988,
    'akame ga kill': 62226,
    'dororo': 83726,
    'erased': 63631,
    'boku dake ga inai machi': 63631,
    'another': 45539,
    'future diary': 45535,
    'mirai nikki': 45535,
    'made in abyss': 72636,

    // ─── Sports ──────────────────────────────────────
    'haikyuu': 62832,
    'haikyu': 62832,
    'kuroko no basket': 47999,
    'kurokos basketball': 47999,
    'slam dunk': 30361,
    'yuri on ice': 67070,

    // ─── Mecha / Sci-fi ─────────────────────────────
    'gurren lagann': 37071,
    'tengen toppa gurren lagann': 37071,
    'mobile suit gundam': 2351,
    'darling in the franxx': 74283,
    '86': 110679,
    '86 eighty-six': 110679,
    'cyberpunk edgerunners': 135044,

    // ─── Recent (2024-2025) ──────────────────────────
    'tower of god': 86153,
    're monster': 241879,
    'sakamoto days': 258440,
    'my happy marriage': 204095,
    'watashi no shiawase na kekkon': 204095,
    'dungeon meshi': 217265,
    'delicious in dungeon': 217265,
    'nier automata': 210519,
};

// ─── TMDB ID Cache ──────────────────────────────────────────────────────────────

const TMDB_CACHE_KEY = 'tmdb_id_cache';

function getTMDBCache(): Record<string, number> {
    try {
        return JSON.parse(localStorage.getItem(TMDB_CACHE_KEY) || '{}');
    } catch {
        return {};
    }
}

function setTMDBCache(title: string, id: number): void {
    try {
        const cache = getTMDBCache();
        cache[title.toLowerCase()] = id;
        localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify(cache));
    } catch { }
}

// ─── Resolve TMDB ID ────────────────────────────────────────────────────────────

/**
 * Resolve TMDB ID for an anime title.
 * Strategy: hardcoded map → localStorage cache → null
 */
export async function resolveTMDBId(
    title: string,
    alternativeTitle?: string
): Promise<number | null> {
    const normalizedTitle = title.toLowerCase().trim();

    // 1. Check hardcoded mapping (exact & partial match)
    for (const [key, id] of Object.entries(POPULAR_ANIME_TMDB)) {
        if (id > 0 && (normalizedTitle.includes(key) || key.includes(normalizedTitle))) {
            setTMDBCache(normalizedTitle, id);
            return id;
        }
    }

    // 2. Check alt title
    if (alternativeTitle) {
        const altNorm = alternativeTitle.toLowerCase().trim();
        for (const [key, id] of Object.entries(POPULAR_ANIME_TMDB)) {
            if (id > 0 && (altNorm.includes(key) || key.includes(altNorm))) {
                setTMDBCache(normalizedTitle, id);
                return id;
            }
        }
    }

    // 3. Check localStorage cache
    const cache = getTMDBCache();
    if (cache[normalizedTitle] && cache[normalizedTitle] > 0) {
        return cache[normalizedTitle];
    }

    return null;
}

// ─── Main: Build embed URL ──────────────────────────────────────────────────────

export function getEmbedUrl(
    tmdbId: number | null,
    episode: number,
    season: number = 1,
    serverIndex: number = 0
): string {
    const server = ANIME_SERVERS[serverIndex] || ANIME_SERVERS[0];
    if (tmdbId && tmdbId > 0) {
        return server.getEmbedUrl(tmdbId, season, episode);
    }
    return '';
}
