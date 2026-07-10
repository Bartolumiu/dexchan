export interface SettingsI18n {
  description: string;
  subcommands: {
    view: {
      description: string;
      response: {
        title: string;
        description: string;
        fields: {
          locale: {
            name: string;
          };
        };
      };
    };
  };
  subcommand_groups: {
    locale: {
      description: string;
      subcommands: {
        set: {
          description: string;
          options: {
            locale: {
              description: string;
            };
          };
          response: {
            title: {
              success: string;
              error: {
                invalid_locale: string;
                no_changes: string;
                unknown: string;
              };
            };
            description: {
              success: string;
              error: {
                invalid_locale: string;
                no_changes: string;
                unknown: string;
              };
            };
          };
        };
        reset: {
          description: string;
          response: {
            title: {
              success: string;
              error: string;
            };
            description: {
              success: string;
              error: string;
            };
          };
        };
      };
    };
  };
  response: {
    footer: string;
  };
}
