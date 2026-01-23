import { Player } from "../../assets/player";
import { GameContext } from "../../assets/gameContext";
import { getPropertyById } from "../../assets/property";
import { movePlayer } from "../../game/movement/movePlayer";

export function movePlayerToTileId(
    tileId: string,
    player: Player,
    ctx: GameContext
): number {
    const pos = getPropertyById(tileId)?.posistion;
    if (pos === undefined) return 0;

    const result = movePlayer(pos, player, ctx);

    result.func();

    return result.time;
}
