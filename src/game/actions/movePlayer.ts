import { GameContext } from "../../assets/gameContext";
import { playStepSfx } from "../../ui/audio/audio";
import { Player } from "../../assets/player";
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
    const { steps, time } = computeMovePlan(
        player.position,
        finalPosition,
        adding
    );

    function start() {
        const element = document.querySelector(`div.player[player-id="${player.id}"]`) as HTMLDivElement;

        animateSteps({
            player,
            element,
            steps,
            finalPosition,
            ctx,
            get200whengo,
            afterFinished,
            adding
        });
    }

    return { start, time };
}

function computeMovePlan(current: number, target: number, adding: boolean) {
    let steps = (target - current) % 40;

    if ((target < current || steps < 0) && adding) {
        steps = 40 - current + target;
    }

    if (!adding) {
        steps = current - target;
        if (steps < 0) steps += 40;
    }

    const time = 0.35 * 1000 * steps;

    return { steps, time };
}

function animateSteps({
    player,
    element,
    steps,
    finalPosition,
    ctx,
    get200whengo,
    afterFinished,
    adding
}: any) {
    let i = 0;
    let addedMoney = false;
    const firstPosition = player.position;

    function step() {
        if (i >= steps) return;

        i++;

        playStepSfx(ctx.settings);

        const delta = adding ? 1 : -1;
        player.position = (player.position + delta + 40) % 40;

        element.style.animation = "jumpstreet 0.35s cubic-bezier(.26,1.5,.65,1.02)";

        if (player.position === 0 && get200whengo) {
            handlePassGo({ player, ctx });
            addedMoney = true;
        }

        if (i === steps) {
            finalizeMove({
                player,
                element,
                finalPosition,
                firstPosition,
                addedMoney,
                get200whengo,
                ctx,
                afterFinished,
            });
        } else {
            setTimeout(step, 0.35 * 1000);
        }
    }

    step();
}

function finalizeMove({
    player,
    element,
    finalPosition,
    firstPosition,
    addedMoney,
    get200whengo,
    ctx,
    afterFinished,
}: any) {
    player.position = finalPosition;

    element.style.animation = "part 0.9s cubic-bezier(0,.7,.57,1)";
    setTimeout(() => (element.style.animation = ""), 900);

    if (!addedMoney && firstPosition > finalPosition && get200whengo) {
        handlePassGo({ player, ctx });
    }

    afterFinished?.();
}
