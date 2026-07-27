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
  MANGABAKA: "https://api.mangabaka.org/_status",
  MANGADEX: "https://api.mangadex.org/ping",
  NAMICOMI: "https://api.namicomi.com/ping",
} as const;

const command: SlashCommand = {
  global: true,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.ping.description)
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const userToBotPing = Date.now() - interaction.createdTimestamp;

    const startDefer = Date.now();
    await interaction.deferReply();
    const responsePing = Date.now() - startDefer;

    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);

    const fields = {
      title: translations.commands.ping.response.title,
      cts: {
        name: translations.commands.ping.response.fields.connection_latency,
        value: `${userToBotPing}ms`,
        inline: true,
      },
      ws: {
        name: translations.commands.ping.response.fields.bot_latency,
        value: `${responsePing}ms`,
        inline: true,
      },
      discord: {
        name: translations.commands.ping.response.fields.api.discord,
        value: `${client.ws.ping}ms`,
        inline: true,
      },
      mb: {
        name: translations.commands.ping.response.fields.api.mangabaka,
        value: "",
        inline: true,
      },
      md: {
        name: translations.commands.ping.response.fields.api.mangadex,
        value: "",
        inline: true,
      },
      nami: {
        name: translations.commands.ping.response.fields.api.namicomi,
        value: "",
        inline: true,
      },
      footer: format(translations.common.footers.command, {
        commandName: `${interaction.commandName}`,
        user: interaction.user.username,
      }),
    };

    const embed = new EmbedBuilder()
      .setTitle(fields.title)
      .addFields(fields.cts, fields.ws, fields.discord)
      .setFooter({
        text: fields.footer,
        iconURL: client.user?.displayAvatarURL(),
      })
      .setColor(Colors.Blurple);

    const [mbResult, mdResult, namiResult] = await Promise.allSettled([
      getPing(API_URLS.MANGABAKA),
      getPing(API_URLS.MANGADEX),
      getPing(API_URLS.NAMICOMI),
    ]);

    fields.mb.value =
      mbResult.status === "fulfilled"
        ? `${mbResult.value}ms`
        : translations.common.words.not_ok;
    fields.md.value =
      mdResult.status === "fulfilled"
        ? `${mdResult.value}ms`
        : translations.common.words.not_ok;
    fields.nami.value =
      namiResult.status === "fulfilled"
        ? `${namiResult.value}ms`
        : translations.common.words.not_ok;

    embed.addFields(fields.mb, fields.md, fields.nami);
    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;

const getPing = async (url: string): Promise<number> => {
  const start = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": `Dex-chan/${pkg.version} by Bartolumiu` },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error("Fetch failed");

  return Date.now() - start;
};
