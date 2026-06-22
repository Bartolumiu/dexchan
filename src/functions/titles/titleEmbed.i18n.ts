export interface TitleEmbedI18n {
  title: {
    unknown: string;
  };
  author: {
    too_many: string;
    unknown: string;
  };
  description: {
    no_description: string;
  };
  fields: {
    rating: string;
    follows: string;
    year: string;
    pub_status: {
      name: string;
      value: Record<string, string>;
    };
    demographic: {
      name: string;
      value: Record<string, string>;
    };
    content_rating: {
      name: string;
      value: Record<string, string>;
    };
    type: {
      name: string;
      value: Record<string, string>;
    };
    reading_mode: {
      name: string;
      value: {
        vertical: string;
        horizontal: {
          left_to_right: string;
          right_to_left: string;
        };
      };
    };
  };
  button: {
    open: string;
    stats: string;
  };
}
