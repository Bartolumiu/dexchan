import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { EmbedBuilder } from "discord.js";
import setImages from "../../../src/functions/titles/setImages";
import getTitleCreators from "../../../src/functions/titles/titleCreators";
import getCover from "../../../src/functions/titles/titleCover";
import getBanner from "../../../src/functions/titles/titleBanner";
import { ProviderType } from "../../../src/constants/providers";

// Mock dependencies
jest.mock("../../../src/functions/titles/titleCreators", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleCover", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../src/functions/titles/titleBanner", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Blind mock for discord.js AttachmentBuilder and EmbedBuilder
jest.mock("discord.js", () => {
  class MockAttachmentBuilder {
    attachment: any;
    options: any;
    constructor(attachment: any, options: any) {
      this.attachment = attachment;
      this.options = options;
    }
  }

  class MockEmbedBuilder {
    setAuthor = jest.fn().mockReturnThis();
    setThumbnail = jest.fn().mockReturnThis();
    setImage = jest.fn().mockReturnThis();
  }

  return {
    AttachmentBuilder: MockAttachmentBuilder,
    EmbedBuilder: MockEmbedBuilder,
  };
});

describe("setImages", () => {
  let mockEmbed: EmbedBuilder;
  const mockTranslations: any = {
    common: {
      words: {
        unknown: "Unknown Author",
      },
    },
    utils: {
      title_embed: {
        author: {
          too_many: "Too Many Authors",
        },
      },
    },
  };
  const mockBuffer = Buffer.from("dummy-image-data");

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmbed = new (require("discord.js").EmbedBuilder)();
  });

  describe("General Routing", () => {
    it("should return an empty array for an unknown provider type", async () => {
      const attachments = await setImages(
        {},
        mockEmbed,
        "unknown" as ProviderType,
        mockTranslations
      );
      expect(attachments).toEqual([]);
    });
  });

  describe("MangaBaka Provider", () => {
    it("should return both icon and cover attachments when cover exists", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Fumi");
      (getCover as jest.Mock<any>).mockResolvedValue(mockBuffer);

      const attachments: any[] = await setImages(
        {},
        mockEmbed,
        "mangabaka",
        mockTranslations
      );

      expect(attachments.length).toBe(2);
      expect(attachments[0].options.name).toBe("mangabaka.png");
      expect(attachments[1].options.name).toBe("cover.png");

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Fumi",
        iconURL: "attachment://mangabaka.png",
      });
      expect(mockEmbed.setThumbnail).toHaveBeenCalledWith(
        "attachment://cover.png"
      );
    });

    it("should fallback to unknown author if creators returns null", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue(null);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "mangabaka", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Unknown Author",
        iconURL: "attachment://mangabaka.png",
      });
    });

    it("should fallback to too_many author if string exceeds 256 chars", async () => {
      const longAuthor = "a".repeat(257);
      (getTitleCreators as jest.Mock).mockReturnValue(longAuthor);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "mangabaka", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Too Many Authors",
        iconURL: "attachment://mangabaka.png",
      });
    });

    it("should return only the icon attachment if cover is missing", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Fumi");
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      const attachments = await setImages(
        {},
        mockEmbed,
        "mangabaka",
        mockTranslations
      );

      expect(attachments.length).toBe(1);
      expect(mockEmbed.setThumbnail).not.toHaveBeenCalled();
    });
  });

  describe("MangaDex Provider", () => {
    it("should return both icon and cover attachments when cover exists", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Dex-chan");
      (getCover as jest.Mock<any>).mockResolvedValue(mockBuffer);

      const attachments: any[] = await setImages(
        {},
        mockEmbed,
        "mangadex",
        mockTranslations
      );

      expect(attachments.length).toBe(2);
      expect(attachments[0].options.name).toBe("mangadex.png");
      expect(attachments[1].options.name).toBe("cover.png");

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Dex-chan",
        iconURL: "attachment://mangadex.png",
      });
      expect(mockEmbed.setThumbnail).toHaveBeenCalledWith(
        "attachment://cover.png"
      );
    });

    it("should fallback to unknown author if creators returns null", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue(null);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "mangadex", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Unknown Author",
        iconURL: "attachment://mangadex.png",
      });
    });

    it("should fallback to too_many author if string exceeds 256 chars", async () => {
      const longAuthor = "b".repeat(260);
      (getTitleCreators as jest.Mock).mockReturnValue(longAuthor);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "mangadex", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Too Many Authors",
        iconURL: "attachment://mangadex.png",
      });
    });

    it("should return only the icon attachment if cover is missing", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Dex-chan");
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      const attachments = await setImages(
        {},
        mockEmbed,
        "mangadex",
        mockTranslations
      );

      expect(attachments.length).toBe(1);
      expect(mockEmbed.setThumbnail).not.toHaveBeenCalled();
    });
  });

  describe("NamiComi Provider", () => {
    it("should return icon, cover, and banner attachments when all exist", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Nami");
      (getCover as jest.Mock<any>).mockResolvedValue(mockBuffer);
      (getBanner as jest.Mock<any>).mockResolvedValue(mockBuffer);

      const attachments: any[] = await setImages(
        {},
        mockEmbed,
        "namicomi",
        mockTranslations,
        "es"
      );

      expect(getCover).toHaveBeenCalledWith(
        expect.anything(),
        "namicomi",
        "es"
      );
      expect(attachments.length).toBe(3);
      expect(attachments[0].options.name).toBe("namicomi.png");
      expect(attachments[1].options.name).toBe("cover.png");
      expect(attachments[2].options.name).toBe("banner.png");

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Nami",
        iconURL: "attachment://namicomi.png",
      });
      expect(mockEmbed.setThumbnail).toHaveBeenCalledWith(
        "attachment://cover.png"
      );
      expect(mockEmbed.setImage).toHaveBeenCalledWith(
        "attachment://banner.png"
      );
    });

    it("should fallback to unknown author if creators returns null", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue(null);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "namicomi", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Unknown Author",
        iconURL: "attachment://namicomi.png",
      });
    });

    it("should fallback to too_many author if string exceeds 256 chars", async () => {
      const longAuthor = "c".repeat(300);
      (getTitleCreators as jest.Mock).mockReturnValue(longAuthor);
      (getCover as jest.Mock<any>).mockResolvedValue(null);

      await setImages({}, mockEmbed, "namicomi", mockTranslations);

      expect(mockEmbed.setAuthor).toHaveBeenCalledWith({
        name: "Too Many Authors",
        iconURL: "attachment://namicomi.png",
      });
    });

    it("should return only the icon attachment if cover is missing (and skips banner fetch)", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Nami");
      (getCover as jest.Mock<any>).mockResolvedValue(null); // No cover

      const attachments = await setImages(
        {},
        mockEmbed,
        "namicomi",
        mockTranslations
      );

      expect(attachments.length).toBe(1);
      expect(mockEmbed.setThumbnail).not.toHaveBeenCalled();
      expect(getBanner).not.toHaveBeenCalled(); // Fast return before fetching banner
    });

    it("should return icon and cover attachments if banner is missing", async () => {
      (getTitleCreators as jest.Mock).mockReturnValue("Nami");
      (getCover as jest.Mock<any>).mockResolvedValue(mockBuffer); // Cover exists
      (getBanner as jest.Mock<any>).mockResolvedValue(null); // No banner

      const attachments = await setImages(
        {},
        mockEmbed,
        "namicomi",
        mockTranslations
      );

      expect(attachments.length).toBe(2);
      expect(mockEmbed.setThumbnail).toHaveBeenCalled();
      expect(mockEmbed.setImage).not.toHaveBeenCalled(); // No banner set
    });
  });
});
