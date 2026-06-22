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
        errors: {
          command_disabled:
            "This command is currently disabled.\nPlease try again later.",
          no_source: "Please specify a source to search on.",
          invalid_source:
            "We don't support searching on `{source}` yet. Please choose a different source.",
          api: "Couldn't fetch title data from the external API.\nPlease try again later.",
          empty: "Please provide a query to search for.",
          no_results: "The query returned no results. That's all we know.",
          invalid_id: "The provided ID is invalid.",
        },
        footer: "/{commandName} - Requested by {user}",
      },
    },
  },
  error_embed: {
    title: "Uh-oh!",
    description: "An error occurred while processing your request.",
    stack: "Error Stack",
    message: "Error Message",
    no_stack: "No stack trace available.",
    timeout: {
      title: "Request timed out",
      description:
        "A timeout occurred while fetching data from an external API. Please try again later.",
      note: "This error is usually caused by the external API being slow or unresponsive.",
    },
    err_int_ch_input: "Error in command {commandName}",
    err_int_btn: "Error in button {buttonId}",
    err_int_slct: "Error in select menu {selectId}",
    err_int_ctx: "Error in context command {contextId}",
    err_int_mod: "Error in modal {modalId}",
    err_int_auto: "Error in autocomplete {autocompleteId}",
  },
  utils: {
    title_embed: {
      title: {
        unknown: "Unknown Title",
      },
      author: {
        too_many: "Multiple Authors",
        unknown: "Unknown Author",
      },
      description: {
        no_description: "No description available.",
      },
      fields: {
        rating: "Rating",
        follows: "Follows",
        year: "Year",
        pub_status: {
          name: "Publication Status",
          value: {
            upcoming: "Upcoming",
            ongoing: "Ongoing",
            completed: "Completed",
            hiatus: "Hiatus",
            cancelled: "Cancelled",
            unknown: "Unknown",
          },
        },
        demographic: {
          name: "Demographic",
          value: {
            none: "None",
            shounen: "Shounen",
            shoujo: "Shoujo",
            seinen: "Seinen",
            josei: "Josei",
          },
        },
        content_rating: {
          name: "Content Rating",
          value: {
            safe: "Safe",
            suggestive: "Suggestive",
            erotica: "Erotica",
            pornographic: "Pornographic",
            mature: "Mature",
            restricted: "Restricted",
          },
        },
        type: {
          name: "Type",
          value: {
            manga: "Manga",
            long_strip: "Long Strip",
            comic: "Comic",
            novel: "Novel",
          },
        },
        reading_mode: {
          name: "Reading Mode",
          value: {
            vertical: "Vertical",
            horizontal: {
              left_to_right: "Left to Right",
              right_to_left: "Right to Left",
            },
          },
        },
      },
      button: {
        open: "Open on {source}",
        stats: "View Stats",
      },
    },
    title_list_embed: {
      description: "Here are the search results for `{query}` on {source}.",
      placeholder: "Select a title to view more information...",
      title: "Search Results",
      unknown: "Unknown Title",
      view: "View Title on {source}",
    },
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
  sources: {
    mangabaka: "MangaBaka",
    mangadex: "MangaDex",
    namicomi: "NamiComi",
  },
} satisfies BotStrings;
