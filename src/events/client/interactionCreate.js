const { EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const locale = client.getMongoUserData(interaction.user) || interaction.locale;

        const { errorEmbed, errorStack } = await createErrorEmbed(client, locale);
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
            let errorTimestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            if (!fs.existsSync('./logs')) fs.mkdirSync('./logs', { recursive: true });
            fs.writeFileSync(`./logs/${errorTimestamp}.txt`, `Date: ${errorTimestamp}\nUser: ${interaction.user.tag} (${interaction.user.id})\nError origin: ${interaction.customId || interaction.commandName}\nError message: ${e.message}\nError stack: ${e.stack}`);

            // Check if the interaction has already been replied to
            if (interaction.replied || interaction.deferred) await interaction.followUp({ embeds: embeds, ephemeral: true });
            else await interaction.reply({ embeds: embeds, ephemeral: true });
        }
    }
};

async function createErrorEmbed(client, locale) {
    const errorTitle = await client.translate(locale, 'error_embed', 'title');
    const errorDescription = await client.translate(locale, 'error_embed', 'description');
    const errorStack = await client.translate(locale, 'error_embed', 'stack');

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
    let item = collection.get(id);
    if (!item) {
        for (const [key, value] of collection.entries()) {
            if (key instanceof RegExp && key.test(id)) {
                item = value;
                break;
            }
        }
    }
    if (!item) throw new Error(`${errorType.split('_').pop()} not found`);

    try {
        if (isAutocomplete) {
            await item.autocomplete(interaction, client);
        } else {
            await item.execute(interaction, client);
        }
    } catch (e) {
        if (e.code === 'ECONNABORTED' || e.message.toLowerCase().includes('timeout') || e.stack.toLowerCase().includes('timeout')) await errorTimeout(client, interaction, e, errorType, id, embeds[0], embeds[1]);
        else {
            await updateErrorEmbed(client, interaction, e, errorType, id, embeds[0], embeds[1]);
            throw e;
        }
        throw new Error();
    }
}

async function updateErrorEmbed(client, interaction, error, errorType, id, errorEmbed, errorStack) {
    const locale = client.getMongoUserData(interaction.user) || interaction.locale;
    const replacements = { commandName: `/${id}`, buttonId: id, selectId: id, contextId: id, modalId: id };
    const error_message = await client.translate(locale, 'error_embed', 'message');
    const footer = await client.translate(locale, 'error_embed', `${errorType}`, replacements);

    errorEmbed.addFields(
        { name: error_message, value: error.message }
    );
    errorEmbed.setFooter({ text: `${errorType.toUpperCase()} - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

    errorStack.setDescription(error.stack);
    errorStack.setFooter({ text: `${errorType.toUpperCase()} - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
}

async function errorTimeout(client, interaction, error, errorType, id, errorEmbed, errorStack) {
    const locale = client.getMongoUserData(interaction.user) || interaction.locale;
    const replacements = { commandName: `/${id}`, buttonId: id, selectId: id, contextId: id, modalId: id };
    const footer = await client.translate(locale, 'error_embed', `${errorType}`, replacements);

    errorEmbed.setTitle(await client.translate(locale, 'error_embed', 'timeout.title'));
    errorEmbed.setDescription(await client.translate(locale, 'error_embed', 'timeout.description'));
    errorEmbed.setFooter({ text: `ERR_TIMEOUT - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

    errorStack.setTitle(await client.translate(locale, 'error_embed', 'no_stack'));
    errorStack.setDescription(await client.translate(locale, 'error_embed', 'timeout.note'));
    errorStack.setFooter({ text: `ERR_TIMEOUT - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
}