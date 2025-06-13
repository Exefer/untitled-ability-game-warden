import { universeId } from "@/config";
import type { RobloxUser } from "@/types";
import { OrderedDataStoresApi_V2 } from "openblox/cloud";

export class PunchesService {
  private static readonly DATA_STORE_KEY = "Punches";

  public static async setPunchesForUser(robloxUser: RobloxUser, value: number) {
    const { data } = await OrderedDataStoresApi_V2.updateOrderedDataStoreEntry({
      universeId,
      dataStoreId: this.DATA_STORE_KEY,
      scope: "global",
      entryId: robloxUser.id,
      allowIfMissing: true,
      newEntryValue: value,
    });
    return data;
  }

  public static async getPunchesForUser(robloxUser: RobloxUser) {
    const { data } = await OrderedDataStoresApi_V2.orderedDataStoreEntry({
      universeId,
      dataStoreId: this.DATA_STORE_KEY,
      entryId: robloxUser.id,
      scope: "global",
    });
    return data;
  }
}
