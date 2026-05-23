import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { playJailSfx } from "../../ui/audio/audio";


export function goToJail({
    player,
    ctx,
}: {
    player: Player;
    ctx: ReactGameContext;
}) {
    player.position = 10;
    player.isInJail = true;
    player.jailTurnsRemaining = 3;

    playJailSfx(ctx.settings);

    const element = document.querySelector(
        `div.player[player-id="${player.id}"]`
    ) as HTMLDivElement;

    element.style.animation = "part 0.4s ease-out";
    setTimeout(() => (element.style.animation = ""), 400);
}
