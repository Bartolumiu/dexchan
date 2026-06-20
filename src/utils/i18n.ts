import { BotStrings } from "../i18n/schema";

export type JsonToDotPath<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: T[K] extends Record<string, any>
          ? `${K & string}.${JsonToDotPath<T[K]>}`
          : K & string;
      }[keyof T]
    : never;

export type TranslationKey = JsonToDotPath<BotStrings>;
