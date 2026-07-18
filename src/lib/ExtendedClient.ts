import {
  Client,
  ClientOptions,
  Collection,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { SlashCommand } from "../types/Command";
import {
  ButtonComponent,
  ModalComponent,
  SelectMenuComponent,
} from "../types/Component";

export class ExtendedClient extends Client {
  public commands = new Collection<string | RegExp, SlashCommand>();
  public buttons = new Collection<string | RegExp, ButtonComponent>();
  public selectMenus = new Collection<string | RegExp, SelectMenuComponent>();
  public modals = new Collection<string | RegExp, ModalComponent>();
  public guildCommands = new Collection<string, SlashCommand>();
  public globalCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  public version: string;

  constructor(options: ClientOptions, version: string) {
    super(options);
    this.version = version;
  }
}
