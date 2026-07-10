import { SearchI18n } from "../commands/lookup/search.i18n";
import { SettingsI18n } from "../commands/configuration/settings.i18n";
import { PingI18n } from "../commands/utils/ping.i18n";
import { HelpI18n } from "../commands/utils/help.i18n";
import { CommandsI18n } from "../commands/utils/commands.i18n";
import { TitleTagsI18n } from "../functions/titles/titleTags.i18n";
import { TitleListEmbedI18n } from "../functions/titles/titleListEmbed.i18n";
import { TitleEmbedI18n } from "../functions/titles/titleEmbed.i18n";
import { TitleStatsI18n } from "../components/buttons/title_stats.i18n";

export interface BotStrings {
  locale: {
    enabled: boolean;
    name: string;
    english_name: string;
    code: string;
  };
  commands: {
    lookup: {
      search: SearchI18n;
    };
    configuration: {
      settings: SettingsI18n;
    };
    utils: {
      ping: PingI18n;
      help: HelpI18n;
      commands: CommandsI18n;
    };
  };
  error_embed: {
    title: string;
    description: string;
    stack: string;
    message: string;
    no_stack: string;
    timeout: {
      title: string;
      description: string;
      note: string;
    };
    err_int_ch_input: string;
    err_int_btn: string;
    err_int_slct: string;
    err_int_ctx: string;
    err_int_mod: string;
    err_int_auto: string;
  };
  components: {
    title_stats: TitleStatsI18n;
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
