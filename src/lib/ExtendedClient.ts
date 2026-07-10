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
  public commands = new Collection<string, SlashCommand>();
  public buttons = new Collection<string, ButtonComponent>();
  public selectMenus = new Collection<string, SelectMenuComponent>();
  public modals = new Collection<string, ModalComponent>();
  public guildCommands = new Collection<string, SlashCommand>();
  public globalCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  public version: string;

  constructor(options: ClientOptions, version: string) {
    super(options);
    this.version = version;
  }
}
