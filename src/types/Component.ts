import {
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { ExtendedClient } from "../lib/ExtendedClient";

export interface ExecutableItem {
  execute?: (interaction: any, client: ExtendedClient) => Promise<void | any>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}

export interface Component extends ExecutableItem {
  data: {
    customId: string | RegExp;
  };
}

export interface ButtonComponent extends Component {
  execute: (
    interaction: ButtonInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}

export interface SelectMenuComponent extends Component {
  execute: (
    interaction: AnySelectMenuInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}

export interface ModalComponent extends Component {
  execute: (
    interaction: ModalSubmitInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}
