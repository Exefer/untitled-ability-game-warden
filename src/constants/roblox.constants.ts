import { universeId } from "@/config";
import { ClassicGamePassesApi } from "openblox/classic";

export const { data: UNIVERSE_GAMEPASSES } = await ClassicGamePassesApi.gamePassesForUniverse({
  universeId,
});
