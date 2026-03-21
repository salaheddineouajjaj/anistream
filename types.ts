
export interface Anime {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string;
  };
  bannerImage: string;
  description: string;
  status: string;
  episodes: number;
  season: string;
  seasonYear: number;
  averageScore: number;
  genres: string[];
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
}

export interface Episode {
  number: number;
  title?: string;
  thumbnail?: string;
}

export interface StreamingSource {
  serverName: string;
  url: string;
  priority: number;
  isActive: boolean;
}

export interface UserProgress {
  animeId: number;
  episodeNumber: number;
  progressSeconds: number;
  lastUpdated: number;
}
