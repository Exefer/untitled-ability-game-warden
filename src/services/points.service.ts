import { universeId } from "@/config";
import type { RobloxUser } from "@/types";
import { OrderedDataStoresApi_V2 } from "openblox/cloud";

export class PointsService {
  private static readonly DATA_STORE_ID = "Points";

  public static async setPointsForUser(robloxUser: RobloxUser, value: number) {
    const { data } = await OrderedDataStoresApi_V2.updateOrderedDataStoreEntry({
      universeId,
      dataStoreId: this.DATA_STORE_ID,
      scope: "global",
      entryId: robloxUser.id,
      allowIfMissing: true,
      newEntryValue: value,
    });
    return data;
  }

  public static async getPointsForUser(robloxUser: RobloxUser) {
    const { data } = await OrderedDataStoresApi_V2.orderedDataStoreEntry({
      universeId,
      dataStoreId: this.DATA_STORE_ID,
      entryId: robloxUser.id,
      scope: "global",
    });
    return data;
  }
}
