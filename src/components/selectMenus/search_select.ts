import { StringSelectMenuInteraction } from "discord.js";
import { ExtendedClient } from "../../lib/ExtendedClient";

export default {
  data: {
    customId: "search_select",
  },
  async execute(
    interaction: StringSelectMenuInteraction,
    client: ExtendedClient
  ) {
    await interaction.deferUpdate();

    const title = interaction.values[0];
    const [source, id] = title.split(":");

    const command = client.commands.get("search");
    if (command) {
      await interaction.editReply({ components: [] });

      const mockInteraction = new Proxy(interaction, {
        get(target, prop) {
          switch (prop) {
            case "commandName":
              return "search";
            case "deferred":
              return true;
            case "deferReply":
              return async () => {};
            case "options":
              return {
                getString: (name: string) => {
                  switch (name) {
                    case "id":
                      return id;
                    case "source":
                      return source;
                    default:
                      return null;
                  }
                },
              };
          }
          const value = Reflect.get(target, prop);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }) as any;

      await command.execute(mockInteraction, client);
    }
  },
};
