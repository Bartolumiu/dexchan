import { BotStrings } from "../schema";

export default {
  locale: {
    enabled: true,
    name: "English",
    code: "en",
  },
  common: {
    footers: {
      command: "/{commandName} - Requested by {user}",
      stats: "Title Stats - Requested by {user}",
    },
    errors: {
      unknown: "An unknown error occurred.",
      try_again: "Please try again later.",
      api_failure: "Couldn't fetch data from the external API.",
    },
    words: {
      unknown: "Unknown",
      none: "None",
      success: "Success",
      error: "Error",
      not_ok: "Fetch failed",
    },
  },
  commands: {
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
        empty: "Please provide a query to search for.",
        no_results: "The query returned no results. That's all we know.",
        invalid_id: "The provided ID is invalid.",
      },
    },
    settings: {
      description: "View or change the bot's settings.",
      view: {
        description: "View your settings",
        embed: {
          title: "User Settings",
          description: "Here are your current settings.",
          fields: {
            locale: "Language",
          },
        },
      },
      locale: {
        description: "Language settings",
        set: {
          description: "Set your preferred language",
          options: {
            locale: "The language you want to use",
          },
          success: {
            title: "Language Set",
            description: "Your preferred language has been set to `{locale}`.",
          },
          error: {
            invalid_locale: "The language `{locale}` is not valid.",
            no_changes:
              "No changes made. The language remains set to `{locale}`.",
          },
        },
        reset: {
          description: "Reset your preferred language",
          success: {
            title: "Language Reset",
            description: "Your preferred language has been reset.",
          },
          error: {
            description:
              "An error occurred while resetting your preferred language.",
          },
        },
      },
    },
    ping: {
      description: "Check the bot's latency.",
      response: {
        ping: "Pinging...",
        title: "Pong!",
        fields: {
          connection_latency: "Connection Latency",
          bot_latency: "Bot Latency",
          api: {
            discord: "Discord API",
            mangabaka: "MangaBaka API",
            mangadex: "MangaDex API",
            namicomi: "NamiComi API",
          },
        },
      },
    },
    help: {
      description: "Get help with the bot.",
      response: {
        title: "Help",
        fields: {
          commands: {
            name: "Commands",
            value: "To view a list of commands, use `/commands`.",
          },
          support: {
            name: "Support",
            value: "To get support, use `/support`.",
          },
          invite: {
            name: "Invite",
            value: "To invite the bot to your server, use `/invite`.",
          },
          stats: {
            name: "Stats",
            value: "To view the bot's stats, use `/stats`.",
          },
          uptime: {
            name: "Uptime",
            value: "To view the bot's uptime, use `/uptime`.",
          },
        },
      },
    },
    commands: {
      description: "Get the list of the commands you can use.",
      response: {
        title: "Commands",
        description: "Here are the commands you can use.",
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
  components: {
    title_stats: {
      response: {
        title: "Title Stats",
        description:
          "Here are the stats for the title with ID `{titleId}` from {source}.",
        fields: {
          rating: "Rating",
          average: "Average Rating",
          bayesian: "Bayesian Rating",
          follows: "Follows",
          distribution: "Rating Distribution",
          comments: "Comments",
          chapter_views: "Chapter Views",
          chapter_comments: "Chapter Comments",
          chapter_reactions: "Chapter Reactions",
          views: "Views",
        },
        units: {
          votes: "votes",
          comments: "comments",
        },
        buttons: {
          mangadex: {
            forum: {
              open: "Open Forum Thread",
              no_thread: "No Forum Thread",
            },
          },
          namicomi: {
            open: "Open on NamiComi",
          },
        },
      },
    },
  },
  utils: {
    title_embed: {
      author: {
        too_many: "Multiple Authors",
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
