import { PartialBotStrings } from "../schema";

export default {
  locale: {
    enabled: true,
    name: "Español",
    code: "es",
  },
  common: {
    footers: {
      command: "/{commandName} - Solicitado por {user}",
      stats: "Estadísticas del Título - Solicitado por {user}",
    },
    errors: {
      unknown: "Ha ocurrido un error desconocido.",
      try_again: "Por favor, inténtalo de nuevo más tarde.",
      api_failure: "No se han podido obtener los datos de la API externa.",
    },
    words: {
      unknown: "Desconocido",
      none: "Ninguno",
      success: "Éxito",
      error: "Error",
      not_ok: "Error al obtener los datos",
    },
  },
  commands: {
    search: {
      description: "Busca un título",
      options: {
        source: {
          description: "La fuente a utilizar para la búsqueda",
          no_sources:
            "No hay fuentes disponibles. Por favor, inténtalo de nuevo más tarde.",
        },
        query: "El título a buscar",
        id: "ID del título a buscar",
        url: "La URL del título a buscar",
      },
      errors: {
        command_disabled:
          "Este comando está deshabilitado actualmente.\nPor favor, inténtalo de nuevo más tarde.",
        no_source: "Por favor, especifica una fuente donde buscar.",
        invalid_source:
          "Aún no soportamos búsquedas en `{source}`. Por favor, elige una fuente diferente.",
        empty: "Por favor, proporciona una consulta para buscar.",
        no_results:
          "La consulta no devolvió resultados. Es todo lo que sabemos.",
        invalid_id: "La ID proporcionada no es válida.",
      },
    },
    settings: {
      description: "Revisa o cambia los ajustes del bot.",
      view: {
        description: "Revisa tus ajustes",
        embed: {
          title: "Ajustes de Usuario",
          description: "Aquí tienes tus ajustes actuales.",
          fields: {
            locale: "Idioma",
          },
        },
      },
      locale: {
        description: "Ajustes de Idioma",
        set: {
          description: "Cambia tu idioma preferido",
          options: {
            locale: "El idioma que quieres usar",
          },
          success: {
            title: "¡Idioma Cambiado!",
            description: "Tu idioma ha sido cambiado a `{locale}`.",
          },
          error: {
            invalid_locale: "El idioma `{locale}` no es válido.",
            no_changes:
              "No se realizaron cambios. El idioma establecido sigue siendo `{locale}`.",
          },
        },
        reset: {
          description: "Restablece tu idioma preferido",
          success: {
            title: "Idioma Restablecido",
            description:
              "Tu idioma ha sido restablecido al idioma predeterminado.",
          },
          error: {
            description: "Ha ocurrido un error al restablecer el idioma.",
          },
        },
      },
    },
    ping: {
      description: "Verifica la latencia del bot.",
      response: {
        ping: "Haciendo ping...",
        title: "¡Pong!",
        fields: {
          connection_latency: "Latencia de Conexión",
          bot_latency: "Latencia del Bot",
          api: {
            discord: "API Discord",
            mangabaka: "API MangaBaka",
            mangadex: "API MangaDex",
            namicomi: "API NamiComi",
          },
        },
      },
    },
    help: {
      description: "Obtén ayuda con el bot.",
      response: {
        title: "Ayuda",
        fields: {
          commands: {
            name: "Comandos",
            value: "Para ver una lista de comandos, usa `/commands`.",
          },
          support: {
            name: "Soporte",
            value: "Para obtener soporte, usa `/support`.",
          },
          invite: {
            name: "Invitar",
            value: "Para invitar al bot a tu servidor, usa `/invite`.",
          },
          stats: {
            name: "Estadísticas",
            value: "Para ver las estadísticas del bot, usa `/stats`.",
          },
          uptime: {
            name: "Tiempo de actividad",
            value: "Para ver el tiempo de actividad del bot, usa `/uptime`.",
          },
        },
      },
    },
    commands: {
      description: "Obtén la lista de comandos que puedes usar.",
      response: {
        title: "Comandos",
        description: "Aquí tienes los comandos que puedes usar.",
      },
    },
  },
  error_embed: {
    title: "Error",
    description:
      "Ha ocurrido un error al ejecutar este comando, a continuación se muestra el mensaje de error. Por favor, informa de esto al desarrollador del bot. ¡Gracias!",
    stack: "Pila del error",
    message: "Mensaje de error",
    no_stack: "No se ha proporcionado una pila de error.",
    timeout: {
      title: "Timeout",
      description:
        "Se ha agotado el tiempo de espera al obtener los datos desde la API externa. Por favor, inténtalo de nuevo más tarde.",
      note: "Este error puede deberse a la API externa siendo lenta o no respondiendo.",
    },
    err_int_ch_input: "Error en el comando {commandName}",
    err_int_btn: "Error en el botón {buttonId}",
    err_int_slct: "Error en el menú de selección {selectId}",
    err_int_ctx: "Error en el comando de contexto {contextId}",
    err_int_mod: "Error en el modal {modalId}",
    err_int_auto: "Error en la autocompletación {autocompleteId}",
  },
  components: {
    title_stats: {
      response: {
        title: "Estadísticas del Título",
        description:
          "Aquí están las estadísticas para el título con ID `{titleId}` de {source}.",
        fields: {
          rating: "Calificación",
          average: "Puntuación Media",
          bayesian: "Puntuación Bayesiana",
          follows: "Seguidores",
          distribution: "Distribución de Valoraciones",
          comments: "Comentarios",
          chapter_views: "Visualizaciones de Capítulos",
          chapter_comments: "Comentarios de Capítulos",
          chapter_reactions: "Reacciones de Capítulos",
          views: "Visualizaciones",
        },
        units: {
          votes: "votos",
          comments: "comentarios",
        },
        buttons: {
          mangadex: {
            forum: {
              open: "Abrir el Hilo del Foro",
              no_thread: "No hay hilo del foro",
            },
          },
          namicomi: {
            open: "Abrir en NamiComi",
          },
        },
      },
    },
  },
  utils: {
    title_embed: {
      author: {
        too_many: "Múltiples Autores",
      },
      description: {
        no_description: "No hay descripción disponible.",
      },
      fields: {
        rating: "Calificación",
        follows: "Seguidores",
        year: "Año",
        pub_status: {
          name: "Estado de Publicación",
          value: {
            upcoming: "Próximamente",
            ongoing: "En curso",
            completed: "Completado",
            hiatus: "En Pausa",
            cancelled: "Cancelado",
            unknown: "Desconocido",
          },
        },
        demographic: {
          name: "Demografía",
          value: {
            none: "Ninguna",
            shounen: "Shounen",
            shoujo: "Shoujo",
            seinen: "Seinen",
            josei: "Josei",
          },
        },
        content_rating: {
          name: "Clasificación de Contenido",
          value: {
            safe: "Seguro",
            suggestive: "Sugerente",
            erotica: "Erótica",
            pornographic: "Pornográfico",
            mature: "Adulto",
            restricted: "Restringido",
          },
        },
        type: {
          name: "Tipo",
          value: {
            manga: "Manga",
            long_strip: "Tira Larga",
            comic: "Cómic",
            novel: "Novela",
          },
        },
        reading_mode: {
          name: "Modo de Lectura",
          value: {
            vertical: "Vertical",
            horizontal: {
              left_to_right: "Horizontal (Izquierda a Derecha)",
              right_to_left: "Horizontal (Derecha a Izquierda)",
            },
          },
        },
      },
      button: {
        open: "Abrir en {source}",
        stats: "Ver Estadísticas",
      },
    },
    title_list_embed: {
      description:
        "Aquí están los resultados de búsqueda para `{query}` en {source}.",
      placeholder: "Selecciona un título para ver más información...",
      title: "Resultados de la Búsqueda",
      view: "Ver Título en {source}",
    },
    title_tags: {
      format: "Formato",
      themes: "Temas",
      genres: "Géneros",
      tags: "Etiquetas",
      genres_v2: "Géneros (v2)",
      tags_v2: "Etiquetas (v2)",
      content_warning: "Advertencias de Contenido",
      other_tags: "Otras Etiquetas",
    },
  },
  sources: {
    mangabaka: "MangaBaka",
    mangadex: "MangaDex",
    namicomi: "NamiComi",
  },
} satisfies PartialBotStrings;
