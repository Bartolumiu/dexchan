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
  utils: {
    title_tags: {
      format: "Format",
      themes: "Themes",
      genres: "Genres",
      tags: "Tags",
      genres_v2: "Genres (v2)",
      tags_v2: "Tags (v2)",
      content_warning: "Content Warnings",
      other_tags: "Other Tags",
    },
  },
} satisfies BotStrings;
