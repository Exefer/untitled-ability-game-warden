import { universeId } from "@/config";
import { formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { PunchesService } from "@/services/punch.service";
import { Command } from "@sapphire/framework";
import { hyperlink, MessageFlags, PermissionFlagsBits } from "discord.js";
import { MessagingApi } from "openblox/cloud";

export class UAGSetPunchesCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-setpunches",
      description: "(Staff Only) Sets a player's punches in game.",
      detailedDescription: "Only works if the player is not currently in the game.",
      requiredUserPermissions: [PermissionFlagsBits.Administrator],
      preconditions: ["AdminOnly"],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      builder =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addStringOption(option =>
            option
              .setName("target")
              .setDescription("The Roblox username, ID, or Discord user to set the punches of.")
              .setRequired(true)
          )
          .addIntegerOption(option =>
            option.setName("punches").setDescription("The amount of punches to set.").setRequired(true)
          ),
      { idHints: ["1382740191126753381"] }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const target = interaction.options.getString("target", true);
    const punches = interaction.options.getInteger("punches", true);

    await interaction.deferReply();

    const robloxUser = await RobloxAPI.getUserByInput(target);

    if ("error" in robloxUser) {
      await interaction.followUp(robloxUser.error);
      return;
    }

    const punchesEntry = await PunchesService.setPunchesForUser(robloxUser, punches);

    // Update in-game punches value in real-time
    await MessagingApi.publishMessage<{
      targetId: number;
      value: number;
    }>({
      universeId,
      topic: "uag-setpunches",
      message: { targetId: Number(robloxUser.id), value: punches },
    });

    await interaction.followUp({
      content: `Successfully set user ${hyperlink(
        robloxUser.data.name,
        formatRobloxProfileLink(robloxUser.id)
      )} punches to ${punchesEntry.value}.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  }
}
