export interface PingI18n {
  description: string;
  response: {
    ping: string;
    title: string;
    fields: {
      bot_latency: string;
      api: {
        discord: string;
        mangadex: string;
        namicomi: string;
      };
    };
  };
}
