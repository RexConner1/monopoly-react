import { Player } from "../../../src/assets/player";
import { GameContext } from "../../../shared/game/context/gameContext";
import { moveSteps } from "../../../shared/game/actions/moveSteps";
import { handlePassGo } from "./handlePassGo";

export function movePlayer({
    finalPosition,
    player,
    ctx,
    get200whengo = true,
    afterFinished,
    adding = true,
}: {
    finalPosition: number;
    player: Player;
    ctx: GameContext;
    get200whengo?: boolean;
    afterFinished?: () => void;
    adding?: boolean;
}) {
    const plan = moveSteps({
        player,
        finalPosition,
        adding,
        get200whengo,
        onPassGo: () => {
            handlePassGo({ player, ctx });
        },
        onFinish: afterFinished,
    });

    return {
        start: plan.start,
        time: plan.time,
    };
}
