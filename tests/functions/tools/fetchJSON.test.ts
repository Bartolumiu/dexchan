import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import fetchJSON from "../../../src/functions/tools/fetchJSON";

describe("fetchJSON", () => {
  const mockUrl = new URL("https://api.example.com/data.json");

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null if url is null", async () => {
    const result = await fetchJSON(null);
    expect(result).toBeNull();
  });

  it("should return JSON data if fetch is successful", async () => {
    const mockData = { key: "value" };
    const mockResponse = {
      ok: true,
      json: jest.fn<() => Promise<any>>().mockResolvedValue(mockData),
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchJSON(mockUrl);

    expect(global.fetch).toHaveBeenCalledWith(
      mockUrl.toString(),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it("should return null if fetch response is not ok", async () => {
    const mockResponse = {
      ok: false,
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchJSON(mockUrl);

    expect(result).toBeNull();
  });

  it("should return null if fetch throws an error", async () => {
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("Fetch failed") as any);

    const result = await fetchJSON(mockUrl);

    expect(result).toBeNull();
  });

  it("should return null if json parsing throws an error", async () => {
    const mockResponse = {
      ok: true,
      json: jest
        .fn<() => Promise<any>>()
        .mockRejectedValue(new Error("JSON parsing failed")),
    };
    jest.spyOn(global, "fetch").mockResolvedValue(mockResponse as any);

    const result = await fetchJSON(mockUrl);

    expect(result).toBeNull();
  });
});
