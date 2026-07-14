import { CommandsI18n } from "../commands/utils/commands.i18n";
import { HelpI18n } from "../commands/utils/help.i18n";
import { PingI18n } from "../commands/utils/ping.i18n";
import { SearchI18n } from "../commands/lookup/search.i18n";
import { SettingsI18n } from "../commands/configuration/settings.i18n";

import { TitleStatsI18n } from "../components/buttons/title_stats.i18n";

import { InteractionCreateI18n } from "../events/client/interactionCreate.i18n";
import { TitleEmbedI18n } from "../functions/titles/titleEmbed.i18n";
import { TitleListEmbedI18n } from "../functions/titles/titleListEmbed.i18n";
import { TitleTagsI18n } from "../functions/titles/titleTags.i18n";

export interface BotStrings {
  locale: {
    enabled: boolean;
    name: string;
    code: string;
  };
  common: {
    footers: {
      command: string;
      stats: string;
    };
    errors: {
      unknown: string;
      try_again: string;
      api_failure: string;
    };
    words: {
      unknown: string;
      none: string;
      success: string;
      error: string;
      not_ok: string;
    };
  };
  commands: {
    search: SearchI18n;
    settings: SettingsI18n;
    ping: PingI18n;
    help: HelpI18n;
    commands: CommandsI18n;
  };
  error_embed: InteractionCreateI18n["error_embed"];
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

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type PartialBotStrings = DeepPartial<BotStrings>;
