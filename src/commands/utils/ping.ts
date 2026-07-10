import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  format,
  getTranslations,
  translateAttribute,
} from "../../functions/handlers/handleLocales";
import { getInteractionContext } from "../../utils/database";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { SlashCommand } from "../../types/Command";
import pkg from "../../../package.json";

const API_URLS = {
  MANGADEX: "https://api.mangadex.org/ping",
  NAMICOMI: "https://api.namicomi.com/ping",
} as const;

const command: SlashCommand = {
  global: true,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.utils.ping.description)
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);

    const message = await interaction.deferReply({
      fetchReply: true,
    });

    const ping = message.createdTimestamp - interaction.createdTimestamp;

    const fields = {
      title: translations.commands.utils.ping.response.title,
      ws: {
        name: translations.commands.utils.ping.response.fields.bot_latency.name,
        value: format(
          translations.commands.utils.ping.response.fields.bot_latency.value,
          { ping }
        ),
        inline: true,
      },
      discord: {
        name: translations.commands.utils.ping.response.fields.api.discord.name,
        value: format(
          translations.commands.utils.ping.response.fields.api.discord.value,
          { apiPing: client.ws.ping }
        ),
        inline: true,
      },
      md: {
        name: translations.commands.utils.ping.response.fields.api.mangadex.name,
        value: "",
        inline: true,
      },
      nami: {
        name: translations.commands.utils.ping.response.fields.api.namicomi.name,
        value: "",
        inline: true,
      },
      footer: format(translations.commands.utils.ping.response.footer, {
        commandName: `/${interaction.commandName}`,
        user: interaction.user.username,
      }),
    };

    const embed = new EmbedBuilder()
      .setTitle(fields.title)
      .addFields(fields.ws, fields.discord)
      .setFooter({
        text: fields.footer,
        iconURL: client.user?.displayAvatarURL(),
      })
      .setColor(Colors.Blurple);

    try {
      const mdPing = await getPing(API_URLS.MANGADEX);
      fields.md.value = format(
        translations.commands.utils.ping.response.fields.api.mangadex.value,
        { mdPing }
      );
    } catch (e) {
      console.error(e);
      fields.md.value = translations.commands.utils.ping.response.not_ok;
    }

    try {
      const namiPing = await getPing(API_URLS.NAMICOMI);
      fields.nami.value = format(
        translations.commands.utils.ping.response.fields.api.namicomi.value,
        { ncPing: namiPing }
      );
    } catch (e) {
      console.error(e);
      fields.nami.value = translations.commands.utils.ping.response.not_ok;
    }

    embed.addFields(fields.md, fields.nami);
    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;

const getPing = async (url: string): Promise<number> => {
  const start = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": `Dex-chan/${pkg.version} by Bartolumiu` },
  });

  if (!res.ok) throw new Error("Fetch failed");

  return Date.now() - start;
};
