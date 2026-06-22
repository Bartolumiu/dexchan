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
  errors: {
    command_disabled: string;
    no_source: string;
    invalid_source: string;
    api: string;
    empty: string;
    no_results: string;
    invalid_id: string;
  };
  footer: string;
}
