import { Colors, EmbedBuilder, RepliableInteraction } from "discord.js";
import { logMessage } from "../../lib/app";

export const sendErrorEmbed = async (
  interaction: RepliableInteraction,
  commandErrors: Record<string, string>,
  globalErrorTitle: string,
  embed: EmbedBuilder | null | undefined,
  errorKey: string,
  replacements: Record<string, string | number> = {}
): Promise<void> => {
  if (!embed) return;

  let description: string = commandErrors[errorKey];

  if (!description) return;

  for (const [key, value] of Object.entries(replacements)) {
    description = description.replaceAll(`{${key}}`, String(value));
  }

  embed
    .setTitle(globalErrorTitle)
    .setDescription(description)
    .setColor(Colors.Red);

  const payload = { embeds: [embed], ephemeral: true };

  try {
    if (interaction.isMessageComponent()) {
      await interaction.reply(payload);
    } else {
      await interaction.editReply(payload);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage(
      `[ErrorEmbed] Failed to send or edit reply. Interaction may have expired: ${errorMessage}`,
      "error"
    );
  }
};
