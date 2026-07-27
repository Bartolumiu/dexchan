import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import { BotStrings } from "../../i18n/schema";
import { ProviderType } from "../../constants/providers";
import { checkID, parseUrl } from "../parsers/urlParser";
import getTitleDetails from "./titleDetails";
import getTitleStats from "./titleStats";
import buildTitleEmbed from "./titleEmbed";
import setImages from "./setImages";

export interface TitleLookupSuccess {
  success: true;
  payload: {
    embeds: EmbedBuilder[];
    files: AttachmentBuilder[];
    components: ActionRowBuilder<ButtonBuilder>[];
  };
}

export interface TitleLookupError {
  success: false;
  errorKey: string;
  replacements?: Record<string, string>;
}

export type TitleLookupResult = TitleLookupSuccess | TitleLookupError;

export async function lookupTitleById(
  id: string | null,
  url: string | null,
  source: ProviderType,
  locale: string,
  translations: BotStrings,
  embed: EmbedBuilder
): Promise<TitleLookupResult> {
  const titleID = id || parseUrl(url, source);

  if (!checkID(titleID, source)) {
    return { success: false, errorKey: "invalid_id" };
  }

  const [entry, stats] = await Promise.all([
    getTitleDetails(titleID!, source),
    getTitleStats(titleID!, source),
  ]);

  if (!entry || !stats) {
    return { success: false, errorKey: "invalid_id" };
  }

  const buttons = buildTitleEmbed(
    embed,
    locale,
    entry,
    stats,
    translations,
    source
  );

  const files = await setImages(entry, embed, source, translations, locale);

  return {
    success: true,
    payload: {
      embeds: [embed],
      files,
      components: buttons ? [buttons] : [],
    },
  };
}
