const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const locale = interaction.locale;

        const {errorEmbed, errorStack} = await createErrorEmbed(client, locale);
        const embeds = [errorEmbed, errorStack];

        try {
            switch (true) {
                case interaction.isChatInputCommand():
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_ch_input', embeds, client);
                    break;
                case interaction.isButton():
                    await handleInteraction(interaction, client.buttons, interaction.customId, 'err_int_btn', embeds, client);
                    break;
                case interaction.isAnySelectMenu():
                    await handleInteraction(interaction, client.selectMenus, interaction.customId, 'err_int_slct', embeds, client);
                    break;
                case interaction.isContextMenuCommand():
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_ctx', embeds, client);
                    break;
                case interaction.isModalSubmit():
                    await handleInteraction(interaction, client.modals, interaction.customId, 'err_int_mod', embeds, client);
                    break;
                case interaction.isAutocomplete():
                    await handleInteraction(interaction, client.commands, interaction.commandName, 'err_int_aut', embeds, client, true);
                    break;
                default:
                    console.warn(`Unknown interaction type: ${interaction.type}`);
                    break;
            }
        } catch (e) {
            console.error(e);
            await interaction.reply({ embeds: embeds, ephemeral: true });
        }
    }
};

async function createErrorEmbed(client, locale) {
    const errorTitle = await client.translate(locale, 'error_embed', 'title') || await client.translate('en', 'error_embed', 'title');
    const errorDescription = await client.translate(locale, 'error_embed', 'description') || await client.translate('en', 'error_embed', 'description');
    const errorStack = await client.translate(locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');

    return {
        errorEmbed: new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(errorDescription)
        .setColor(Colors.Red),
        errorStack: new EmbedBuilder()
        .setTitle(errorStack)
        .setColor(Colors.Red)
    }
}

async function handleInteraction(interaction, collection, id, errorType, embeds, client, isAutocomplete = false) {
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
        await updateErrorEmbed(client, interaction, e, errorType, id, embeds[0], embeds[1]);
        throw e;
    }
}

async function updateErrorEmbed(client, interaction, error, errorType, id, errorEmbed, errorStack) {
    const locale = interaction.locale;
    const replacements = { commandName: `/${id}`, buttonId: id, selectId: id, contextId: id, modalId: id };
    const error_message = await client.translate(locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
    const footer = await client.translate(locale, 'error_embed', `${errorType}`, replacements) || await client.translate('en', 'error_embed', `${errorType}`, replacements);

    errorEmbed.addFields(
        { name: error_message, value: error.message }
    );
    errorEmbed.setFooter({ text: `${errorType.toUpperCase()} - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

    errorStack.setDescription(error.stack);
    errorStack.setFooter({ text: `${errorType.toUpperCase()} - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
}