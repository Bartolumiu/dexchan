export interface SettingsI18n {
  description: string;
  view: {
    description: string;
    embed: {
      title: string;
      description: string;
      fields: {
        locale: string;
      };
    };
  };
  locale: {
    description: string;
    set: {
      description: string;
      options: {
        locale: string;
      };
      success: {
        title: string;
        description: string;
      };
      error: {
        invalid_locale: string;
        no_changes: string;
      };
    };
    reset: {
      description: string;
      success: {
        title: string;
        description: string;
      };
      error: {
        description: string;
      };
    };
  };
}
