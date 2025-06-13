import { isUserMention, stripMention } from "@/helpers";
import { BloxlinkAPI } from "@/lib/bloxlink-api";
import { inlineCode } from "discord.js";
import { ClassicUsersApi } from "openblox/classic";
import { UsersApi } from "openblox/cloud";

export type RobloxUserResult =
  | { id: string; data: Awaited<ReturnType<typeof UsersApi.userInfo>>["data"] }
  | { error: string };

export class RobloxAPI {
  private static createNotFoundError(type: string, value: string) {
    return {
      error: `Can't find any Roblox account with the ${type} ${inlineCode(value)}.`,
    };
  }

  private static async handleDiscordMention(input: string): Promise<RobloxUserResult> {
    const discordUserId = stripMention(input);
    const response = await BloxlinkAPI.discordToRoblox(discordUserId);

    // Temporary loose error handling
    if ("error" in response) {
      return { error: `An API error occurred: ${response.error}.` };
    }

    const { data } = await UsersApi.userInfo({ userId: Number(response.robloxID) });
    return { id: response.robloxID, data };
  }

  private static async handleRobloxUserId(input: string): Promise<RobloxUserResult> {
    const { data } = await UsersApi.userInfo({ userId: Number(input) });
    if (!data) return this.createNotFoundError("ID", input);
    return { id: input, data };
  }

  private static async handleRobloxUsername(input: string): Promise<RobloxUserResult> {
    const {
      data: { [input]: user },
    } = await ClassicUsersApi.usersInfoFromNames({
      usernames: [input],
    });

    if (!user) return this.createNotFoundError("username", input);

    const { data } = await UsersApi.userInfo({ userId: user.id });
    if (!data) return this.createNotFoundError("username", input);

    return { id: String(user.id), data };
  }

  public static async getUserByInput(input: string): Promise<RobloxUserResult> {
    // Handle Discord member mentions
    if (isUserMention(input)) {
      return this.handleDiscordMention(input);
    }

    // Handle Roblox user IDs
    if (parseInt(input)) {
      return this.handleRobloxUserId(input);
    }

    // Handle Roblox usernames
    return this.handleRobloxUsername(input);
  }
}
