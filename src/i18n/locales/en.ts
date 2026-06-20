import { BotStrings } from "../schema";

export default {
  commands: {
    lookup: {
      search: {
        description: "Search for a title",
        options: {
          source: {
            description: "The source to use for the search",
            no_sources: "No sources available. Please try again later.",
          },
          query: "The title to search for",
          id: "The ID of the title",
          url: "The URL of the title",
        },
      },
    },
  },
  error_embed: {
    title: "Error",
    description: "An error occurred while processing your request.",
  },
} satisfies BotStrings;
