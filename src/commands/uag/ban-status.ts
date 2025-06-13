import { universeId } from "@/config";
import { formatDateWithDashes, formatRobloxProfileLink } from "@/helpers";
import { RobloxAPI } from "@/lib/roblox-api";
import { Duration, Time } from "@sapphire/duration";
import { Command } from "@sapphire/framework";
import { formatDistanceToNow } from "date-fns";
import { Colors, EmbedBuilder, inlineCode, subtext, userMention } from "discord.js";
import { UserRestrictionsApi } from "openblox/cloud";

type RestrictionEntry = Awaited<ReturnType<typeof UserRestrictionsApi.listRestrictionLogs>>["data"][number];

export class UAGBanStatusCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "uag-ban-status",
      description: "Check if a user is banned from Untitled Ability Game, along additional information.",
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
      { idHints: ["1382336016349790241"] }
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

    const validRestrictions = await this.getValidRestrictions(Number(robloxUser.id));
    if (validRestrictions.length === 0) {
      const embed = this.buildEmbed(robloxUser.data.name, false, "Not currently banned - no bans on record!");
      await interaction.followUp({ embeds: [embed] });
      return;
    }

    const sortedDesc = this.sortRestrictionsDesc(validRestrictions);
    const [latest, ...others] = sortedDesc;
    const currentRestriction = latest.active ? latest : undefined;

    const description = this.buildDescription(currentRestriction, sortedDesc, others);
    const embed = this.buildEmbed(robloxUser.data.name, Boolean(currentRestriction), description, currentRestriction);
    await interaction.followUp({ embeds: [embed] });
  }

  private async getValidRestrictions(userId: number): Promise<RestrictionEntry[]> {
    const { data: restrictions } = await UserRestrictionsApi.listRestrictionLogs({ universeId, userId });
    return restrictions.filter(r => r.createTime && !isNaN(r.createTime.getTime()));
  }

  private sortRestrictionsDesc(restrictions: RestrictionEntry[]): RestrictionEntry[] {
    return [...restrictions].sort((a, b) => b.createTime.getTime() - a.createTime.getTime());
  }

  private calculateRemainingRestrictionTime(
    restriction: RestrictionEntry
  ): { totalDays: number; remainingDays: number } | null {
    if (!restriction.duration || parseInt(restriction.duration) === -1) {
      return null;
    }
    const totalDays = (parseInt(restriction.duration) * 1000) / Time.Day;
    const endDate = new Duration(restriction.duration).dateFrom(restriction.createTime);
    const remainingMs = endDate.getTime() - Date.now();
    const remainingDays = Math.ceil(remainingMs / Time.Day);
    return { totalDays, remainingDays };
  }

  private buildDescription(
    currentRestriction: RestrictionEntry | undefined,
    allSorted: RestrictionEntry[],
    pastRestrictions: RestrictionEntry[]
  ): string {
    if (!currentRestriction) {
      const historyText = this.formatRestrictions(allSorted);
      return `Not currently banned - bans on record:\n${historyText}`;
    }
    const restrictionInfo = this.calculateRemainingRestrictionTime(currentRestriction);
    const durationText = restrictionInfo
      ? `for ${Math.round(restrictionInfo.totalDays)} days. ${restrictionInfo.remainingDays} days remaining`
      : "permanently. This ban will not expire.";
    const historyLines = pastRestrictions.length ? this.formatRestrictions(pastRestrictions) : "";
    const historyBlock = historyLines ? `\n\nPast bans on record:\n${historyLines}` : "";
    return `Currently banned ${durationText}${historyBlock}`;
  }

  private buildEmbed(
    username: string,
    isBanned: boolean,
    description: string,
    currentRestriction?: RestrictionEntry
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(isBanned ? Colors.Red : Colors.Green)
      .setTitle(`Bans for ${username}`)
      .setURL(formatRobloxProfileLink(username))
      .setDescription(description);
    if (currentRestriction) {
      embed.addFields([
        { name: "Reason", value: currentRestriction.displayReason || "No reason provided", inline: true },
        {
          name: "Banned",
          value: `${formatDateWithDashes(currentRestriction.createTime)} (${formatDistanceToNow(
            currentRestriction.createTime,
            { addSuffix: true }
          )})`,
          inline: true,
        },
      ]);
    }
    return embed;
  }

  private formatRestrictions(restrictions: RestrictionEntry[]): string {
    return Object.entries(
      this.sortRestrictionsDesc(restrictions).reduce<Record<string, RestrictionEntry[]>>((acc, r) => {
        const key = formatDateWithDashes(r.createTime);
        acc[key] = acc[key] ?? [];
        acc[key].push(r);
        return acc;
      }, {})
    )
      .map(([date, group]) => this.formatDateGroup(date, group))
      .join("\n");
  }

  private formatDateGroup(date: string, group: RestrictionEntry[]): string {
    const restriction = group.find(r => r.active);
    const hasUnban = group.some(r => !r.active);

    if (!restriction) {
      return `- ${inlineCode(date)} (unbanned)`;
    }

    if (hasUnban) {
      const isPermanent = !restriction.duration || parseInt(restriction.duration) === -1;
      const durationText = isPermanent
        ? "(permanent)"
        : (() => {
            const endDate = new Duration(restriction.duration).dateFrom(restriction.createTime);
            const formattedEnd = formatDateWithDashes(endDate);
            return `(until ${inlineCode(formattedEnd)})`;
          })();

      return `- ${inlineCode(date)} (unbanned) ${durationText}\n${subtext(restriction.displayReason)}`;
    }

    const reasonText = subtext(restriction.displayReason);
    const isPermanent = !restriction.duration || parseInt(restriction.duration) === -1;

    if (isPermanent) {
      return `- ${inlineCode(date)} (permanent)\n${reasonText}`;
    }

    const status = restriction.active
      ? (() => {
          const endDate = new Duration(restriction.duration).dateFrom(restriction.createTime);
          const formattedEnd = formatDateWithDashes(endDate);
          const verb = restriction.active ? "ends" : "ended";
          return `- ${verb} on ${inlineCode(formattedEnd)}`;
        })()
      : "(inactive)";

    return `- ${inlineCode(date)} ${status}\n${reasonText}`;
  }
}
