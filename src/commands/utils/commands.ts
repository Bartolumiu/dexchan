import {
  ApplicationCommand,
  ApplicationCommandPermissions,
  ApplicationCommandPermissionType,
  ChatInputCommandInteraction,
  Collection,
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
    .setName("commands")
    .setDescription("Get the list of the commands you can use")
    .setDescriptionLocalizations(
      translateAttribute((t) => t.commands.commands.description)
    ),
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) {
    const context = await getInteractionContext(interaction);
    const locale = context.locale;
    const translations = getTranslations(locale);
    const t = translations.commands.commands.response;

    if (!interaction.guild) {
      await interaction.reply({
        content: translations.common.errors.unknown,
        ephemeral: true,
      });
      return;
    }

    const globalCommands = await client.application!.commands.fetch();
    const guildCommands = await interaction.guild.commands.fetch();
    const guildCommandPermissions =
      await interaction.guild.commands.permissions.fetch({});

    const allCommands = new Collection<string, ApplicationCommand>([
      ...globalCommands,
      ...guildCommands,
    ]);

    const availableCommands = [...allCommands.values()].filter((command) => {
      const permissions = guildCommandPermissions.get(command.id);

      if (command.defaultMemberPermissions) {
        if (
          !interaction.memberPermissions?.has(command.defaultMemberPermissions)
        )
          return false;
      }

      if (!permissions) return true;

      const hasRole = hasRolePermission(permissions, interaction);
      const hasUser = hasUserPermission(permissions, interaction);

      return hasRole || hasUser;
    });

    const fields = availableCommands.map((cmd) => {
      const cmdKey = cmd.name as keyof typeof translations.commands;
      const localizedDesc = translations.commands[cmdKey]?.description;

      return {
        name: `/${cmd.name}`,
        value: localizedDesc || cmd.description || cmd.name,
      };
    });

    const embed = new EmbedBuilder()
      .setTitle(t.title)
      .setDescription(t.description)
      .addFields(fields)
      .setColor(Colors.Blurple)
      .setFooter({
        text: format(translations.common.footers.command, {
          commandName: `${interaction.commandName}`,
          user: interaction.user.username,
        }),
        iconURL: client.user?.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;

export const hasRolePermission = (
  commandPermissions: ApplicationCommandPermissions[],
  interaction: ChatInputCommandInteraction
): boolean => {
  const rolePermissions = commandPermissions.filter(
    (p) => p.type === ApplicationCommandPermissionType.Role && p.permission === true
  );
  const userRoleIDs = interaction.member
    ? (interaction.member.roles as any).cache.map((role: any) => role.id)
    : [];
  return rolePermissions.some((p) => userRoleIDs.includes(p.id));
};

export const hasUserPermission = (
  commandPermissions: ApplicationCommandPermissions[],
  interaction: ChatInputCommandInteraction
): boolean => {
  const userPermissions = commandPermissions.filter(
    (p) => p.type === ApplicationCommandPermissionType.User && p.permission === true
  );
  return userPermissions.some((p) => p.id === interaction.user.id);
};
