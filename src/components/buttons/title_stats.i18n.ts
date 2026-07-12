export interface TitleStatsI18n {
  response: {
    title: string;
    description: string;
    fields: {
      rating: string;
      average: string;
      bayesian: string;
      follows: string;
      distribution: string;
      comments: string;
      chapter_views: string;
      chapter_comments: string;
      chapter_reactions: string;
      views: string;
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
  };
}
