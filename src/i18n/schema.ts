import { SearchI18n } from "../commands/lookup/search.i18n";

export interface BotStrings {
  commands: {
    lookup: {
      search: SearchI18n;
    };
  };
  error_embed: {
    title: string;
    description: string;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialBotStrings = DeepPartial<BotStrings>;
