import { applyPassGoReward } from "../../../shared/game/actions/applyPassGoReward.ts";
import { Player } from "../../../src/assets/player.ts";
import { GameContext } from "../../../shared/game/context/gameContext.ts";
import { updatePlayer } from "../state/updatePlayer.ts";

export function handlePassGo({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext;
}) {
    applyPassGoReward(player);

    updatePlayer({ player, ctx });
}
