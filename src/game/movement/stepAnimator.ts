import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { playSound } from "../../ui/audio/soundPlayer";
import { getPlayerElement } from "../../ui/dom/playerElement";

interface StepAnimatorOptions {
    moves: number;
    adding: boolean;
    target: number;
    get200whengo: boolean;
    ctx: GameContext;
    onFinish?: () => void;
}

export function animatePlayerSteps(
    player: Player,
    options: StepAnimatorOptions
) {
    const {
        moves,
        adding,
        target,
        get200whengo,
        ctx,
        onFinish
    } = options;

    let step = 0;
    let awarded = false;
    const element = getPlayerElement(player.id);

    const stepVolume =
        ((ctx.settings?.audio[1] ?? 100) / 100) *
        ((ctx.settings?.audio[0] ?? 100) / 100);

    function nextStep() {
        if (step >= moves) return;

        step++;
        playSound("./step2.mp3", stepVolume);

        player.position = (player.position + (adding ? 1 : -1) + 40) % 40;

        if (player.position === 0 && get200whengo && !awarded) {
            awarded = true;
            player.balance += 200;
            playSound("./moneyplus.mp3", stepVolume);

            if (player.id === ctx.socket.id && ctx.settings?.notifications) {
                ctx.notifyRef.current?.message(
                    "200 of money is added to the account",
                    "info",
                    2,
                    () => {},
                    false
                );
                ctx.engineRef.current?.applyAnimation(2);
            }

            ctx.SetClients(new Map(ctx.clients.set(player.id, player)))
        }

        if (step === moves) {
            player.position = target;
            element.style.animation = "part 0.9s cubic-bezier(0,.7,.57,1)";
            setTimeout(() => (element.style.animation = ""), 900);
            onFinish?.();
            return;
        }

        element.style.animation =
            "jumpstreet 0.35s cubic-bezier(.26,1.5,.65,1.02)";
        setTimeout(nextStep, 350);
    }

    nextStep();
}
