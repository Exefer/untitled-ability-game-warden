import { PreconditionIdentifier } from "@/types";
import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

export class AdminOnlyPrecondition extends Precondition {
  private readonly message: string = "You must be an administrator to use this command.";

  public constructor(context: Precondition.LoaderContext, options: Precondition.Options) {
    super(context, {
      ...options,
      name: PreconditionIdentifier.AdminOnly,
    });
  }

  public override chatInputRun(interaction: ChatInputCommandInteraction): Precondition.Result {
    if (interaction.memberPermissions?.has("Administrator")) {
      return this.ok();
    }

    return this.error({ message: this.message });
  }
}
