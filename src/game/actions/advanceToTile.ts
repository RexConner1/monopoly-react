import { Player } from "../../assets/player";
import { getPropertyById } from "../../assets/property";
import { movePlayer } from "./movePlayer";

export function advanceToTile({
    tileId,
    player,
    ctx,
}: {
    tileId: string;
    player: Player;
    ctx: any;
}): number {
    const targetPos = getPropertyById(tileId)?.posistion;

    if (targetPos === undefined) return 0;

    const plan = movePlayer({
        finalPosition: targetPos,
        player,
        ctx,
    });

    plan.start(); 

    return plan.time;
}
