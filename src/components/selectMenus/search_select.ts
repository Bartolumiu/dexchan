import { Colors, EmbedBuilder, StringSelectMenuInteraction } from "discord.js";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { lookupTitleById } from "../../functions/titles/titleLookup";
import { getInteractionContext } from "../../utils/database";
import {
  format,
  getTranslations,
} from "../../functions/handlers/handleLocales";
import { ProviderType } from "../../constants/providers";

export default {
  data: {
    customId: "search_select",
  },
  async execute(
    interaction: StringSelectMenuInteraction,
    client: ExtendedClient
  ) {
    await interaction.deferUpdate();

    const title = interaction.values[0];
    const [source, id] = title.split(":");

    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const embed = new EmbedBuilder().setFooter({
      text: format(translations.common.footers.command, {
        commandName: "search",
        user: interaction.user.username,
      }),
      iconURL: client.user?.displayAvatarURL(),
    });

    const result = await lookupTitleById(
      id,
      null,
      source as ProviderType,
      locale,
      translations,
      embed
    );

    if (!result.success) {
      const errorKey = result.errorKey;
      const errorMessage = (
        translations.commands.search.errors as Record<string, string>
      )[errorKey];

      const errorEmbed = new EmbedBuilder()
        .setTitle(translations.error_embed.title)
        .setDescription(errorMessage)
        .setColor(Colors.Red);

      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    await interaction.editReply(result.payload);
  },
};
