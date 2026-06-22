export interface InteractionCreateI18n {
  error_embed: {
    title: string;
    description: string;
    stack: string;
    message: string;
    no_stack: string;
    timeout: {
      title: string;
      description: string;
      note: string;
    };
    err_int_ch_input: string;
    err_int_btn: string;
    err_int_slct: string;
    err_int_ctx: string;
    err_int_mod: string;
    err_int_auto: string;
  };
}
