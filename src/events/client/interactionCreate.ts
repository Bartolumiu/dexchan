import {
  Events,
  Colors,
  EmbedBuilder,
  Interaction,
  Collection,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  ButtonInteraction,
  AnySelectMenuInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
} from "discord.js";
import * as fs from "node:fs";
import { BotEvent } from "../../types/Event";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { getInteractionContext } from "../../utils/database";

const event: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (client: ExtendedClient, interaction: Interaction) => {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;

    const { errorEmbed, errorStack } = await createErrorEmbed(client, locale);
    const embeds = [errorEmbed, errorStack];

    try {
      if (interaction.isChatInputCommand()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_ch_input",
          embeds,
          client
        );
      } else if (interaction.isButton()) {
        await handleInteraction(
          interaction,
          client.buttons,
          interaction.customId,
          "err_int_btn",
          embeds,
          client
        );
      } else if (interaction.isAnySelectMenu()) {
        await handleInteraction(
          interaction,
          client.selectMenus,
          interaction.customId,
          "err_int_slct",
          embeds,
          client
        );
      } else if (interaction.isContextMenuCommand()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_ctx",
          embeds,
          client
        );
      } else if (interaction.isModalSubmit()) {
        await handleInteraction(
          interaction,
          client.modals,
          interaction.customId,
          "err_int_mod",
          embeds,
          client
        );
      } else if (interaction.isAutocomplete()) {
        await handleInteraction(
          interaction,
          client.commands,
          interaction.commandName,
          "err_int_auto",
          embeds,
          client,
          true
        );
      } else {
        console.warn(`Unknown interaction type: ${interaction.type}`);
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

async function createErrorEmbed(client: ExtendedClient, locale: string) {
  // TODO: Remove 'any' cast once handleLocales is migrated
  const translate = (client as any).translate || (async () => "Error");

  const errorTitle = await translate(locale, "error_embed", "title");
  const errorDescription = await translate(
    locale,
    "error_embed",
    "description"
  );
  const errorStack = await translate(locale, "error_embed", "stack");

  return {
    errorEmbed: new EmbedBuilder()
      .setTitle(errorTitle || "Error")
      .setDescription(errorDescription || "An error occurred.")
      .setColor(Colors.Red),
    errorStack: new EmbedBuilder()
      .setTitle(errorStack || "Stack Trace")
      .setColor(Colors.Red),
  };
}

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

async function handleInteraction(
  interaction: Interaction,
  collection: Collection<string | RegExp, ExecutableItem>,
  id: string,
  errorType: string,
  embeds: EmbedBuilder[],
  client: ExtendedClient,
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
      await errorTimeout(
        client,
        interaction,
        error,
        errorType,
        id,
        embeds[0],
        embeds[1]
      );
    } else {
      await updateErrorEmbed(
        client,
        interaction,
        error,
        errorType,
        id,
        embeds[0],
        embeds[1]
      );
      throw error;
    }
    throw new Error("Interaction execution timed out");
  }
}

async function updateErrorEmbed(
  client: ExtendedClient,
  interaction: Interaction,
  error: Error,
  errorType: string,
  id: string,
  errorEmbed: EmbedBuilder,
  errorStack: EmbedBuilder
) {
  const locale = (await getInteractionContext(interaction)).locale;
  const translate = (client as any).translate || (async () => "Error"); // TODO: Remove 'any' cast

  const replacements = {
    commandName: `/${id}`,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
  };
  const errorMessageStr = await translate(locale, "error_embed", "message");
  const footer = await translate(
    locale,
    "error_embed",
    `${errorType}`,
    replacements
  );

  errorEmbed.addFields({
    name: errorMessageStr || "Error Message",
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

async function errorTimeout(
  client: ExtendedClient,
  interaction: Interaction,
  error: Error,
  errorType: string,
  id: string,
  errorEmbed: EmbedBuilder,
  errorStack: EmbedBuilder
) {
  const locale = (await getInteractionContext(interaction)).locale;
  const translate = (client as any).translate || (async () => "Error"); // TODO: Remove 'any' cast

  const replacements = {
    commandName: `/${id}`,
    buttonId: id,
    selectId: id,
    contextId: id,
    modalId: id,
  };
  const footer = await translate(
    locale,
    "error_embed",
    `${errorType}`,
    replacements
  );

  errorEmbed.setTitle(await translate(locale, "error_embed", "timeout.title"));
  errorEmbed.setDescription(
    await translate(locale, "error_embed", "timeout.description")
  );
  errorEmbed.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });

  errorStack.setTitle(await translate(locale, "error_embed", "no_stack"));
  errorStack.setDescription(
    await translate(locale, "error_embed", "timeout.note")
  );
  errorStack.setFooter({
    text: `ERR_TIMEOUT - ${footer}`,
    iconURL: client.user?.displayAvatarURL(),
  });
}
