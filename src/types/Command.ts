import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { ExtendedClient } from "../lib/ExtendedClient";

export interface SlashCommand {
  global?: boolean;
  guildID?: string | string[];
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) => Promise<void>;
}
