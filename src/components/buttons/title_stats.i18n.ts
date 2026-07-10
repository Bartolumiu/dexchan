export interface TitleStatsI18n {
  response: {
    title: string;
    description: string;
    fields: {
      rating: {
        name: string;
      };
      average: {
        name: string;
      };
      bayesian: {
        name: string;
      };
      follows: {
        name: string;
      };
      distribution: {
        name: string;
      };
      comments: {
        name: string;
      };
      chapter_views: {
        name: string;
      };
      chapter_comments: {
        name: string;
      };
      chapter_reactions: {
        name: string;
      };
      views: {
        name: string;
      };
    };
    units: {
      votes: string;
      comments: string;
    };
    buttons: {
      mangadex: {
        forum: {
          open: string;
          no_thread: string;
        };
      };
      namicomi: {
        open: string;
      };
    };
    footer: string;
  };
  error: {
    title: string;
    description: string;
  };
}
