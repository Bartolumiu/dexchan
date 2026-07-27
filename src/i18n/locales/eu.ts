import { PartialBotStrings } from "../schema";

export default {
  locale: {
    enabled: true,
    name: "Euskara",
    code: "eu",
  },
  common: {
    footers: {
      command: "/{commandName} - {user}k eskatua",
      stats: "Tituluaren Estatistikak - {user}k eskatua",
    },
    errors: {
      unknown: "Errore ezezagun bat gertatu da.",
      try_again: "Mesedez, saiatu berriro geroago.",
      api_failure:
        "Errore bat gertatu da kanpoko APItik datuak eskuratzerakoan.",
    },
    words: {
      unknown: "Ezezaguna",
      none: "Bat ere ez",
      success: "Arrakasta",
      error: "Errorea",
      not_ok: "Datu eskuratzeak huts egin du",
    },
  },
  commands: {
    search: {
      description: "Titulu bat bilatu.",
      options: {
        source: {
          description: "Bilaketarako erabili beharreko iturria",
          no_sources:
            "Ez dago iturririk eskuragarri. Mesedez, saiatu berriro geroago.",
        },
        query: "Bilatu nahi duzun titulua",
        id: "Bilatu nahi duzun tituluaren IDa",
        url: "Bilatu nahi duzun tituluaren URLa",
      },
      errors: {
        command_disabled:
          "Komando hau desgaituta dago.\nMesedez, saiatu berrigo geroago.",
        no_source: "Mesedez, bilatzeko iturri bat eman.",
        invalid_source:
          "Oraindik ez dugu `{source}`(e)n bilaketak onartzen. Mesedez, beste iturri bat aukeratu.",
        empty: "Mesedez, bilatzeko kontsulta bat eman.",
        no_results:
          "Kontsultak ez du emaitzarik itzuli. Hori da dakigun guztia.",
        invalid_id: "Emandako IDa baliogabea da.",
      },
    },
    settings: {
      description: "Botaren ezarpenak ikusi edo aldatu.",
      view: {
        description: "Zure ezarpenak ikusi",
        embed: {
          title: "Erabiltzailearen Ezarpenak",
          description: "Hemen dituzu zure uneko ezarpenak.",
          fields: {
            locale: "Hizkuntza",
          },
        },
      },
      locale: {
        description: "Hizkuntza Ezarpenak",
        set: {
          description: "Zure hizkuntza lehenetsia ezarri",
          options: {
            locale: "Erabili nahi duzun hizkuntza",
          },
          success: {
            title: "Hizkuntza Ezarrita",
            description: "Zure lehenetsitako hizkuntza berria `{locale}` da.",
          },
          error: {
            invalid_locale: "`{locale}` hizkuntza baliogabea da.",
            no_changes:
              "Ez dira aldaketarik egin. Hizkuntza `{locale}` balioarekin mantendu da.",
          },
        },
        reset: {
          description: "Zure lehenetsitako hizkuntza berrezarri",
          success: {
            title: "Hizkuntza Berrezarrita",
            description: "Zure lehenetsitako hizkuntza berrezarri da.",
          },
          error: {
            description:
              "Errore bat gertatu da zure lehenetsitako hizkuntza berrezartzean.",
          },
        },
      },
    },
    ping: {
      description: "Botaren latentzia ikusi.",
      response: {
        ping: "Ping egiten...",
        title: "Pong!",
        fields: {
          connection_latency: "Konexioaren Latentzia",
          bot_latency: "Botaren Latentzia",
          api: {
            discord: "Discord APIa",
            mangabaka: "MangaBaka APIa",
            mangadex: "MangaDex APIa",
            namicomi: "NamiComi APIa",
          },
        },
      },
    },
    help: {
      description: "Botarekin laguntza lortu.",
      response: {
        title: "Laguntza",
        fields: {
          commands: {
            name: "Komandoak",
            value: "Komando zerrenda bat ikusteko, `/commands` erabili.",
          },
          support: {
            name: "Laguntza",
            value: "Laguntza eskuratzeko, `/support` erabili.",
          },
          invite: {
            name: "Gonbidatu",
            value: "Bota zure zerbitzarira gonbidatzeko, `/invite` erabili.",
          },
          stats: {
            name: "Estatistikak",
            value: "Botaren estatistikak ikusteko, `/stats` erabili.",
          },
          uptime: {
            name: "Funtzionamendu Denbora",
            value:
              "Botaren funtzionamendu-denbora ikusteko, `/uptime` erabili.",
          },
        },
      },
    },
    commands: {
      description: "Erabil ditzakezun komandoen zerrenda eskuratu.",
      response: {
        title: "Komandoak",
        description: "Hemen dituzu erabil ditzakezun komandoak.",
      },
    },
  },
  error_embed: {
    title: "Errorea",
    description:
      "Errore bat gertatu da komando hau exekutatzerakoan. Behean duzu errorearen mezua. Mesedez, errore hau garatzaileari bidali. Mila esker!",
    stack: "Errorearen pila",
    message: "Errore mezua",
    no_stack: "Ez dago errore-pilarik eskuragarri",
    timeout: {
      title: "Timeout",
      description:
        "Timeout bat gertatu da kanpoko API batetik datuak eskuratzerakoan. Mesedez, saiatu berriro geroago.",
      note: "Errore hau normalean kanpoko APIa motela edo erantzuten ez duelako gertatzen da.",
    },
    err_int_ch_input: "{commandName} komandoan errorea",
    err_int_btn: "{buttonId} botoian errorea",
    err_int_slct: "{selectId} hautaketa menuan errorea",
    err_int_ctx: "{contextId} testuinguru komandoan errorea",
    err_int_mod: "{modalId} modalean errorea",
    err_int_auto: "{autocompleteId} osatze automatikoan errorea",
  },
  components: {
    title_stats: {
      response: {
        title: "Tituluaren Estatistikak",
        description:
          "Hemen dituzu `{titleId}`IDa duen tituluaren estatistikak {source}(e)n.",
        fields: {
          rating: "Balorazioa",
          average: "Batezbesteko Balorazioa",
          bayesian: "Bayesiar Balorazioa",
          follows: "Jarraitzaileak",
          distribution: "Balorazioen Banaketa",
          comments: "Iruzkinak",
          chapter_views: "Kapitulu Bistaratzeak",
          chapter_comments: "Kapitulu Iruzkinak",
          chapter_reactions: "Kapitulu Erreakzioak",
          views: "Bistaratzeak",
        },
        units: {
          votes: "bozkak",
          comments: "iruzkin",
        },
        buttons: {
          mangadex: {
            forum: {
              open: "Foroaren Haria Ireki",
              no_thread: "Foru-haririk Ez",
            },
          },
          namicomi: {
            open: "NamiComin Ireki",
          },
        },
      },
    },
  },
  utils: {
    title_embed: {
      author: {
        too_many: "Egile Anitz",
      },
      description: {
        no_description: "Ez dago deskribapenik eskuragarri.",
      },
      fields: {
        rating: "Balorazioa",
        follows: "Jarraitzaileak",
        year: "Urtea",
        pub_status: {
          name: "Argitalpen Egoera",
          value: {
            upcoming: "Etorkizunean",
            ongoing: "Argitaratzen",
            completed: "Amaituta",
            hiatus: "Atsedenaldia",
            cancelled: "Bertan Behera",
            unknown: "Ezezaguna",
          },
        },
        demographic: {
          name: "Demografia",
          value: {
            none: "Bat ere ez",
            shounen: "Shounen",
            shoujo: "Shoujo",
            seinen: "Seinen",
            josei: "Josei",
          },
        },
        content_rating: {
          name: "Edukiaren Sailkapena",
          value: {
            safe: "Segurua",
            suggestive: "Lizuna",
            erotica: "Erotika",
            pornographic: "Pornografikoa",
            mature: "Helduentzat",
            restricted: "Mugatuta",
          },
        },
        type: {
          name: "Mota",
          value: {
            manga: "Manga",
            long_strip: "Tira Luzea",
            comic: "Komikia",
            novel: "Eleberria",
          },
        },
        reading_mode: {
          name: "Irakurketa Modua",
          value: {
            vertical: "Bertikala",
            horizontal: {
              left_to_right: "Horizontala (Ezkerretik Eskuinera)",
              right_to_left: "Horizontala (Eskuinetik Ezkerrera)",
            },
          },
        },
      },
      button: {
        open: "{source}(e)n Ireki",
        stats: "Estatistikak Ikusi",
      },
    },
    title_list_embed: {
      description: "Hemen dituzu `{query}` bilaketaren emaitzak {source}(e)n.",
      placeholder: "Titulu bat hautatu informazio gehiago ikusteko...",
      title: "Bilaketa-emaitzak",
      view: "Titulua {source}(e)n Ikusi",
    },
    title_tags: {
      format: "Formatua",
      themes: "Gaiak",
      genres: "Generoak",
      tags: "Etiketak",
      genres_v2: "Generoak (v2)",
      tags_v2: "Etiketak (v2)",
      content_warning: "Edukiaren Abisuak",
      other_tags: "Beste Etiketak",
    },
  },
  sources: {
    mangabaka: "MangaBaka",
    mangadex: "MangaDex",
    namicomi: "NamiComi",
  },
} satisfies PartialBotStrings;
