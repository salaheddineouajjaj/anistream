
import { Anime } from '../types';

const ANILIST_URL = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int, $genre: String, $year: Int, $status: MediaStatus, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(search: $search, type: ANIME, genre: $genre, seasonYear: $year, status: $status, sort: $sort) {
        id
        idMal
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
        bannerImage
        description
        status
        episodes
        season
        seasonYear
        averageScore
        popularity
        trending
        genres
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  }
`;

export async function fetchAnimeList(params: {
  search?: string;
  page?: number;
  perPage?: number;
  genre?: string;
  year?: number;
  status?: string;
  sort?: string[];
}) {
  const variables = {
    search: params.search,
    page: params.page || 1,
    perPage: params.perPage || 24,
    genre: params.genre,
    year: params.year,
    status: params.status,
    sort: params.sort || ['TRENDING_DESC', 'POPULARITY_DESC'],
  };

  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: SEARCH_QUERY, variables }),
  });

  const data = await response.json();
  return data.data.Page;
}

export async function fetchAnimeDetails(id: number) {
  const DETAILS_QUERY = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
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
        bannerImage
        description
        status
        episodes
        season
        seasonYear
        averageScore
        popularity
        favourites
        genres
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
        recommendations {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              averageScore
            }
          }
        }
      }
    }
  `;

  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: DETAILS_QUERY, variables: { id } }),
  });

  const data = await response.json();
  return data.data.Media;
}
