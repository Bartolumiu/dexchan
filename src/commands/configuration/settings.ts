import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import {
  format,
  getAvailableLocales,
  getTranslations,
  translate,
  translateAttribute,
} from "../../functions/handlers/handleLocales";
import { getInteractionContext } from "../../utils/database";
import { prisma } from "../../utils/prisma";
import { ExtendedClient } from "../../lib/ExtendedClient";
import { SlashCommand } from "../../types/Command";

const command: SlashCommand = {
  global: true,
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Change your settings")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.settings.description)
    )
    .addSubcommand((command) =>
      command
        .setName("view")
        .setDescription("View your settings")
        .setDescriptionLocalizations(
          translateAttribute((t) => t.commands.settings.view.description)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("locale")
        .setDescription("Your preferred locale")
        .setDescriptionLocalizations(
          translateAttribute((t) => t.commands.settings.locale.description)
        )
        .addSubcommand((command) =>
          command
            .setName("set")
            .setDescription("Set your preferred locale")
            .setDescriptionLocalizations(
              translateAttribute(
                (t) => t.commands.settings.locale.set.description
              )
            )
            .addStringOption((option) =>
              option
                .setName("locale")
                .setDescription(
                  "The language you want to set as your preferred language"
                )
                .setDescriptionLocalizations(
                  translateAttribute(
                    (t) => t.commands.settings.locale.set.options.locale
                  )
                )
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("reset")
            .setDescription("Reset your preferred locale")
            .setDescriptionLocalizations(
              translateAttribute(
                (t) => t.commands.settings.locale.reset.description
              )
            )
        )
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    let locale = context.locale;
    let translations = getTranslations(locale);
    const embed = new EmbedBuilder();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (subcommandGroup === "locale") {
      const updatedLocale = await localeSettings(interaction, locale, embed);
      if (updatedLocale) {
        locale = updatedLocale;
        translations = getTranslations(locale);
      }
    } else if (subcommand === "view") {
      await viewSettings(interaction, locale, embed);
    } else {
      return;
    }

    embed.setFooter({
      text: format(translations.common.footers.command, {
        commandName: `${interaction.commandName}`,
        user: interaction.user.username,
      }),
      iconURL: interaction.user.displayAvatarURL(),
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async autocomplete(
    interaction: AutocompleteInteraction,
    _client: ExtendedClient
  ) {
    const subcommandGroup = interaction.options
      .getSubcommandGroup()
      ?.toLowerCase();
    const subcommand = interaction.options.getSubcommand().toLowerCase();

    if (subcommandGroup === "locale" && subcommand === "set") {
      const locales = getFilteredLocales(interaction);
      return interaction.respond(locales);
    }
  },
};

export default command;

function getFilteredLocales(
  interaction: AutocompleteInteraction
): Array<{ name: string; value: string }> {
  const allLocales = getAvailableLocales().filter((l) => l.enabled);
  const input = interaction.options.getString("locale");

  if (input) {
    const lower = input.toLowerCase();
    return allLocales
      .filter(
        (l) =>
          l.name.toLowerCase().includes(lower) ||
          l.code.toLowerCase().includes(lower)
      )
      .map((l) => ({ name: l.name, value: l.code }));
  }

  return allLocales.map((l) => ({ name: l.name, value: l.code }));
}

async function localeSettings(
  interaction: ChatInputCommandInteraction,
  locale: string,
  embed: EmbedBuilder
): Promise<string | undefined> {
  const translations = getTranslations(locale);
  const t = translations.commands.settings.locale;

  switch (interaction.options.getSubcommand()) {
    case "set":
      try {
        const newLocale = interaction.options.getString("locale")!;

        const validLocales = getAvailableLocales().filter((l) => l.enabled);
        const isValid = validLocales.some((l) => l.code === newLocale);

        if (!isValid) {
          embed.setTitle(t.set.error.invalid_locale);
          embed.setDescription(
            format(t.set.error.invalid_locale, {
              locale: newLocale,
            })
          );
          embed.setColor(Colors.Red);
          return undefined;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: interaction.user.id },
        });

        if (dbUser?.preferredLocale === newLocale) {
          embed.setTitle(t.set.error.no_changes);
          embed.setDescription(
            format(t.set.error.no_changes, {
              locale: newLocale,
            })
          );
          embed.setColor(Colors.Red);
          return undefined;
        }

        await prisma.user.upsert({
          where: { id: interaction.user.id },
          update: { preferredLocale: newLocale },
          create: { id: interaction.user.id, preferredLocale: newLocale },
        });

        const newTranslations = getTranslations(newLocale);
        const newT = newTranslations.commands.settings.locale;
        const langName = translate(newLocale, "locale.name" as any);

        embed.setTitle(newT.set.success.title);
        embed.setDescription(
          format(newT.set.success.description, { locale: langName })
        );
        embed.setColor(Colors.Green);

        return newLocale;
      } catch {
        embed.setTitle(translations.common.words.error);
        embed.setDescription(translations.common.errors.unknown);
        embed.setColor(Colors.Red);
      }
      break;
    case "reset":
      try {
        await prisma.user.update({
          where: { id: interaction.user.id },
          data: { preferredLocale: null },
        });

        const fallbackLocale = interaction.locale;
        const fallbackTranslations = getTranslations(fallbackLocale);
        const fallbackT = fallbackTranslations.commands.settings.locale;

        embed.setTitle(fallbackT.reset.success.title);
        embed.setDescription(fallbackT.reset.success.description);
        embed.setColor(Colors.Green);

        return fallbackLocale;
      } catch {
        embed.setTitle(translations.common.words.error);
        embed.setDescription(t.reset.error.description);
        embed.setColor(Colors.Red);
      }
      break;
  }
  return undefined;
}

async function viewSettings(
  interaction: ChatInputCommandInteraction,
  locale: string,
  embed: EmbedBuilder
) {
  const translations = getTranslations(locale);
  const t = translations.commands.settings.view;

  embed.setTitle(t.embed.title);
  embed.setDescription(t.embed.description);
  embed.addFields({
    name: t.embed.fields.locale,
    value: translate(locale, "locale.name" as any),
    inline: true,
  });
  embed.setColor(Colors.Blue);
}
