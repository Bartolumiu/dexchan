import {
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Interaction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import * as fs from "node:fs";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { getInteractionContext } from "../../utils/database";
import getChalk from "../../functions/tools/getChalk";

import { translate } from "../../functions/handlers/handleLocales";
import { TranslationKey } from "../../utils/i18n";

type InteractionErrorType =
  | "err_int_ch_input"
  | "err_int_btn"
  | "err_int_slct"
  | "err_int_ctx"
  | "err_int_mod"
  | "err_int_auto";

type ExecutableInteraction =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction
  | ButtonInteraction
  | AnySelectMenuInteraction
  | ModalSubmitInteraction;

interface ExecutableItem {
  execute?: (
    interaction: ExecutableInteraction,
    client: ExtendedClient
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) => Promise<void>;
}

const event: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (client: ExtendedClient, interaction: Interaction) => {
    const chalk = await getChalk();

    const context = await getInteractionContext(interaction);
    const locale = context.locale;

    // Synchronously create the fallback embeds
    const { errorEmbed, errorStack } = createErrorEmbed(locale);
    const embeds = [errorEmbed, errorStack];

    try {
      if (interaction.isChatInputCommand()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_ch_input",
          embeds,
          client,
          locale
        );
      } else if (interaction.isButton()) {
        await handleInteraction(
          interaction,
          client.buttons,
          interaction.customId,
          "err_int_btn",
          embeds,
          client,
          locale
        );
      } else if (interaction.isAnySelectMenu()) {
        await handleInteraction(
          interaction,
          client.selectMenus,
          interaction.customId,
          "err_int_slct",
          embeds,
          client,
          locale
        );
      } else if (interaction.isContextMenuCommand()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_ctx",
          embeds,
          client,
          locale
        );
      } else if (interaction.isModalSubmit()) {
        await handleInteraction(
          interaction,
          client.modals,
          interaction.customId,
          "err_int_mod",
          embeds,
          client,
          locale
        );
      } else if (interaction.isAutocomplete()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_auto",
          embeds,
          client,
          locale,
          true
        );
      } else {
        console.warn(
          chalk.yellowBright(`Unknown interaction type: ${interaction.type}`)
        );
      }
    } catch (e) {
      const error = e as Error;
      let errorTimestamp = new Date()
        .toISOString()
        .replaceAll(":", "-")
        .split(".")[0];

      if (!fs.existsSync("./logs")) fs.mkdirSync("./logs", { recursive: true });

      let origin = "Unknown";
      if (interaction.isCommand() || interaction.isAutocomplete()) {
        origin = interaction.commandName;
      } else if (
        interaction.isMessageComponent() ||
        interaction.isModalSubmit()
      ) {
        origin = interaction.customId;
      }

      let options = {};
      if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
        options = interaction.options.data;
      }

      fs.writeFileSync(
        `./logs/${errorTimestamp}.txt`,
        `Data: ${errorTimestamp}\nUser: ${interaction.user.tag} (${interaction.user.id})\nError origin: ${origin}\nError message: ${error.message}\nError stack: ${error.stack}\nInteraction type: ${interaction.type}\n\nInput:${JSON.stringify(options, null, 2)}`
      );

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds, ephemeral: true });
        } else if (interaction.reply) {
          await interaction.reply({ embeds, ephemeral: true });
        }
      }
    }
  },
};

export default event;

// Using your synchronous dot-notation translator
function createErrorEmbed(locale: string) {
  return {
    errorEmbed: new EmbedBuilder()
      .setTitle(translate(locale, "error_embed.title"))
      .setDescription(translate(locale, "error_embed.description"))
      .setColor(Colors.Red),
    errorStack: new EmbedBuilder()
      .setTitle(translate(locale, "error_embed.stack"))
      .setColor(Colors.Red),
  };
}

async function handleInteraction(
  interaction: Interaction,
  collection: Collection<string | RegExp, ExecutableItem>,
  id: string,
  errorType: InteractionErrorType,
  embeds: EmbedBuilder[],
  client: ExtendedClient,
  locale: string,
  isAutocomplete = false
) {
  let item = collection.get(id);

  if (!item) {
    for (const [key, value] of collection.entries()) {
      if (key instanceof RegExp && key.test(id)) {
        item = value;
        break;
      }
    }
  }

  if (!item) throw new Error(`${errorType.split("_").pop()} not found`);

  try {
    if (isAutocomplete && item.autocomplete && interaction.isAutocomplete()) {
      await item.autocomplete(interaction, client);
    } else if (item.execute && interaction.isRepliable()) {
      await item.execute(interaction as ExecutableInteraction, client);
    }
  } catch (e) {
    const error = e as Error;
    const stack = error.stack?.toLowerCase() || "";

    if (
      ("code" in error && error.code === "ECONNABORDED") ||
      error.message.toLowerCase().includes("timeout") ||
      stack.includes("timeout")
    ) {
      errorTimeout(client, error, errorType, id, embeds[0], embeds[1], locale);
    } else {
      updateErrorEmbed(
        client,
        error,
        errorType,
        id,
        embeds[0],
        embeds[1],
        locale
      );
      throw error; // Propagate the error so the main block logs it
    }
    throw new Error("Interaction execution timed out");
  }
}

function updateErrorEmbed(
  client: ExtendedClient,
  error: Error,
  errorType: InteractionErrorType,
  id: string,
  errorEmbed: EmbedBuilder,
  errorStack: EmbedBuilder,
  locale: string
) {
  const replacements = {
    commandName: `/${id}`,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
  };

  // Safely cast the dynamic string to a TranslationKey
  const dynamicKey = `error_embed.${errorType}` as TranslationKey;
  const footer = translate(locale, dynamicKey, replacements);

  errorEmbed.addFields({
    name: translate(locale, "error_embed.message"),
    value: error.message,
  });

  errorEmbed.setFooter({
    text: `${errorType.toUpperCase()} - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });

  errorStack.setDescription(error.stack || "No stack trace available.");
  errorStack.setFooter({
    text: `${errorType.toUpperCase()} - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });
}

function errorTimeout(
  client: ExtendedClient,
  error: Error,
  errorType: InteractionErrorType,
  id: string,
  errorEmbed: EmbedBuilder,
  errorStack: EmbedBuilder,
  locale: string
) {
  const replacements = {
    commandName: `/${id}`,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
  };

  const dynamicKey = `error_embed.${errorType}` as TranslationKey;
  const footer = translate(locale, dynamicKey, replacements);

  errorEmbed.setTitle(translate(locale, "error_embed.timeout.title"));
  errorEmbed.setDescription(
    translate(locale, "error_embed.timeout.description")
  );
  errorEmbed.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });

  errorStack.setTitle(translate(locale, "error_embed.no_stack"));
  errorStack.setDescription(translate(locale, "error_embed.timeout.note"));
  errorStack.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });
}
