import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import getBanner from "../../../src/functions/titles/titleBanner";
import fetchImageAsBuffer from "../../../src/functions/tools/fetchImageAsBuffer";

// Mock the network fetcher
jest.mock("../../../src/functions/tools/fetchImageAsBuffer", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("getBanner", () => {
  const mockBuffer = Buffer.from("mock-banner-data");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should construct the correct URL and return a Buffer when title data is valid", async () => {
    (fetchImageAsBuffer as jest.Mock<any>).mockResolvedValue(mockBuffer);

    const validTitle = {
      id: "12345",
      attributes: {
        bannerFileName: "banner.jpg",
      },
    };

    const result = await getBanner(validTitle, "namicomi");

    expect(result).toBe(mockBuffer);

    // Verify the URL was constructed perfectly
    const calledUrl = (fetchImageAsBuffer as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl).toBeInstanceOf(URL);
    expect(calledUrl.href).toBe(
      "https://uploads.namicomi.com/media/manga/12345/banner/banner.jpg"
    );
  });

  it("should pass null to fetchImageAsBuffer if title ID is missing", async () => {
    (fetchImageAsBuffer as jest.Mock<any>).mockResolvedValue(null);

    const noIdTitle = {
      attributes: {
        bannerFileName: "banner.jpg",
      },
    };

    const result = await getBanner(noIdTitle, "namicomi");

    expect(result).toBeNull();
    expect(fetchImageAsBuffer).toHaveBeenCalledWith(null);
  });

  it("should pass null to fetchImageAsBuffer if bannerFileName is missing", async () => {
    (fetchImageAsBuffer as jest.Mock<any>).mockResolvedValue(null);

    const noFilenameTitle = {
      id: "12345",
      attributes: {}, // Missing bannerFileName
    };

    const result = await getBanner(noFilenameTitle, "namicomi");

    expect(result).toBeNull();
    expect(fetchImageAsBuffer).toHaveBeenCalledWith(null);
  });

  it("should gracefully handle a completely null or undefined title object", async () => {
    (fetchImageAsBuffer as jest.Mock<any>).mockResolvedValue(null);

    const resultUndefined = await getBanner(undefined, "namicomi");
    const resultNull = await getBanner(null, "namicomi");

    expect(resultUndefined).toBeNull();
    expect(resultNull).toBeNull();

    // Both calls should pass null down to the fetcher
    expect(fetchImageAsBuffer).toHaveBeenCalledTimes(2);
    expect(fetchImageAsBuffer).toHaveBeenNthCalledWith(1, null);
    expect(fetchImageAsBuffer).toHaveBeenNthCalledWith(2, null);
  });
});
