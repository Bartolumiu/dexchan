import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { StringSelectMenuInteraction } from "discord.js"
import searchSelectMenu from "../../../src/components/selectMenus/search_select"
import { ExtendedClient } from "../../../src/lib/ExtendedClient"
import { lookupTitleById } from "../../../src/functions/titles/titleLookup"
import { getInteractionContext } from "../../../src/utils/database"
import { getTranslations } from "../../../src/functions/handlers/handleLocales"

jest.mock("../../../src/utils/database", () => ({
  getInteractionContext: jest.fn(),
}))

jest.mock("../../../src/functions/handlers/handleLocales", () => ({
  getTranslations: jest.fn(),
  format: jest.fn().mockImplementation(
    (str: unknown, vars: unknown) =>
      `${(vars as Record<string, string>).commandName} - ${(vars as Record<string, string>).user}`,
  ),
}))

jest.mock("../../../src/functions/titles/titleLookup", () => ({
  lookupTitleById: jest.fn(),
}))

describe("search_select select menu", () => {
  let client: ExtendedClient
  let mockInteraction: any

  const mockTranslations = {
    common: {
      footers: { command: "{commandName} - {user}" },
      words: { error: "Error" },
    },
    commands: {
      search: {
        errors: {
          invalid_id: "Invalid ID provided",
        },
      },
    },
    error_embed: {
      title: "Error Title",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    client = {
      user: { displayAvatarURL: jest.fn().mockReturnValue("https://example.com/avatar.png") },
    } as unknown as ExtendedClient

    mockInteraction = {
      deferUpdate: jest.fn<any>().mockResolvedValue(undefined),
      editReply: jest.fn<any>().mockResolvedValue(undefined),
      followUp: jest.fn<any>().mockResolvedValue(undefined),
      values: ["mangadex:12345"],
      user: { username: "TestUser" },
    }

    ;(getInteractionContext as jest.Mock<any>).mockResolvedValue({
      locale: "en",
    })
    ;(getTranslations as jest.Mock<any>).mockReturnValue(mockTranslations)
  })

  it("should have correct data customId", () => {
    expect(searchSelectMenu.data.customId).toBe("search_select")
  })

  it("should defer update and query lookupTitleById with correct values", async () => {
    const mockPayload = {
      embeds: [],
      files: [],
      components: [],
    }
    ;(lookupTitleById as jest.Mock<any>).mockResolvedValue({
      success: true,
      payload: mockPayload,
    })

    await searchSelectMenu.execute(
      mockInteraction as StringSelectMenuInteraction,
      client,
    )

    expect(mockInteraction.deferUpdate).toHaveBeenCalled()
    expect(lookupTitleById).toHaveBeenCalledWith(
      "12345",
      null,
      "mangadex",
      "en",
      expect.any(Object),
      expect.any(Object),
    )
  })

  it("should editReply with the payload on success", async () => {
    const mockPayload = {
      embeds: [{ title: "Manga Title" }],
      files: [],
      components: [],
    }
    ;(lookupTitleById as jest.Mock<any>).mockResolvedValue({
      success: true,
      payload: mockPayload,
    })

    await searchSelectMenu.execute(
      mockInteraction as StringSelectMenuInteraction,
      client,
    )

    expect(mockInteraction.editReply).toHaveBeenCalledWith(mockPayload)
    expect(mockInteraction.followUp).not.toHaveBeenCalled()
  })

  it("should send error embed on lookup failure", async () => {
    ;(lookupTitleById as jest.Mock<any>).mockResolvedValue({
      success: false,
      errorKey: "invalid_id",
    })

    await searchSelectMenu.execute(
      mockInteraction as StringSelectMenuInteraction,
      client,
    )

    expect(mockInteraction.followUp).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        ephemeral: true,
      }),
    )
    expect(mockInteraction.editReply).not.toHaveBeenCalled()
  })
})
