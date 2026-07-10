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
      translateAttribute((t) => t.commands.configuration.settings.description)
    )
    .addSubcommand((command) =>
      command
        .setName("view")
        .setDescription("View your settings")
        .setDescriptionLocalizations(
          translateAttribute(
            (t) => t.commands.configuration.settings.subcommands.view.description
          )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("locale")
        .setDescription("Your preferred locale")
        .setDescriptionLocalizations(
          translateAttribute(
            (t) =>
              t.commands.configuration.settings.subcommand_groups.locale.description
          )
        )
        .addSubcommand((command) =>
          command
            .setName("set")
            .setDescription("Set your preferred locale")
            .setDescriptionLocalizations(
              translateAttribute(
                (t) =>
                  t.commands.configuration.settings.subcommand_groups.locale.subcommands.set.description
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
                    (t) =>
                      t.commands.configuration.settings.subcommand_groups.locale.subcommands.set.options.locale.description
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
                (t) =>
                  t.commands.configuration.settings.subcommand_groups.locale.subcommands.reset.description
              )
            )
        )
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const embed = new EmbedBuilder();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();

    if (subcommandGroup === "locale")
      await localeSettings(interaction, locale, embed);
    else if (subcommand === "view")
      await viewSettings(interaction, locale, embed);
    else return;

    embed.setFooter({
      text: format(translations.commands.configuration.settings.response.footer, {
        commandName: `/${interaction.commandName}`,
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
) {
  const translations = getTranslations(locale);
  const t = translations.commands.configuration.settings.subcommand_groups.locale.subcommands;

  switch (interaction.options.getSubcommand()) {
    case "set":
      try {
        const newLocale = interaction.options.getString("locale")!;

        const validLocales = getAvailableLocales().filter((l) => l.enabled);
        const isValid = validLocales.some((l) => l.code === newLocale);

        if (!isValid) {
          embed.setTitle(t.set.response.title.error.invalid_locale);
          embed.setDescription(
            format(t.set.response.description.error.invalid_locale, {
              locale: newLocale,
            })
          );
          embed.setColor(Colors.Red);
          return;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: interaction.user.id },
        });

        if (dbUser?.preferredLocale === newLocale) {
          embed.setTitle(t.set.response.title.error.no_changes);
          embed.setDescription(
            format(t.set.response.description.error.no_changes, {
              locale: newLocale,
            })
          );
          embed.setColor(Colors.Red);
          return;
        }

        await prisma.user.upsert({
          where: { id: interaction.user.id },
          update: { preferredLocale: newLocale },
          create: { id: interaction.user.id, preferredLocale: newLocale },
        });

        const langName = translate(newLocale, "locale.name" as any);
        embed.setTitle(t.set.response.title.success);
        embed.setDescription(
          format(t.set.response.description.success, { locale: langName })
        );
        embed.setColor(Colors.Green);
      } catch {
        embed.setTitle(t.set.response.title.error.unknown);
        embed.setDescription(t.set.response.description.error.unknown);
        embed.setColor(Colors.Red);
      }
      break;
    case "reset":
      try {
        await prisma.user.update({
          where: { id: interaction.user.id },
          data: { preferredLocale: null },
        });
        embed.setTitle(t.reset.response.title.success);
        embed.setDescription(t.reset.response.description.success);
        embed.setColor(Colors.Green);
      } catch {
        embed.setTitle(t.reset.response.title.error);
        embed.setDescription(t.reset.response.description.error);
        embed.setColor(Colors.Red);
      }
      break;
  }
}

async function viewSettings(
  interaction: ChatInputCommandInteraction,
  locale: string,
  embed: EmbedBuilder
) {
  const translations = getTranslations(locale);
  const t = translations.commands.configuration.settings.subcommands.view.response;

  embed.setTitle(t.title);
  embed.setDescription(t.description);
  embed.addFields({
    name: t.fields.locale.name,
    value: translate(locale, "locale.name" as any),
    inline: true,
  });
  embed.setColor(Colors.Blue);
}
