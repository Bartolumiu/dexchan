import { Colors, EmbedBuilder, RepliableInteraction } from "discord.js";

type Translations = any; // TODO: Replace with actual translations from reworked i18n

export const sendErrorEmbed = async (
  interaction: RepliableInteraction,
  translations: Translations,
  embed: EmbedBuilder | null | undefined,
  errorKey: string,
  replacements: Record<string, string | number> = {}
): Promise<void> => {
  if (!embed) return;

  let description: string = interaction.isMessageComponent()
    ? translations.response.error.description.api
    : translations.response.error.description[errorKey];

  if (!description) return;

  for (const [key, value] of Object.entries(replacements)) {
    description = description.replaceAll(`{${key}}`, String(value));
  }

  embed
    .setTitle(translations.response.error.title)
    .setDescription(description)
    .setColor(Colors.Red);

  const payload = { embeds: [embed], ephemeral: true };

  try {
    if (interaction.isMessageComponent()) {
      await interaction.reply(payload);
    } else {
      await interaction.editReply(payload);
    }
  } catch (error) {
    console.error(
      "[ErrorEmbed] Failed to send or edit reply. Interaction may have expired:",
      error
    );
  }
};
