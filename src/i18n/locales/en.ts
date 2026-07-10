import { BotStrings } from "../schema";

export default {
  locale: {
    enabled: true,
    name: "English",
    english_name: "English",
    code: "en",
  },
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
    configuration: {
      settings: {
        description: "View or change the bot's settings.",
        subcommands: {
          view: {
            description: "View your settings",
            response: {
              title: "User Settings",
              description: "Here are your current settings.",
              fields: {
                locale: {
                  name: "Language",
                },
              },
            },
          },
        },
        subcommand_groups: {
          locale: {
            description: "Language Settings",
            subcommands: {
              set: {
                description: "Set your preferred language",
                options: {
                  locale: {
                    description: "The language you want to use",
                  },
                },
                response: {
                  title: {
                    success: "Language Set",
                    error: {
                      invalid_locale: "Invalid Language",
                      no_changes: "No Changes",
                      unknown: "Unknown Error",
                    },
                  },
                  description: {
                    success:
                      "Your preferred language has been set to `{locale}`.",
                    error: {
                      invalid_locale: "The language `{locale}` is not valid.",
                      no_changes:
                        "No changes made. The language remains set to `{locale}`.",
                      unknown:
                        "An unknown error occurred while changing the language.",
                    },
                  },
                },
              },
              reset: {
                description: "Reset your preferred language",
                response: {
                  title: {
                    success: "Language Reset",
                    error: "Error while resetting the language",
                  },
                  description: {
                    success: "Your preferred language has been reset.",
                    error:
                      "An error occurred while resetting your preferred language.",
                  },
                },
              },
            },
          },
        },
        response: {
          footer: "{commandName} - Requested by {user}",
        },
      },
    },
    utils: {
      ping: {
        description: "Check the bot's latency.",
        response: {
          ping: "Pinging...",
          title: "Pong!",
          fields: {
            bot_latency: {
              name: "Bot Latency",
              value: "{ping}ms",
            },
            api: {
              discord: {
                name: "Discord API",
                value: "{apiPing}ms",
              },
              mangadex: {
                name: "MangaDex API",
                value: "{mdPing}ms",
              },
              namicomi: {
                name: "NamiComi API",
                value: "{ncPing}ms",
              },
            },
          },
          footer: "{commandName} - Requested by {user}",
          not_ok: "Fetch failed",
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
          footer: "{commandName} - Requested by {user}",
        },
      },
      commands: {
        description: "Get the list of the commands you can use.",
        response: {
          title: "Commands",
          description: "Here are the commands you can use.",
          footer: "{commandName} - Requested by {user}",
        },
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
          rating: { name: "Rating" },
          average: { name: "Average Rating" },
          bayesian: { name: "Bayesian Rating" },
          follows: { name: "Follows" },
          distribution: { name: "Rating Distribution" },
          comments: { name: "Comments" },
          chapter_views: { name: "Chapter Views" },
          chapter_comments: { name: "Chapter Comments" },
          chapter_reactions: { name: "Chapter Reactions" },
          views: { name: "Views" },
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
        footer: "Title Stats - Requested by {user}",
      },
      error: {
        title: "Error",
        description:
          "An error occurred while fetching title stats from the API. Please try again later.",
      },
    },
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
