import { ProviderType } from "../../constants/providers";
import fetchJSON from "../tools/fetchJSON";

const URL_FORMATS = {
  mangabaka: "https://api.mangabaka.org/v1/statistics/series/",
  mangadex: "https://api.mangadex.org/statistics/manga/",
  namicomi: {
    ratings: "https://api.namicomi.com/title/",
    stats: "https://api.namicomi.com/statistics/title/",
  },
} as const;

export interface TitleStats {
  title: {
    comments: {
      threadId: string | number | null;
      repliesCount: number;
    };
    rating: {
      average: string;
      bayesian: string;
      distribution: Record<string | number, number>;
      count: number;
    };
    follows: number;
    views: number;
  };
  chapters: {
    views: number;
    comments: number;
    reactions: number;
  };
}

export default async function getTitleStats(
  id: string | number,
  type: ProviderType
): Promise<TitleStats | null> {
  if (!id) return null;

  switch (type) {
    case "mangabaka":
      return await getMangaBakaStats(id as number);
    case "mangadex":
      return await getMangaDexStats(id);
    case "namicomi":
      return await getNamiComiStats(id);
    default:
      return null;
  }
}

const buildUrl = (
  id: string | number,
  endpointType: "mangabaka" | "mangadex" | "namicomi.ratings" | "namicomi.stats"
): URL => {
  switch (endpointType) {
    case "mangabaka":
      return new URL(`${URL_FORMATS.mangabaka}${id}`);
    case "mangadex":
      return new URL(`${URL_FORMATS.mangadex}${id}`);
    case "namicomi.ratings":
      return new URL(`${URL_FORMATS.namicomi.ratings}${id}/rating`);
    case "namicomi.stats":
      return new URL(`${URL_FORMATS.namicomi.stats}${id}`);
  }
};

const getMangaBakaStats = async (id: number): Promise<TitleStats> => {
  // MangaBaka does not provide statistics via their API as of now
  // Return zeroed-out object to avoid breaking the bot (there's no "stats" button for MangaBaka entries anyway)
  // Jippi plz add stats endpoint ;-;
  return getEmptyStats();
};

const getMangaDexStats = async (
  id: string | number
): Promise<TitleStats | null> => {
  const url = buildUrl(id, "mangadex");
  const data = await fetchJSON(url);

  if (!data?.statistics?.[id]) return null;
  return formatMangaDexStats(data.statistics[id]);
};

const getNamiComiStats = async (
  id: string | number
): Promise<TitleStats | null> => {
  const ratingsURL = buildUrl(id, "namicomi.ratings");
  const statsURL = buildUrl(id, "namicomi.stats");

  const [ratingsData, statsData] = await Promise.all([
    fetchJSON(ratingsURL),
    fetchJSON(statsURL),
  ]);

  if (!ratingsData || !statsData) return null;
  return formatNamiComiStats(statsData, ratingsData);
};

const formatMangaDexStats = (stats: any): TitleStats => {
  const distribution = stats.rating?.distribution || {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
  };

  // Sum up all votes in the distribution map
  const count = Object.values(distribution as Record<string, number>).reduce(
    (total, num) => total + num,
    0
  );

  return {
    title: {
      comments: {
        threadId: stats.comments?.threadId || null,
        repliesCount: stats.comments?.repliesCount || 0,
      },
      rating: {
        average: (stats.rating?.average || 0).toFixed(2),
        bayesian: (stats.rating?.bayesian || 0).toFixed(2),
        distribution: distribution,
        count: count,
      },
      follows: stats.follows || 0,
      views: 0,
    },
    chapters: {
      views: 0,
      comments: 0,
      reactions: 0,
    },
  };
};

const formatNamiComiStats = (stats: any, ratings: any): TitleStats => {
  const extra = stats.data?.attributes?.extra || {};

  // Helper to safely sum values of an object
  const sumValues = (obj: any) =>
    Object.values(obj || {}).reduce(
      (total: any, num: any) => total + (Number(num) || 0),
      0
    ) as number;

  return {
    title: {
      comments: {
        threadId: null,
        repliesCount: stats.data?.attributes?.commentCount || 0,
      },
      rating: {
        average: "0.00",
        bayesian: (ratings.data?.attributes?.rating || 0).toFixed(2),
        distribution: {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
          "6": 0,
          "7": 0,
          "8": 0,
          "9": 0,
          "10": 0,
        },
        count: ratings.data?.attributes?.count || 0,
      },
      follows: stats.data?.attributes?.followCount || 0,
      views: stats.data?.attributes?.viewCount || 0,
    },
    chapters: {
      views: sumValues(extra.totalChapterViews),
      comments: sumValues(extra.totalChapterComments),
      reactions: sumValues(extra.totalChapterReactions),
    },
  };
};

const getEmptyStats = (): TitleStats => ({
  title: {
    comments: { threadId: null, repliesCount: 0 },
    rating: { average: "0.00", bayesian: "0.00", distribution: {}, count: 0 },
    follows: 0,
    views: 0,
  },
  chapters: { views: 0, comments: 0, reactions: 0 },
});
