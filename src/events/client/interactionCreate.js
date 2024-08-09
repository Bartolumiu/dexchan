const { InteractionType, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const locale = interaction.locale;

        const errorEmbed = await createErrorEmbed(client, locale);

        try {
            switch (true) {
                case interaction.isChatInputCommand():
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_ch_input', errorEmbed, client);
                    break;
                case interaction.isButton():
                    await handleInteraction(interaction, client.buttons, interaction.customId, 'err_int_btn', errorEmbed, client);
                    break;
                case interaction.isSelectMenu():
                    await handleInteraction(interaction, client.selectMenus, interaction.customId, 'err_int_slct', errorEmbed, client);
                    break;
                case interaction.isContextMenuCommand():
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_ctx', errorEmbed, client);
                    break;
                case interaction.type == InteractionType.ModalSubmit:
                    await handleInteraction(interaction, client.modals, interaction.customId, 'err_int_mod', errorEmbed, client);
                    break;
                case interaction.type == InteractionType.ApplicationCommandAutocomplete:
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_aut', errorEmbed, client);
                    break;
                default:
                    console.warn(`Unknown interaction type: ${interaction.type}`);
                    break;
            }
        } catch (e) {
            console.error(e);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

async function createErrorEmbed(client, locale) {
    const errorTitle = await client.translate(locale, 'error_embed', 'title') || await client.translate('en', 'error_embed', 'title');
    const errorDescription = await client.translate(locale, 'error_embed', 'description') || await client.translate('en', 'error_embed', 'description');

    return new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(errorDescription)
        .setColor(Colors.Red);
}

async function handleInteraction(interaction, collection, id, errorType, errorEmbed, client, isAutocomplete = false) {
    const item = collection.get(id);
    if (!item) throw new Error(`${errorType.split('_').pop()} not found`);

    try {
        if (isAutocomplete) {
            await item.autocomplete(interaction, client);
        } else {
            await item.execute(interaction, client);
        }
    } catch (e) {
        console.error(e);
        await updateErrorEmbed(client, interaction, e, errorType, id, errorEmbed);
        throw e;
    }
}

async function updateErrorEmbed(client, interaction, error, errorType, id, errorEmbed) {
    const locale = interaction.locale;
    const error_message = await client.translate(locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
    const error_stack = await client.translate(locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
    const footer = await client.translate(locale, `error_embed.${errorType}`, { [`${errorType.split('_').pop()}Id`]: id }) || await client.translate('en', `error_embed.${errorType}`, { [`${errorType.split('_').pop()}Id`]: id });

    errorEmbed.addFields(
        { name: error_message, value: error.message },
        { name: error_stack, value: error.stack }
    );
    errorEmbed.setFooter({ text: `${errorType.toUpperCase()} - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
}