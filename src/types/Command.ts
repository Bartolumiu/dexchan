import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { ExtendedClient } from "../lib/ExtendedClient";

export interface SlashCommand {
  global?: boolean;
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | any; // TODO: Remove after yeeting async data() from current commands
  execute: (
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) => Promise<void>;
}
