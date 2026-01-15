import { Player } from "../../../assets/player";
import { GameContext } from "../../../assets/gameContext";
import { movePlayer } from "../../movement/movePlayer";
import { playJailSfx } from "../../../ui/audio/audio";


const JAIL_POSITION = 10;

export function sendPlayerToJail(
    player: Player,
    ctx: GameContext
): number {
    const result = movePlayer(
        10,
        player,
        ctx,
        false, 
        () => {
            player.position = JAIL_POSITION;
            player.isInJail = true;
            player.jailTurnsRemaining = 3;
            
            playJailSfx(ctx.settings);
        }
    );

    result.func();
    return result.time;
}
