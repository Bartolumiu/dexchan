import { SearchI18n } from "../commands/lookup/search.i18n";
import { TitleTagsI18n } from "../functions/titles/titleTags.i18n";

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
  utils: {
    title_tags: TitleTagsI18n;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialBotStrings = DeepPartial<BotStrings>;
