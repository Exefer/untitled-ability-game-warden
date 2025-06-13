import { universeId } from "@/config";
import type { RobloxUser } from "@/types";
import { Time } from "@sapphire/duration";
import { UserRestrictionsApi } from "openblox/cloud";

export class BanService {
  public static async temporaryBan(robloxUser: RobloxUser, reason: string, days: number) {
    const { data: updatedRestrictions } = await UserRestrictionsApi.updateRestrictionsForUser({
      universeId,
      userId: Number(robloxUser.id),
      idempotencyKey: Bun.randomUUIDv7(),
      firstSent: new Date(),
      updatedData: {
        gameJoinRestriction: {
          active: true,
          duration: `${(days * Time.Day) / 1000}s`,
          displayReason: reason,
          privateReason: reason,
          excludeAltAccounts: false,
        },
      },
    });
    return updatedRestrictions;
  }

  public static async permanentBan(robloxUser: RobloxUser, reason: string) {
    const { data: updatedRestrictions } = await UserRestrictionsApi.updateRestrictionsForUser({
      universeId,
      userId: Number(robloxUser.id),
      idempotencyKey: Bun.randomUUIDv7(),
      firstSent: new Date(),
      updatedData: {
        gameJoinRestriction: {
          active: true,
          displayReason: reason,
          privateReason: reason,
          excludeAltAccounts: false,
        },
      },
    });
    return updatedRestrictions;
  }

  public static async unban(robloxUser: RobloxUser) {
    const { data: updatedRestrictions } = await UserRestrictionsApi.updateRestrictionsForUser({
      universeId,
      userId: Number(robloxUser.id),
      updatedData: {
        // @ts-expect-error
        gameJoinRestriction: {
          active: false,
        },
      },
    });
    return updatedRestrictions;
  }
}
