import { Client, ClientOptions, Collection } from "discord.js";

export class ExtendedClient extends Client {
  public commands = new Collection<string, any>();
  public buttons = new Collection<string, any>();
  public selectMenus = new Collection<string, any>();
  public modals = new Collection<string, any>();
  public guildCommands = new Collection<string, any>();
  public globalCommands: any[] = [];
  public version: string;

  constructor(options: ClientOptions, version: string) {
    super(options);
    this.version = version;
  }
}
