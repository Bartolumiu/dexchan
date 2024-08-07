const { InteractionType, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const locale = interaction.locale;

        const errorTitle = await client.translate(locale, 'error_embed', 'title') || client.translate('en', 'error_embed', 'title');
        const errorDescription = client.translate(locale, 'error_embed', 'description') || client.translate('en', 'error_embed', 'description');

        const errorEmbed = new EmbedBuilder()
            .setTitle(errorTitle)
            .setDescription(errorDescription)
            .setColor(Colors.Red);


        if (interaction.isChatInputCommand()) {
            chatInputCommand(interaction, client, errorEmbed);
        } else if (interaction.isButton()) {
            button(interaction, client, errorEmbed);
        } else if (interaction.isSelectMenu()) {
            selectMenu(interaction, client, errorEmbed);
        } else if (interaction.isContextMenuCommand()) {
            contextMenu(interaction, client, errorEmbed);
        } else if (interaction.type == InteractionType.ModalSubmit) {
            modalSubmit(interaction, client, errorEmbed);
        } else if (interaction.type == InteractionType.ApplicationCommandAutocomplete) {
            autocomplete(interaction, client, errorEmbed);
        }
    }
};

async function chatInputCommand(interaction, client, errorEmbed) {
    const { commands } = client;
    const { commandName } = interaction;
    const command = commands.get(commandName);
    if (!command) return new Error('Command not found');

    try {
        await command.execute(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_ch_input', { commandName: commandName }) || await client.translate('en', 'error_embed', 'err_int_ch_input', { commandName: commandName });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_CH_INP - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}

async function button(interaction, client, errorEmbed) {
    const { buttons } = client;
    const { customId } = interaction;
    const button = buttons.get(customId);
    if (!button) return new Error('Button not found');

    try {
        await button.execute(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_btn', { buttonId: customId }) || await client.translate('en', 'error_embed', 'err_int_btn', { buttonId: customId });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_BTN - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}

async function selectMenu(interaction, client, errorEmbed) {
    const { selectMenus } = client;
    const { customId } = interaction;
    const menu = selectMenus.get(customId);
    if (!menu) return new Error('Select menu not found');

    try {
        await menu.execute(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_slct', { selectId: customId }) || await client.translate('en', 'error_embed', 'err_int_slct', { selectId: customId });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_SEL - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}

async function contextMenu(interaction, client, errorEmbed) {
    const { commands } = client;
    const { commandName } = interaction.commandName;
    const contextCommand = commands.get(commandName);
    if (!contextCommand) return new Error('Command not found');

    try {
        await contextCommand.execute(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_ctx', { contextId: commandName }) || await client.translate('en', 'error_embed', 'err_int_ctx', { contextId: commandName });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_CTX - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}

async function modalSubmit(interaction, client, errorEmbed) {
    const { modals } = client;
    const { customId } = interaction;
    const modal = modals.get(customId);
    if (!modal) return new Error('Modal not found');

    try {
        await modal.execute(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_mod', { modalId: customId }) || await client.translate('en', 'error_embed', 'err_int_mod', { modalId: customId });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_MOD - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}

async function autocomplete(interaction, client, errorEmbed) {
    const { commands } = client;
    const { commandName } = interaction;
    const command = commands.get(commandName);
    if (!command) return new Error('Command not found');

    try {
        await command.autocomplete(interaction, client);
        return true;
    } catch (e) {
        console.error(e);
        const error_message = await client.translate(interaction.locale, 'error_embed', 'message') || await client.translate('en', 'error_embed', 'message');
        const error_stack = await client.translate(interaction.locale, 'error_embed', 'stack') || await client.translate('en', 'error_embed', 'stack');
        const footer = await client.translate(interaction.locale, 'error_embed', 'err_int_aut', { autocompleteId: commandName }) || await client.translate('en', 'error_embed', 'err_int_aut', { autocompleteId: commandName });
        errorEmbed.addFields(
            {
                name: error_message,
                value: e.message
            },
            {
                name: error_stack,
                value: e.stack
            }
        );
        errorEmbed.setFooter({ text: `ERR_INT_AUT - ${footer}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return false;
    }
}