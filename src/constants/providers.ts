export const SEARCH_PROVIDERS = ["mangabaka", "mangadex", "namicomi"] as const;

export type ProviderType = (typeof SEARCH_PROVIDERS)[number];
