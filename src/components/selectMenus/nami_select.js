const { StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    data: {
        customId: 'nami_select',
    },
    async execute(interaction, client) {
        await interaction.deferUpdate();

        const title = interaction.values[0];

        const command = client.commands.get('nami');
        if (command) {
            const mockInteraction = {
                ...interaction,
                options: {
                    /**
                     * Mocks the getString method for the interaction options.
                     * @param {*} name - Option name
                     * @returns {string | null} - The value of the option or null if the option is not found.
                     */
                    getString: (name) => (name === 'id' ? title : null),
                },
                /**
                 * Mocks the reply method for the interaction
                 * @param {*} response - The response to send to the interaction
                 * @returns {Promise<void>} - A promise that resolves when the interaction is replied to.
                 */
                reply: (response) => interaction.editReply(response),
            };

            // Either lock the select menu or remove it
            const selectMenu = interaction.component;

            if (selectMenu instanceof StringSelectMenuBuilder) {
                selectMenu.setDisabled(true);
                await interaction.editReply({ components: [selectMenu] });
            } else {
                await interaction.editReply({ components: [] });
            }

            mockInteraction.commandName = 'nami';

            await command.execute(mockInteraction, client);
        }
    }
}