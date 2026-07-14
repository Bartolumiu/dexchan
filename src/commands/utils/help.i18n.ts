export interface HelpI18n {
  description: string;
  response: {
    title: string;
    fields: {
      commands: {
        name: string;
        value: string;
      };
      support: {
        name: string;
        value: string;
      };
      invite: {
        name: string;
        value: string;
      };
      stats: {
        name: string;
        value: string;
      };
      uptime: {
        name: string;
        value: string;
      };
    };
  };
}
