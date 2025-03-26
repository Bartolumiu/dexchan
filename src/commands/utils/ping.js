const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { translateAttribute } = require('../../functions/handlers/handleLocales');
let version = require('../../../package.json').version;

const API_URLS = {
    MANGADEX: 'https://api.mangadex.org/ping',
    NAMICOMI: 'https://api.namicomi.com/ping'
}

module.exports = {
    global: true,
    data: async () => {
        const localizations = {
            description: await translateAttribute('ping', 'description')
        };
        return new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Check the bot\'s latency')
            .setDescriptionLocalizations(localizations.description);
    },
    async execute(interaction, client) {
        const userProfile = await client.getMongoUserData(interaction.user);
        const locale = client.getLocale(userProfile, interaction);

        const content = client.translate(locale, 'commands', 'ping.response.ping');
        const message = await interaction.deferReply({ content: content, fetchReply: true });

        // Calculate the latency
        const ping = message.createdTimestamp - interaction.createdTimestamp;

        const fields = {
            title: await client.translate(locale, 'commands', 'ping.response.title'),
            ws: {
                name: await client.translate(locale, 'commands', 'ping.response.fields.bot_latency.name'),
                value: await client.translate(locale, 'commands', 'ping.response.fields.bot_latency.value', { ping: ping }),
                inline: true
            },
            discord: {
                name: await client.translate(locale, 'commands', 'ping.response.fields.api.discord.name'),
                value: await client.translate(locale, 'commands', 'ping.response.fields.api.discord.value', { apiPing: client.ws.ping }),
                inline: true
            },
            md: {
                name: await client.translate(locale, 'commands', 'ping.response.fields.api.mangadex.name'),
                value: null,
                inline: true
            },
            nami: {
                name: await client.translate(locale, 'commands', 'ping.response.fields.api.namicomi.name'),
                value: null,
                inline: true
            },
            footer: await client.translate(locale, 'commands', 'ping.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })
        };

        const embed = new EmbedBuilder()
            .setTitle(fields.title)
            .addFields(fields.ws, fields.discord)
            .setFooter({ text: fields.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setColor(Colors.Blurple);

        try {
            const mdPing = await getPing(API_URLS.MANGADEX);
            fields.md.value = await client.translate(locale, 'commands', 'ping.response.fields.api.mangadex.value', { mdPing: mdPing });
        } catch (e) {
            console.error(e);
            fields.md.value = await client.translate(locale, 'commands', 'ping.response.not_ok');
        }

        try {
            const namiPing = await getPing(API_URLS.NAMICOMI);
            fields.nami.value = await client.translate(locale, 'commands', 'ping.response.fields.api.namicomi.value', { ncPing: namiPing });
        } catch (e) {
            console.error(e);
            fields.nami.value = await client.translate(locale, 'commands', 'ping.response.not_ok');
        }

        embed.addFields(fields.md, fields.nami);
        await interaction.editReply({ embeds: [embed] });
    }
};

const getPing = async (url) => {
    const start = Date.now();

    const res = await fetch(url, {
        headers: { 'User-Agent': `Dex-chan/${version} by Bartolumiu` }
    });

    if (!res.ok) throw new Error('Fetch failed');

    return Date.now() - start;
};

module.exports.getPing = getPing;