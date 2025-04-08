const { StringSelectMenuBuilder } = require("discord.js");
const mangaSelect = require("../../../src/components/selectMenus/manga_select");

describe("manga_select", () => {
    let interaction, client, command;

    beforeEach(() => {
        command = {
            execute: jest.fn().mockResolvedValue(),
        };
        client = {
            commands: new Map([["manga", command]]),
        };

        interaction = {
            deferUpdate: jest.fn().mockResolvedValue(),
            editReply: jest.fn().mockResolvedValue(),
            values: ["testTitle"],
            component: new StringSelectMenuBuilder().setCustomId("manga_select"),
            options: {
                getString: jest.fn((name) => (name === "id" ? "testTitle" : null)),
            }
        };
    });

    it('should do nothing if the command does not exist', async () => {
        client.commands.delete("manga");
        await mangaSelect.execute(interaction, client);
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(interaction.editReply).not.toHaveBeenCalled();
    });

    it('should return an empty array of components if the select menu is not a StringSelectMenuBuilder', async () => {
        interaction.component = { setDisabled: jest.fn() };
        await mangaSelect.execute(interaction, client);
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith({ components: [] });
    });

    it('should return a disabled select menu if the select menu is a StringSelectMenuBuilder', async () => {
        await mangaSelect.execute(interaction, client);
        expect(interaction.deferUpdate).toHaveBeenCalled();
        expect(interaction.editReply).toHaveBeenCalledWith({ components: [interaction.component] });
    });

    it('should mock getString and reply correctly with mockInteraction', async () => {
        await mangaSelect.execute(interaction, client);

        const mockInteraction = command.execute.mock.calls[0][0];
        expect(mockInteraction.options.getString("id")).toBe("testTitle");
        mockInteraction.reply('test reply');
        expect(interaction.editReply).toHaveBeenCalledWith('test reply');
    });

    it('should return null from getString if the key is not "id"', async () => {
        await mangaSelect.execute(interaction, client);

        const mockInteraction = command.execute.mock.calls[0][0];
        expect(mockInteraction.options.getString("unknown")).toBeNull();
    });
});