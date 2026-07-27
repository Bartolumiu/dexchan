import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { EmbedBuilder } from "discord.js"
import { lookupTitleById } from "../../../src/functions/titles/titleLookup"
import { checkID, parseUrl } from "../../../src/functions/parsers/urlParser"
import getTitleDetails from "../../../src/functions/titles/titleDetails"
import getTitleStats from "../../../src/functions/titles/titleStats"
import buildTitleEmbed from "../../../src/functions/titles/titleEmbed"
import setImages from "../../../src/functions/titles/setImages"
import { BotStrings } from "../../../src/i18n/schema"

jest.mock("../../../src/functions/parsers/urlParser", () => ({
  checkID: jest.fn<any>(),
  parseUrl: jest.fn<any>(),
}))

jest.mock("../../../src/functions/titles/titleDetails", () => ({
  __esModule: true,
  default: jest.fn<any>(),
}))

jest.mock("../../../src/functions/titles/titleStats", () => ({
  __esModule: true,
  default: jest.fn<any>(),
}))

jest.mock("../../../src/functions/titles/titleEmbed", () => ({
  __esModule: true,
  default: jest.fn<any>(),
}))

jest.mock("../../../src/functions/titles/setImages", () => ({
  __esModule: true,
  default: jest.fn<any>(),
}))

describe("lookupTitleById", () => {
  const mockTranslations = {
    common: {
      footers: { command: "Requested by {user}", stats: "" },
      errors: { unknown: "", try_again: "", api_failure: "" },
      words: { and: "", by: "" },
    },
    locale: { enabled: false, name: "", code: "" },
    commands: {
      search: { response: { description: "" } },
      ping: { response: "" },
      help: { description: "", embed: { title: "", fields: [] } },
      settings: { permissions: {} },
      commands: { response: { title: "", description: "" } },
    },
    components: {
      title_stats: { title: "", author: "", status: "", volumes: "", chapters: "" },
    },
    events: {
      interactionCreate: {
        modal: { error: "", settings: { title: "" } },
      },
    },
    functions: {
      titleEmbed: {
        description: { empty: "" },
        footer: "",
      },
      titleListEmbed: {},
      titleTags: {},
    },
  } as unknown as BotStrings

  let mockEmbed: EmbedBuilder

  beforeEach(() => {
    jest.clearAllMocks()
    mockEmbed = new EmbedBuilder()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return error if checkID fails", async () => {
    ;(checkID as jest.Mock<any>).mockReturnValue(false)

    const result = await lookupTitleById(
      "invalid-id",
      null,
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(result).toEqual({
      success: false,
      errorKey: "invalid_id",
    })
    expect(parseUrl).not.toHaveBeenCalled()
  })

  it("should parse url when id is null", async () => {
    ;(parseUrl as jest.Mock<any>).mockReturnValue("parsed-id")
    ;(checkID as jest.Mock<any>).mockReturnValue(true)
    ;(getTitleDetails as jest.Mock<any>).mockResolvedValue({ id: "parsed-id" })
    ;(getTitleStats as jest.Mock<any>).mockResolvedValue({})
    ;(buildTitleEmbed as jest.Mock<any>).mockReturnValue(null)
    ;(setImages as jest.Mock<any>).mockResolvedValue([])

    const result = await lookupTitleById(
      null,
      "https://mangadex.org/title/some-id",
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(parseUrl).toHaveBeenCalledWith(
      "https://mangadex.org/title/some-id",
      "mangadex"
    )
    expect(result).toEqual({
      success: true,
      payload: {
        embeds: [mockEmbed],
        files: [],
        components: [],
      },
    })
  })

  it("should return error when getTitleDetails returns null", async () => {
    ;(checkID as jest.Mock<any>).mockReturnValue(true)
    ;(getTitleDetails as jest.Mock<any>).mockResolvedValue(null)
    ;(getTitleStats as jest.Mock<any>).mockResolvedValue({})

    const result = await lookupTitleById(
      "valid-id",
      null,
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(result).toEqual({
      success: false,
      errorKey: "invalid_id",
    })
  })

  it("should return error when getTitleStats returns null", async () => {
    ;(checkID as jest.Mock<any>).mockReturnValue(true)
    ;(getTitleDetails as jest.Mock<any>).mockResolvedValue({ id: "valid-id" })
    ;(getTitleStats as jest.Mock<any>).mockResolvedValue(null)

    const result = await lookupTitleById(
      "valid-id",
      null,
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(result).toEqual({
      success: false,
      errorKey: "invalid_id",
    })
  })

  it("should return success with buttons when buildTitleEmbed returns a row", async () => {
    const mockButtonRow = { type: 1, components: [] }
    ;(checkID as jest.Mock<any>).mockReturnValue(true)
    ;(getTitleDetails as jest.Mock<any>).mockResolvedValue({ id: "valid-id" })
    ;(getTitleStats as jest.Mock<any>).mockResolvedValue({})
    ;(buildTitleEmbed as jest.Mock<any>).mockReturnValue(mockButtonRow)
    ;(setImages as jest.Mock<any>).mockResolvedValue([{}])

    const result = await lookupTitleById(
      "valid-id",
      null,
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(result).toEqual({
      success: true,
      payload: {
        embeds: [mockEmbed],
        files: [{}],
        components: [mockButtonRow],
      },
    })
    expect(buildTitleEmbed).toHaveBeenCalledWith(
      mockEmbed,
      "en",
      { id: "valid-id" },
      expect.any(Object),
      mockTranslations,
      "mangadex"
    )
    expect(setImages).toHaveBeenCalledWith(
      { id: "valid-id" },
      mockEmbed,
      "mangadex",
      mockTranslations,
      "en"
    )
  })

  it("should return success without buttons when buildTitleEmbed returns null", async () => {
    ;(checkID as jest.Mock<any>).mockReturnValue(true)
    ;(getTitleDetails as jest.Mock<any>).mockResolvedValue({ id: "valid-id" })
    ;(getTitleStats as jest.Mock<any>).mockResolvedValue({})
    ;(buildTitleEmbed as jest.Mock<any>).mockReturnValue(null)
    ;(setImages as jest.Mock<any>).mockResolvedValue([])

    const result = await lookupTitleById(
      "valid-id",
      null,
      "mangadex",
      "en",
      mockTranslations,
      mockEmbed
    )

    expect(result).toEqual({
      success: true,
      payload: {
        embeds: [mockEmbed],
        files: [],
        components: [],
      },
    })
  })
})
