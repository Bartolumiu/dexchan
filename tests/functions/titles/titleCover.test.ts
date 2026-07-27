import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import getCover from "../../../src/functions/titles/titleCover";
import fetchImageAsBuffer from "../../../src/functions/tools/fetchImageAsBuffer";
import { ProviderType } from "../../../src/constants/providers";

jest.mock("../../../src/functions/tools/fetchImageAsBuffer", () => ({
  __esModule: true,
  default: jest.fn(async (url) => {
    return url ? Buffer.from("mock-cover-data") : null;
  }),
}));

describe("getCover", () => {
  const mockBuffer = Buffer.from("mock-cover-data");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return null immediately if title is falsey", async () => {
    const result = await getCover(null, "mangadex");
    expect(result).toBeNull();
    expect(fetchImageAsBuffer).toHaveBeenCalledWith(null);
  });

  describe("MangaBaka Provider", () => {
    it("should return null if cover url is missing", async () => {
      const result = await getCover({ cover: {} }, "mangabaka");
      expect(result).toBeNull();
    });

    it("should return buffer if cover url exists", async () => {
      const title = {
        cover: { raw: "https://example.com/cover.jpg" },
      };
      const result = await getCover(title, "mangabaka");

      expect(result).toEqual(mockBuffer);
      const url = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
      expect(url.href).toBe("https://example.com/cover.jpg");
    });

    it("should return null if cover url is malformed", async () => {
      const title = {
        cover: { raw: "\0invalid" },
      };
      const result = await getCover(title, "mangabaka");
      expect(result).toBeNull();
    });
  });

  describe("MangaDex Provider", () => {
    it("should return null if title id is missing", async () => {
      const result = await getCover({}, "mangadex");
      expect(result).toBeNull();
    });

    it("should return null if cover_art relationship is missing", async () => {
      const title = { id: "123", relationships: [] };
      const result = await getCover(title, "mangadex");
      expect(result).toBeNull();
    });

    it("should return null if fileName is missing in cover_art", async () => {
      const title = {
        id: "123",
        relationships: [{ type: "cover_art", attributes: {} }],
      };
      const result = await getCover(title, "mangadex");
      expect(result).toBeNull();
    });

    it("should construct URL correctly when id and fileName exist", async () => {
      const title = {
        id: "123",
        relationships: [
          { type: "cover_art", attributes: { fileName: "cover.png" } },
        ],
      };
      const result = await getCover(title, "mangadex");

      expect(result).toEqual(mockBuffer);
      const url = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
      expect(url.href).toBe(
        "https://uploads.mangadex.org/covers/123/cover.png.512.jpg"
      );
    });

  });

  describe("NamiComi Provider", () => {
    it("should return null if title id is missing", async () => {
      const result = await getCover({}, "namicomi");
      expect(result).toBeNull();
    });

    it("should map Discord locales to short locales", async () => {
      const title = {
        id: "456",
        relationships: [
          {
            type: "cover_art",
            attributes: { locale: "es", fileName: "spain.png" },
          },
        ],
      };
      const result = await getCover(title, "namicomi", "es-ES"); // Will map to "es"

      expect(result).toEqual(mockBuffer);
      const url = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
      expect(url.href).toBe(
        "https://uploads.namicomi.com/covers/456/spain.png.512.jpg"
      );
    });

    it("should fallback 'es' to 'es-419' if 'es' cover is missing", async () => {
      const title = {
        id: "456",
        relationships: [
          {
            type: "cover_art",
            attributes: { locale: "es-419", fileName: "latam.png" },
          },
        ],
      };
      const result = await getCover(title, "namicomi", "es");

      expect(result).toEqual(mockBuffer);
      const url = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
      expect(url.href).toBe(
        "https://uploads.namicomi.com/covers/456/latam.png.512.jpg"
      );
    });

    it("should fallback to the first cover if no locale matches", async () => {
      const title = {
        id: "456",
        relationships: [
          {
            type: "cover_art",
            attributes: { locale: "fr", fileName: "french.png" },
          },
        ],
      };
      const result = await getCover(title, "namicomi", "en"); // en missing, fallback to first item

      expect(result).toEqual(mockBuffer);
      const url = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
      expect(url.href).toBe(
        "https://uploads.namicomi.com/covers/456/french.png.512.jpg"
      );
    });

    it("should return null if relationships is missing entirely", async () => {
      const title = { id: "456" };
      const result = await getCover(title, "namicomi");
      expect(result).toBeNull();
    });

    it("should return null if no covers have a fileName", async () => {
      const title = {
        id: "456",
        relationships: [{ type: "cover_art", attributes: {} }],
      };
      const result = await getCover(title, "namicomi");
      expect(result).toBeNull();
    });

  });

  describe("Unknown Provider", () => {
    it("should pass null to fetchImageAsBuffer for unknown provider", async () => {
      const result = await getCover({ id: "1" }, "unknown" as ProviderType);
      expect(result).toBeNull();
    });
  });
});
