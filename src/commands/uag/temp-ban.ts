import { formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { BanService } from "@/services/ban.service";
import { Command } from "@sapphire/framework";
import { hyperlink, MessageFlags, PermissionFlagsBits } from "discord.js";

export class UAGTempBanCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-tempban",
      description: "(Staff Only) Ban a user temporarely from Untitled Ability Game.",
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
              .setDescription("The Roblox username, ID, or Discord user to ban.")
              .setRequired(true)
          )
          .addStringOption(option =>
            option.setName("reason").setDescription("The reason for the ban.").setRequired(true)
          )
          .addNumberOption(option =>
            option.setName("days").setDescription("The duration of the ban in days.").setRequired(true)
          ),
      { idHints: ["1382336023526244414"] }
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const target = interaction.options.getString("target", true);
    const reason = interaction.options.getString("reason", true);
    const days = interaction.options.getNumber("days", true);

    await interaction.deferReply();

    const robloxUser = await RobloxAPI.getUserByInput(target);

    if ("error" in robloxUser) {
      await interaction.followUp(robloxUser.error);
      return;
    }

    await BanService.temporaryBan(robloxUser, reason, days);

    await interaction.followUp({
      content: `Successfully banned user ${hyperlink(
        robloxUser.data.name,
        formatRobloxProfileLink(robloxUser.id)
      )} for ${days} days.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  }
}
