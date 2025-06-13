import { formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { BanService } from "@/services/ban.service";
import { Command } from "@sapphire/framework";
import { hyperlink, MessageFlags, PermissionFlagsBits } from "discord.js";

export class UAGUnbanCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-unban",
      description: "(Staff Only) Unban a user from Untitled Ability Game.",
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
              .setDescription("The Roblox username, ID, or Discord user to unban.")
              .setRequired(true)
          ),
      { idHints: ["1382342643731927083"] }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const target = interaction.options.getString("target", true);

    await interaction.deferReply();

    const robloxUser = await RobloxAPI.getUserByInput(target);

    if ("error" in robloxUser) {
      await interaction.followUp(robloxUser.error);
      return;
    }

    await BanService.unban(robloxUser);

    await interaction.followUp({
      content: `Successfully unbanned user ${hyperlink(robloxUser.data.name, formatRobloxProfileLink(robloxUser.id))}.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  }
}
