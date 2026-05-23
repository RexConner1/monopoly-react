import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { movePlayer } from "./movePlayer";

export function moveBySpaces({
    spaces,
    player,
    ctx,
    get200whengo = true,
    afterFinished,
}: {
    spaces: number;
    player: Player;
    ctx: ReactGameContext;
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