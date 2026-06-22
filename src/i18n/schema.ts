import { SearchI18n } from "../commands/lookup/search.i18n";
import { TitleTagsI18n } from "../functions/titles/titleTags.i18n";
import { TitleListEmbedI18n } from "../functions/titles/titleListEmbed.i18n";
import { TitleEmbedI18n } from "../functions/titles/titleEmbed.i18n";

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
    title_embed: TitleEmbedI18n;
    title_tags: TitleTagsI18n;
    title_list_embed: TitleListEmbedI18n;
  };
  sources: {
    mangabaka: string;
    mangadex: string;
    namicomi: string;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialBotStrings = DeepPartial<BotStrings>;
