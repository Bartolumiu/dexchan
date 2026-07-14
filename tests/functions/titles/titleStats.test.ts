import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import getTitleStats from "../../../src/functions/titles/titleStats";
import fetchJSON from "../../../src/functions/tools/fetchJSON";
import { ProviderType } from "../../../src/constants/providers";

// --- Mocking Dependencies ---
jest.mock("../../../src/functions/tools/fetchJSON", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("getTitleStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Early Returns", () => {
    it("should return null if ID is falsy", async () => {
      expect(await getTitleStats("", "mangadex")).toBeNull();
      expect(await getTitleStats(0, "mangadex")).toBeNull();
    });

    it("should return null for unknown provider types", async () => {
      expect(await getTitleStats("123", "unknown" as ProviderType)).toBeNull();
    });
  });

  describe("MangaBaka Provider", () => {
    it("should return the empty stats template immediately", async () => {
      const stats = await getTitleStats("123", "mangabaka");

      expect(stats).toEqual({
        title: {
          comments: { threadId: null, repliesCount: 0 },
          rating: {
            average: "0.00",
            bayesian: "0.00",
            distribution: {},
            count: 0,
          },
          follows: 0,
          views: 0,
        },
        chapters: { views: 0, comments: 0, reactions: 0 },
      });
      expect(fetchJSON).not.toHaveBeenCalled(); // Ensures no API calls are made
    });
  });

  describe("MangaDex Provider", () => {
    it("should return null if fetchJSON returns null or no statistics object", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue(null);
      expect(await getTitleStats("md-1", "mangadex")).toBeNull();

      (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: {} });
      expect(await getTitleStats("md-1", "mangadex")).toBeNull();
    });

    it("should return null if the specific title ID is missing in statistics", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({
        statistics: { "different-id": {} },
      });
      expect(await getTitleStats("md-1", "mangadex")).toBeNull();
    });

    it("should parse and format valid MangaDex stats", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({
        statistics: {
          "md-1": {
            comments: { threadId: 999, repliesCount: 15 },
            rating: {
              average: 8.543,
              bayesian: 8.211,
              distribution: { "10": 5, "9": 3, "8": 2 }, // Total count = 10
            },
            follows: 500,
          },
        },
      });

      const stats = await getTitleStats("md-1", "mangadex");

      const calledUrl = (fetchJSON as jest.Mock).mock.calls[0][0] as URL;
      expect(calledUrl.href).toBe(
        "https://api.mangadex.org/statistics/manga/md-1"
      );

      expect(stats!.title.comments.threadId).toBe(999);
      expect(stats!.title.comments.repliesCount).toBe(15);
      expect(stats!.title.rating.average).toBe("8.54");
      expect(stats!.title.rating.bayesian).toBe("8.21");
      expect(stats!.title.rating.count).toBe(10);
      expect(stats!.title.follows).toBe(500);
      expect(stats!.chapters.views).toBe(0); // MangaDex does not provide chapter stats in this endpoint
    });

    it("should safely fallback missing values to 0 / defaults", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({
        statistics: {
          "md-empty": {}, // Entirely empty attributes
        },
      });

      const stats = await getTitleStats("md-empty", "mangadex");

      expect(stats!.title.comments.threadId).toBeNull();
      expect(stats!.title.comments.repliesCount).toBe(0);
      expect(stats!.title.rating.average).toBe("0.00");
      expect(stats!.title.rating.bayesian).toBe("0.00");
      expect(stats!.title.rating.count).toBe(0);
      expect(stats!.title.rating.distribution["10"]).toBe(0); // default distribution template
      expect(stats!.title.follows).toBe(0);
    });
  });

  describe("NamiComi Provider", () => {
    it("should return null if ratings fetch fails", async () => {
      (fetchJSON as jest.Mock).mockImplementation(async (url: any) => {
        if (url.href.includes("rating")) return null;
        return { data: {} };
      });

      expect(await getTitleStats("nc-1", "namicomi")).toBeNull();
    });

    it("should return null if stats fetch fails", async () => {
      (fetchJSON as jest.Mock).mockImplementation(async (url: any) => {
        if (url.href.includes("statistics")) return null;
        return { data: {} };
      });

      expect(await getTitleStats("nc-1", "namicomi")).toBeNull();
    });

    it("should parse and format valid NamiComi stats and sum chapter data safely", async () => {
      (fetchJSON as jest.Mock).mockImplementation(async (url: any) => {
        if (url.href.includes("rating")) {
          return { data: { attributes: { rating: 4.876, count: 50 } } };
        }
        if (url.href.includes("statistics")) {
          return {
            data: {
              attributes: {
                commentCount: 20,
                followCount: 300,
                viewCount: 1500,
                extra: {
                  totalChapterViews: { ch1: 100, ch2: 200 }, // sum: 300
                  totalChapterComments: { ch1: 5, invalid: "abc", empty: null }, // sum: 5 (NaN falls back to 0)
                  totalChapterReactions: null, // should fall back to 0
                },
              },
            },
          };
        }
      });

      const stats = await getTitleStats("nc-1", "namicomi");

      expect(stats!.title.comments.repliesCount).toBe(20);
      expect(stats!.title.rating.bayesian).toBe("4.88");
      expect(stats!.title.rating.count).toBe(50);
      expect(stats!.title.follows).toBe(300);
      expect(stats!.title.views).toBe(1500);
      expect(stats!.chapters.views).toBe(300);
      expect(stats!.chapters.comments).toBe(5);
      expect(stats!.chapters.reactions).toBe(0);
    });

    it("should safely fallback missing values to 0 / defaults", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: {} }); // Both endpoints return empty data

      const stats = await getTitleStats("nc-empty", "namicomi");

      expect(stats!.title.comments.repliesCount).toBe(0);
      expect(stats!.title.rating.bayesian).toBe("0.00");
      expect(stats!.title.rating.count).toBe(0);
      expect(stats!.title.follows).toBe(0);
      expect(stats!.title.views).toBe(0);
      expect(stats!.chapters.views).toBe(0);
      expect(stats!.chapters.comments).toBe(0);
      expect(stats!.chapters.reactions).toBe(0);
    });
  });
});
