import { universeId } from "@/config";
import { formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { PointsService } from "@/services/points.service";
import { Command } from "@sapphire/framework";
import { hyperlink, MessageFlags, PermissionFlagsBits } from "discord.js";
import { MessagingApi } from "openblox/cloud";

export class UAGSetPointsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-setpoints",
      description: "(Staff Only) Sets a player's points in game.",
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
              .setDescription("The Roblox username, ID, or Discord user to set the points of.")
              .setRequired(true)
          )
          .addIntegerOption(option =>
            option.setName("points").setDescription("The amount of points to set.").setRequired(true)
          ),
      { idHints: ["1382740191126753381"] }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const target = interaction.options.getString("target", true);
    const points = interaction.options.getInteger("points", true);

    await interaction.deferReply();

    const robloxUser = await RobloxAPI.getUserByInput(target);

    if ("error" in robloxUser) {
      await interaction.followUp(robloxUser.error);
      return;
    }

    const pointsEntry = await PointsService.setPointsForUser(robloxUser, points);

    // Update in-game points value in real-time
    await MessagingApi.publishMessage<{
      targetId: number;
      value: number;
    }>({
      universeId,
      topic: "uag-setpoints",
      message: { targetId: Number(robloxUser.id), value: points },
    });

    await interaction.followUp({
      content: `Successfully set user ${hyperlink(
        robloxUser.data.name,
        formatRobloxProfileLink(robloxUser.id)
      )} points to ${pointsEntry.value}.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  }
}
