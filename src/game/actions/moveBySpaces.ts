import { GameContext } from "../../../shared/game/context/gameContext";
import { MovePlayerFn } from "../../../shared/types/player";
import { Player } from "../../assets/player";

export function moveBySpaces<TContext extends GameContext>({
    spaces,
    player,
    ctx,
    movePlayer,
    get200whengo = true,
    afterFinished,
}: {
    spaces: number;
    player: Player;
    ctx: TContext;
    movePlayer: MovePlayerFn<TContext>;
    get200whengo?: boolean;
    afterFinished?: () => void;
}) {
    const finalPosition = (player.position + spaces) % 40; //(player.position + spaces + 40) % 40;

    const plan = movePlayer({
        finalPosition,
        player,
        ctx,
        get200whengo,
        afterFinished,
        adding: spaces >= 0,
    });

    plan.start();

    return plan.time;
}