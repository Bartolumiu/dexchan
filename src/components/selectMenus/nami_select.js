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
                    getString: (name) => (name === 'id' ? title : null),
                },
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