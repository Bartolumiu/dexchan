export interface SearchI18n {
  description: string;
  options: {
    source: {
      description: string;
      no_sources: string;
    };
    query: string;
    id: string;
    url: string;
  };
}
