import { PartialBotStrings } from "../schema";

export default {
  locale: {
    enabled: false,
    name: "",
    code: "",
  },
  commands: {
    search: {
      description: "",
      options: {
        source: {
          description: "",
          no_sources: "",
        },
      },
    },
    settings: {
      description: "",
    },
    ping: {
      description: "",
      response: {
        ping: "",
        title: "",
      },
    },
    help: {
      description: "",
      response: {
        title: "",
        fields: {
          commands: {
            name: "",
            value: "",
          },
          support: {
            name: "",
            value: "",
          },
          invite: {
            name: "",
            value: "",
          },
          stats: {
            name: "",
            value: "",
          },
          uptime: {
            name: "",
            value: "",
          },
        },
      },
    },
    commands: {
      description: "",
      response: {
        title: "",
      },
    },
  },
  error_embed: {
    title: "",
    description: "",
    stack: "",
    message: "",
    no_stack: "",
    timeout: {
      title: "",
      description: "",
      note: "",
    },
    err_int_ch_input: "",
    err_int_btn: "",
    err_int_slct: "",
    err_int_ctx: "",
    err_int_mod: "",
  },
  components: {
    title_stats: {
      response: {
        title: "",
        description: "",
        units: {
          votes: "",
          comments: "",
        },
        buttons: {
          mangadex: {
            forum: {
              open: "",
              no_thread: "",
            },
          },
          namicomi: {
            open: "",
          },
        },
      },
    },
  },
} satisfies PartialBotStrings;
