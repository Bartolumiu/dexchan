import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import fetchImageAsBuffer from "../../../src/functions/tools/fetchImageAsBuffer";

describe("fetchImageAsBuffer", () => {
  const mockUrl = new URL("https://example.com/image.png");

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null if url is null", async () => {
    const result = await fetchImageAsBuffer(null);
    expect(result).toBeNull();
  });

  it("should return a Buffer if fetch is successful", async () => {
    const mockBuffer = Buffer.from("mock image data");
    const mockArrayBuffer = new Uint8Array(mockBuffer).buffer;
    const mockResponse = {
      ok: true,
      arrayBuffer: jest
        .fn<() => Promise<ArrayBuffer>>()
        .mockResolvedValue(mockArrayBuffer),
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchImageAsBuffer(mockUrl);

    expect(global.fetch).toHaveBeenCalled();
    expect(result).toEqual(mockBuffer);
  });

  it("should return null if fetch response is not ok", async () => {
    const mockResponse = {
      ok: false,
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchImageAsBuffer(mockUrl);

    expect(result).toBeNull();
  });

  it("should return null if fetch throws an error", async () => {
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Fetch failed") as any);

    const result = await fetchImageAsBuffer(mockUrl);

    expect(result).toBeNull();
  });

  it("should return null if arrayBuffer throws an error", async () => {
    const mockResponse = {
      ok: true,
      arrayBuffer: jest
        .fn<() => Promise<ArrayBuffer>>()
        .mockRejectedValue(new Error("arrayBuffer failed")),
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchImageAsBuffer(mockUrl);

    expect(result).toBeNull();
  });
});
