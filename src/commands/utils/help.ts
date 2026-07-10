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

const command: SlashCommand = {
  global: true,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with using the bot")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.utils.help.description)
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const t = translations.commands.utils.help.response;

    const embed = new EmbedBuilder()
      .setTitle(t.title)
      .addFields(
        {
          name: t.fields.commands.name,
          value: t.fields.commands.value,
        },
        {
          name: t.fields.support.name,
          value: t.fields.support.value,
        },
        {
          name: t.fields.invite.name,
          value: t.fields.invite.value,
        },
        {
          name: t.fields.stats.name,
          value: t.fields.stats.value,
        },
        {
          name: t.fields.uptime.name,
          value: t.fields.uptime.value,
        }
      )
      .setColor(Colors.Blurple)
      .setFooter({
        text: format(t.footer, {
          commandName: `/${interaction.commandName}`,
          user: interaction.user.username,
        }),
        iconURL: client.user?.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
