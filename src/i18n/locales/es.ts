import { PartialBotStrings } from "../schema";

export default {
  commands: {
    lookup: {
      search: {
        description: "Busca un título",
        options: {
          source: {
            description: "La fuente a utilizar para la búsqueda",
            no_sources:
              "No hay fuentes disponibles. Por favor, inténtalo de nuevo más tarde",
          },
          query: "El título a buscar",
          id: "ID del título a buscar",
          url: "La URL del título a buscar",
        },
      },
    },
  },
} satisfies PartialBotStrings;
