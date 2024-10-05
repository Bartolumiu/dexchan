const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const translateAttribute = require('../../functions/handlers/translateAttribute');
let version = require('../../../package.json').version;
const https = require('https');

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

        const title = client.translate(locale, 'commands', 'ping.response.title');
        const ws_ping_name = client.translate(locale, 'commands', 'ping.response.fields[0].name');
        const ws_ping_value = client.translate(locale, 'commands', 'ping.response.fields[0].value', { ping: ping });
        const discord_ping_name = client.translate(locale, 'commands', 'ping.response.fields[1].name');
        const discord_ping_value = client.translate(locale, 'commands', 'ping.response.fields[1].value', { apiPing: client.ws.ping });
        const md_ping_name = client.translate(locale, 'commands', 'ping.response.fields[2].name');
        const nami_ping_name = client.translate(locale, 'commands', 'ping.response.fields[3].name');
        const footer = client.translate(locale, 'commands', 'ping.response.footer', { commandName: `/${interaction.commandName}`, user: interaction.user.username });

        const embed = new EmbedBuilder()
            .setTitle(title)
            .addFields(
                { name: ws_ping_name, value: ws_ping_value, inline: true },
                { name: discord_ping_name, value: discord_ping_value, inline: true }
            )
            .setFooter({ text: footer, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setColor(Colors.Blurple)
            .setTimestamp();

        try {
            const mdPing = await new Promise((resolve, reject) => {
                const start = Date.now();
                https.get('https://api.mangadex.org/ping', { headers: { 'User-Agent': `Dex-chan/${version} by Bartolumiu` } }, (res) => {
                    res.on('data', () => { });
                    res.on('end', () => {
                        resolve(Date.now() - start);
                    });
                }).on('error', (e) => {
                    reject(e);
                });
            });

            const namiPing = await new Promise((resolve, reject) => {
                const start = Date.now();
                https.get('https://api.namicomi.com/ping', { headers: { 'User-Agent': `Dex-chan/${version} by Bartolumiu` } }, (res) => {
                    res.on('data', () => { });
                    res.on('end', () => {
                        resolve(Date.now() - start);
                    });
                }).on('error', (e) => {
                    reject(e);
                });
            });

            const md_ping_value = client.translate(locale, 'commands', 'ping.response.fields[2].value', { mdPing: mdPing });
            embed.addFields({ name: md_ping_name, value: md_ping_value, inline: true });

            const nami_ping_value = client.translate(locale, 'commands', 'ping.response.fields[3].value', { ncPing: namiPing });
            embed.addFields({ name: nami_ping_name, value: nami_ping_value, inline: true });
        } catch (e) {
            const md_ping_value = client.translate(locale, 'commands', 'ping.response.md_not_ok');
            embed.addFields({ name: md_ping_name, value: md_ping_value, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};