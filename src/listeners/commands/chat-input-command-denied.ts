import { type ChatInputCommandDeniedPayload, Events, Listener, UserError } from "@sapphire/framework";

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ChatInputCommandDenied,
    });
  }

  public override async run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (Reflect.get(Object(error.context), "silent")) return;

    return interaction.reply({ content: error.message });
  }
}
