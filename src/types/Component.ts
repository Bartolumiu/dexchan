import {
  AnySelectMenuInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { ExtendedClient } from "../lib/ExtendedClient";

export interface ExecutableItem<TInteraction = unknown> {
  execute?: (
    interaction: TInteraction,
    client: ExtendedClient
  ) => Promise<unknown>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client: ExtendedClient
  ) => Promise<unknown>;
}

export interface Component<
  TInteraction = unknown,
> extends ExecutableItem<TInteraction> {
  data: {
    customId: string | RegExp;
  };
}

export interface ButtonComponent extends Component<ButtonInteraction> {
  execute: (
    interaction: ButtonInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}

export interface SelectMenuComponent extends Component<AnySelectMenuInteraction> {
  execute: (
    interaction: AnySelectMenuInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}

export interface ModalComponent extends Component<ModalSubmitInteraction> {
  execute: (
    interaction: ModalSubmitInteraction,
    client: ExtendedClient
  ) => Promise<void | any>;
}
