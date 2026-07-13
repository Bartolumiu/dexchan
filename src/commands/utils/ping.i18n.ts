export interface PingI18n {
  description: string;
  response: {
    ping: string;
    title: string;
    fields: {
      connection_latency: string;
      bot_latency: string;
      api: {
        discord: string;
        mangabaka: string;
        mangadex: string;
        namicomi: string;
      };
    };
  };
}
