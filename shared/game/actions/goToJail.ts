import { GameContext } from "../context/gameContext";
import { Player } from "../../../src/assets/player";
import { playJailSfx } from "../../../src/ui/audio/audio";


export function goToJail({
    player,
    ctx,
}: {
    player: Player;
    ctx: GameContext;
}) {
    player.position = 10;
    player.isInJail = true;
    player.jailTurnsRemaining = 3;

    if (ctx.effectsEnabled !== false) {
        playJailSfx(ctx.settings);

        const element = document.querySelector(
            `div.player[player-id="${player.id}"]`
        ) as HTMLDivElement;

        element.style.animation = "part 0.4s ease-out";
        setTimeout(() => (element.style.animation = ""), 400);
    }
}
