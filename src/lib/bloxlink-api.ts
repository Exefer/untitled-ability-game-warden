import { guildId } from "@/config";

export interface DiscordToRobloxGuildAPIResponse {
  robloxID: string;
}
export interface RobloxToDiscordGuildAPIResponse {
  discordIDs: string[];
}

interface ErrorAPIResponse {
  error: string;
}

export class BloxlinkAPI {
  private static readonly BLOXLINK_API_KEY: string = Bun.env.BLOXLINK_API_KEY!;

  public static async discordToRoblox(
    discordUserId: string
  ): Promise<DiscordToRobloxGuildAPIResponse | ErrorAPIResponse> {
    const response = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordUserId}`,
      {
        headers: { Authorization: this.BLOXLINK_API_KEY },
      }
    );
    const data = await response.json();

    return data;
  }

  public static async robloxToDiscord(
    robloxUserId: string
  ): Promise<RobloxToDiscordGuildAPIResponse | ErrorAPIResponse> {
    const response = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/roblox-to-discord/${robloxUserId}`,
      {
        headers: { Authorization: this.BLOXLINK_API_KEY },
      }
    );
    const data = response.json();

    return data;
  }
}
