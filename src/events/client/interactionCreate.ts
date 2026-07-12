import {
  AnySelectMenuInteraction,
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
import { logMessage } from "../../lib/app";
import {
  format,
  getTranslations,
} from "../../functions/handlers/handleLocales";
import { ExecutableItem } from "../../types/Component";
import { BotStrings } from "../../i18n/schema";

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

const event: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (client: ExtendedClient, interaction: Interaction) => {
    const context = await getInteractionContext(interaction);
    const translations = getTranslations(context.locale);
    const errorStrings = translations.error_embed;

    const { errorEmbed, errorStack } = createErrorEmbed(errorStrings);
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
          errorStrings
        );
      } else if (interaction.isButton()) {
        await handleInteraction(
          interaction,
          client.buttons,
          interaction.customId,
          "err_int_btn",
          embeds,
          client,
          errorStrings
        );
      } else if (interaction.isAnySelectMenu()) {
        await handleInteraction(
          interaction,
          client.selectMenus,
          interaction.customId,
          "err_int_slct",
          embeds,
          client,
          errorStrings
        );
      } else if (interaction.isContextMenuCommand()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_ctx",
          embeds,
          client,
          errorStrings
        );
      } else if (interaction.isModalSubmit()) {
        await handleInteraction(
          interaction,
          client.modals,
          interaction.customId,
          "err_int_mod",
          embeds,
          client,
          errorStrings
        );
      } else if (interaction.isAutocomplete()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_auto",
          embeds,
          client,
          errorStrings,
          true
        );
      } else {
        await logMessage(
          `Unknown interaction type: ${interaction.type}`,
          "warn"
        );
      }
    } catch (e) {
      const error = e as Error;
      const errorTimestamp = new Date()
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

function createErrorEmbed(errorStrings: BotStrings["error_embed"]) {
  return {
    errorEmbed: new EmbedBuilder()
      .setTitle(errorStrings.title)
      .setDescription(errorStrings.description)
      .setColor(Colors.Red),
    errorStack: new EmbedBuilder()
      .setTitle(errorStrings.stack)
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
  errorStrings: BotStrings["error_embed"],
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
      ("code" in error && (error as any).code === "ECONNABORDED") ||
      error.message.toLowerCase().includes("timeout") ||
      stack.includes("timeout")
    ) {
      errorTimeout(
        client,
        error,
        errorType,
        id,
        embeds[0],
        embeds[1],
        errorStrings
      );
    } else {
      updateErrorEmbed(
        client,
        error,
        errorType,
        id,
        embeds[0],
        embeds[1],
        errorStrings
      );
      throw error;
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
  errorStrings: BotStrings["error_embed"]
) {
  const replacements = {
    commandName: id,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
    autocompleteId: id,
  };

  const footer = format(errorStrings[errorType], replacements);

  errorEmbed.addFields({
    name: errorStrings.message,
    value: error.message,
  });

  errorEmbed.setFooter({
    text: `${errorType.toUpperCase()} - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });

  errorStack.setDescription(error.stack || errorStrings.no_stack);
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
  errorStrings: BotStrings["error_embed"]
) {
  const replacements = {
    commandName: id,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
    autocompleteId: id,
  };

  const footer = format(errorStrings[errorType], replacements);

  errorEmbed.setTitle(errorStrings.timeout.title);
  errorEmbed.setDescription(errorStrings.timeout.description);
  errorEmbed.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });

  errorStack.setTitle(errorStrings.no_stack);
  errorStack.setDescription(errorStrings.timeout.note);
  errorStack.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });
}
