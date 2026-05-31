import { Player } from "../../assets/player";
import { getPropertyById } from "../../../shared/types/property";
import { MovePlayerFn } from "../../../shared/types/player";
import { GameContext } from "../../../shared/game/context/gameContext";

export function moveToTile<TContext extends GameContext>({
    tileId,
    player,
    ctx,
    movePlayer
}: {
    tileId: string;
    player: Player;
    ctx: TContext;
    movePlayer: MovePlayerFn<TContext>;
}): number {
    const targetPos = getPropertyById(tileId)?.position;

    if (targetPos === undefined) return 0;

    const plan = movePlayer({
        finalPosition: targetPos,
        player,
        ctx,
    });

    plan.start(); 

    return plan.time;
}
