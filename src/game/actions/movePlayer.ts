import { ReactGameContext } from "../../assets/reactGameContext";
import { playStepSfx } from "../../ui/audio/audio";
import { Player } from "../../assets/player";
import { handlePassGo } from "./handlePassGo";
import { moveSteps } from "../../../shared/game/actions/moveSteps";

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
    ctx: ReactGameContext;
    get200whengo?: boolean;
    afterFinished?: () => void;
    adding?: boolean;
}) {
    const element = document.querySelector(`div.player[player-id="${player.id}"]`) as HTMLDivElement;

    const plan = moveSteps({
        player,
        finalPosition,
        adding,
        get200whengo,
        onStep: () => {
            playStepSfx(ctx.settings);
            element.style.animation = "jumpstreet 0.35s cubic-bezier(.26,1.5,.65,1.02)";
        },
        onPassGo: () => {
            handlePassGo({ player, ctx });
        },
        onFinish: () => {
            element.style.animation = "part 0.9s cubic-bezier(0,.7,.57,1)";
            setTimeout(() => (element.style.animation = ""), 900);
            afterFinished?.();
        },
    });

    return { start: plan.start, time: plan.time };
}
