import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { calculateMoves } from "./calculateMoves";
import { calculateMoveTime } from "./moveTiming";
import { animatePlayerSteps } from "./stepAnimator";

export function movePlayer(
    finalPosition: number,
    player: Player,
    ctx: GameContext,
    get200whengo = true,
    afterFinished?: () => void,
    adding = true
) {
    const moves = calculateMoves(player.position, finalPosition, adding);
    const time = calculateMoveTime(moves);

    return {
        time,
        func: () =>
            animatePlayerSteps(player, {
                moves,
                adding,
                target: finalPosition,
                get200whengo,
                ctx,
                onFinish: afterFinished
            })
    };
}
