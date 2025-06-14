import { universeId } from "@/config";
import { UNIVERSE_GAMEPASSES } from "@/constants";
import { formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { PointsService } from "@/services/points.service";
import { Command } from "@sapphire/framework";
import { Colors, EmbedBuilder, inlineCode, userMention } from "discord.js";
import { InventoryApi, UserRestrictionsApi } from "openblox/cloud";

export class UAGStatsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-stats",
      description: "Get stats about someone in Untitled Ability Game.",
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
              .setDescription("The Roblox username, ID, or Discord user to check.")
              .setRequired(false)
          ),
      { idHints: ["1382336020313542670"] }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const target = interaction.options.getString("target", false) ?? userMention(interaction.user.id);

    await interaction.deferReply();

    const robloxUser = await RobloxAPI.getUserByInput(target);

    if ("error" in robloxUser) {
      await interaction.followUp(robloxUser.error);
      return;
    }

    const {
      data: { gameJoinRestriction: restriction },
    } = await UserRestrictionsApi.restrictionForUser({
      universeId,
      userId: Number(robloxUser.id),
    });

    const universeOwnedGamepassIds = await InventoryApi.inventoryItemsForUser({
      userId: Number(robloxUser.id),
      filter: {
        gamePassIds: UNIVERSE_GAMEPASSES.map(pass => String(pass.gamePassId)),
      },
    })
      .then(({ data }) => data.map(pass => pass.gamePassDetails!.gamePassId))
      .catch(() => [] as string[]);

    const pointsEntry = await PointsService.getPointsForUser(robloxUser);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`Stats for ${robloxUser.data.name}`)
      .setURL(formatRobloxProfileLink(robloxUser.id))
      .setDescription(`Requested by ${userMention(interaction.user.id)}`)
      .setFields([
        {
          name: "Points",
          value: String(pointsEntry.value),
          inline: true,
        },
        {
          name: "Gamepasses",
          value:
            UNIVERSE_GAMEPASSES.filter(pass => universeOwnedGamepassIds.includes(String(pass.gamePassId)))
              .map(pass => pass.name)
              .join(", ") || "None",
          inline: true,
        },
        {
          name: "Is Banned?",
          value: `${restriction.active ? `Yes (see ${inlineCode("/uag-ban-status")})` : "No"}`,
          inline: true,
        },
      ]);

    await interaction.followUp({
      embeds: [embed],
    });
  }
}
