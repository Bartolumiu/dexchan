const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');
let version = require('../../../package.json').version;
const https = require('https');

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
        const userSettings = await client.getMongoUserData(interaction.user);
        const locale = userSettings.preferredLocale || interaction.locale;

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
            not_ok: await client.translate(locale, 'commands', 'ping.response.not_ok'),
            footer: await client.translate(locale, 'commands', 'ping.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username })
        };

        const embed = new EmbedBuilder()
            .setTitle(fields.title)
            .addFields(fields.ws, fields.discord)
            .setFooter({ text: fields.footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setColor(Colors.Blurple)
            .setTimestamp();

        try {
            fields.md.value = client.translate(locale, 'commands', 'ping.response.fields.api.mangadex.value', { mdPing: await getPing(API_URLS.MANGADEX) });
            embed.addFields(fields.md);
        } catch (e) {
            console.error('Error while fetching Mangadex API ping:', e);
            embed.addFields(fields.md);
        } finally {
            try {
                fields.nami.value = client.translate(locale, 'commands', 'ping.response.fields.api.namicomi.value', { ncPing: await getPing(API_URLS.NAMICOMI) });
                embed.addFields(fields.nami);
            } catch (e) {
                console.error('Error while fetching Namicomi API ping:', e);
                embed.addFields({ name: fields.nami.name, value: fields.not_ok, inline: true });
            }
        }   

        await interaction.editReply({ embeds: [embed] });
    }
};

async function getPing(url) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        https.get(url, { headers: { 'User-Agent': `Dex-chan/${version} by Bartolumiu` } }, (res) => {
            res.on('data', () => { });
            res.on('end', () => {
                resolve(Date.now() - start);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
};

module.exports.getPing = getPing;