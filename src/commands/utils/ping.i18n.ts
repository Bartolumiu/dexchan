export interface PingI18n {
  description: string;
  response: {
    ping: string;
    title: string;
    fields: {
      bot_latency: {
        name: string;
        value: string;
      };
      api: {
        discord: {
          name: string;
          value: string;
        };
        mangadex: {
          name: string;
          value: string;
        };
        namicomi: {
          name: string;
          value: string;
        };
      };
    };
    footer: string;
    not_ok: string;
  };
}
