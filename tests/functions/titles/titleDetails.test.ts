import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import getTitleDetails from "../../../src/functions/titles/titleDetails";
import fetchJSON from "../../../src/functions/tools/fetchJSON";
import { ProviderType } from "../../../src/constants/providers";

// Mock the network fetcher
jest.mock("../../../src/functions/tools/fetchJSON", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("getTitleDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return null immediately if ID is falsey", async () => {
    const result1 = await getTitleDetails("", "mangadex");
    const result2 = await getTitleDetails(0, "namicomi"); // 0 is falsy
    expect(result1).toBeNull();
    expect(result2).toBeNull();
    expect(fetchJSON).not.toHaveBeenCalled();
  });

  it("should return null for an unknown provider type", async () => {
    const result = await getTitleDetails("123", "unknown" as ProviderType);
    expect(result).toBeNull();
    expect(fetchJSON).not.toHaveBeenCalled();
  });

  it("should return null if fetchJSON returns a null or empty response", async () => {
    (fetchJSON as jest.Mock<any>).mockResolvedValue(null);
    const result = await getTitleDetails("123", "mangabaka");
    expect(result).toBeNull();
  });

  it("should return response.data on a successful fetch", async () => {
    const mockData = { id: "123", name: "Test Manga" };
    (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: mockData });
    const result = await getTitleDetails("123", "mangabaka");
    expect(result).toEqual(mockData);
  });

  describe("MangaBaka Provider", () => {
    it("should build correct URL for MangaBaka", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: {} });
      await getTitleDetails("mb-123", "mangabaka");

      const calledUrl = (fetchJSON as jest.Mock).mock.calls[0][0] as URL;
      expect(calledUrl.href).toBe("https://api.mangabaka.org/v1/series/mb-123");
    });
  });

  describe("MangaDex Provider", () => {
    it("should build correct URL with include[] parameters for MangaDex", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: {} });
      await getTitleDetails("md-123", "mangadex");

      const calledUrl = (fetchJSON as jest.Mock).mock.calls[0][0] as URL;

      expect(calledUrl.origin + calledUrl.pathname).toBe(
        "https://api.mangadex.org/manga/md-123"
      );
      expect(calledUrl.searchParams.getAll("includes[]")).toEqual([
        "author",
        "artist",
        "cover_art",
        "tag",
      ]);
    });
  });

  describe("NamiComi Provider", () => {
    it("should build correct URL with include[] parameters for NamiComi", async () => {
      (fetchJSON as jest.Mock<any>).mockResolvedValue({ data: {} });
      await getTitleDetails("nc-123", "namicomi");

      const calledUrl = (fetchJSON as jest.Mock).mock.calls[0][0] as URL;

      expect(calledUrl.origin + calledUrl.pathname).toBe(
        "https://api.namicomi.com/title/nc-123"
      );
      expect(calledUrl.searchParams.getAll("includes[]")).toEqual([
        "organization",
        "cover_art",
        "tag",
      ]);
    });
  });
});
